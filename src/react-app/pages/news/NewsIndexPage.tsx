import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router";
import { Newspaper, Plus, Settings } from "lucide-react";
import NewsCard, { LiveNewsCard } from "@/react-app/components/NewsCard";
import NewsUrgentBanner from "@/react-app/components/NewsUrgentBanner";
import { useApi } from "@/react-app/hooks/useApi";
import { NewsMockDB } from "@/react-app/data/newsData";
import { getVisibleNews, canUserPublishNews } from "@/react-app/services/localNews";
import type { News, LiveNewsItem } from "@/shared/types";
import { DB_KEYS, MockDB } from "@/react-app/data/terminalData";
import { canPublishNews } from "@/shared/constants/news";

export default function NewsIndexPage() {
  const navigate = useNavigate();
  const isLocal = __GRAMA_LOCAL_DEV__;
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const localUser = isLocal ? MockDB.getUserByPhone(localStorage.getItem(DB_KEYS.SESSION) ?? "") : null;

  const { data: apiNews } = useApi<News[]>('/api/news', { enabled: !isLocal });
  const { data: liveData } = useApi<{ items: LiveNewsItem[]; available: boolean; message?: string }>(
    '/api/news/live',
    { enabled: !isLocal && tab === 'live' }
  );
  const { data: apiUser } = useApi<{ role: string }>('/api/users/me', { enabled: !isLocal });

  useEffect(() => {
    if (isLocal && localUser) {
      NewsMockDB.seedDemo(localUser.village, localUser.district, localUser.mandal);
    }
  }, [isLocal, localUser]);

  const articles = useMemo(() => {
    if (isLocal && localUser) return getVisibleNews(localUser, tab === "all" ? undefined : tab, query);
    let list = apiNews ?? [];
    if (tab === "village") list = list.filter((n) => n.category === "Village Announcement");
    else if (tab === "government") list = list.filter((n) => n.category === "Government Announcement");
    else if (tab === "emergency") list = list.filter((n) => n.priority === "URGENT" || n.category === "Emergency");
    if (query) {
      const q = query.toLowerCase();
      list = list.filter((n) => n.title_en.toLowerCase().includes(q));
    }
    return list;
  }, [isLocal, localUser, tab, query, apiNews]);

  const canPublish = isLocal
    ? localUser && canUserPublishNews(localUser)
    : apiUser && canPublishNews(apiUser.role);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50 to-green-50">
      <header className="bg-white border-b-4 border-tg-gold shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-tg-maroon">📰 News & Announcements</h1>
            <p className="text-sm text-slate-600">Official GramSeva updates & live Telangana news</p>
          </div>
          <div className="flex gap-2">
            {canPublish && (
              <>
                <Link to="/news/create" className="flex items-center gap-2 px-4 py-2 bg-tg-maroon text-white rounded-xl text-xs font-black uppercase">
                  <Plus size={16} /> Create
                </Link>
                <Link to="/news/manage" className="flex items-center gap-2 px-4 py-2 border-2 border-tg-gold rounded-xl text-xs font-black uppercase text-tg-maroon">
                  <Settings size={16} /> Manage
                </Link>
              </>
            )}
            <Link to="/" className="px-4 py-2 text-xs font-bold text-slate-600">← Home</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {isLocal && (
          <div className="px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs font-black uppercase text-amber-800 text-center">
            DEMO DATA — local mode sample announcements
          </div>
        )}

        <NewsUrgentBanner
          articles={articles as News[]}
          onSelect={(id) => navigate(`/news/${id}`)}
        />

        <div className="flex flex-wrap gap-2">
          {["all", "village", "government", "my-village", "emergency", "live"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${tab === t ? "bg-tg-maroon text-white" : "bg-white border"}`}
            >
              {t.replace("-", " ")}
            </button>
          ))}
        </div>

        {tab === "live" ? (
          <section>
            <h2 className="text-lg font-black text-blue-800 mb-4">🌐 Live Telangana News (External)</h2>
            {!isLocal && liveData && !liveData.available ? (
              <p className="text-slate-500 italic">{liveData.message}</p>
            ) : isLocal ? (
              <p className="text-slate-500 italic">Live Telangana news is currently unavailable in local mode.</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {(liveData?.items ?? []).map((item) => (
                  <LiveNewsCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
            <input
              className="w-full p-4 rounded-2xl border bg-white"
              placeholder="Search news..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="grid md:grid-cols-2 gap-6">
              {articles.map((a) => (
                <NewsCard key={String(a.id)} article={a} onClick={() => navigate(`/news/${a.id}`)} />
              ))}
            </div>
            {articles.length === 0 && (
              <div className="text-center py-16 text-slate-400">
                <Newspaper className="mx-auto mb-4 opacity-30" size={48} />
                No news found
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
