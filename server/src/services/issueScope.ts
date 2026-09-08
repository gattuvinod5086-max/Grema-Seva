import { and, eq, isNull, or } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { schema } from "../db/client";
import type { Jurisdiction, User } from "../db/schema";
import { forbidden } from "../middleware/error";

/**
 * Data isolation rules. Every issue query goes through here — a handler
 * that forgets its own WHERE clause still cannot leak another village's
 * data because the filter is composed from the authenticated user.
 *
 * Role matrix (POC):
 *   super_admin, admin          → the whole app (all villages)
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
  // Admin manages the whole app; super admin the same.
  if (user.role === "super_admin" || user.role === "admin") return undefined;

  const own = eq(schema.issues.reporterId, user.id);

  if (isApprovedOfficial(user) && userJurisdiction) {
    const villageScope = eq(schema.issues.jurisdictionId, userJurisdiction.id);
    if (user.role === "ward_member" && user.wardNumber) {
      // Their ward's issues plus unassigned ones (no ward recorded yet).
      return or(
        own,
        and(
          villageScope,
          or(eq(schema.issues.wardNumber, user.wardNumber), isNull(schema.issues.wardNumber))
        )
      );
    }
    return villageScope;
  }

  // Everyone else (citizens, pending/declined officials, no jurisdiction).
  if (userJurisdiction) {
    if (user.role === "citizen") {
      return and(
        eq(schema.issues.jurisdictionId, userJurisdiction.id),
        or(own, eq(schema.issues.visibility, "village"))
      );
    }
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
  // Admin manages the whole app.
  if (user.role === "super_admin" || user.role === "admin") return true;

  if (isApprovedOfficial(user) && userJurisdiction) {
    if (issue.jurisdictionId !== userJurisdiction.id) return false;
    if (user.role === "ward_member" && user.wardNumber) {
      return issue.wardNumber === user.wardNumber || issue.wardNumber == null;
    }
    return true;
  }

  // Citizens and others with jurisdiction: MUST match userJurisdiction
  if (userJurisdiction) {
    if (issue.jurisdictionId !== userJurisdiction.id) return false;
    return issue.reporterId === user.id || issue.visibility === "village";
  }

  return issue.reporterId === user.id;
}

export function assertCanManageIssue(
  user: User,
  userJurisdiction: Jurisdiction | null,
  issue: { jurisdictionId: string; wardNumber: string | null }
): void {
  // Admin manages the whole app.
  if (user.role === "super_admin" || user.role === "admin") return;

  if (!isApprovedOfficial(user) || !userJurisdiction) {
    throw forbidden("Only approved officials can update issues");
  }

  // Sarpanch: village-scoped. Ward member: ward-scoped.
  if (issue.jurisdictionId !== userJurisdiction.id) {
    throw forbidden("This issue belongs to a different village");
  }
  if (user.role === "ward_member" && user.wardNumber && issue.wardNumber !== user.wardNumber) {
    throw forbidden("This issue belongs to a different ward");
  }
}
