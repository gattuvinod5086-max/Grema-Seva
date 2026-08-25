import type {
  NewsCategory,
  NewsPriority,
  NewsStatus,
  NewsApprovalStatus,
  NewsVisibilityScope,
} from "@/shared/constants/news";

export interface LocalNewsArticle {
  id: string;
  title_en: string;
  title_te?: string;
  short_description_en: string;
  short_description_te?: string;
  content_en: string;
  content_te?: string;
  category: NewsCategory;
  image?: string;
  district?: string;
  mandal?: string;
  village?: string;
  visibility_scope: NewsVisibilityScope;
  priority: NewsPriority;
  status: NewsStatus;
  approval_status: NewsApprovalStatus;
  author_id: string;
  author_name: string;
  published_at?: string;
  scheduled_at?: string;
  expires_at?: string;
  view_count: number;
  created_at: string;
  updated_at: string;
  isDemoData?: boolean;
}

export const NEWS_STORAGE_KEY = "tg_grama_seva_news";
export const NEWS_DEMO_SEEDED_KEY = "tg_grama_seva_news_demo";

function readNews(): LocalNewsArticle[] {
  try {
    const raw = localStorage.getItem(NEWS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LocalNewsArticle[]) : [];
  } catch {
    return [];
  }
}

function writeNews(items: LocalNewsArticle[]) {
  localStorage.setItem(NEWS_STORAGE_KEY, JSON.stringify(items));
}

export const NewsMockDB = {
  getAll: (): LocalNewsArticle[] => readNews(),
  getById: (id: string): LocalNewsArticle | undefined => readNews().find((n) => n.id === id),
  save: (article: LocalNewsArticle) => {
    const all = readNews();
    const idx = all.findIndex((n) => n.id === article.id);
    if (idx >= 0) all[idx] = article;
    else all.unshift(article);
    writeNews(all);
  },
  delete: (id: string) => writeNews(readNews().filter((n) => n.id !== id)),
  incrementView: (id: string) => {
    const all = readNews();
    const idx = all.findIndex((n) => n.id === id);
    if (idx >= 0) {
      all[idx].view_count += 1;
      writeNews(all);
    }
  },
  seedDemo: (village: string, district: string, mandal: string) => {
    if (localStorage.getItem(NEWS_DEMO_SEEDED_KEY)) return;
    const demo = createDemoNews(village, district, mandal);
    writeNews([...demo, ...readNews()]);
    localStorage.setItem(NEWS_DEMO_SEEDED_KEY, "1");
  },
};

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

/** DEMO DATA — illustrative announcements only */
export function createDemoNews(village: string, district: string, mandal: string): LocalNewsArticle[] {
  const now = new Date().toISOString();
  return [
    {
      id: "NEWS-DEMO-1",
      title_en: "Village sanitation drive announced",
      title_te: "గ్రామ sanitation drive ప్రకటన",
      short_description_en: "Clean-up drive this Saturday from 7 AM at the main junction.",
      short_description_te: "ఈ శనివారం ఉదయం 7 గంటలకు main junction వద్ద clean-up drive.",
      content_en: "All ward members and volunteers are requested to participate in the village sanitation drive. Gloves and bags will be provided at the Panchayat office.",
      category: "Village Announcement",
      district,
      mandal,
      village,
      visibility_scope: "VILLAGE",
      priority: "IMPORTANT",
      status: "PUBLISHED",
      approval_status: "APPROVED",
      author_id: "demo-sarpanch",
      author_name: "M. Ramesh Babu (Sarpanch)",
      published_at: daysAgo(1),
      view_count: 42,
      created_at: daysAgo(2),
      updated_at: daysAgo(1),
      isDemoData: true,
    },
    {
      id: "NEWS-DEMO-2",
      title_en: "Free health camp on Sunday",
      short_description_en: "Primary health check-up camp at the community hall.",
      content_en: "A free medical camp will be held on Sunday 9 AM–4 PM. Bring Aadhaar card. Services include BP, sugar tests, and general consultation.",
      category: "Health",
      district,
      mandal,
      village,
      visibility_scope: "VILLAGE",
      priority: "NORMAL",
      status: "PUBLISHED",
      approval_status: "APPROVED",
      author_id: "demo-ward",
      author_name: "Smt. P. Sunitha (Ward Member)",
      published_at: daysAgo(0),
      view_count: 18,
      created_at: daysAgo(0),
      updated_at: now,
      isDemoData: true,
    },
    {
      id: "NEWS-DEMO-3",
      title_en: "Water supply interruption tomorrow",
      short_description_en: "Mission Bhagiratha pipeline maintenance — 9 AM to 2 PM.",
      content_en: "Water supply will be unavailable tomorrow from 9 AM to 2 PM due to pipeline maintenance. Please store sufficient water.",
      category: "Emergency",
      district,
      mandal,
      village,
      visibility_scope: "VILLAGE",
      priority: "URGENT",
      status: "PUBLISHED",
      approval_status: "APPROVED",
      author_id: "demo-sarpanch",
      author_name: "M. Ramesh Babu (Sarpanch)",
      published_at: now,
      view_count: 5,
      created_at: now,
      updated_at: now,
      isDemoData: true,
    },
    {
      id: "NEWS-DEMO-4",
      title_en: "Rythu support registration camp",
      short_description_en: "Farmer awareness and registration at Mandal office.",
      content_en: "Telangana farmer support registration camp at the mandal office on 25th. Carry land passbook and Aadhaar.",
      category: "Agriculture",
      district,
      mandal,
      visibility_scope: "MANDAL",
      priority: "IMPORTANT",
      status: "PUBLISHED",
      approval_status: "APPROVED",
      author_id: "demo-admin",
      author_name: "Mandal Agriculture Officer",
      published_at: daysAgo(3),
      view_count: 67,
      created_at: daysAgo(4),
      updated_at: daysAgo(3),
      isDemoData: true,
    },
    {
      id: "NEWS-DEMO-5",
      title_en: "Scholarship registration camp",
      short_description_en: "ePASS scholarship help desk at village school.",
      content_en: "Students can get assistance with ePASS scholarship applications at the village school on weekdays 10 AM–3 PM.",
      category: "Education",
      district,
      mandal,
      village,
      visibility_scope: "VILLAGE",
      priority: "NORMAL",
      status: "PUBLISHED",
      approval_status: "APPROVED",
      author_id: "demo-ward",
      author_name: "Smt. L. Manjula (Ward Member)",
      published_at: daysAgo(5),
      view_count: 31,
      created_at: daysAgo(6),
      updated_at: daysAgo(5),
      isDemoData: true,
    },
  ];
}

export function getLocalizedNewsField(
  article: {
    title_en: string;
    title_te?: string | null;
    short_description_en?: string | null;
    short_description_te?: string | null;
    content_en?: string | null;
    content_te?: string | null;
  },
  field: "title" | "short_description" | "content",
  lang: "en" | "te"
): string {
  if (lang === "te") {
    if (field === "title") return article.title_te || article.title_en;
    if (field === "short_description") return article.short_description_te || article.short_description_en || "";
    return article.content_te || article.content_en || "";
  }
  if (field === "title") return article.title_en;
  if (field === "short_description") return article.short_description_en || "";
  return article.content_en || "";
}
