import {
  ESCALATION_CHAIN,
  type EscalationRole,
  type EscalationStatus,
  type IssuePriority,
} from "@/shared/constants/governance";
import { computeSlaInfo } from "@/shared/services/sla";

export interface EscalationState {
  escalationLevel: number;
  escalationStatus: EscalationStatus;
  currentResponsibleRole: EscalationRole;
  nextResponsibleRole: EscalationRole | null;
  shouldEscalate: boolean;
  reason: string | null;
}

export function getResponsibleRole(level: number): EscalationRole {
  const idx = Math.min(Math.max(level, 0), ESCALATION_CHAIN.length - 1);
  return ESCALATION_CHAIN[idx];
}

export function evaluateEscalation(issue: {
  priority?: string | null;
  created_at: string;
  sla_due_at?: string | null;
  acknowledged_at?: string | null;
  resolved_at?: string | null;
  status?: string | null;
  escalation_level?: number | null;
  escalation_status?: string | null;
  now?: Date;
}): EscalationState {
  const level = issue.escalation_level ?? 0;
  const currentRole = getResponsibleRole(level);
  const nextRole = level < ESCALATION_CHAIN.length - 1 ? ESCALATION_CHAIN[level + 1] : null;

  const sla = computeSlaInfo({
    createdAt: issue.created_at,
    priority: issue.priority as IssuePriority,
    slaDueAt: issue.sla_due_at,
    acknowledgedAt: issue.acknowledged_at,
    resolvedAt: issue.resolved_at,
    status: issue.status,
    now: issue.now,
  });

  const isTerminal =
    issue.status === "Resolved" ||
    issue.status === "Closed" ||
    !!issue.resolved_at;

  if (isTerminal) {
    return {
      escalationLevel: level,
      escalationStatus: (issue.escalation_status as EscalationStatus) ?? "NONE",
      currentResponsibleRole: currentRole,
      nextResponsibleRole: null,
      shouldEscalate: false,
      reason: null,
    };
  }

  if (!issue.acknowledged_at && sla.breached) {
    return {
      escalationLevel: level,
      escalationStatus: "ESCALATED",
      currentResponsibleRole: currentRole,
      nextResponsibleRole: nextRole,
      shouldEscalate: !!nextRole,
      reason: "Not acknowledged within SLA",
    };
  }

  if (issue.acknowledged_at && sla.breached && issue.status !== "Resolved") {
    return {
      escalationLevel: level,
      escalationStatus: "SLA_BREACHED",
      currentResponsibleRole: currentRole,
      nextResponsibleRole: nextRole,
      shouldEscalate: !!nextRole,
      reason: "Unresolved after SLA deadline",
    };
  }

  return {
    escalationLevel: level,
    escalationStatus: (issue.escalation_status as EscalationStatus) ?? "NONE",
    currentResponsibleRole: currentRole,
    nextResponsibleRole: nextRole,
    shouldEscalate: false,
    reason: null,
  };
}

export function nextEscalationLevel(current: number): number {
  return Math.min(current + 1, ESCALATION_CHAIN.length - 1);
}
