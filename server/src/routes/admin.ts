import { Hono } from "hono";
import { z } from "zod";
import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { db, schema } from "../db/client";
import { requireAuth, getAuth, requireRole } from "../middleware/auth";
import { notFound, badRequest } from "../middleware/error";

const decisionSchema = z.object({ note: z.string().trim().max(500).optional() });

const OFFICIAL_ROLES = ["sarpanch", "admin", "ward_member", "mandal_official"] as const;

/**
 * Super-admin approval queue. Officials register by phone + jurisdiction and
 * hold citizen-level access only; these endpoints flip approvalStatus.
 */
export const adminRoutes = new Hono()
  .use("*", requireAuth)
  .get("/officials", requireRole("super_admin", "admin"), async (c) => {
    const status = c.req.query("status");
    const role = c.req.query("role");

    const conditions = [inArray(schema.users.role, OFFICIAL_ROLES), ne(schema.users.role, "super_admin")];
    if (status && ["pending", "approved", "declined"].includes(status)) {
      conditions.push(eq(schema.users.approvalStatus, status as "pending" | "approved" | "declined"));
    }
    if (role && OFFICIAL_ROLES.includes(role as (typeof OFFICIAL_ROLES)[number])) {
      conditions.push(eq(schema.users.role, role as (typeof OFFICIAL_ROLES)[number]));
    } else if (role === "mandal") {
      conditions.push(inArray(schema.users.role, ["mandal_official", "admin"]));
    } else if (role === "panchayat") {
      conditions.push(inArray(schema.users.role, ["sarpanch", "ward_member"]));
    }

    const rows = await db
      .select({ user: schema.users, jurisdiction: schema.jurisdictions })
      .from(schema.users)
      .leftJoin(schema.jurisdictions, eq(schema.users.jurisdictionId, schema.jurisdictions.id))
      .where(and(...conditions))
      .orderBy(desc(schema.users.updatedAt), desc(schema.users.createdAt))
      .limit(200);

    return c.json({
      officials: rows.map(({ user, jurisdiction }) => ({
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        approvalStatus: user.approvalStatus,
        approvalNote: user.approvalNote,
        wardNumber: user.wardNumber,
        district: jurisdiction?.district ?? null,
        mandal: jurisdiction?.mandal ?? null,
        village: jurisdiction?.village ?? null,
        createdAt: user.createdAt.toISOString(),
      })),
    });
  })
  .post("/officials/:id/approve", requireRole("super_admin", "admin"), async (c) => {
    const { user } = getAuth(c);
    const targetId = c.req.param("id") ?? "";

    const [target] = await db.select().from(schema.users).where(eq(schema.users.id, targetId)).limit(1);
    if (!target || !OFFICIAL_ROLES.includes(target.role as (typeof OFFICIAL_ROLES)[number])) {
      throw notFound("Official registration not found");
    }
    if (target.approvalStatus === "approved") {
      throw badRequest("This official is already approved");
    }

    const [updated] = await db
      .update(schema.users)
      .set({ approvalStatus: "approved", approvalNote: null, updatedAt: new Date() })
      .where(eq(schema.users.id, targetId))
      .returning();

    await db.insert(schema.auditLog).values({
      actorId: user.id,
      action: "official.approved",
      entity: "user",
      entityId: targetId,
      before: { approvalStatus: target.approvalStatus },
      after: { approvalStatus: "approved" },
      ip: c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"),
    });

    return c.json({ ok: true, official: { id: updated.id, approvalStatus: updated.approvalStatus } });
  })
  .post("/officials/:id/decline", requireRole("super_admin", "admin"), async (c) => {
    const { user } = getAuth(c);
    const targetId = c.req.param("id") ?? "";
    const { note } = decisionSchema.parse(await c.req.json().catch(() => ({})));

    const [target] = await db.select().from(schema.users).where(eq(schema.users.id, targetId)).limit(1);
    if (!target || !OFFICIAL_ROLES.includes(target.role as (typeof OFFICIAL_ROLES)[number])) {
      throw notFound("Official registration not found");
    }
    if (target.approvalStatus === "declined") {
      throw badRequest("This registration is already declined");
    }

    const [updated] = await db
      .update(schema.users)
      .set({ approvalStatus: "declined", approvalNote: note ?? null, updatedAt: new Date() })
      .where(eq(schema.users.id, targetId))
      .returning();

    await db.insert(schema.auditLog).values({
      actorId: user.id,
      action: "official.declined",
      entity: "user",
      entityId: targetId,
      before: { approvalStatus: target.approvalStatus },
      after: { approvalStatus: "declined", note: note ?? null },
      ip: c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"),
    });

    return c.json({ ok: true, official: { id: updated.id, approvalStatus: updated.approvalStatus } });
  });
