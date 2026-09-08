import { useMemo } from "react";
import { Award } from "lucide-react";
import VillageAnalytics from "@web/components/VillageAnalytics";
import { useApi } from "@web/hooks/useApi";
import type { IssueListResponse, User } from "@shared/types";
import { BRANDING } from "@web/constants/branding";

export default function VillageAnalyticsPage() {
  const { data: userResp } = useApi<{ user: User }>("/api/users/me");
  const { data: issuesData } = useApi<IssueListResponse>("/api/issues");
  const user = userResp?.user;
  const issues = useMemo(() => issuesData?.issues ?? [], [issuesData]);

  const village = user?.village || "All Villages";

  return (
    <div className="space-y-8 animate-in pb-12">
      {/* Header Banner */}
      <div
        className="rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-lg border-2 border-[#CCB252]"
        style={{ background: "linear-gradient(135deg, #67001A 0%, #8A1538 50%, #4d0012 100%)" }}
      >
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-[#CCB252] uppercase tracking-wider mb-3">
            <Award size={14} /> Palle Pragathi Metrics
          </div>
          <p className="text-xs font-telugu text-[#CCB252] font-semibold telugu-text">గ్రామ అభివృద్ధి కొలమానం</p>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mt-2 mb-3 leading-tight">
            Village Development Score & Analytics
          </h1>
          <p className="text-sm md:text-base text-white/90 leading-relaxed">
            Real-time grievance redressal velocity, SLA compliance, and civic infrastructure metrics for {village}.
          </p>
        </div>
        <img
          src={BRANDING.bgMap}
          className="absolute -right-20 -bottom-20 w-[350px] opacity-[0.06] pointer-events-none"
          alt=""
          aria-hidden
        />
      </div>

      <div className="bg-white rounded-3xl p-6 md:p-8 border-2 border-slate-200 shadow-sm">
        <VillageAnalytics village={village} issues={issues} />
      </div>
    </div>
  );
}
