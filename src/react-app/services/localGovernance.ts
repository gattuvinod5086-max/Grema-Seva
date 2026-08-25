import {
  normalizePriority,
  formatIssueRef,
} from "@/shared/constants/governance";
import { computeSlaDueAt, getSlaHours } from "@/shared/services/sla";
import { evaluateEscalation, nextEscalationLevel } from "@/shared/services/escalation";
import { classifyIssue } from "@/shared/services/issueClassification";
import { getDepartmentForCategory } from "@/shared/services/departmentRouting";
import { buildAuditRecord } from "@/shared/services/audit";
import { resolveSyncState } from "@/shared/services/offlineSync";
import type { VillageIssue, IssueAuditRecord } from "@/react-app/data/terminalData";
import { MockDB } from "@/react-app/data/terminalData";

export function createLocalIssue(params: {
  citizenId: string;
  citizenName: string;
  category: string;
  description: string;
  priority?: string;
  ward: string;
  village: string;
  district?: string;
  mandal?: string;
  photo?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  estimatedAffectedCitizens?: number;
  isOnline?: boolean;
}): VillageIssue {
  const classification = classifyIssue(params.description);
  const now = new Date().toISOString();
  const priority = normalizePriority(params.priority ?? classification.priority);
  const category = params.category || classification.category;
  const slaHours = getSlaHours(priority);
  const slaDueAt = computeSlaDueAt(now, priority);

  const issue: VillageIssue = {
    id: `ISS-${Date.now()}`,
    citizenId: params.citizenId,
    citizenName: params.citizenName,
    category,
    description: params.description,
    status: "Submitted",
    priority,
    department: getDepartmentForCategory(category),
    slaHours,
    slaDueAt,
    escalationLevel: 0,
    escalationStatus: "NONE",
    createdAt: now,
    ward: params.ward,
    village: params.village,
    district: params.district,
    mandal: params.mandal,
    photo: params.photo,
    location: params.location,
    latitude: params.latitude,
    longitude: params.longitude,
    estimatedAffectedCitizens: params.estimatedAffectedCitizens,
    syncState: resolveSyncState(params.isOnline ?? navigator.onLine, true),
    timeline: [
      {
        id: `AUD-${Date.now()}`,
        timestamp: now,
        action: "created",
        actorName: params.citizenName,
        actorRole: "Citizen",
        detail: "Complaint submitted by citizen",
      },
    ],
  };

  return issue;
}

export function updateLocalIssueStatus(
  issue: VillageIssue,
  status: VillageIssue["status"],
  actor: { id: string; name: string; role: string },
  comment?: string
): VillageIssue {
  const now = new Date().toISOString();
  const updated = { ...issue, status, updatedAt: now };

  if (status === "Acknowledged" && !updated.acknowledgedAt) updated.acknowledgedAt = now;
  if (status === "In Progress" && !updated.assignedAt) updated.assignedAt = now;
  if (status === "Resolved" && !updated.resolvedAt) {
    updated.resolvedAt = now;
    updated.citizenConfirmationStatus = "pending";
  }
  if (status === "Reopened") {
    updated.resolvedAt = undefined;
    updated.citizenConfirmationStatus = undefined;
  }

  const audit: IssueAuditRecord = {
    id: `AUD-${Date.now()}`,
    timestamp: now,
    action: status === "Acknowledged" ? "acknowledged" : "status_change",
    actorName: actor.name,
    actorRole: actor.role,
    detail: comment ?? `Status changed to ${status}`,
  };

  updated.timeline = [...(issue.timeline ?? []), audit];
  return updated;
}

export function processLocalEscalations(issues: VillageIssue[]): VillageIssue[] {
  return issues.map((issue) => {
    const evalResult = evaluateEscalation({
      priority: issue.priority,
      created_at: issue.createdAt,
      sla_due_at: issue.slaDueAt,
      acknowledged_at: issue.acknowledgedAt,
      resolved_at: issue.resolvedAt,
      status: issue.status,
      escalation_level: issue.escalationLevel,
      escalation_status: issue.escalationStatus,
    });

    if (!evalResult.shouldEscalate) return issue;

    const now = new Date().toISOString();
    return {
      ...issue,
      escalationLevel: nextEscalationLevel(issue.escalationLevel ?? 0),
      escalationStatus: evalResult.escalationStatus,
      status: evalResult.escalationStatus === "SLA_BREACHED" ? "SLA_BREACHED" : issue.status,
      timeline: [
        ...(issue.timeline ?? []),
        {
          id: `AUD-${Date.now()}`,
          timestamp: now,
          action: "escalated",
          actorRole: "System",
          detail: `${evalResult.reason}. Escalated to ${evalResult.nextResponsibleRole}`,
        },
      ],
    };
  });
}

export function confirmLocalIssue(
  issue: VillageIssue,
  data: { confirmed: boolean; rating?: number; feedback?: string; reason?: string },
  citizen: { id: string; name: string }
): VillageIssue {
  const now = new Date().toISOString();
  if (data.confirmed) {
    return {
      ...issue,
      status: "Closed",
      citizenConfirmationStatus: "confirmed",
      citizenConfirmedAt: now,
      citizenRating: data.rating,
      citizenFeedback: data.feedback,
      timeline: [
        ...(issue.timeline ?? []),
        {
          id: `AUD-${Date.now()}`,
          timestamp: now,
          action: "citizen_confirmed",
          actorName: citizen.name,
          actorRole: "Citizen",
          detail: data.feedback ?? "Citizen confirmed resolution",
        },
      ],
    };
  }

  return {
    ...issue,
    status: "Reopened",
    citizenConfirmationStatus: "rejected",
    resolvedAt: undefined,
    citizenFeedback: data.reason ?? data.feedback,
    timeline: [
      ...(issue.timeline ?? []),
      {
        id: `AUD-${Date.now()}`,
        timestamp: now,
        action: "citizen_rejected",
        actorName: citizen.name,
        actorRole: "Citizen",
        detail: data.reason ?? data.feedback ?? "Citizen reported unresolved",
      },
    ],
  };
}

export function persistLocalIssue(issue: VillageIssue) {
  const issues = MockDB.getAllIssues();
  const idx = issues.findIndex((i) => i.id === issue.id);
  if (idx >= 0) issues[idx] = issue;
  else issues.unshift(issue);
  MockDB.saveAllIssues(issues);
}

export { formatIssueRef, buildAuditRecord, classifyIssue };
