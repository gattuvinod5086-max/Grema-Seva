import type { NewsVisibilityScope } from "@shared/constants/news";

export interface NewsLocationTarget {
  visibility_scope: string;
  district?: string | null;
  mandal?: string | null;
  village?: string | null;
}

export interface UserLocation {
  district?: string | null;
  mandal?: string | null;
  village?: string | null;
}

export function newsMatchesUserLocation(
  news: NewsLocationTarget,
  user: UserLocation
): boolean {
  const scope = (news.visibility_scope ?? "VILLAGE") as NewsVisibilityScope;

  if (scope === "STATE") return true;
  if (scope === "DISTRICT") {
    return !news.district || !user.district || news.district === user.district;
  }
  if (scope === "MANDAL") {
    if (news.district && user.district && news.district !== user.district) return false;
    return !news.mandal || !user.mandal || news.mandal === user.mandal;
  }
  // VILLAGE
  if (news.district && user.district && news.district !== user.district) return false;
  if (news.mandal && user.mandal && news.mandal !== user.mandal) return false;
  return !news.village || !user.village || news.village === user.village;
}

export function formatNewsLocation(news: NewsLocationTarget): string {
  const parts = [news.village, news.mandal, news.district].filter(Boolean);
  if (parts.length) return parts.join(", ");
  if (news.visibility_scope === "STATE") return "Telangana";
  return "Telangana";
}
