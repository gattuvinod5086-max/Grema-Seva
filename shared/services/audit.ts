import type { AuditAction } from "@shared/constants/governance";

export interface AuditRecord {
  issue_id: number | string;
  user_id: string;
  actor_role: string;
  action_type: AuditAction;
  old_value?: string | null;
  new_value?: string | null;
  comment?: string | null;
  created_at: string;
}

export function buildAuditRecord(params: {
  issueId: number | string;
  userId: string;
  actorRole: string;
  actionType: AuditAction;
  oldValue?: string | null;
  newValue?: string | null;
  comment?: string | null;
}): AuditRecord {
  return {
    issue_id: params.issueId,
    user_id: params.userId,
    actor_role: params.actorRole,
    action_type: params.actionType,
    old_value: params.oldValue ?? null,
    new_value: params.newValue ?? null,
    comment: params.comment ?? null,
    created_at: new Date().toISOString(),
  };
}

export interface TimelineEntry {
  id?: number | string;
  timestamp: string;
  action: string;
  actorName?: string;
  actorRole?: string;
  detail?: string;
}

export function auditToTimeline(
  records: Array<{
    id?: number;
    created_at: string;
    action_type?: string;
    new_status?: string;
    comment?: string | null;
    actor_role?: string | null;
    user_id?: string;
    old_value?: string | null;
    new_value?: string | null;
  }>,
  actorNames?: Record<string, string>
): TimelineEntry[] {
  return records.map((r) => {
    const action = r.action_type ?? "status_change";
    let detail = r.comment ?? undefined;
    if (action === "status_change" && r.new_status) {
      detail = r.old_value
        ? `Status changed from ${r.old_value} to ${r.new_value ?? r.new_status}`
        : `Status changed to ${r.new_status}`;
    } else if (action === "escalated") {
      detail = r.new_value ?? "Escalated to next responsible official";
    } else if (action === "citizen_confirmed") {
      detail = "Citizen confirmed resolution";
    } else if (action === "citizen_rejected") {
      detail = r.comment ?? "Citizen reported issue not resolved";
    } else if (action === "created") {
      detail = "Complaint submitted by citizen";
    } else if (action === "acknowledged") {
      detail = `Acknowledged by ${r.actor_role ?? "official"}`;
    } else if (action === "assigned") {
      detail = r.new_value ?? "Issue assigned";
    }

    return {
      id: r.id,
      timestamp: r.created_at,
      action,
      actorRole: r.actor_role ?? undefined,
      actorName: r.user_id ? actorNames?.[r.user_id] : undefined,
      detail,
    };
  });
}
