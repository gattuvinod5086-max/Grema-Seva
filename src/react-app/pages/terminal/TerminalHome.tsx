import { ClipboardList, Droplets, Award, UserCheck, ChevronRight, PlusCircle, Newspaper, Siren } from "lucide-react";
import { TerminalGlassCard, Badge } from "./TerminalUI";
import { MOCK_PANCHAYAT } from "@/react-app/data/terminalData";
import { BRANDING } from "@/react-app/constants/branding";
import type { AppUser, VillageIssue } from "@/react-app/data/terminalData";

export function TerminalHome({
  user,
  issues,
  setView,
}: {
  user: AppUser;
  issues: VillageIssue[];
  setView: (v: string) => void;
}) {
  const sarpanch = MOCK_PANCHAYAT.find((l) => l.role === "Sarpanch");

  return (
    <div className="space-y-8 animate-in">
      <TerminalGlassCard className="p-6 md:p-10 relative overflow-hidden border-[#67001A]/10">
        <div className="relative z-10 max-w-2xl">
          <Badge variant="maroon">Digital Governance</Badge>
          <p className="text-xs font-telugu text-[#CCB252] font-semibold mt-2 telugu-text">జై తెలంగాణ</p>
          <h2 className="text-3xl md:text-5xl font-heading text-[#1F2937] mt-3 mb-4 leading-tight">
            Namaste, <span className="text-[#67001A]">{user.name}</span>
          </h2>
          <p className="text-base text-[#64748B] leading-relaxed mb-8">
            Connected hub for <strong className="text-[#008A3B]">{user.village}</strong>. Report issues, access welfare, and connect with your panchayat.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
            <button
              type="button"
              onClick={() => setView("report")}
              className="sm:col-span-2 flex items-center justify-center gap-3 px-6 py-4 rounded-lg font-semibold text-sm text-white bg-[#67001A] hover:bg-[#8A1538] min-h-[52px] shadow-sm"
            >
              <PlusCircle size={20} strokeWidth={2.25} aria-hidden />
              Report a Problem
            </button>
            <button
              type="button"
              onClick={() => setView("krishi")}
              className="flex items-center justify-center gap-2 px-5 py-4 rounded-lg font-semibold text-sm bg-white border border-[#E5E7EB] text-[#1F2937] hover:bg-slate-50 min-h-[52px]"
            >
              🌱 Krishi
            </button>
            <button
              type="button"
              onClick={() => setView("news")}
              className="flex items-center justify-center gap-2 px-5 py-4 rounded-lg font-semibold text-sm bg-white border border-[#E5E7EB] text-[#67001A] hover:bg-slate-50 min-h-[52px]"
            >
              <Newspaper size={18} aria-hidden />
              News
            </button>
            <button
              type="button"
              onClick={() => setView("emergency")}
              className="sm:col-span-2 flex items-center justify-center gap-2 px-5 py-4 rounded-lg font-semibold text-sm bg-red-50 border border-red-200 text-red-800 hover:bg-red-100 min-h-[52px]"
            >
              <Siren size={18} aria-hidden />
              Emergency & Help
            </button>
          </div>
        </div>
        <img
          src={BRANDING.bgMap}
          className="absolute -right-24 -bottom-24 w-[400px] opacity-[0.04] pointer-events-none"
          alt=""
          aria-hidden
        />
      </TerminalGlassCard>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Reports", val: issues.length, icon: <ClipboardList size={22} />, onClick: () => setView("list") },
          { label: "Soil Health", val: "Check", icon: <Droplets size={22} />, onClick: () => setView("krishi") },
          { label: "Welfare", val: "Active", icon: <Award size={22} />, onClick: () => setView("schemes") },
        ].map((s) => (
          <TerminalGlassCard
            key={s.label}
            className="p-5 cursor-pointer hover:shadow-md"
            onClick={s.onClick}
          >
            <div className="w-10 h-10 rounded-lg bg-[#67001A]/8 text-[#67001A] flex items-center justify-center mb-4">
              {s.icon}
            </div>
            <p className="text-2xl font-bold text-[#1F2937]">{s.val}</p>
            <p className="text-[10px] font-semibold uppercase text-[#64748B] tracking-wide mt-1">{s.label}</p>
          </TerminalGlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <TerminalGlassCard className="xl:col-span-1 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-[#1F2937]">Panchayat</h3>
            <UserCheck size={20} className="text-[#CCB252]" aria-hidden />
          </div>
          {sarpanch && (
            <div className="flex items-center gap-4 p-4 rounded-lg border border-[#E5E7EB] bg-slate-50/50">
              <div className="w-12 h-12 bg-[#67001A] text-white rounded-lg flex items-center justify-center text-xl font-bold">
                {sarpanch.name[0]}
              </div>
              <div>
                <p className="font-semibold text-[#1F2937]">{sarpanch.name}</p>
                <p className="text-xs font-semibold text-[#CCB252] uppercase">{sarpanch.role}</p>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={() => setView("panchayat")}
            className="w-full py-3 mt-6 rounded-lg font-semibold text-sm text-[#67001A] border border-[#67001A]/20 hover:bg-[#67001A]/5"
          >
            Directory Hub
          </button>
        </TerminalGlassCard>

        <TerminalGlassCard className="xl:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-[#1F2937]">Recent activity</h3>
            <button
              type="button"
              onClick={() => setView("list")}
              className="text-xs font-semibold text-[#67001A] hover:underline"
            >
              View all
            </button>
          </div>
          <div className="space-y-3">
            {issues.slice(0, 3).map((i) => (
              <div
                key={i.id}
                role="button"
                tabIndex={0}
                className="p-4 rounded-lg border border-[#E5E7EB] hover:border-slate-300 flex items-center justify-between gap-4 cursor-pointer bg-white"
                onClick={() => setView("list")}
                onKeyDown={(e) => e.key === "Enter" && setView("list")}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">📋</div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-[#1F2937] truncate">{i.category}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant={i.status === "Resolved" ? "emerald" : "amber"}>{i.status}</Badge>
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-[#64748B] shrink-0" />
              </div>
            ))}
            {issues.length === 0 && (
              <div className="text-center py-12 text-[#64748B] text-sm border border-dashed border-[#E5E7EB] rounded-lg">
                No recent activity.
              </div>
            )}
          </div>
        </TerminalGlassCard>
      </div>
    </div>
  );
}
