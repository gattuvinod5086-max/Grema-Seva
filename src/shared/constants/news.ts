export const NEWS_CATEGORIES = [
  "Village Announcement",
  "Government Announcement",
  "Welfare",
  "Agriculture",
  "Education",
  "Health",
  "Employment",
  "Infrastructure",
  "Emergency",
  "General",
] as const;
export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

export const NEWS_PRIORITIES = ["LOW", "NORMAL", "IMPORTANT", "URGENT"] as const;
export type NewsPriority = (typeof NEWS_PRIORITIES)[number];

export const NEWS_STATUSES = ["DRAFT", "PUBLISHED", "SCHEDULED", "EXPIRED"] as const;
export type NewsStatus = (typeof NEWS_STATUSES)[number];

export const NEWS_APPROVAL_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type NewsApprovalStatus = (typeof NEWS_APPROVAL_STATUSES)[number];

export const NEWS_VISIBILITY_SCOPES = ["STATE", "DISTRICT", "MANDAL", "VILLAGE"] as const;
export type NewsVisibilityScope = (typeof NEWS_VISIBILITY_SCOPES)[number];

/** Roles allowed to create/publish news (configurable) */
export const NEWS_PUBLISHER_ROLES = [
  "admin",
  "sarpanch",
  "ward_member",
  "mandal_official",
] as const;

/** Roles that can approve news when approval is required */
export const NEWS_APPROVER_ROLES = ["admin", "sarpanch"] as const;

/** Set true to require Sarpanch/Admin approval for ward_member posts */
export const NEWS_REQUIRES_APPROVAL = false;

export function canPublishNews(role: string): boolean {
  return (NEWS_PUBLISHER_ROLES as readonly string[]).includes(role);
}

export function canApproveNews(role: string): boolean {
  return (NEWS_APPROVER_ROLES as readonly string[]).includes(role);
}

export function mapTerminalRoleToApi(role: string): string {
  const map: Record<string, string> = {
    Admin: "admin",
    Sarpanch: "sarpanch",
    "Ward Member": "ward_member",
    "Mandal Official": "mandal_official",
    Citizen: "citizen",
  };
  return map[role] ?? role.toLowerCase().replace(/\s+/g, "_");
}
