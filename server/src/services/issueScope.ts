import { and, eq, inArray, or } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db, schema } from "../db/client";
import type { Jurisdiction, User } from "../db/schema";
import { forbidden } from "../middleware/error";

/**
 * Data isolation rules. Every issue query goes through here — a handler
 * that forgets its own WHERE clause still cannot leak another village's
 * data because the filter is composed from the authenticated user.
 *
 * Role matrix (POC):
 *   super_admin                 → everything
 *   admin (approved)            → all issues in the admin's district
 *   sarpanch (approved)         → all issues in the sarpanch's village
 *   ward_member (approved)      → their ward's issues + issues they reported
 *   citizen / pending / declined→ own issues + 'village'-visible issues
 *                                 of the user's own village
 */

export function isApprovedOfficial(user: User): boolean {
  return (
    user.role === "super_admin" ||
    (["sarpanch", "admin", "ward_member"].includes(user.role) &&
      user.approvalStatus === "approved")
  );
}

/** SQL condition limiting issues to what this user may ever list. */
export function issueVisibilityFilter(
  user: User,
  userJurisdiction: Jurisdiction | null
): SQL | undefined {
  if (user.role === "super_admin") return undefined; // no restriction

  const own = eq(schema.issues.reporterId, user.id);

  if (user.role === "admin" && isApprovedOfficial(user) && userJurisdiction) {
    // District-wide view via the canonical geography.
    return or(
      own,
      inArray(
        schema.issues.jurisdictionId,
        db
          .select({ id: schema.jurisdictions.id })
          .from(schema.jurisdictions)
          .where(eq(schema.jurisdictions.district, userJurisdiction.district))
      )
    );
  }

  if (isApprovedOfficial(user) && userJurisdiction) {
    const villageScope = eq(schema.issues.jurisdictionId, userJurisdiction.id);
    if (user.role === "ward_member" && user.wardNumber) {
      return or(own, and(villageScope, eq(schema.issues.wardNumber, user.wardNumber)));
    }
    return villageScope;
  }

  // Everyone else (citizens, pending/declined officials, no jurisdiction).
  if (userJurisdiction) {
    return or(
      own,
      and(
        eq(schema.issues.visibility, "village"),
        eq(schema.issues.jurisdictionId, userJurisdiction.id)
      )
    );
  }
  return own;
}

export async function canViewIssue(
  user: User,
  userJurisdiction: Jurisdiction | null,
  issue: { reporterId: string; jurisdictionId: string; visibility: string; wardNumber: string | null }
): Promise<boolean> {
  if (user.role === "super_admin") return true;
  if (issue.reporterId === user.id) return true;

  if (user.role === "admin" && isApprovedOfficial(user) && userJurisdiction) {
    const [j] = await db
      .select()
      .from(schema.jurisdictions)
      .where(eq(schema.jurisdictions.id, issue.jurisdictionId))
      .limit(1);
    return j?.district === userJurisdiction.district;
  }

  if (isApprovedOfficial(user) && userJurisdiction) {
    if (issue.jurisdictionId !== userJurisdiction.id) return false;
    if (user.role === "ward_member" && user.wardNumber) {
      return issue.wardNumber === user.wardNumber;
    }
    return true;
  }

  // Citizens: village-visible issues of their own village.
  return (
    issue.visibility === "village" && issue.jurisdictionId === userJurisdiction?.id
  );
}

export function assertCanManageIssue(
  user: User,
  userJurisdiction: Jurisdiction | null,
  issue: { jurisdictionId: string; wardNumber: string | null },
  issueJurisdiction: Jurisdiction | null
): void {
  if (user.role === "super_admin") return;

  if (!isApprovedOfficial(user) || !userJurisdiction) {
    throw forbidden("Only approved officials can update issues");
  }

  if (user.role === "admin") {
    if (issueJurisdiction?.district === userJurisdiction.district) return;
    throw forbidden("This issue belongs to a different district");
  }

  if (issue.jurisdictionId !== userJurisdiction.id) {
    throw forbidden("This issue belongs to a different village");
  }
  if (user.role === "ward_member" && user.wardNumber && issue.wardNumber !== user.wardNumber) {
    throw forbidden("This issue belongs to a different ward");
  }
}
