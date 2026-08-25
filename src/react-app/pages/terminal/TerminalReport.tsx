import { useState, useRef, useMemo } from "react";
import { PlusCircle, Image as ImageIcon } from "lucide-react";
import { TerminalGlassCard, Badge } from "./TerminalUI";
import { CATEGORIES, MOCK_PANCHAYAT } from "@/react-app/data/terminalData";
import VoiceInput from "@/react-app/components/VoiceInput";
import DuplicateIssueModal from "@/react-app/components/DuplicateIssueModal";
import { classifyIssue } from "@/shared/services/issueClassification";
import { findDuplicateIssues } from "@/shared/services/duplicateDetection";
import { formatIssueRef } from "@/shared/constants/governance";
import { useLanguage } from "@/react-app/context/LanguageContext";
import type { AppUser, VillageIssue } from "@/react-app/data/terminalData";
import type { ClassificationResult } from "@/shared/services/issueClassification";
import type { DuplicateCandidate } from "@/shared/services/duplicateDetection";

const GOVERNANCE_CATEGORIES = ["Water", "Roads", "Sanitation", "Electricity", "Welfare", "Agriculture", "Other"];

export function TerminalReport({
  user,
  existingIssues,
  onSubmit,
  onCancel,
  onViewIssue,
  initialCategory,
  initialPriority,
}: {
  user: AppUser;
  existingIssues: VillageIssue[];
  onSubmit: (data: Partial<VillageIssue> & { assignedToMemberName?: string; photo?: string }) => void;
  onCancel: () => void;
  onViewIssue?: (id: string) => void;
  initialCategory?: string;
  initialPriority?: string;
}) {
  const { t } = useLanguage();
  const [data, setData] = useState({
    category: initialCategory && GOVERNANCE_CATEGORIES.includes(initialCategory)
      ? initialCategory
      : GOVERNANCE_CATEGORIES[0],
    priority: initialPriority ?? "MEDIUM",
    description: "",
  });
  const [classification, setClassification] = useState<ClassificationResult | null>(null);
  const [duplicate, setDuplicate] = useState<DuplicateCandidate | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const officials = useMemo(
    () =>
      user.role === "Citizen"
        ? MOCK_PANCHAYAT.filter((l) => l.role === "Sarpanch")
        : MOCK_PANCHAYAT,
    [user.role]
  );
  const [assigned, setAssigned] = useState(officials[0]?.name ?? "");

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDescriptionChange = (description: string) => {
    setData((d) => ({ ...d, description }));
    if (description.length > 10) {
      const result = classifyIssue(description);
      setClassification(result);
      setData((d) => ({
        ...d,
        description,
        category: result.category,
        priority: result.priority,
      }));
    }
  };

  const trySubmit = () => {
    const dupes = findDuplicateIssues(
      {
        description: data.description,
        category: data.category,
        village: user.village,
        ward: user.ward,
      },
      existingIssues.map((i) => ({
        id: i.id,
        description: i.description,
        category: i.category,
        village: i.village,
        ward: i.ward,
        createdAt: i.createdAt,
        status: i.status,
        estimatedAffectedCitizens: i.estimatedAffectedCitizens,
      })),
      { formatRef: (id) => formatIssueRef(id) }
    );
    if (dupes.length > 0) {
      setDuplicate(dupes[0]);
      return;
    }
    submitIssue();
  };

  const submitIssue = () => {
    onSubmit({
      ...data,
      priority: data.priority as VillageIssue["priority"],
      assignedToMemberName: assigned,
      photo: photo ?? undefined,
    });
    setDuplicate(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in">
      {duplicate && (
        <DuplicateIssueModal
          duplicate={duplicate}
          onViewExisting={() => {
            onViewIssue?.(String(duplicate.id));
            setDuplicate(null);
          }}
          onCreateNew={() => {
            setDuplicate(null);
            submitIssue();
          }}
          onClose={() => setDuplicate(null)}
        />
      )}

      <div className="flex items-center gap-6 px-2">
        <div className="p-4 rounded-2xl shadow-xl ring-2 ring-tg-maroon flex items-center justify-center bg-tg-gold text-tg-maroon">
          <PlusCircle size={28} strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-[10px] font-black text-tg-gold uppercase tracking-widest mb-0.5">జై తెలంగాణ</p>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none italic">
            New <span className="text-tg-maroon">Grievance</span>
          </h2>
        </div>
      </div>

      <TerminalGlassCard className="p-8 md:p-12 space-y-8 border-2 border-tg-maroon/20 shadow-xl bg-gradient-to-br from-white to-rose-50/30">
        <VoiceInput
          onTranscript={handleDescriptionChange}
          onClassification={(r) => {
            setClassification(r);
            setData((d) => ({ ...d, category: r.category, priority: r.priority }));
          }}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
              {t.issue.category}
            </label>
            <select
              className="w-full p-5 bg-white border border-slate-100 rounded-2xl font-black text-sm outline-none focus:ring-2 focus:ring-tg-maroon/10 shadow-sm"
              value={data.category}
              onChange={(e) => setData({ ...data, category: e.target.value })}
            >
              {GOVERNANCE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{t.categories[c as keyof typeof t.categories] ?? c}</option>
              ))}
              {CATEGORIES.filter((c) => !GOVERNANCE_CATEGORIES.includes(c)).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
              {t.issue.priority}
            </label>
            <select
              className="w-full p-5 bg-white border border-slate-100 rounded-2xl font-black text-sm outline-none focus:ring-2 focus:ring-tg-maroon/10 shadow-sm"
              value={data.priority}
              onChange={(e) => setData({ ...data, priority: e.target.value })}
            >
              {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((p) => (
                <option key={p} value={p}>{t.priorities[p]}</option>
              ))}
            </select>
          </div>
        </div>

        {classification && (
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 text-sm">
            <p className="text-[9px] font-black uppercase text-blue-600 mb-1">{t.classification.mockNotice}</p>
            <p>
              {t.classification.department}: <strong>{classification.suggestedDepartment}</strong> •{" "}
              {t.classification.confidence}: {classification.confidence}%
            </p>
          </div>
        )}

        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
            Authorized Recipient
          </label>
          <select
            disabled={user.role === "Citizen"}
            className="w-full p-5 bg-white border border-slate-100 rounded-2xl font-black text-sm outline-none disabled:opacity-75 shadow-sm"
            value={assigned}
            onChange={(e) => setAssigned(e.target.value)}
          >
            {officials.map((o) => (
              <option key={o.id} value={o.name}>{o.name} ({o.role})</option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
            Visual Evidence (Optional)
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`w-full h-48 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden bg-white relative group ${
              photo ? "border-tg-maroon/20" : "border-slate-200 hover:border-tg-maroon/40 shadow-sm"
            }`}
          >
            {photo ? (
              <>
                <img src={photo} className="w-full h-full object-cover" alt="Evidence" />
                <div className="absolute inset-0 bg-tg-maroon/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                  <Badge variant="maroon">Replace Photo</Badge>
                </div>
              </>
            ) : (
              <>
                <ImageIcon className="text-slate-300 mb-2" size={32} />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Click to upload photo</p>
              </>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
            {t.issue.description}
          </label>
          <textarea
            className="w-full p-8 bg-white border border-slate-100 rounded-[2.5rem] font-medium text-slate-700 min-h-[200px] outline-none transition-all leading-relaxed focus:ring-2 focus:ring-tg-maroon/10 shadow-sm telugu-text"
            placeholder="Detailed description of the issue..."
            value={data.description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-6">
          <button
            onClick={trySubmit}
            disabled={!data.description}
            className="flex-[2] py-5 min-h-[48px] font-black rounded-[2rem] shadow-lg text-[10px] uppercase tracking-widest disabled:opacity-50 hover:opacity-95 transition-opacity text-white border-2 bg-tg-pink border-tg-pink/60"
          >
            {t.issue.submit}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-5 min-h-[48px] font-black rounded-[2rem] text-[10px] uppercase tracking-widest border-2 bg-white text-slate-800 shadow-md hover:bg-slate-50 border-tg-gold"
          >
            {t.issue.cancel}
          </button>
        </div>
      </TerminalGlassCard>
    </div>
  );
}
