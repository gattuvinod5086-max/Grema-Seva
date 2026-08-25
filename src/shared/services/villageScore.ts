import type { IssueCategory } from "@/shared/constants/governance";

export interface VillageScoreBreakdown {
  water: number;
  roads: number;
  sanitation: number;
  electricity: number;
  welfare: number;
  issueResolution: number;
}

export interface VillageDevelopmentScore {
  current: number;
  previous: number;
  trendPercent: number;
  breakdown: VillageScoreBreakdown;
  isDemoData: boolean;
  label: string;
}

const CATEGORY_MAP: Record<string, keyof VillageScoreBreakdown> = {
  Water: "water",
  Roads: "roads",
  Sanitation: "sanitation",
  Electricity: "electricity",
  Welfare: "welfare",
  Agriculture: "welfare",
  Other: "issueResolution",
};

function categoryScore(openCount: number, resolvedCount: number): number {
  const total = openCount + resolvedCount;
  if (total === 0) return 85;
  const resolutionRate = resolvedCount / total;
  const openPenalty = Math.min(30, openCount * 3);
  return Math.max(0, Math.min(100, Math.round(resolutionRate * 100 - openPenalty + 10)));
}

export function computeVillageDevelopmentScore(
  issues: Array<{
    category: string;
    status: string;
    created_at?: string;
    createdAt?: string;
    citizen_rating?: number | null;
    citizenRating?: number | null;
    resolved_at?: string | null;
    resolvedAt?: string | null;
  }>,
  options?: { isDemoData?: boolean }
): VillageDevelopmentScore {
  const isDemoData = options?.isDemoData ?? issues.length < 3;
  const buckets: Record<keyof VillageScoreBreakdown, { open: number; resolved: number }> = {
    water: { open: 0, resolved: 0 },
    roads: { open: 0, resolved: 0 },
    sanitation: { open: 0, resolved: 0 },
    electricity: { open: 0, resolved: 0 },
    welfare: { open: 0, resolved: 0 },
    issueResolution: { open: 0, resolved: 0 },
  };

  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 86_400_000;

  let recentResolved = 0;
  let recentTotal = 0;
  let olderResolved = 0;
  let olderTotal = 0;
  let ratingSum = 0;
  let ratingCount = 0;

  for (const issue of issues) {
    const key = CATEGORY_MAP[issue.category] ?? "issueResolution";
    const resolved = issue.status === "Resolved" || issue.status === "Closed";
    if (resolved) buckets[key].resolved++;
    else buckets[key].open++;

    const created = new Date(issue.created_at ?? issue.createdAt ?? now).getTime();
    if (created >= thirtyDaysAgo) {
      recentTotal++;
      if (resolved) recentResolved++;
    } else {
      olderTotal++;
      if (resolved) olderResolved++;
    }

    const rating = issue.citizen_rating ?? issue.citizenRating;
    if (rating != null) {
      ratingSum += rating;
      ratingCount++;
    }
  }

  const breakdown: VillageScoreBreakdown = {
    water: categoryScore(buckets.water.open, buckets.water.resolved),
    roads: categoryScore(buckets.roads.open, buckets.roads.resolved),
    sanitation: categoryScore(buckets.sanitation.open, buckets.sanitation.resolved),
    electricity: categoryScore(buckets.electricity.open, buckets.electricity.resolved),
    welfare: categoryScore(buckets.welfare.open, buckets.welfare.resolved),
    issueResolution: categoryScore(buckets.issueResolution.open, buckets.issueResolution.resolved),
  };

  const values = Object.values(breakdown);
  let current = Math.round(values.reduce((a, b) => a + b, 0) / values.length);

  if (ratingCount > 0) {
    const avgRating = ratingSum / ratingCount;
    current = Math.round(current * 0.85 + (avgRating / 5) * 100 * 0.15);
  }

  const recentRate = recentTotal ? recentResolved / recentTotal : 0;
  const olderRate = olderTotal ? olderResolved / olderTotal : recentRate;
  const trendPercent =
    olderTotal === 0 && recentTotal === 0
      ? 0
      : Math.round((recentRate - olderRate) * 100);

  const previous = Math.max(0, Math.min(100, current - trendPercent));

  return {
    current,
    previous,
    trendPercent,
    breakdown,
    isDemoData,
    label: isDemoData ? "DEMO DATA — illustrative score only" : "Calculated from village issue data",
  };
}

export function getCategoryLabel(key: keyof VillageScoreBreakdown): IssueCategory | string {
  const labels: Record<keyof VillageScoreBreakdown, string> = {
    water: "Water",
    roads: "Roads",
    sanitation: "Sanitation",
    electricity: "Electricity",
    welfare: "Welfare",
    issueResolution: "Issue Resolution",
  };
  return labels[key];
}
