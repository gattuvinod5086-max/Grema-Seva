import {
  SLA_HOURS_BY_PRIORITY,
  type IssuePriority,
  normalizePriority,
} from "@shared/constants/governance";

export type SlaStatus = "green" | "amber" | "red";

export interface SlaInfo {
  slaHours: number;
  slaDueAt: string;
  timeRemainingMs: number;
  timeRemainingLabel: string;
  status: SlaStatus;
  breached: boolean;
  approaching: boolean;
}

const APPROACHING_THRESHOLD = 0.25; // last 25% of SLA window

function formatDuration(ms: number): string {
  if (ms <= 0) return "0m";
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return `${days}d ${remHours}h`;
  }
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function computeSlaDueAt(createdAt: string, priority: IssuePriority): string {
  const hours = SLA_HOURS_BY_PRIORITY[priority];
  const due = new Date(createdAt);
  due.setHours(due.getHours() + hours);
  return due.toISOString();
}

export function getSlaHours(priority: string | null | undefined): number {
  return SLA_HOURS_BY_PRIORITY[normalizePriority(priority)];
}

export function computeSlaInfo(params: {
  createdAt: string;
  priority: string | null | undefined;
  slaDueAt?: string | null;
  acknowledgedAt?: string | null;
  resolvedAt?: string | null;
  status?: string | null;
  now?: Date;
}): SlaInfo {
  const priority = normalizePriority(params.priority);
  const slaHours = SLA_HOURS_BY_PRIORITY[priority];
  const created = new Date(params.createdAt);
  const due = params.slaDueAt
    ? new Date(params.slaDueAt)
    : new Date(created.getTime() + slaHours * 3_600_000);
  const now = params.now ?? new Date();

  const resolved =
    params.resolvedAt ||
    (params.status === "Resolved" || params.status === "Closed" ? now.toISOString() : null);

  const endTime = resolved ? new Date(resolved) : now;
  const remainingMs = due.getTime() - endTime.getTime();
  const totalMs = slaHours * 3_600_000;
  const breached = remainingMs < 0 && !resolved;
  const approaching =
    !breached && !resolved && remainingMs > 0 && remainingMs / totalMs <= APPROACHING_THRESHOLD;

  let status: SlaStatus = "green";
  if (breached || params.status === "SLA_BREACHED") status = "red";
  else if (approaching) status = "amber";

  return {
    slaHours,
    slaDueAt: due.toISOString(),
    timeRemainingMs: Math.max(0, remainingMs),
    timeRemainingLabel: breached
      ? `Breached by ${formatDuration(-remainingMs)}`
      : formatDuration(remainingMs),
    status,
    breached,
    approaching,
  };
}
