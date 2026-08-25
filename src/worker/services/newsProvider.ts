import type { LiveNewsItem } from "@/shared/types";

export interface NewsProviderResult {
  items: LiveNewsItem[];
  available: boolean;
  message?: string;
}

export interface NewsProviderEnv {
  NEWS_RSS_URL?: string;
  NEWS_API_KEY?: string;
  NEWS_API_URL?: string;
}

/**
 * Fetches live Telangana news from configured external providers.
 * Never returns fake headlines — empty when unconfigured.
 */
export async function getTelanganaNews(env: NewsProviderEnv): Promise<NewsProviderResult> {
  if (env.NEWS_RSS_URL) {
    try {
      const items = await fetchRssFeed(env.NEWS_RSS_URL);
      if (items.length) {
        return { items, available: true };
      }
    } catch (e) {
      console.error("RSS news fetch failed:", e);
    }
  }

  if (env.NEWS_API_KEY && env.NEWS_API_URL) {
    try {
      const items = await fetchNewsApi(env.NEWS_API_URL, env.NEWS_API_KEY);
      if (items.length) {
        return { items, available: true };
      }
    } catch (e) {
      console.error("News API fetch failed:", e);
    }
  }

  return {
    items: [],
    available: false,
    message: "Live Telangana news is currently unavailable.",
  };
}

async function fetchRssFeed(url: string): Promise<LiveNewsItem[]> {
  const res = await fetch(url, {
    headers: { Accept: "application/rss+xml, application/xml, text/xml" },
  });
  if (!res.ok) return [];
  const text = await res.text();
  return parseRssXml(text, new URL(url).hostname);
}

function parseRssXml(xml: string, sourceHost: string): LiveNewsItem[] {
  const items: LiveNewsItem[] = [];
  const itemBlocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  for (const block of itemBlocks.slice(0, 20)) {
    const title = extractTag(block, "title");
    const link = extractTag(block, "link");
    const desc = extractTag(block, "description");
    const pubDate = extractTag(block, "pubDate");
    if (!title || !link) continue;
    items.push({
      id: `rss-${hashCode(link)}`,
      source: sourceHost,
      headline: stripHtml(title),
      summary: desc ? stripHtml(desc).slice(0, 200) : null,
      url: link.trim(),
      published_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      is_external: true,
    });
  }
  return items;
}

async function fetchNewsApi(apiUrl: string, apiKey: string): Promise<LiveNewsItem[]> {
  const url = new URL(apiUrl);
  url.searchParams.set("apiKey", apiKey);
  const res = await fetch(url.toString());
  if (!res.ok) return [];
  const data = (await res.json()) as {
    articles?: Array<{
      title?: string;
      description?: string;
      url?: string;
      publishedAt?: string;
      source?: { name?: string };
    }>;
  };
  return (data.articles ?? []).slice(0, 20).map((a, i) => ({
    id: `api-${i}-${hashCode(a.url ?? String(i))}`,
    source: a.source?.name ?? "External News",
    headline: a.title ?? "Untitled",
    summary: a.description?.slice(0, 200) ?? null,
    url: a.url ?? "#",
    published_at: a.publishedAt ?? new Date().toISOString(),
    is_external: true as const,
  }));
}

function extractTag(block: string, tag: string): string | null {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return m?.[1]?.trim() ?? null;
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
}

function hashCode(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}
