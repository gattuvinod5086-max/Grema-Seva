import { Clock } from "lucide-react";
import type { IssueTimelineEvent } from "@shared/types";

const ACTION_LABELS: Record<string, string> = {
  created: "Complaint submitted",
  status_change: "Status updated",
  progress: "Progress update",
  confirmation: "Resolution confirmed",
  attachment: "Evidence uploaded",
  comment: "Comment",
  assignment: "Assigned",
};

function labelFor(event: IssueTimelineEvent): string {
  if (event.action === "status_change" && event.newStatus) {
    return `Status updated to ${event.newStatus}`;
  }
  return ACTION_LABELS[event.action] ?? event.action;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function IssueTimeline({ events }: { events: IssueTimelineEvent[] }) {
  if (!events.length) {
    return (
      <p className="text-sm text-slate-400 font-medium italic">No timeline events yet.</p>
    );
  }

  return (
    <div className="space-y-0">
      {events.map((event, idx) => (
        <div key={event.id ?? idx} className="flex gap-4 pb-6 last:pb-0">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-tg-maroon/10 border-2 border-tg-maroon/30 flex items-center justify-center">
              <Clock size={14} className="text-tg-maroon" />
            </div>
            {idx < events.length - 1 && (
              <div className="w-0.5 flex-1 bg-slate-200 mt-2 min-h-[24px]" />
            )}
          </div>
          <div className="flex-1 pt-0.5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {formatTimestamp(event.createdAt)}
            </p>
            <p className="font-black text-slate-900 mt-1">{labelFor(event)}</p>
            {event.note && (
              <p className="text-sm text-slate-600 mt-1">{event.note}</p>
            )}
            {(event.actorName || event.actorRole) && (
              <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">
                {[event.actorName, event.actorRole?.replace("_", " ")].filter(Boolean).join(" • ")}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
