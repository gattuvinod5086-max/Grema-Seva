import { useState, useMemo } from "react";
import { Newspaper, Search, Plus, Settings, Radio } from "lucide-react";
import { TerminalGlassCard } from "./TerminalUI";
import NewsCard from "@/react-app/components/NewsCard";
import NewsUrgentBanner from "@/react-app/components/NewsUrgentBanner";
import { NewsMockDB } from "@/react-app/data/newsData";
import { getVisibleNews, canUserPublishNews } from "@/react-app/services/localNews";
import { newsMatchesUserLocation } from "@/shared/services/newsVisibility";
import type { AppUser } from "@/react-app/data/terminalData";

const TABS = [
  { id: "all", label: "Telangana News" },
  { id: "village", label: "Village News" },
  { id: "government", label: "Government" },
  { id: "my-village", label: "My Village" },
  { id: "emergency", label: "Important Updates" },
  { id: "live", label: "Live Telangana News" },
] as const;

export function TerminalNews({
  user,
  onOpenDetail,
  onCreate,
  onManage,
}: {
  user: AppUser;
  onOpenDetail: (id: string) => void;
  onCreate: () => void;
  onManage: () => void;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("all");
  const [query, setQuery] = useState("");

  const articles = useMemo(() => {
    if (tab === "live") return [];
    return getVisibleNews(user, tab === "all" ? undefined : tab, query);
  }, [user, tab, query]);

  const urgent = NewsMockDB.getAll().filter(
    (n) =>
      n.priority === "URGENT" &&
      n.status === "PUBLISHED" &&
      newsMatchesUserLocation(n, user)
  );

  const canPublish = canUserPublishNews(user);

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in">
      <div className="flex flex-wrap items-center justify-between gap-4 px-2">
        <div>
          <p className="text-[10px] font-black text-tg-gold uppercase tracking-widest mb-0.5">📰 News & Announcements</p>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
            News <span className="text-tg-maroon">& Updates</span>
          </h2>
        </div>
        {canPublish && (
          <div className="flex gap-2 flex-wrap">
            <button type="button" onClick={onCreate} className="flex items-center gap-2 px-4 py-3 bg-tg-maroon text-white rounded-xl text-[10px] font-black uppercase">
              <Plus size={16} /> Create News
            </button>
            <button type="button" onClick={onManage} className="flex items-center gap-2 px-4 py-3 bg-white border-2 border-tg-gold rounded-xl text-[10px] font-black uppercase text-tg-maroon">
              <Settings size={16} /> Manage
            </button>
          </div>
        )}
      </div>

      <div className="px-2 py-2 rounded-xl bg-amber-50 border border-amber-200 text-[9px] font-black uppercase text-amber-800 text-center">
        DEMO DATA — sample announcements for local mode only
      </div>

      <NewsUrgentBanner articles={urgent} onSelect={(id) => onOpenDetail(String(id))} />

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-colors ${
              tab === t.id ? "bg-tg-maroon text-white border-tg-maroon" : "bg-white text-slate-600 border-slate-200 hover:border-tg-gold"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab !== "live" && (
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-white font-medium" placeholder="Search news..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      )}

      {tab === "live" ? (
        <TerminalGlassCard className="p-8 text-center border-2 border-blue-100">
          <Radio className="mx-auto text-blue-500 mb-4" size={40} />
          <h3 className="text-lg font-black text-slate-800 mb-2">Live Telangana News</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Live Telangana news is currently unavailable in local mode. Configure NEWS_RSS_URL or NEWS_API_KEY in Cloudflare mode.
          </p>
          <span className="inline-block mt-4 text-[9px] font-black uppercase text-blue-600">🌐 External News — not official GramSeva communication</span>
        </TerminalGlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {articles.map((a) => (
            <NewsCard key={a.id} article={a} onClick={() => onOpenDetail(a.id)} />
          ))}
          {articles.length === 0 && (
            <div className="col-span-full py-20 text-center text-slate-400 font-black uppercase text-[10px] tracking-widest border-2 border-dashed border-slate-200 rounded-3xl">
              <Newspaper className="mx-auto mb-4 opacity-30" size={40} />
              No news found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
