import { useParams, Link, useNavigate } from "react-router";
import { Share2, ArrowLeft } from "lucide-react";
import NewsCard from "@/react-app/components/NewsCard";
import { useApi } from "@/react-app/hooks/useApi";
import { NewsMockDB, getLocalizedNewsField } from "@/react-app/data/newsData";
import { formatNewsLocation } from "@/shared/services/newsVisibility";
import { useLanguage } from "@/react-app/context/LanguageContext";
import type { News } from "@/shared/types";

export default function NewsDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const isLocal = __GRAMA_LOCAL_DEV__;

  const { data: apiData } = useApi<{ article: News; related: News[] }>(
    `/api/news/${id}`,
    { enabled: !isLocal && !!id }
  );

  const localArticle = isLocal && id ? NewsMockDB.getById(id) : undefined;
  const article = isLocal ? localArticle : apiData?.article;
  const related = isLocal
    ? NewsMockDB.getAll().filter((n) => n.id !== id && n.category === localArticle?.category).slice(0, 3)
    : apiData?.related ?? [];

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Loading or not found…</p>
      </div>
    );
  }

  if (isLocal && id) NewsMockDB.incrementView(id);

  const title = getLocalizedNewsField(article, "title", lang);
  const content = getLocalizedNewsField(article, "content", lang);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-amber-50 py-8 px-4">
      <article className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
        {"image_url" in article && article.image_url && (
          <img src={article.image_url} alt="" className="w-full h-64 object-cover" />
        )}
        {"image" in article && article.image && (
          <img src={article.image} alt="" className="w-full h-64 object-cover" />
        )}
        <div className="p-8 md:p-12">
          <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-2 text-xs font-black uppercase text-tg-maroon mb-6">
            <ArrowLeft size={16} /> Back
          </button>
          <span className="text-[10px] font-black uppercase bg-tg-maroon/10 text-tg-maroon px-2 py-1 rounded">🏛 GramSeva Official</span>
          <h1 className="text-3xl font-black mt-4 mb-2">{title}</h1>
          <p className="text-sm text-slate-500 mb-6">
            📍 {formatNewsLocation(article)} · 🗓 {new Date(article.published_at ?? article.created_at).toLocaleDateString("en-IN")}
            {article.author_name && ` · ${article.author_name}`}
          </p>
          <div className="prose whitespace-pre-wrap text-slate-700 mb-8">{content}</div>
          <button
            type="button"
            onClick={() => navigator.share?.({ title, text: article.short_description_en ?? "" })}
            className="flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-black uppercase"
          >
            <Share2 size={14} /> Share
          </button>
        </div>
      </article>
      {related.length > 0 && (
        <div className="max-w-3xl mx-auto mt-8">
          <h3 className="font-black uppercase mb-4">Related</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {related.map((r) => (
              <Link key={String(r.id)} to={`/news/${r.id}`}>
                <NewsCard article={r} compact />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
