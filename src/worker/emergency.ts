import type { Hono } from "hono";
import type { User } from "@/shared/types";
import { requireAuth } from "./governance";
import {
  NATIONAL_EMERGENCY_SERVICES,
  WOMEN_CHILD_SUPPORT_SERVICES,
  canManageEmergencyContacts,
} from "@/shared/constants/emergency";
import {
  filterContactsForLocation,
  findNearestContact,
  findPrimaryContact,
  type EmergencyContactRecord,
} from "@/shared/services/emergencyLookup";

type HonoEnv = { Bindings: Env };

interface DbContact {
  id: number;
  name: string;
  service_type: string;
  description?: string | null;
  phone: string;
  alternate_phone?: string | null;
  district?: string | null;
  mandal?: string | null;
  village?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  jurisdiction?: string | null;
  scope: string;
  is_emergency?: number;
  is_active?: number;
  verified_at?: string | null;
  verified_by?: string | null;
  source?: string | null;
}

interface DbPoliceStation {
  id: number;
  name: string;
  district?: string | null;
  mandal?: string | null;
  address?: string | null;
  phone?: string | null;
  alternate_phone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  jurisdiction?: string | null;
  is_active?: number;
  verified_at?: string | null;
  verified_by?: string | null;
  source?: string | null;
}

function parseLocationFromQuery(url: URL) {
  return {
    district: url.searchParams.get("district") ?? undefined,
    mandal: url.searchParams.get("mandal") ?? undefined,
    village: url.searchParams.get("village") ?? undefined,
    ward: url.searchParams.get("ward") ?? undefined,
    latitude: url.searchParams.get("lat") ? Number(url.searchParams.get("lat")) : undefined,
    longitude: url.searchParams.get("lng") ? Number(url.searchParams.get("lng")) : undefined,
  };
}

function citizenVisible(contact: DbContact): boolean {
  return contact.is_active !== 0 && !!contact.verified_at;
}

function toRecord(c: DbContact): EmergencyContactRecord {
  return { ...c, is_active: c.is_active !== 0, is_emergency: c.is_emergency === 1 };
}

async function getVerifiedContacts(
  db: D1Database,
  loc: ReturnType<typeof parseLocationFromQuery>,
  serviceType?: string
): Promise<EmergencyContactRecord[]> {
  const { results } = await db
    .prepare(
      `SELECT * FROM emergency_contacts WHERE is_active = 1 AND verified_at IS NOT NULL`
    )
    .all<DbContact>();
  const records = results.map(toRecord);
  return filterContactsForLocation(records, loc, { serviceType });
}

export function registerEmergencyRoutes(app: Hono<HonoEnv>) {
  const adminAuth = requireAuth();

  app.get("/api/emergency/state", (c) => {
    return c.json({
      national: NATIONAL_EMERGENCY_SERVICES,
      womenChild: WOMEN_CHILD_SUPPORT_SERVICES,
      notice: "Verify all numbers against official sources before production deployment.",
    });
  });

  app.get("/api/emergency/contacts", async (c) => {
    const url = new URL(c.req.url);
    const loc = parseLocationFromQuery(url);
    const serviceType = url.searchParams.get("service_type") ?? undefined;

    const contacts = await getVerifiedContacts(c.env.DB, loc, serviceType);
    return c.json(contacts);
  });

  app.get("/api/emergency/contacts/manage/list", adminAuth, async (c) => {
    const user = c.get("gramaUser") as User;
    if (!canManageEmergencyContacts(user.role)) {
      return c.json({ error: "Forbidden" }, 403);
    }
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM emergency_contacts ORDER BY updated_at DESC"
    ).all<DbContact>();
    return c.json(results.map(toRecord));
  });

  app.get("/api/emergency/contacts/:id", async (c) => {
    const id = c.req.param("id");
    const row = await c.env.DB.prepare("SELECT * FROM emergency_contacts WHERE id = ?")
      .bind(id)
      .first<DbContact>();
    if (!row || !citizenVisible(row)) {
      return c.json({ error: "Not found" }, 404);
    }
    return c.json(toRecord(row));
  });

  app.get("/api/emergency/nearby", async (c) => {
    const url = new URL(c.req.url);
    const loc = parseLocationFromQuery(url);
    const serviceTypes = (url.searchParams.get("types") ?? "HOSPITAL,PHC")
      .split(",")
      .map((s) => s.trim());
    const contacts = await getVerifiedContacts(c.env.DB, loc);
    const nearest = findNearestContact(contacts, loc, serviceTypes);
    return c.json(nearest ?? null);
  });

  app.get("/api/emergency/police", async (c) => {
    const url = new URL(c.req.url);
    const { district, mandal, village } = parseLocationFromQuery(url);
    if (!district || !mandal || !village) {
      return c.json({ error: "district, mandal, village required" }, 400);
    }

    let mapping = await c.env.DB.prepare(
      `SELECT police_station_id FROM village_police_mapping
       WHERE district = ? AND mandal = ? AND village = ?`
    )
      .bind(district, mandal, village)
      .first<{ police_station_id: number }>();

    if (!mapping) {
      mapping = await c.env.DB.prepare(
        `SELECT police_station_id FROM village_police_mapping
         WHERE district = ? AND mandal = ? LIMIT 1`
      )
        .bind(district, mandal)
        .first<{ police_station_id: number }>();
    }

    if (!mapping) return c.json(null);

    const station = await c.env.DB.prepare("SELECT * FROM police_stations WHERE id = ? AND is_active = 1")
      .bind(mapping.police_station_id)
      .first<DbPoliceStation>();

    if (!station?.verified_at) return c.json(null);
    return c.json(station);
  });

  app.get("/api/emergency/health", async (c) => {
    const loc = parseLocationFromQuery(new URL(c.req.url));
    const contacts = await getVerifiedContacts(c.env.DB, loc);
    return c.json({
      phc: findPrimaryContact(contacts, loc, "PHC"),
      hospital: findPrimaryContact(contacts, loc, "HOSPITAL"),
      nearest: findNearestContact(contacts, loc, ["HOSPITAL", "PHC"]),
    });
  });

  app.get("/api/emergency/fire", async (c) => {
    const loc = parseLocationFromQuery(new URL(c.req.url));
    const contacts = await getVerifiedContacts(c.env.DB, loc);
    return c.json(findPrimaryContact(contacts, loc, "FIRE") ?? null);
  });

  app.post("/api/emergency/contacts", adminAuth, async (c) => {
    const user = c.get("gramaUser") as User;
    if (!canManageEmergencyContacts(user.role)) return c.json({ error: "Forbidden" }, 403);

    const body = await c.req.json<Partial<DbContact>>();
    if (!body.name || !body.phone || !body.service_type) {
      return c.json({ error: "name, phone, service_type required" }, 400);
    }

    const result = await c.env.DB.prepare(
      `INSERT INTO emergency_contacts
       (name, service_type, description, phone, alternate_phone, district, mandal, village,
        address, latitude, longitude, jurisdiction, scope, is_emergency, is_active, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`
    )
      .bind(
        body.name,
        body.service_type,
        body.description ?? null,
        body.phone,
        body.alternate_phone ?? null,
        body.district ?? null,
        body.mandal ?? null,
        body.village ?? null,
        body.address ?? null,
        body.latitude ?? null,
        body.longitude ?? null,
        body.jurisdiction ?? null,
        body.scope ?? "VILLAGE",
        body.is_emergency ? 1 : 0,
        body.source ?? null
      )
      .run();

    const row = await c.env.DB.prepare("SELECT * FROM emergency_contacts WHERE id = ?")
      .bind(result.meta?.last_row_id)
      .first<DbContact>();
    return c.json(toRecord(row!), 201);
  });

  app.patch("/api/emergency/contacts/:id", adminAuth, async (c) => {
    const user = c.get("gramaUser") as User;
    if (!canManageEmergencyContacts(user.role)) return c.json({ error: "Forbidden" }, 403);

    const id = c.req.param("id");
    const body = await c.req.json<Partial<DbContact>>();
    const existing = await c.env.DB.prepare("SELECT * FROM emergency_contacts WHERE id = ?")
      .bind(id)
      .first<DbContact>();
    if (!existing) return c.json({ error: "Not found" }, 404);

    await c.env.DB.prepare(
      `UPDATE emergency_contacts SET
        name = COALESCE(?, name),
        service_type = COALESCE(?, service_type),
        description = COALESCE(?, description),
        phone = COALESCE(?, phone),
        alternate_phone = COALESCE(?, alternate_phone),
        district = COALESCE(?, district),
        mandal = COALESCE(?, mandal),
        village = COALESCE(?, village),
        address = COALESCE(?, address),
        latitude = COALESCE(?, latitude),
        longitude = COALESCE(?, longitude),
        jurisdiction = COALESCE(?, jurisdiction),
        scope = COALESCE(?, scope),
        is_emergency = COALESCE(?, is_emergency),
        is_active = COALESCE(?, is_active),
        source = COALESCE(?, source),
        updated_at = datetime('now')
       WHERE id = ?`
    )
      .bind(
        body.name ?? null,
        body.service_type ?? null,
        body.description ?? null,
        body.phone ?? null,
        body.alternate_phone ?? null,
        body.district ?? null,
        body.mandal ?? null,
        body.village ?? null,
        body.address ?? null,
        body.latitude ?? null,
        body.longitude ?? null,
        body.jurisdiction ?? null,
        body.scope ?? null,
        body.is_emergency != null ? (body.is_emergency ? 1 : 0) : null,
        body.is_active != null ? (body.is_active ? 1 : 0) : null,
        body.source ?? null,
        id
      )
      .run();

    const row = await c.env.DB.prepare("SELECT * FROM emergency_contacts WHERE id = ?")
      .bind(id)
      .first<DbContact>();
    return c.json(toRecord(row!));
  });

  app.delete("/api/emergency/contacts/:id", adminAuth, async (c) => {
    const user = c.get("gramaUser") as User;
    if (!canManageEmergencyContacts(user.role)) return c.json({ error: "Forbidden" }, 403);

    const id = c.req.param("id");
    await c.env.DB.prepare(
      "UPDATE emergency_contacts SET is_active = 0, updated_at = datetime('now') WHERE id = ?"
    )
      .bind(id)
      .run();
    return c.json({ success: true });
  });

  app.post("/api/emergency/contacts/:id/verify", adminAuth, async (c) => {
    const user = c.get("gramaUser") as User;
    if (!canManageEmergencyContacts(user.role)) return c.json({ error: "Forbidden" }, 403);

    const id = c.req.param("id");
    let verifySource: string | null = null;
    try {
      const body = await c.req.json<{ source?: string }>();
      verifySource = body.source ?? null;
    } catch {
      verifySource = null;
    }

    await c.env.DB.prepare(
      `UPDATE emergency_contacts SET
        verified_at = datetime('now'),
        verified_by = ?,
        source = COALESCE(?, source),
        updated_at = datetime('now')
       WHERE id = ?`
    )
      .bind(user.name ?? user.id, verifySource, id)
      .run();

    const row = await c.env.DB.prepare("SELECT * FROM emergency_contacts WHERE id = ?")
      .bind(id)
      .first<DbContact>();
    return c.json(toRecord(row!));
  });
}
