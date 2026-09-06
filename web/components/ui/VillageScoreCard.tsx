import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { GsCard } from "./GsCard";
import type { VillageDevelopmentScore } from "@shared/services/villageScore";

export default function VillageScoreCard({ score }: { score: VillageDevelopmentScore }) {
  const TrendIcon =
    score.trendPercent > 0 ? TrendingUp : score.trendPercent < 0 ? TrendingDown : Minus;
  const trendColor =
    score.trendPercent > 0 ? "text-emerald-600" : score.trendPercent < 0 ? "text-red-600" : "text-slate-500";

  const pct = Math.min(100, Math.max(0, score.current));

  return (
    <GsCard className="overflow-hidden" padding="p-0">
      <div className="p-5 md:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B] mb-1">
          Village Development Score
        </p>
        <div className="flex items-end gap-3">
          <p className="text-4xl md:text-5xl font-bold text-[#67001A] tabular-nums">
            {score.current}
            <span className="text-lg text-[#64748B] font-medium"> / 100</span>
          </p>
          <div className={`flex items-center gap-1 text-sm font-semibold ${trendColor} mb-1`}>
            <TrendIcon size={16} aria-hidden />
            {score.trendPercent >= 0 ? "+" : ""}
            {score.trendPercent}%
          </div>
        </div>
        <div className="mt-4 h-2 rounded-full bg-[#E5E7EB] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#008A3B] transition-all duration-500"
            style={{ width: `${pct}%` }}
            role="progressbar"
            aria-valuenow={score.current}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-[#E5E7EB] border-t border-[#E5E7EB]">
        {Object.entries(score.breakdown).map(([key, val]) => (
          <div key={key} className="bg-white p-3 text-center">
            <p className="text-[10px] font-semibold uppercase text-[#64748B] truncate">{key}</p>
            <p className="text-lg font-bold text-[#1F2937] tabular-nums">{val}</p>
          </div>
        ))}
      </div>
      {score.isDemoData && (
        <p className="text-[10px] font-semibold uppercase text-amber-700 bg-amber-50 px-4 py-2 text-center border-t border-amber-100">
          Demo score — illustrative only
        </p>
      )}
    </GsCard>
  );
}
