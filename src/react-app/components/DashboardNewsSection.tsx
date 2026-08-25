import { useMemo } from "react";
import { useNavigate } from "react-router";
import { Newspaper, Radio } from "lucide-react";
import NewsCard, { LiveNewsCard } from "@/react-app/components/NewsCard";
import { GsCard } from "@/react-app/components/ui/GsCard";
import type { LocalNewsArticle } from "@/react-app/data/newsData";
import type { News, LiveNewsItem } from "@/shared/types";

interface DashboardNewsSectionProps {
  announcements: (LocalNewsArticle | News)[];
  liveNews?: LiveNewsItem[];
  liveAvailable?: boolean;
  liveMessage?: string;
  newsPath?: string;
}

export default function DashboardNewsSection({
  announcements,
  liveNews = [],
  liveAvailable = false,
  liveMessage,
  newsPath = "/news",
}: DashboardNewsSectionProps) {
  const navigate = useNavigate();
  const latest = useMemo(
    () =>
      [...announcements]
        .filter((a) => a.status === "PUBLISHED")
        .sort(
          (a, b) =>
            new Date(b.published_at ?? b.created_at).getTime() -
            new Date(a.published_at ?? a.created_at).getTime()
        )
        .slice(0, 3),
    [announcements]
  );

  const featured = latest[0];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#1F2937]">Village announcements</h3>
        <button
          type="button"
          onClick={() => navigate(newsPath)}
          className="text-xs font-semibold text-[#67001A] hover:underline"
        >
          View all
        </button>
      </div>

      {featured && (
        <GsCard
          padding="p-0"
          onClick={() => navigate(`${newsPath}/${featured.id}`)}
          className="overflow-hidden border-[#67001A]/15"
        >
          <div className="px-4 py-2 bg-[#67001A] text-white text-[10px] font-semibold uppercase tracking-wide flex items-center gap-2">
            <Newspaper size={12} aria-hidden />
            Official GramSeva · Featured
          </div>
          <div className="p-4">
            <NewsCard article={featured} compact onClick={() => navigate(`${newsPath}/${featured.id}`)} />
          </div>
        </GsCard>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GsCard padding="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B] mb-3 flex items-center gap-2">
            <Newspaper size={14} aria-hidden /> Latest announcements
          </p>
          <div className="space-y-2">
            {latest.length === 0 ? (
              <p className="text-sm text-[#64748B]">No announcements yet.</p>
            ) : (
              latest.slice(featured ? 1 : 0).map((a) => (
                <NewsCard
                  key={String(a.id)}
                  article={a}
                  compact
                  onClick={() => navigate(`${newsPath}/${a.id}`)}
                />
              ))
            )}
          </div>
        </GsCard>

        <GsCard padding="p-4" className="border-blue-100">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 mb-3 flex items-center gap-2">
            <Radio size={14} aria-hidden /> Live Telangana News
          </p>
          <p className="text-[10px] text-[#64748B] mb-3">External news · not official GramSeva content</p>
          {!liveAvailable ? (
            <p className="text-sm text-[#64748B]">
              {liveMessage ?? "Live news is currently unavailable."}
            </p>
          ) : liveNews.length === 0 ? (
            <p className="text-sm text-[#64748B]">No headlines at the moment.</p>
          ) : (
            <div className="space-y-2">
              {liveNews.slice(0, 3).map((item) => (
                <LiveNewsCard key={item.id} item={item} />
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => navigate(`${newsPath}/live`)}
            className="mt-3 text-xs font-semibold text-blue-700 hover:underline"
          >
            View live news →
          </button>
        </GsCard>
      </div>
    </section>
  );
}
