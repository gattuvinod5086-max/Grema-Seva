import { MapPin, Calendar, Building2, Globe } from "lucide-react";
import { formatNewsLocation } from "@/shared/services/newsVisibility";
import { getLocalizedNewsField } from "@/react-app/data/newsData";
import type { LocalNewsArticle } from "@/react-app/data/newsData";
import type { News } from "@/shared/types";
import { useLanguage } from "@/react-app/context/LanguageContext";

type NewsItem = LocalNewsArticle | News;

const PRIORITY_STYLES: Record<string, string> = {
  URGENT: "bg-red-100 text-red-800 border-red-300",
  IMPORTANT: "bg-amber-100 text-amber-800 border-amber-300",
  NORMAL: "bg-slate-100 text-slate-700 border-slate-200",
  LOW: "bg-slate-50 text-slate-500 border-slate-100",
};

export default function NewsCard({
  article,
  onClick,
  compact,
}: {
  article: NewsItem;
  onClick?: () => void;
  compact?: boolean;
}) {
  const { lang } = useLanguage();
  const title = getLocalizedNewsField(article, "title", lang);
  const short = getLocalizedNewsField(article, "short_description", lang);
  const location = formatNewsLocation(article);
  const date = article.published_at ?? article.created_at;
  const image = "image" in article ? article.image : (article as News).image_url;
  const author = article.author_name;

  return (
    <article
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      className={`bg-white rounded-2xl border border-slate-100 shadow-md hover:shadow-lg transition-all overflow-hidden ${onClick ? "cursor-pointer" : ""}`}
    >
      {!compact && image && (
        <div className="h-40 bg-slate-100 overflow-hidden">
          <img src={image} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-tg-maroon bg-tg-maroon/10 px-2 py-1 rounded-lg">
            <Building2 size={10} /> GramSeva Official
          </span>
          <span className="text-[9px] font-black uppercase px-2 py-1 rounded-lg bg-tg-gold/20 text-tg-maroon">
            {article.category}
          </span>
          {article.priority !== "NORMAL" && article.priority !== "LOW" && (
            <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg border ${PRIORITY_STYLES[article.priority] ?? ""}`}>
              {article.priority}
            </span>
          )}
        </div>
        <h3 className="text-lg font-black text-slate-900 leading-tight mb-2">{title}</h3>
        {!compact && short && (
          <p className="text-sm text-slate-600 line-clamp-2 mb-4">{short}</p>
        )}
        <div className="flex flex-wrap gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          <span className="flex items-center gap-1"><MapPin size={12} /> {location}</span>
          {date && (
            <span className="flex items-center gap-1">
              <Calendar size={12} /> {new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          )}
        </div>
        {author && !compact && (
          <p className="text-[10px] text-slate-400 mt-2">By {author}</p>
        )}
        {onClick && (
          <p className="text-[10px] font-black text-tg-maroon uppercase tracking-widest mt-4">Read More →</p>
        )}
      </div>
    </article>
  );
}

export function LiveNewsCard({
  item,
}: {
  item: { id: string; source: string; headline: string; summary?: string | null; url: string; published_at: string };
}) {
  return (
    <article className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-blue-700 bg-blue-50 px-2 py-1 rounded-lg">
          <Globe size={10} /> External News
        </span>
        <span className="text-[9px] font-bold text-slate-400 uppercase">{item.source}</span>
      </div>
      <h3 className="font-black text-slate-900 mb-2">{item.headline}</h3>
      {item.summary && <p className="text-sm text-slate-600 line-clamp-2 mb-3">{item.summary}</p>}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-400 uppercase">
          {new Date(item.published_at).toLocaleString("en-IN")}
        </span>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-black text-blue-600 uppercase hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          Read full article →
        </a>
      </div>
    </article>
  );
}
