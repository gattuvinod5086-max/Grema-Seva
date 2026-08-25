import { Share2, ArrowLeft } from "lucide-react";
import { TerminalGlassCard, Badge } from "./TerminalUI";
import NewsCard from "@/react-app/components/NewsCard";
import { NewsMockDB, getLocalizedNewsField } from "@/react-app/data/newsData";
import { formatNewsLocation } from "@/shared/services/newsVisibility";
import { useLanguage } from "@/react-app/context/LanguageContext";

export function TerminalNewsDetail({
  id,
  onBack,
}: {
  id: string;
  onBack: () => void;
}) {
  const { lang } = useLanguage();
  const article = NewsMockDB.getById(id);

  if (!article) {
    return (
      <TerminalGlassCard className="p-8 text-center">
        <p className="text-slate-500">News not found.</p>
        <button type="button" onClick={onBack} className="mt-4 text-tg-maroon font-bold">Go back</button>
      </TerminalGlassCard>
    );
  }

  NewsMockDB.incrementView(id);
  const related = NewsMockDB.getAll()
    .filter((n) => n.id !== id && n.category === article.category && n.status === "PUBLISHED")
    .slice(0, 3);

  const share = async () => {
    const title = getLocalizedNewsField(article, "title", lang);
    if (navigator.share) {
      await navigator.share({ title, text: article.short_description_en });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in">
      <button type="button" onClick={onBack} className="flex items-center gap-2 text-[10px] font-black uppercase text-tg-maroon">
        <ArrowLeft size={16} /> Back to News
      </button>

      <TerminalGlassCard className="overflow-hidden">
        {article.image && (
          <div className="h-64 bg-slate-100">
            <img src={article.image} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-8 md:p-12">
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="maroon">🏛 GramSeva Official</Badge>
            <Badge variant="gold">{article.category}</Badge>
            {article.isDemoData && <Badge variant="default">DEMO DATA</Badge>}
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
            {getLocalizedNewsField(article, "title", lang)}
          </h1>
          <p className="text-sm text-slate-500 mb-6">
            📍 {formatNewsLocation(article)} · 🗓 {new Date(article.published_at ?? article.created_at).toLocaleDateString("en-IN")} · By {article.author_name}
          </p>
          <div className="prose text-slate-700 whitespace-pre-wrap leading-relaxed mb-8">
            {getLocalizedNewsField(article, "content", lang)}
          </div>
          <button type="button" onClick={share} className="flex items-center gap-2 px-4 py-2 rounded-xl border font-black text-[10px] uppercase">
            <Share2 size={14} /> Share
          </button>
        </div>
      </TerminalGlassCard>

      {related.length > 0 && (
        <div>
          <h3 className="text-lg font-black uppercase mb-4">Related News</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {related.map((r) => (
              <NewsCard key={r.id} article={r} compact onClick={onBack} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
