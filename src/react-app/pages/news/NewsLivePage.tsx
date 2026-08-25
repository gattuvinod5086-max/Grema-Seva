import { Link } from "react-router";
import { LiveNewsCard } from "@/react-app/components/NewsCard";
import { useApi } from "@/react-app/hooks/useApi";
import type { LiveNewsItem } from "@/shared/types";

export default function NewsLivePage() {
  const isLocal = __GRAMA_LOCAL_DEV__;
  const { data, isLoading } = useApi<{ items: LiveNewsItem[]; available: boolean; message?: string }>(
    '/api/news/live',
    { enabled: !isLocal }
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Link to="/news" className="text-xs font-black uppercase text-tg-maroon">← Back to News</Link>
        <h1 className="text-3xl font-black text-blue-900 mt-4 mb-2">🌐 Live Telangana News</h1>
        <p className="text-sm text-slate-600 mb-6">External news — not official Telangana Government or GramSeva communication.</p>

        {isLocal || (data && !data.available) ? (
          <p className="text-slate-500 italic p-8 bg-white rounded-2xl border">
            {isLocal ? "Live Telangana news is currently unavailable in local mode." : data?.message}
          </p>
        ) : isLoading ? (
          <p className="text-slate-400">Loading…</p>
        ) : (
          <div className="grid gap-4">
            {(data?.items ?? []).map((item) => (
              <LiveNewsCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
