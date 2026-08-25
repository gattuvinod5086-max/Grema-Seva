import { useState } from "react";
import { X, User, Calendar, ArrowUpRight } from "lucide-react";
import { TerminalGlassCard, Badge } from "./TerminalUI";
import SlaDisplay from "@/react-app/components/SlaDisplay";
import IssueTimeline from "@/react-app/components/IssueTimeline";
import { buildLocalTimeline } from "@/react-app/utils/timelineUtils";
import CitizenConfirmation from "@/react-app/components/CitizenConfirmation";
import { getResponsibleRole } from "@/shared/services/escalation";
import { evaluateEscalation } from "@/shared/services/escalation";
import { getSyncStateLabel } from "@/shared/services/offlineSync";
import {
  confirmLocalIssue,
  updateLocalIssueStatus,
  persistLocalIssue,
} from "@/react-app/services/localGovernance";
import type { VillageIssue, AppUser, PriorityLevel } from "@/react-app/data/terminalData";

function getPriorityVariant(p: PriorityLevel): "maroon" | "amber" | "blue" | "default" {
  const upper = String(p).toUpperCase();
  switch (upper) {
    case "CRITICAL":
    case "HIGH":
      return "maroon";
    case "MEDIUM":
      return "amber";
    case "LOW":
      return "blue";
    default:
      return "default";
  }
}

export function TerminalIssues({
  issues,
  user,
  onRefresh,
}: {
  issues: VillageIssue[];
  user: AppUser;
  onRefresh?: () => void;
}) {
  const [selectedIssue, setSelectedIssue] = useState<VillageIssue | null>(null);
  const isOfficial = user.role !== "Citizen";

  const handleStatusUpdate = (status: VillageIssue["status"]) => {
    if (!selectedIssue) return;
    const updated = updateLocalIssueStatus(selectedIssue, status, {
      id: user.id,
      name: user.name,
      role: user.role,
    });
    persistLocalIssue(updated);
    setSelectedIssue(updated);
    onRefresh?.();
  };

  const handleConfirmation = (data: {
    confirmed: boolean;
    rating?: number;
    feedback?: string;
    reason?: string;
  }) => {
    if (!selectedIssue) return;
    const updated = confirmLocalIssue(selectedIssue, data, {
      id: user.id,
      name: user.name,
    });
    persistLocalIssue(updated);
    setSelectedIssue(updated);
    onRefresh?.();
  };

  return (
    <div className="space-y-10 max-w-6xl mx-auto animate-in">
      <div className="flex items-center justify-between px-2 flex-wrap gap-3">
        <div>
          <p className="text-[10px] font-black text-tg-gold uppercase tracking-widest mb-0.5">జై తెలంగాణ</p>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none italic">
            Official <span className="text-tg-maroon">Logs</span>
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="flex items-center gap-2 p-3 bg-white border-2 border-tg-gold/40 rounded-xl text-[10px] font-black text-tg-maroon uppercase tracking-widest transition-all shadow-sm hover:bg-amber-50"
            >
              Refresh
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {issues.map((i) => (
          <TerminalGlassCard
            key={i.id}
            className="p-8 hover:shadow-2xl transition-all group cursor-pointer border-2 border-slate-100 hover:border-tg-gold/30"
            onClick={() => setSelectedIssue(i)}
          >
            {i.photo && (
              <div className="mb-6 -mx-8 -mt-8 h-48 overflow-hidden shadow-inner">
                <img src={i.photo} className="w-full h-full object-cover" alt="Issue evidence" />
              </div>
            )}
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant={i.status === "Resolved" || i.status === "Closed" ? "emerald" : "gold"}>{i.status}</Badge>
                <Badge variant={getPriorityVariant(i.priority)}>{i.priority}</Badge>
                {i.syncState && i.syncState !== "synced" && (
                  <Badge variant="default">{getSyncStateLabel(i.syncState)}</Badge>
                )}
              </div>
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                {i.id.replace("ISS-", "GS-")}
              </p>
            </div>
            <SlaDisplay
              compact
              createdAt={i.createdAt}
              priority={i.priority}
              slaDueAt={i.slaDueAt}
              acknowledgedAt={i.acknowledgedAt}
              resolvedAt={i.resolvedAt}
              status={i.status}
            />
            <h4 className="text-xl font-black text-slate-800 mb-4 mt-4 group-hover:text-tg-maroon transition-colors">
              {i.category}
            </h4>
            <p className="text-sm text-slate-500 font-medium line-clamp-2 mb-6 leading-relaxed">
              {i.description}
            </p>
            <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400 text-[10px]">
                  {i.citizenName[0]}
                </div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  {i.citizenName}
                </span>
              </div>
              <span className="text-[8px] font-black text-slate-300 uppercase">
                {new Date(i.createdAt).toLocaleDateString()}
              </span>
            </div>
          </TerminalGlassCard>
        ))}
        {issues.length === 0 && (
          <div className="col-span-full py-32 text-center border-2 border-dashed border-tg-gold/30 rounded-[3rem] text-slate-400 font-black uppercase tracking-widest bg-amber-50/30">
            No Logged Records
          </div>
        )}
      </div>

      {selectedIssue && (
        <div className="fixed inset-0 z-[100] flex items-start md:items-center justify-center p-4 md:p-6 bg-tg-sidebar/50 backdrop-blur-md animate-in overflow-y-auto">
          <TerminalGlassCard className="w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar p-8 md:p-14 relative shadow-2xl my-4 md:my-0 flex-shrink-0">
            <button
              onClick={() => setSelectedIssue(null)}
              className="absolute top-8 right-8 p-3 bg-white text-slate-500 rounded-2xl hover:bg-red-50 hover:text-tg-maroon transition-all shadow-sm"
            >
              <X size={20} />
            </button>

            {selectedIssue.photo && (
              <div className="mb-10 -mx-8 md:-mx-14 -mt-8 md:-mt-14 h-64 md:h-80 overflow-hidden shadow-2xl">
                <img src={selectedIssue.photo} className="w-full h-full object-cover" alt="Issue detail" />
              </div>
            )}

            <div className="mb-8">
              <div className="flex flex-wrap gap-3 mb-4">
                <Badge variant={selectedIssue.status === "Resolved" || selectedIssue.status === "Closed" ? "emerald" : "gold"}>
                  {selectedIssue.status}
                </Badge>
                <Badge variant={getPriorityVariant(selectedIssue.priority)}>{selectedIssue.priority}</Badge>
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
                {selectedIssue.category}
              </h2>
              <div className="flex flex-wrap items-center gap-4 mt-4 text-[10px] font-black uppercase text-slate-500">
                <span className="flex items-center gap-1"><User size={14} /> {selectedIssue.citizenName}</span>
                <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(selectedIssue.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-8">
              <SlaDisplay
                createdAt={selectedIssue.createdAt}
                priority={selectedIssue.priority}
                slaDueAt={selectedIssue.slaDueAt}
                acknowledgedAt={selectedIssue.acknowledgedAt}
                resolvedAt={selectedIssue.resolvedAt}
                status={selectedIssue.status}
              />

              {(() => {
                const esc = evaluateEscalation({
                  priority: selectedIssue.priority,
                  created_at: selectedIssue.createdAt,
                  sla_due_at: selectedIssue.slaDueAt,
                  acknowledged_at: selectedIssue.acknowledgedAt,
                  resolved_at: selectedIssue.resolvedAt,
                  status: selectedIssue.status,
                  escalation_level: selectedIssue.escalationLevel,
                  escalation_status: selectedIssue.escalationStatus,
                });
                return (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 mb-2">
                      <ArrowUpRight size={14} /> Escalation
                    </div>
                    <p className="text-sm font-bold text-slate-800">
                      Responsible: {getResponsibleRole(selectedIssue.escalationLevel ?? 0)}
                    </p>
                    {esc.reason && <p className="text-xs text-red-600 mt-1">{esc.reason}</p>}
                    {selectedIssue.department && (
                      <p className="text-xs text-slate-500 mt-1">Department: {selectedIssue.department}</p>
                    )}
                  </div>
                );
              })()}

              <section>
                <p className="text-sm text-slate-700 leading-relaxed">{selectedIssue.description}</p>
                <p className="text-xs text-slate-400 mt-2">
                  Affected population:{" "}
                  {selectedIssue.estimatedAffectedCitizens != null
                    ? selectedIssue.estimatedAffectedCitizens
                    : "Not available"}
                </p>
              </section>

              {selectedIssue.timeline && selectedIssue.timeline.length > 0 && (
                <section>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Timeline</h4>
                  <IssueTimeline events={buildLocalTimeline(selectedIssue.timeline)} />
                </section>
              )}

              {selectedIssue.status === "Resolved" &&
                selectedIssue.citizenId === user.id &&
                selectedIssue.citizenConfirmationStatus === "pending" && (
                  <CitizenConfirmation onConfirm={handleConfirmation} />
                )}

              {isOfficial && selectedIssue.status !== "Closed" && (
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  {(["Acknowledged", "In Progress", "Resolved"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleStatusUpdate(s)}
                      className="px-4 py-2 rounded-xl bg-tg-maroon text-white text-[10px] font-black uppercase"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => setSelectedIssue(null)}
                className="w-full py-4 bg-white text-slate-500 border border-slate-200 rounded-2xl font-black text-xs uppercase"
              >
                Close
              </button>
            </div>
          </TerminalGlassCard>
        </div>
      )}
    </div>
  );
}
