import { Clock } from "lucide-react";
import type { IssueTimelineEvent } from "@/shared/types";

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
              {formatTimestamp(event.timestamp)}
            </p>
            <p className="font-black text-slate-900 mt-1">
              {event.label || ACTION_LABELS[event.action ?? ""] || event.action}
            </p>
            {event.detail && (
              <p className="text-sm text-slate-600 mt-1">{event.detail}</p>
            )}
            {(event.actorName || event.actorRole) && (
              <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">
                {[event.actorName, event.actorRole].filter(Boolean).join(" • ")}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
