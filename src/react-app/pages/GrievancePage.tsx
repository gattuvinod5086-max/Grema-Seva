import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Plus, Camera, MapPin } from "lucide-react";
import GlassCard from "@/react-app/components/GlassCard";
import { useAppSession } from "@/react-app/context/AppSessionContext";
import {
  getGrievances,
  saveGrievance,
  type GrievanceRecord,
  type GrievancePriority,
} from "@/react-app/data/grievances";

const CATEGORIES = ["Water", "Roads", "Sanitation", "Electricity", "Welfare", "Other"];
const PRIORITIES: GrievancePriority[] = ["Low", "Medium", "High"];

const statusBadgeClass: Record<string, string> = {
  Submitted: "bg-slate-100 text-slate-800 border-slate-300",
  "In Progress": "bg-amber-100 text-amber-800 border-amber-300",
  Resolved: "bg-emerald-100 text-emerald-800 border-emerald-300",
};

const priorityBadgeClass: Record<string, string> = {
  Low: "bg-slate-100 text-slate-700",
  Medium: "bg-amber-100 text-amber-700",
  High: "bg-red-100 text-red-700",
};

export default function GrievancePage() {
  const navigate = useNavigate();
  const { session } = useAppSession();
  const [list, setList] = useState<GrievanceRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<GrievancePriority>("Medium");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setList(getGrievances());
  }, []);

  const refresh = () => setList(getGrievances());

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f?.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoDataUrl(reader.result as string);
    reader.readAsDataURL(f);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category.trim() || !description.trim()) return;
    setSubmitting(true);
    saveGrievance({
      category,
      description: description.trim(),
      priority,
      photoDataUrl,
      district: session?.district,
      mandal: session?.mandal,
      village: session?.village,
    });
    setCategory("");
    setDescription("");
    setPriority("Medium");
    setPhotoDataUrl(null);
    setSubmitting(false);
    setShowForm(false);
    refresh();
  };

  return (
    <div className="min-h-screen grama-pattern pb-24">
      <header className="sticky top-0 z-10 glass-card rounded-b-glass border-t-0 px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/app")}
          className="active-scale p-2 rounded-xl border border-slate-200 text-slate-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-heading text-xl text-primary">Grievance</h1>
          <p className="text-xs text-slate-500 font-body">Report & official logs</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="active-scale w-full flex items-center justify-center gap-2 py-4 rounded-glass bg-primary text-white font-body font-bold"
        >
          <Plus className="w-5 h-5" />
          New Grievance
        </button>

        <h2 className="font-body font-bold text-slate-900">Official Logs</h2>
        <div className="space-y-4">
          {list.length === 0 ? (
            <GlassCard className="p-8 text-center text-slate-500 font-body">
              No grievances yet. Tap “New Grievance” to submit one.
            </GlassCard>
          ) : (
            list.map((g) => (
              <GlassCard key={g.id} className="overflow-hidden terminal-reveal">
                {g.photoDataUrl && (
                  <img
                    src={g.photoDataUrl}
                    alt="Evidence"
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
                <div className="p-4">
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${priorityBadgeClass[g.priority] ?? ""}`}>
                      {g.priority}
                    </span>
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-200 text-slate-700">
                      {g.category}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${statusBadgeClass[g.status] ?? ""}`}>
                      {g.status}
                    </span>
                  </div>
                  <p className="text-slate-800 font-body text-sm mb-2">{g.description}</p>
                  {(g.village || g.mandal) && (
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {[g.village, g.mandal, g.district].filter(Boolean).join(", ")}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-2">
                    {new Date(g.createdAt).toLocaleString("en-IN")}
                  </p>
                </div>
              </GlassCard>
            ))
          )}
        </div>
      </main>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
          <GlassCard className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white/95 backdrop-blur py-4 px-4 flex items-center justify-between border-b border-slate-200">
              <h2 className="font-heading text-xl text-primary">New Grievance</h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="active-scale p-2 rounded-xl border border-slate-200"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={`active-scale px-3 py-2 rounded-xl text-sm font-semibold ${
                        category === c ? "bg-primary text-white" : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Priority</label>
                <div className="flex gap-2">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`active-scale flex-1 py-2 rounded-xl text-sm font-semibold ${
                        priority === p ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the issue in detail..."
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-body"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Photo evidence</label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhoto}
                  className="hidden"
                  id="grievance-photo"
                />
                <label
                  htmlFor="grievance-photo"
                  className="active-scale flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-primary/40"
                >
                  <Camera className="w-5 h-5 text-slate-500" />
                  {photoDataUrl ? "Photo added" : "Take or upload photo"}
                </label>
                {photoDataUrl && (
                  <img src={photoDataUrl} alt="Preview" className="mt-2 h-24 rounded-lg object-cover" />
                )}
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="active-scale w-full py-4 rounded-glass bg-primary text-white font-body font-bold disabled:opacity-50"
              >
                Submit Grievance
              </button>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
