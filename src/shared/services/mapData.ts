export interface MapIssuePoint {
  id: number | string;
  latitude: number;
  longitude: number;
  category: string;
  status: string;
  priority?: string | null;
  village?: string | null;
  weight: number;
}

const PRIORITY_WEIGHT: Record<string, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

/** Transform issues for future heatmap rendering */
export function toMapPoints(
  issues: Array<{
    id: number | string;
    latitude?: number | null;
    longitude?: number | null;
    category: string;
    status: string;
    priority?: string | null;
    village?: string | null;
  }>
): MapIssuePoint[] {
  return issues
    .filter((i) => i.latitude != null && i.longitude != null)
    .map((i) => ({
      id: i.id,
      latitude: i.latitude!,
      longitude: i.longitude!,
      category: i.category,
      status: i.status,
      priority: i.priority,
      village: i.village,
      weight: PRIORITY_WEIGHT[(i.priority ?? "MEDIUM").toUpperCase()] ?? 2,
    }));
}

export function hasMapData(issues: Array<{ latitude?: number | null; longitude?: number | null }>): boolean {
  return issues.some((i) => i.latitude != null && i.longitude != null);
}
