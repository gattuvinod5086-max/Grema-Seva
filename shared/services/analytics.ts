import { computeSlaInfo } from "@shared/services/sla";
import { computeVillageDevelopmentScore, type VillageScoreBreakdown } from "@shared/services/villageScore";

export interface DashboardStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  slaBreached: number;
  critical: number;
  avgResolutionHours: number | null;
  citizensAffected: number | null;
  villagesAffected: number;
  isDemoData: boolean;
}

export interface VillageAnalyticsData extends DashboardStats {
  village: string;
  topCategories: Array<{ category: string; count: number }>;
  citizenSatisfaction: number | null;
  developmentScore: ReturnType<typeof computeVillageDevelopmentScore>;
}

type IssueLike = {
  id?: number | string;
  category: string;
  status: string;
  priority?: string | null;
  village?: string | null;
  created_at?: string;
  createdAt?: string;
  resolved_at?: string | null;
  resolvedAt?: string | null;
  acknowledged_at?: string | null;
  sla_due_at?: string | null;
  estimated_affected_citizens?: number | null;
  estimatedAffectedCitizens?: number | null;
  citizen_rating?: number | null;
  citizenRating?: number | null;
};

export function computeDashboardStats(
  issues: IssueLike[],
  options?: { isDemoData?: boolean }
): DashboardStats {
  const isDemoData = options?.isDemoData ?? false;
  let pending = 0;
  let inProgress = 0;
  let resolved = 0;
  let slaBreached = 0;
  let critical = 0;
  let resolutionSumHours = 0;
  let resolutionCount = 0;
  let citizensAffected = 0;
  let hasAffectedData = false;
  const villages = new Set<string>();

  for (const issue of issues) {
    if (issue.village) villages.add(issue.village);

    const status = issue.status;
    if (status === "Submitted" || status === "Acknowledged" || status === "Reopened") pending++;
    else if (status === "In Progress") inProgress++;
    else if (status === "Resolved" || status === "Closed") resolved++;

    if ((issue.priority ?? "").toUpperCase() === "CRITICAL") critical++;

    const sla = computeSlaInfo({
      createdAt: issue.created_at ?? issue.createdAt ?? new Date().toISOString(),
      priority: issue.priority,
      slaDueAt: issue.sla_due_at,
      acknowledgedAt: issue.acknowledged_at,
      resolvedAt: issue.resolved_at ?? issue.resolvedAt,
      status: issue.status,
    });
    if (sla.breached || status === "SLA_BREACHED") slaBreached++;

    const resolvedAt = issue.resolved_at ?? issue.resolvedAt;
    const createdAt = issue.created_at ?? issue.createdAt;
    if (resolvedAt && createdAt) {
      const hours = (new Date(resolvedAt).getTime() - new Date(createdAt).getTime()) / 3_600_000;
      if (hours >= 0) {
        resolutionSumHours += hours;
        resolutionCount++;
      }
    }

    const affected = issue.estimated_affected_citizens ?? issue.estimatedAffectedCitizens;
    if (affected != null) {
      citizensAffected += affected;
      hasAffectedData = true;
    }
  }

  return {
    total: issues.length,
    pending,
    inProgress,
    resolved,
    slaBreached,
    critical,
    avgResolutionHours: resolutionCount ? Math.round(resolutionSumHours / resolutionCount) : null,
    citizensAffected: hasAffectedData ? citizensAffected : null,
    villagesAffected: villages.size,
    isDemoData,
  };
}

export function computeVillageAnalytics(
  village: string,
  issues: IssueLike[],
  options?: { isDemoData?: boolean }
): VillageAnalyticsData {
  const normalizedVillage = (village || "").trim();
  const isAll =
    !normalizedVillage ||
    normalizedVillage.toLowerCase() === "all" ||
    normalizedVillage.toLowerCase() === "all villages" ||
    normalizedVillage.toLowerCase() === "statewide";

  const villageIssues = isAll
    ? issues
    : issues.filter((i) => (i.village || "").trim().toLowerCase() === normalizedVillage.toLowerCase());

  // isDemoData is true whenever total issues < 3 (never forced false for aggregate!)
  const isDemoData = options?.isDemoData ?? (villageIssues.length < 3);
  const stats = computeDashboardStats(villageIssues, { isDemoData });

  const categoryCounts: Record<string, number> = {};
  let ratingSum = 0;
  let ratingCount = 0;

  for (const issue of villageIssues) {
    categoryCounts[issue.category] = (categoryCounts[issue.category] ?? 0) + 1;
    const rating = issue.citizen_rating ?? issue.citizenRating;
    if (rating != null) {
      ratingSum += rating;
      ratingCount++;
    }
  }

  const topCategories = Object.entries(categoryCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Volume-weighted Civic Health Index for aggregate scopes (Mandal / District / Statewide)
  let devScore: ReturnType<typeof computeVillageDevelopmentScore>;

  if (isAll) {
    // Group issues by normalized village name to prevent case/whitespace fragmentation
    const villageGroups = new Map<string, { name: string; issues: IssueLike[] }>();
    for (const issue of villageIssues) {
      const vRaw = (issue.village || "Unknown").trim();
      const vKey = vRaw.toLowerCase();
      const entry = villageGroups.get(vKey) ?? { name: vRaw, issues: [] };
      entry.issues.push(issue);
      villageGroups.set(vKey, entry);
    }

    if (villageGroups.size > 1) {
      // Volume-weighted aggregation across constituent villages:
      // High-volume villages contribute proportionally to both headline score and category breakdown
      let weightedCurrent = 0;
      let weightedPrev = 0;
      let totalGrievances = 0;
      const weightedBreakdown: Record<keyof VillageScoreBreakdown, number> = {
        water: 0,
        roads: 0,
        sanitation: 0,
        electricity: 0,
        welfare: 0,
        issueResolution: 0,
      };

      for (const entry of villageGroups.values()) {
        const vScore = computeVillageDevelopmentScore(entry.issues, { isDemoData });
        const weight = Math.max(1, entry.issues.length);
        weightedCurrent += vScore.current * weight;
        weightedPrev += vScore.previous * weight;
        for (const [k, val] of Object.entries(vScore.breakdown)) {
          weightedBreakdown[k as keyof VillageScoreBreakdown] += val * weight;
        }
        totalGrievances += weight;
      }

      const compositeCurrent = totalGrievances > 0 ? Math.round(weightedCurrent / totalGrievances) : 85;
      const compositePrev = totalGrievances > 0 ? Math.round(weightedPrev / totalGrievances) : 85;
      const compositeBreakdown: VillageScoreBreakdown = {
        water: totalGrievances > 0 ? Math.round(weightedBreakdown.water / totalGrievances) : 85,
        roads: totalGrievances > 0 ? Math.round(weightedBreakdown.roads / totalGrievances) : 85,
        sanitation: totalGrievances > 0 ? Math.round(weightedBreakdown.sanitation / totalGrievances) : 85,
        electricity: totalGrievances > 0 ? Math.round(weightedBreakdown.electricity / totalGrievances) : 85,
        welfare: totalGrievances > 0 ? Math.round(weightedBreakdown.welfare / totalGrievances) : 85,
        issueResolution: totalGrievances > 0 ? Math.round(weightedBreakdown.issueResolution / totalGrievances) : 85,
      };

      devScore = {
        current: compositeCurrent,
        previous: compositePrev,
        trendPercent: compositeCurrent - compositePrev,
        breakdown: compositeBreakdown,
        isDemoData,
        label: isDemoData
          ? "DEMO DATA — illustrative aggregate score"
          : `Aggregated across ${villageGroups.size} villages (${totalGrievances} grievances)`,
      };
    } else {
      devScore = computeVillageDevelopmentScore(villageIssues, { isDemoData });
    }
  } else {
    devScore = computeVillageDevelopmentScore(villageIssues, { isDemoData });
  }

  return {
    ...stats,
    village,
    topCategories,
    citizenSatisfaction: ratingCount ? Math.round((ratingSum / ratingCount) * 10) / 10 : null,
    developmentScore: devScore,
  };
}

export function filterIssues<T extends IssueLike>(
  issues: T[],
  filters: {
    district?: string;
    mandal?: string;
    village?: string;
    ward?: string;
    category?: string;
    priority?: string;
    status?: string;
    slaStatus?: "green" | "amber" | "red" | "breached";
  }
): T[] {
  return issues.filter((issue) => {
    const issueExt = issue as IssueLike & { district?: string; mandal?: string; ward?: string };
    if (filters.district && issueExt.district !== filters.district) return false;
    if (filters.mandal && issueExt.mandal !== filters.mandal) return false;
    if (filters.village && issue.village !== filters.village) return false;
    if (filters.ward && issueExt.ward !== filters.ward) return false;
    if (filters.category && issue.category !== filters.category) return false;
    if (filters.priority && (issue.priority ?? "").toUpperCase() !== filters.priority.toUpperCase())
      return false;
    if (filters.status && issue.status !== filters.status) return false;
    if (filters.slaStatus) {
      const sla = computeSlaInfo({
        createdAt: issue.created_at ?? issue.createdAt ?? new Date().toISOString(),
        priority: issue.priority,
        slaDueAt: issue.sla_due_at,
        status: issue.status,
      });
      if (filters.slaStatus === "breached" && !sla.breached) return false;
      if (filters.slaStatus !== "breached" && sla.status !== filters.slaStatus) return false;
    }
    return true;
  });
}
