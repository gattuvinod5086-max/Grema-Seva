export const ISSUE_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type IssuePriority = (typeof ISSUE_PRIORITIES)[number];

export const SLA_HOURS_BY_PRIORITY: Record<IssuePriority, number> = {
  LOW: 72,
  MEDIUM: 48,
  HIGH: 24,
  CRITICAL: 4,
};

export const ISSUE_STATUSES = [
  "Submitted",
  "Acknowledged",
  "In Progress",
  "Resolved",
  "Closed",
  "Reopened",
  "SLA_BREACHED",
] as const;
export type IssueStatus = (typeof ISSUE_STATUSES)[number];

export const ESCALATION_CHAIN = [
  "Citizen",
  "Ward Member",
  "Sarpanch",
  "Mandal Official",
  "District Official",
] as const;
export type EscalationRole = (typeof ESCALATION_CHAIN)[number];

export const ESCALATION_STATUSES = ["NONE", "PENDING", "ESCALATED", "SLA_BREACHED"] as const;
export type EscalationStatus = (typeof ESCALATION_STATUSES)[number];

export const ISSUE_CATEGORIES = [
  "Water",
  "Roads",
  "Sanitation",
  "Electricity",
  "Welfare",
  "Agriculture",
  "Other",
] as const;
export type IssueCategory = (typeof ISSUE_CATEGORIES)[number];

export const SYNC_STATES = ["offline", "pending_sync", "synced"] as const;
export type SyncState = (typeof SYNC_STATES)[number];

export const CITIZEN_CONFIRMATION_STATUSES = [
  "pending",
  "confirmed",
  "rejected",
] as const;
export type CitizenConfirmationStatus = (typeof CITIZEN_CONFIRMATION_STATUSES)[number];

export const AUDIT_ACTIONS = [
  "created",
  "acknowledged",
  "assigned",
  "status_change",
  "escalated",
  "resolved",
  "citizen_confirmed",
  "citizen_rejected",
  "photo_uploaded",
  "affected_population_updated",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const USER_ROLES = [
  "citizen",
  "ward_member",
  "sarpanch",
  "mandal_official",
  "admin",
] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** Normalize legacy terminal priority strings to standard SLA priority */
export function normalizePriority(p: string | null | undefined): IssuePriority {
  const upper = (p ?? "MEDIUM").toUpperCase();
  if (upper === "LOW" || upper === "MEDIUM" || upper === "HIGH" || upper === "CRITICAL") {
    return upper;
  }
  return "MEDIUM";
}

export function formatIssueRef(id: number | string): string {
  const num = typeof id === "string" ? id.replace(/\D/g, "").slice(-4) || id : String(id);
  return `GS-${num}`;
}
