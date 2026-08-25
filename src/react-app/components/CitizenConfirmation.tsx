import { useState } from "react";
import { Star } from "lucide-react";
import { useLanguage } from "@/react-app/context/LanguageContext";

interface CitizenConfirmationProps {
  onConfirm: (data: { confirmed: boolean; rating?: number; feedback?: string; reason?: string }) => void;
  loading?: boolean;
}

export default function CitizenConfirmation({ onConfirm, loading }: CitizenConfirmationProps) {
  const { t } = useLanguage();
  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [reason, setReason] = useState("");

  return (
    <div className="rounded-2xl border-2 border-tg-gold/40 bg-amber-50/50 p-6 space-y-4">
      <h4 className="text-lg font-black text-tg-maroon">{t.confirmation.title}</h4>

      {!showFeedback ? (
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={() => setShowFeedback(true)}
            className="flex-1 py-4 rounded-2xl bg-tg-green text-white font-black text-xs uppercase tracking-widest hover:opacity-95 disabled:opacity-50"
          >
            {t.confirmation.yes}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => setShowFeedback(true)}
            className="flex-1 py-4 rounded-2xl bg-white border-2 border-tg-maroon text-tg-maroon font-black text-xs uppercase tracking-widest hover:bg-red-50 disabled:opacity-50"
          >
            {t.confirmation.no}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-black uppercase text-slate-500 mb-2">{t.confirmation.rating}</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)} className="p-1">
                  <Star
                    size={24}
                    className={n <= rating ? "fill-tg-gold text-tg-gold" : "text-slate-300"}
                  />
                </button>
              ))}
            </div>
          </div>
          <textarea
            className="w-full p-4 rounded-xl border border-slate-200 text-sm"
            placeholder={t.confirmation.comment}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={2}
          />
          <textarea
            className="w-full p-4 rounded-xl border border-slate-200 text-sm"
            placeholder={t.confirmation.reason}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
          />
          <div className="flex gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => onConfirm({ confirmed: true, rating: rating || undefined, feedback: feedback || undefined })}
              className="flex-1 py-3 rounded-xl bg-tg-green text-white font-black text-xs uppercase"
            >
              {t.confirmation.yes}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => onConfirm({ confirmed: false, reason: reason || feedback || undefined })}
              className="flex-1 py-3 rounded-xl bg-tg-maroon text-white font-black text-xs uppercase"
            >
              {t.confirmation.no}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
