import { useState } from "react";
import { X, Eye } from "lucide-react";
import { TerminalGlassCard } from "./TerminalUI";
import { TELANGANA_DATA } from "@/react-app/data/terminalData";
import {
  NEWS_CATEGORIES,
  NEWS_PRIORITIES,
  NEWS_VISIBILITY_SCOPES,
} from "@/shared/constants/news";
import { createLocalNewsArticle } from "@/react-app/services/localNews";
import { NewsMockDB, getLocalizedNewsField } from "@/react-app/data/newsData";
import type { AppUser } from "@/react-app/data/terminalData";
import type { LocalNewsArticle } from "@/react-app/data/newsData";
import type { NewsCategory, NewsVisibilityScope, NewsPriority, NewsStatus } from "@/shared/constants/news";
import { useLanguage } from "@/react-app/context/LanguageContext";

export function TerminalNewsEditor({
  user,
  existing,
  onSave,
  onCancel,
}: {
  user: AppUser;
  existing?: LocalNewsArticle;
  onSave: () => void;
  onCancel: () => void;
}) {
  const { lang } = useLanguage();
  const [preview, setPreview] = useState(false);
  const [form, setForm] = useState({
    title_en: existing?.title_en ?? "",
    title_te: existing?.title_te ?? "",
    short_description_en: existing?.short_description_en ?? "",
    short_description_te: existing?.short_description_te ?? "",
    content_en: existing?.content_en ?? "",
    content_te: existing?.content_te ?? "",
    category: (existing?.category ?? "Village Announcement") as NewsCategory,
    visibility_scope: (existing?.visibility_scope ?? "VILLAGE") as NewsVisibilityScope,
    priority: (existing?.priority ?? "NORMAL") as NewsPriority,
    district: existing?.district ?? user.district,
    mandal: existing?.mandal ?? user.mandal,
    village: existing?.village ?? user.village,
    expires_at: existing?.expires_at?.slice(0, 10) ?? "",
    scheduled_at: existing?.scheduled_at?.slice(0, 16) ?? "",
    image: existing?.image ?? "",
  });

  const districts = Object.keys(TELANGANA_DATA);
  const mandals = form.district ? Object.keys(TELANGANA_DATA[form.district] ?? {}) : [];
  const villages = form.district && form.mandal ? TELANGANA_DATA[form.district]?.[form.mandal] ?? [] : [];

  const valid = form.title_en.trim() && form.short_description_en.trim() && form.content_en.trim();

  const persist = (status: NewsStatus) => {
    if (!valid) return;
    const article = existing
      ? { ...existing, ...form, status, updated_at: new Date().toISOString(), published_at: status === "PUBLISHED" ? new Date().toISOString() : existing.published_at }
      : createLocalNewsArticle(user, { ...form, status });
    if (existing) NewsMockDB.save(article as LocalNewsArticle);
    else NewsMockDB.save(article);
    onSave();
  };

  if (preview) {
    const draft = { ...existing, ...form, id: existing?.id ?? "preview", status: "DRAFT" as NewsStatus, approval_status: "APPROVED" as const, author_name: user.name, author_id: user.id, view_count: 0, created_at: "", updated_at: "" } as LocalNewsArticle;
    return (
      <TerminalGlassCard className="p-8 max-w-3xl mx-auto">
        <button type="button" onClick={() => setPreview(false)} className="mb-4 text-sm font-bold text-tg-maroon">← Back to editor</button>
        <h2 className="text-2xl font-black mb-2">{getLocalizedNewsField(draft, "title", lang)}</h2>
        <p className="text-slate-600 mb-4">{getLocalizedNewsField(draft, "short_description", lang)}</p>
        <div className="prose text-slate-700 whitespace-pre-wrap">{getLocalizedNewsField(draft, "content", lang)}</div>
      </TerminalGlassCard>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-tg-maroon uppercase italic">Create News</h2>
        <button type="button" onClick={onCancel} className="p-2 rounded-xl bg-white border"><X size={20} /></button>
      </div>

      <TerminalGlassCard className="p-8 space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Title (English) *" value={form.title_en} onChange={(v) => setForm({ ...form, title_en: v })} />
          <Field label="Title (తెలుగు)" value={form.title_te} onChange={(v) => setForm({ ...form, title_te: v })} />
        </div>
        <Field label="Short description (English) *" value={form.short_description_en} onChange={(v) => setForm({ ...form, short_description_en: v })} multiline />
        <Field label="Short description (తెలుగు)" value={form.short_description_te} onChange={(v) => setForm({ ...form, short_description_te: v })} multiline />
        <Field label="Content (English) *" value={form.content_en} onChange={(v) => setForm({ ...form, content_en: v })} multiline rows={6} />
        <Field label="Content (తెలుగు)" value={form.content_te} onChange={(v) => setForm({ ...form, content_te: v })} multiline rows={4} />

        <div className="grid md:grid-cols-2 gap-4">
          <Select label="Category" value={form.category} options={NEWS_CATEGORIES} onChange={(v) => setForm({ ...form, category: v as NewsCategory })} />
          <Select label="Priority" value={form.priority} options={NEWS_PRIORITIES} onChange={(v) => setForm({ ...form, priority: v as NewsPriority })} />
          <Select label="Visibility" value={form.visibility_scope} options={NEWS_VISIBILITY_SCOPES} onChange={(v) => setForm({ ...form, visibility_scope: v as NewsVisibilityScope })} />
          <Field label="Expiry date" type="date" value={form.expires_at} onChange={(v) => setForm({ ...form, expires_at: v })} />
        </div>

        {form.visibility_scope !== "STATE" && (
          <div className="grid md:grid-cols-3 gap-4">
            <Select label="District" value={form.district} options={districts} onChange={(v) => setForm({ ...form, district: v, mandal: "", village: "" })} />
            {form.visibility_scope !== "DISTRICT" && (
              <Select label="Mandal" value={form.mandal} options={mandals} onChange={(v) => setForm({ ...form, mandal: v, village: "" })} />
            )}
            {form.visibility_scope === "VILLAGE" && (
              <Select label="Village" value={form.village} options={villages} onChange={(v) => setForm({ ...form, village: v })} />
            )}
          </div>
        )}

        <Field label="Image URL (optional)" value={form.image} onChange={(v) => setForm({ ...form, image: v })} />

        <div className="flex flex-wrap gap-3 pt-4 border-t">
          <button type="button" disabled={!valid} onClick={() => persist("DRAFT")} className="px-6 py-3 rounded-xl border-2 font-black text-[10px] uppercase disabled:opacity-50">Save Draft</button>
          <button type="button" onClick={() => setPreview(true)} className="px-6 py-3 rounded-xl border-2 font-black text-[10px] uppercase flex items-center gap-2"><Eye size={14} /> Preview</button>
          <button type="button" disabled={!valid} onClick={() => persist("SCHEDULED")} className="px-6 py-3 rounded-xl bg-slate-800 text-white font-black text-[10px] uppercase disabled:opacity-50">Schedule</button>
          <button type="button" disabled={!valid} onClick={() => persist("PUBLISHED")} className="px-6 py-3 rounded-xl bg-tg-maroon text-white font-black text-[10px] uppercase disabled:opacity-50">Publish</button>
        </div>
      </TerminalGlassCard>
    </div>
  );
}

function Field({ label, value, onChange, multiline, rows = 3, type = "text" }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean; rows?: number; type?: string }) {
  return (
    <div>
      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{label}</label>
      {multiline ? (
        <textarea className="w-full mt-1 p-4 rounded-xl border font-medium" rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input type={type} className="w-full mt-1 p-4 rounded-xl border font-medium" value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: readonly string[] | string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{label}</label>
      <select className="w-full mt-1 p-4 rounded-xl border font-medium" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
