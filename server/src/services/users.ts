import { eq, and } from "drizzle-orm";
import { db, schema } from "../db/client";
import type { Jurisdiction, User } from "../db/schema";

/** API contract for the current user (flattened jurisdiction for convenience). */
export interface ApiUser {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  fatherName: string | null;
  role: User["role"];
  approvalStatus: User["approvalStatus"];
  approvalNote: string | null;
  wardNumber: string | null;
  district: string | null;
  mandal: string | null;
  village: string | null;
  jurisdictionId: string | null;
  needsRegistration: boolean;
  createdAt: string;
}

export function serializeUser(user: User, jurisdiction: Jurisdiction | null): ApiUser {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    fatherName: user.fatherName,
    role: user.role,
    approvalStatus: user.approvalStatus,
    approvalNote: user.approvalNote,
    wardNumber: user.wardNumber,
    district: jurisdiction?.district ?? null,
    mandal: jurisdiction?.mandal ?? null,
    village: jurisdiction?.village ?? null,
    jurisdictionId: user.jurisdictionId,
    // Citizens must complete their profile; officials complete it at sign-up.
    needsRegistration:
      user.role === "citizen" &&
      (!user.jurisdictionId || !jurisdiction?.village || !user.name || user.name === "New User"),
    createdAt: user.createdAt.toISOString(),
  };
}

export async function findIdentityUser(provider: string, providerUid: string) {
  const [row] = await db
    .select({ user: schema.users })
    .from(schema.authIdentities)
    .innerJoin(schema.users, eq(schema.authIdentities.userId, schema.users.id))
    .where(
      and(
        eq(schema.authIdentities.provider, provider),
        eq(schema.authIdentities.providerUid, providerUid)
      )
    )
    .limit(1);
  return row?.user ?? null;
}

export async function loadJurisdiction(jurisdictionId: string | null) {
  if (!jurisdictionId) return null;
  const [j] = await db
    .select()
    .from(schema.jurisdictions)
    .where(eq(schema.jurisdictions.id, jurisdictionId))
    .limit(1);
  return j ?? null;
}

export async function linkIdentity(userId: string, provider: string, providerUid: string) {
  await db
    .insert(schema.authIdentities)
    .values({ userId, provider, providerUid })
    .onConflictDoNothing();
}
