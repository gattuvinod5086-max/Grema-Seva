import {
  NewsMockDB,
  getLocalizedNewsField,
  type LocalNewsArticle,
} from "@/react-app/data/newsData";
import { newsMatchesUserLocation } from "@/shared/services/newsVisibility";
import {
  canPublishNews,
  mapTerminalRoleToApi,
  NEWS_REQUIRES_APPROVAL,
} from "@/shared/constants/news";
import type { AppUser } from "@/react-app/data/terminalData";
import type { NewsCategory, NewsVisibilityScope, NewsPriority, NewsStatus } from "@/shared/constants/news";

export function getVisibleNews(user: AppUser, filter?: string, query?: string): LocalNewsArticle[] {
  const all = NewsMockDB.getAll().filter(
    (n) => n.status === "PUBLISHED" && n.approval_status === "APPROVED"
  );
  let list = all.filter((n) =>
    newsMatchesUserLocation(n, {
      district: user.district,
      mandal: user.mandal,
      village: user.village,
    })
  );

  if (filter === "village") {
    list = list.filter((n) => n.village === user.village || n.category === "Village Announcement");
  } else if (filter === "government") {
    list = list.filter((n) => n.category === "Government Announcement");
  } else if (filter === "welfare") {
    list = list.filter((n) => n.category === "Welfare");
  } else if (filter === "emergency") {
    list = list.filter((n) => n.category === "Emergency" || n.priority === "URGENT");
  } else if (filter === "my-village") {
    list = list.filter((n) => n.village === user.village);
  }

  if (query) {
    const q = query.toLowerCase();
    list = list.filter(
      (n) =>
        n.title_en.toLowerCase().includes(q) ||
        (n.short_description_en ?? "").toLowerCase().includes(q)
    );
  }

  return list.sort(
    (a, b) =>
      new Date(b.published_at ?? b.created_at).getTime() -
      new Date(a.published_at ?? a.created_at).getTime()
  );
}

export function canUserPublishNews(user: AppUser): boolean {
  return canPublishNews(mapTerminalRoleToApi(user.role));
}

export function createLocalNewsArticle(
  user: AppUser,
  data: {
    title_en: string;
    title_te?: string;
    short_description_en: string;
    short_description_te?: string;
    content_en: string;
    content_te?: string;
    category: NewsCategory;
    visibility_scope: NewsVisibilityScope;
    priority: NewsPriority;
    status: NewsStatus;
    district?: string;
    mandal?: string;
    village?: string;
    scheduled_at?: string;
    expires_at?: string;
    image?: string;
  }
): LocalNewsArticle {
  const now = new Date().toISOString();
  const role = mapTerminalRoleToApi(user.role);
  const approval_status =
    NEWS_REQUIRES_APPROVAL && role === "ward_member" ? "PENDING" : "APPROVED";

  return {
    id: `NEWS-${Date.now()}`,
    ...data,
    district: data.district ?? user.district,
    mandal: data.mandal ?? user.mandal,
    village: data.visibility_scope === "VILLAGE" ? data.village ?? user.village : data.village,
    approval_status,
    author_id: user.id,
    author_name: `${user.name} (${user.role})`,
    published_at: data.status === "PUBLISHED" && approval_status === "APPROVED" ? now : undefined,
    view_count: 0,
    created_at: now,
    updated_at: now,
  };
}

export { getLocalizedNewsField };
