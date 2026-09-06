import { Hono } from "hono";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db, schema } from "../db/client";
import { serializeUser, loadJurisdiction } from "../services/users";
import { requireAuth, getAuth } from "../middleware/auth";
import { badRequest } from "../middleware/error";
import { normalizePhone } from "../lib/phone";

const completeRegistrationSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    fatherName: z.string().trim().max(120).optional(),
    phone: z.string().optional(),
    district: z.string().trim().min(1),
    mandal: z.string().trim().min(1),
    village: z.string().trim().min(1),
  })
  .strict();

export const userRoutes = new Hono()
  .use("*", requireAuth)
  .get("/me", (c) => {
    const { user, jurisdiction } = getAuth(c);
    return c.json({ user: serializeUser(user, jurisdiction) });
  })
  /**
   * Completes the citizen profile: binds the user to a jurisdiction
   * looked up from the reference table (never free-text stored).
   */
  .patch("/me", async (c) => {
    const { user } = getAuth(c);
    const input = completeRegistrationSchema.parse(await c.req.json());

    const [jurisdiction] = await db
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

    if (!jurisdiction) {
      throw badRequest("Selected village is not registered. Please choose from the list.");
    }

    const updates: Partial<typeof schema.users.$inferInsert> = {
      name: input.name,
      jurisdictionId: jurisdiction.id,
      updatedAt: new Date(),
    };
    if (input.fatherName) updates.fatherName = input.fatherName;
    if (input.phone) {
      const phone = normalizePhone(input.phone);
      if (!phone) throw badRequest("Enter a valid mobile number");
      updates.phone = phone;
    }

    const [updated] = await db
      .update(schema.users)
      .set(updates)
      .where(eq(schema.users.id, user.id))
      .returning();

    const jurisdictionAfter =
      updated.jurisdictionId === jurisdiction.id
        ? jurisdiction
        : await loadJurisdiction(updated.jurisdictionId);

    return c.json({ user: serializeUser(updated, jurisdictionAfter) });
  });
