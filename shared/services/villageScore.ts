import type { IssueCategory } from "@shared/constants/governance";

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

function mapCategory(raw: string): keyof VillageScoreBreakdown {
  const c = (raw || "").toLowerCase().trim();
  if (c.includes("water") || c.includes("tap") || c.includes("leak") || c.includes("pipe")) return "water";
  if (c.includes("road") || c.includes("pothole") || c.includes("street")) return "roads";
  if (c.includes("sanitat") || c.includes("drain") || c.includes("garbage") || c.includes("waste") || c.includes("clean")) return "sanitation";
  if (c.includes("electr") || c.includes("power") || c.includes("light") || c.includes("transformer")) return "electricity";
  if (c.includes("welfare") || c.includes("agri") || c.includes("scheme") || c.includes("pension") || c.includes("farm")) return "welfare";
  return "issueResolution";
}

function categoryScore(openCount: number, resolvedCount: number): number {
  const total = openCount + resolvedCount;
  if (total === 0) return 85;
  const resolutionRate = resolvedCount / total;
  // Penalty of 4 points per open issue, capped at 35 points max penalty
  const openPenalty = Math.min(35, openCount * 4);
  // Base health 85, adjusted by resolution rate (+15 max bonus) minus open backlog penalty
  const score = Math.round(85 + resolutionRate * 15 - openPenalty);
  return Math.max(15, Math.min(100, score));
}

function computeBucketsFromIssues(
  issues: Array<{
    category: string;
    status: string;
  }>
): Record<keyof VillageScoreBreakdown, { open: number; resolved: number }> {
  const buckets: Record<keyof VillageScoreBreakdown, { open: number; resolved: number }> = {
    water: { open: 0, resolved: 0 },
    roads: { open: 0, resolved: 0 },
    sanitation: { open: 0, resolved: 0 },
    electricity: { open: 0, resolved: 0 },
    welfare: { open: 0, resolved: 0 },
    issueResolution: { open: 0, resolved: 0 },
  };

  for (const issue of issues) {
    const key = mapCategory(issue.category);
    const resolved = issue.status === "Resolved" || issue.status === "Closed";
    if (resolved) buckets[key].resolved++;
    else buckets[key].open++;
  }
  return buckets;
}

function computeScoreFromBuckets(
  buckets: Record<keyof VillageScoreBreakdown, { open: number; resolved: number }>
): { score: number; breakdown: VillageScoreBreakdown } {
  const breakdown: VillageScoreBreakdown = {
    water: categoryScore(buckets.water.open, buckets.water.resolved),
    roads: categoryScore(buckets.roads.open, buckets.roads.resolved),
    sanitation: categoryScore(buckets.sanitation.open, buckets.sanitation.resolved),
    electricity: categoryScore(buckets.electricity.open, buckets.electricity.resolved),
    welfare: categoryScore(buckets.welfare.open, buckets.welfare.resolved),
    issueResolution: categoryScore(buckets.issueResolution.open, buckets.issueResolution.resolved),
  };

  // Weighted average: each category has baseline weight 1, plus active issue volume
  // This prevents 5 empty 85-buckets from masking a crisis in a single active category
  let weightedSum = 0;
  let totalWeight = 0;

  for (const [catKey, bucket] of Object.entries(buckets)) {
    const key = catKey as keyof VillageScoreBreakdown;
    const catIssues = bucket.open + bucket.resolved;
    const weight = 1 + catIssues * 3;
    weightedSum += breakdown[key] * weight;
    totalWeight += weight;
  }

  const score = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 85;
  return { score, breakdown };
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
  options?: { isDemoData?: boolean; label?: string }
): VillageDevelopmentScore {
  const isDemoData = options?.isDemoData ?? issues.length < 3;
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 86_400_000;

  const olderIssues: typeof issues = [];
  let ratingSum = 0;
  let ratingCount = 0;

  for (const issue of issues) {
    const created = new Date(issue.created_at ?? issue.createdAt ?? now).getTime();
    if (created < thirtyDaysAgo) {
      olderIssues.push(issue);
    }
    const rating = issue.citizen_rating ?? issue.citizenRating;
    if (rating != null) {
      ratingSum += rating;
      ratingCount++;
    }
  }

  // 1. Current score & category breakdown
  const currentBuckets = computeBucketsFromIssues(issues);
  const { score: rawCurrent, breakdown } = computeScoreFromBuckets(currentBuckets);

  let current = rawCurrent;
  if (ratingCount > 0) {
    const avgRating = ratingSum / ratingCount;
    current = Math.round(current * 0.85 + (avgRating / 5) * 100 * 0.15);
  }

  // 2. Previous score & dimensionally consistent trend
  // Prior score is computed on issues older than 30 days (or baseline 85 if no prior history)
  let previous = 85;
  if (olderIssues.length > 0) {
    const olderBuckets = computeBucketsFromIssues(olderIssues);
    previous = computeScoreFromBuckets(olderBuckets).score;
  }

  // trendPercent is the point change in the composite 0-100 score
  const trendPercent = issues.length === 0 ? 0 : current - previous;

  return {
    current,
    previous,
    trendPercent,
    breakdown,
    isDemoData,
    label: options?.label ?? (isDemoData ? "DEMO DATA — illustrative score only" : "Calculated from village issue data"),
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
