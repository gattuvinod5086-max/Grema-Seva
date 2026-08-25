import { AlertTriangle } from "lucide-react";
import { getLocalizedNewsField } from "@/react-app/data/newsData";
import type { LocalNewsArticle } from "@/react-app/data/newsData";
import type { News } from "@/shared/types";
import { useLanguage } from "@/react-app/context/LanguageContext";

type NewsItem = LocalNewsArticle | News;

export default function NewsUrgentBanner({
  articles,
  onSelect,
}: {
  articles: NewsItem[];
  onSelect?: (id: string | number) => void;
}) {
  const { lang } = useLanguage();
  const urgent = articles.filter((a) => a.priority === "URGENT" && a.status === "PUBLISHED");

  if (!urgent.length) return null;

  return (
    <div className="space-y-3">
      {urgent.map((a) => {
        const id = String(a.id);
        const title = getLocalizedNewsField(a, "title", lang);
        const short = getLocalizedNewsField(a, "short_description", lang);
        return (
          <div
            key={id}
            role={onSelect ? "button" : undefined}
            onClick={() => onSelect?.(id)}
            className="rounded-2xl border-2 border-red-400 bg-gradient-to-r from-red-50 to-amber-50 p-5 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-red-500 text-white shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-red-700 mb-1">
                  🚨 Important Village Alert
                </p>
                <h3 className="text-lg font-black text-slate-900">{title}</h3>
                {short && <p className="text-sm text-slate-700 mt-1">{short}</p>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
