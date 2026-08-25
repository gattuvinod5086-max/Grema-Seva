import { AlertCircle } from "lucide-react";
import { useLanguage } from "@/react-app/context/LanguageContext";
import type { DuplicateCandidate } from "@/shared/services/duplicateDetection";

interface DuplicateIssueModalProps {
  duplicate: DuplicateCandidate;
  onViewExisting: () => void;
  onCreateNew: () => void;
  onClose: () => void;
}

export default function DuplicateIssueModal({
  duplicate,
  onViewExisting,
  onCreateNew,
  onClose,
}: DuplicateIssueModalProps) {
  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border-2 border-amber-200">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="text-amber-600" size={28} />
          <h3 className="text-lg font-black text-slate-900">{t.issue.duplicateTitle}</h3>
        </div>
        <div className="bg-slate-50 rounded-2xl p-4 mb-6">
          <p className="text-[10px] font-black text-tg-maroon uppercase">{duplicate.displayRef}</p>
          <p className="font-bold text-slate-800 mt-1">{duplicate.description}</p>
          {duplicate.estimatedAffectedCitizens != null ? (
            <p className="text-sm text-slate-500 mt-2">
              {duplicate.estimatedAffectedCitizens} citizens affected
            </p>
          ) : (
            <p className="text-sm text-slate-400 mt-2 italic">{t.issue.notAvailable}</p>
          )}
        </div>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onViewExisting}
            className="py-3 rounded-2xl bg-tg-maroon text-white font-black text-xs uppercase tracking-widest"
          >
            {t.issue.viewExisting}
          </button>
          <button
            type="button"
            onClick={onCreateNew}
            className="py-3 rounded-2xl border-2 border-slate-200 font-black text-xs uppercase tracking-widest"
          >
            {t.issue.createNew}
          </button>
          <button type="button" onClick={onClose} className="text-sm text-slate-500 hover:underline">
            {t.issue.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}
