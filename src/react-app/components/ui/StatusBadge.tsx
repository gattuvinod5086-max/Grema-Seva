import { STATUS, ISSUE_STATUS_STYLE, PRIORITY_STYLE } from "@/react-app/constants/design";

type StatusKey = keyof typeof STATUS;

export function StatusBadge({
  label,
  variant = "neutral",
  showDot = true,
}: {
  label: string;
  variant?: StatusKey;
  showDot?: boolean;
}) {
  const s = STATUS[variant];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${s.bg} ${s.text} ${s.border}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} aria-hidden />}
      {label}
    </span>
  );
}

export function IssueStatusBadge({ status }: { status: string }) {
  const variant = ISSUE_STATUS_STYLE[status] ?? "neutral";
  return <StatusBadge label={status} variant={variant} />;
}

export function PriorityBadge({ priority }: { priority: string }) {
  const variant = PRIORITY_STYLE[priority] ?? "neutral";
  return <StatusBadge label={priority} variant={variant} />;
}
