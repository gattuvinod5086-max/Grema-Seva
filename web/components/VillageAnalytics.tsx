import { computeVillageAnalytics, type VillageAnalyticsData } from "@shared/services/analytics";
import VillageScoreCard from "@web/components/ui/VillageScoreCard";
import { GsCard } from "@web/components/ui/GsCard";

interface VillageAnalyticsProps {
  village: string;
  issues: Parameters<typeof computeVillageAnalytics>[1];
  isDemoData?: boolean;
  title?: string;
}

export default function VillageAnalytics({ village, issues, isDemoData, title }: VillageAnalyticsProps) {
  const analytics: VillageAnalyticsData = computeVillageAnalytics(village, issues, { isDemoData });

  return (
    <div className="space-y-6">
      <VillageScoreCard score={analytics.developmentScore} title={title} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total", val: analytics.total },
          { label: "Resolved", val: analytics.resolved, accent: "text-emerald-700" },
          { label: "Pending", val: analytics.pending, accent: "text-amber-700" },
          { label: "SLA Breached", val: analytics.slaBreached, accent: "text-red-700" },
        ].map((s) => (
          <GsCard key={s.label} padding="p-4" className="text-center">
            <p className={`text-2xl font-bold tabular-nums ${s.accent ?? "text-[#67001A]"}`}>{s.val}</p>
            <p className="text-[10px] font-semibold uppercase text-[#64748B] tracking-wide mt-1">{s.label}</p>
          </GsCard>
        ))}
      </div>

      {analytics.avgResolutionHours != null && (
        <p className="text-sm text-[#64748B]">
          Avg resolution: <strong className="text-[#1F2937]">{analytics.avgResolutionHours}h</strong>
        </p>
      )}

      {analytics.topCategories.length > 0 && (
        <GsCard padding="p-4">
          <p className="text-xs font-semibold uppercase text-[#64748B] mb-3">Top categories</p>
          <div className="flex flex-wrap gap-2">
            {analytics.topCategories.map((c) => (
              <span
                key={c.category}
                className="px-3 py-1 rounded-lg bg-slate-50 border border-[#E5E7EB] text-xs font-semibold text-[#1F2937]"
              >
                {c.category} ({c.count})
              </span>
            ))}
          </div>
        </GsCard>
      )}
    </div>
  );
}
