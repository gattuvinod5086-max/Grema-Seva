import type { IssueTimelineEvent } from "@shared/types";

const ACTION_LABELS: Record<string, string> = {
  created: "Complaint submitted",
  acknowledged: "Acknowledged",
  assigned: "Assigned",
  status_change: "Status updated",
  escalated: "Escalated",
  resolved: "Marked resolved",
  citizen_confirmed: "Citizen confirmed resolution",
  citizen_rejected: "Citizen rejected resolution",
  photo_uploaded: "Photo uploaded",
  affected_population_updated: "Affected population updated",
};

/** Build timeline from local mock audit records */
export function buildLocalTimeline(
  records: Array<{
    id?: string;
    timestamp: string;
    action: string;
    actorName?: string;
    actorRole?: string;
    detail?: string;
  }>
): IssueTimelineEvent[] {
  return records.map((r) => ({
    id: r.id,
    timestamp: r.timestamp,
    label: ACTION_LABELS[r.action] ?? r.action,
    action: r.action,
    detail: r.detail,
    actorName: r.actorName,
    actorRole: r.actorRole,
  }));
}
