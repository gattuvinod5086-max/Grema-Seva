import { and, eq, ilike, isNull, or } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db, schema } from "../db/client";
import type { Jurisdiction, User } from "../db/schema";
import { forbidden } from "../middleware/error";

/**
 * Data isolation rules. Every issue query goes through here — a handler
 * that forgets its own WHERE clause still cannot leak another jurisdiction's
 * data because the filter is composed from the authenticated user.
 *
 * Role hierarchy:
 *   super_admin, admin          → statewide (all districts, mandals, villages)
 *   mandal_official (approved)  → their mandal (all villages in that mandal)
 *   sarpanch (approved)         → all issues in the sarpanch's village (panchayat)
 *   ward_member (approved)      → their ward's issues + issues they reported
 *   citizen / pending / declined→ own issues + 'village'-visible issues
 *                                 of the user's own village
 */

export function isApprovedOfficial(user: User): boolean {
  return (
    user.role === "super_admin" ||
    (["sarpanch", "admin", "ward_member", "mandal_official"].includes(user.role) &&
      user.approvalStatus === "approved")
  );
}

/** SQL condition limiting issues to what this user may ever list. */
export function issueVisibilityFilter(
  user: User,
  userJurisdiction: Jurisdiction | null
): SQL | undefined {
  // Admin and Super Admin manage the whole app (statewide oversight).
  if (user.role === "super_admin" || user.role === "admin") return undefined;

  const own = eq(schema.issues.reporterId, user.id);

  if (isApprovedOfficial(user) && userJurisdiction) {
    if (user.role === "mandal_official") {
      // Mandal official sees ALL issues in their district and mandal.
      return and(
        ilike(schema.jurisdictions.district, userJurisdiction.district),
        ilike(schema.jurisdictions.mandal, userJurisdiction.mandal)
      );
    }

    const villageScope = eq(schema.issues.jurisdictionId, userJurisdiction.id);
    if (user.role === "ward_member") {
      if (user.wardNumber) {
        // Strictly their ward's issues + issues reported by themselves + unassigned
        return or(
          own,
          and(
            villageScope,
            or(eq(schema.issues.wardNumber, user.wardNumber), isNull(schema.issues.wardNumber))
          )
        );
      }
      return and(villageScope, own);
    }
    return villageScope;
  }

  // Citizens with registered village jurisdiction: strictly see village-visible issues in their village + own
  if (userJurisdiction && user.role === "citizen") {
    return and(
      eq(schema.issues.jurisdictionId, userJurisdiction.id),
      or(own, eq(schema.issues.visibility, "village"))
    );
  }

  // Pending / declined officials and unregistered users: hold no official powers, only see own reports
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
    if (user.role === "mandal_official") {
      const [j] = await db
        .select()
        .from(schema.jurisdictions)
        .where(eq(schema.jurisdictions.id, issue.jurisdictionId))
        .limit(1);
      return (
        j != null &&
        j.district.toLowerCase() === userJurisdiction.district.toLowerCase() &&
        j.mandal.toLowerCase() === userJurisdiction.mandal.toLowerCase()
      );
    }
    if (issue.jurisdictionId !== userJurisdiction.id) return false;
    if (user.role === "ward_member") {
      if (issue.reporterId === user.id) return true;
      if (!user.wardNumber) return false;
      return issue.wardNumber === user.wardNumber || issue.wardNumber == null;
    }
    return true;
  }

  // Citizens with jurisdiction: MUST match userJurisdiction
  if (userJurisdiction && user.role === "citizen") {
    if (issue.jurisdictionId !== userJurisdiction.id) return false;
    return issue.reporterId === user.id || issue.visibility === "village";
  }

  return issue.reporterId === user.id;
}

export async function assertCanManageIssue(
  user: User,
  userJurisdiction: Jurisdiction | null,
  issue: { jurisdictionId: string; wardNumber: string | null }
): Promise<void> {
  // Admin manages the whole app.
  if (user.role === "super_admin" || user.role === "admin") return;

  if (!isApprovedOfficial(user) || !userJurisdiction) {
    throw forbidden("Only approved officials can update issues");
  }

  if (user.role === "mandal_official") {
    const [j] = await db
      .select()
      .from(schema.jurisdictions)
      .where(eq(schema.jurisdictions.id, issue.jurisdictionId))
      .limit(1);
    if (
      !j ||
      j.district.toLowerCase() !== userJurisdiction.district.toLowerCase() ||
      j.mandal.toLowerCase() !== userJurisdiction.mandal.toLowerCase()
    ) {
      throw forbidden("This issue belongs to a different mandal");
    }
    return;
  }

  // Sarpanch: village-scoped. Ward member: ward-scoped.
  if (issue.jurisdictionId !== userJurisdiction.id) {
    throw forbidden("This issue belongs to a different village");
  }
  if (user.role === "ward_member" && user.wardNumber && issue.wardNumber !== user.wardNumber) {
    throw forbidden("This issue belongs to a different ward");
  }
}
