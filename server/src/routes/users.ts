import { Hono } from "hono";
import { z } from "zod";
import { and, eq, inArray } from "drizzle-orm";
import { db, schema } from "../db/client";
import { serializeUser, loadJurisdiction } from "../services/users";
import { findJurisdictionByName } from "../services/jurisdictions";
import { requireAuth, getAuth } from "../middleware/auth";
import { badRequest, conflict, notFound } from "../middleware/error";
import { normalizePhone } from "../lib/phone";
import {
  personNameSchema,
  optionalPersonNameSchema,
  indianMobileSchema,
} from "../../../shared/validation";

const completeRegistrationSchema = z.object({
  name: personNameSchema,
  fatherName: optionalPersonNameSchema,
  phone: indianMobileSchema.optional(),
  district: z.string().trim().optional(),
  mandal: z.string().trim().optional(),
  village: z.string().trim().optional(),
  role: z.enum(["citizen", "mandal_official", "sarpanch", "ward_member", "admin"]).optional(),
  wardNumber: z.string().trim().optional(),
});

export const userRoutes = new Hono()
  .use("*", requireAuth)
  .get("/me", (c) => {
    const { user, jurisdiction } = getAuth(c);
    return c.json({ user: serializeUser(user, jurisdiction) });
  })
  /**
   * Completes user profile: binds the user to a jurisdiction
   * looked up from the reference table (never free-text stored).
   */
  .patch("/me", async (c) => {
    const { user } = getAuth(c);
    const input = completeRegistrationSchema.parse(await c.req.json());

    const targetRole = input.role || user.role;
    let jurisdiction: typeof schema.jurisdictions.$inferSelect | null = null;

    if (targetRole === "mandal_official" || (!input.village && input.district && input.mandal)) {
      if (!input.district || !input.mandal) {
        throw badRequest("District and Mandal are required for Mandal Official");
      }
      const [mandalJur] = await db
        .select()
        .from(schema.jurisdictions)
        .where(
          and(
            eq(schema.jurisdictions.district, input.district),
            eq(schema.jurisdictions.mandal, input.mandal)
          )
        )
        .limit(1);

      if (!mandalJur) {
        throw badRequest("Selected mandal is not registered. Please choose from the list.");
      }
      jurisdiction = mandalJur;
    } else if (targetRole === "admin" && !input.district) {
      jurisdiction = null;
    } else {
      if (!input.district || !input.mandal || !input.village) {
        throw badRequest("District, mandal, and village are required");
      }
      if (targetRole === "ward_member" && !input.wardNumber && !user.wardNumber) {
        throw badRequest("Ward number is required for Ward Member");
      }
      const [villageJur] = await db
        .select()
        .from(schema.jurisdictions)
        .where(
          and(
            eq(schema.jurisdictions.district, input.district),
            eq(schema.jurisdictions.mandal, input.mandal),
            eq(schema.jurisdictions.village, input.village)
          )
        )
        .limit(1);

      if (!villageJur) {
        throw badRequest("Selected village is not registered. Please choose from the list.");
      }
      jurisdiction = villageJur;
    }

    const updates: Partial<typeof schema.users.$inferInsert> = {
      name: input.name,
      jurisdictionId: jurisdiction ? jurisdiction.id : null,
      updatedAt: new Date(),
    };

    if (input.role && input.role !== user.role) {
      updates.role = input.role;
      if (input.role !== "citizen") {
        updates.approvalStatus = "pending";
      }
    }
    if (input.wardNumber !== undefined) {
      updates.wardNumber = input.wardNumber;
    }

    if (input.fatherName) updates.fatherName = input.fatherName;
    if (input.phone) {
      const phone = normalizePhone(input.phone);
      if (!phone) {
        throw badRequest("Enter a valid 10-digit Indian mobile number");
      }
      // A phone can bind to only one account.
      const [taken] = await db
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(eq(schema.users.phone, phone))
        .limit(1);
      if (taken && taken.id !== user.id) {
        throw conflict("This mobile number is already linked to another account");
      }
      updates.phone = phone;
    }

    const [updated] = await db
      .update(schema.users)
      .set(updates)
      .where(eq(schema.users.id, user.id))
      .returning();

    const jurisdictionAfter =
      updated.jurisdictionId && updated.jurisdictionId === jurisdiction?.id
        ? jurisdiction
        : await loadJurisdiction(updated.jurisdictionId);

    return c.json({ user: serializeUser(updated, jurisdictionAfter) });
  })
  /**
   * Village directory: the elected representatives of a village (public
   * info, like the panchayat notice board). Defaults to the caller's own
   * village; admins/super admins may query any village.
   */
  .get("/directory", async (c) => {
    const { user, jurisdiction } = getAuth(c);

    let target = jurisdiction;
    const qd = c.req.query("district")?.trim();
    const qm = c.req.query("mandal")?.trim();
    const qv = c.req.query("village")?.trim();

    if (qd && qm && qv) {
      if (user.role === "mandal_official" && jurisdiction) {
        if (
          qd.toLowerCase() !== jurisdiction.district.toLowerCase() ||
          qm.toLowerCase() !== jurisdiction.mandal.toLowerCase()
        ) {
          throw badRequest("You can only look up villages in your mandal");
        }
      }
      target = await findJurisdictionByName(qd, qm, qv);
      if (!target) throw notFound("Village not found");
    } else if (user.role === "mandal_official" && jurisdiction && qv) {
      target = await findJurisdictionByName(jurisdiction.district, jurisdiction.mandal, qv);
      if (!target) throw notFound("Village not found in your mandal");
    } else {
      target = jurisdiction;
    }

    if (!target) {
      return c.json({ village: null, sarpanch: null, wardMembers: [] });
    }

    const rows = await db
      .select()
      .from(schema.users)
      .where(
        and(
          eq(schema.users.jurisdictionId, target.id),
          eq(schema.users.approvalStatus, "approved"),
          inArray(schema.users.role, ["sarpanch", "ward_member"])
        )
      );

    const toCard = (u: typeof schema.users.$inferSelect) => ({
      id: u.id,
      name: u.name,
      phone: u.phone,
      email: u.email,
      wardNumber: u.wardNumber,
    });

    const sarpanchRow = rows.find((r) => r.role === "sarpanch");

    return c.json({
      village: { district: target.district, mandal: target.mandal, village: target.village },
      sarpanch: sarpanchRow ? toCard(sarpanchRow) : null,
      wardMembers: rows
        .filter((r) => r.role === "ward_member")
        .sort((a, b) => (a.wardNumber ?? "").localeCompare(b.wardNumber ?? "", undefined, { numeric: true }))
        .map(toCard),
    });
  });
