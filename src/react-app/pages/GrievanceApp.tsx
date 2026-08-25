import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Plus, Calendar, MapPin, Image as ImageIcon } from "lucide-react";
import GlassCard from "@/react-app/components/GlassCard";
import { useAppSession } from "@/react-app/context/AppSessionContext";
import {
  getStoredGrievances,
  addGrievance,
  type GrievanceRecord,
  type GrievancePriority,
} from "@/react-app/data/grievanceStorage";

const CATEGORIES = ["Water", "Roads", "Sanitation", "Electricity", "Welfare", "Other"];
const PRIORITIES: GrievancePriority[] = ["Low", "Medium", "High"];
const STATUS_STYLE: Record<string, string> = {
  Submitted: "bg-slate-100 text-slate-800 border-slate-300",
  "In Progress": "bg-amber-100 text-amber-800 border-amber-300",
  Resolved: "bg-emerald-100 text-emerald-800 border-emerald-300",
};

export default function GrievanceApp() {
  const navigate = useNavigate();
  const { session } = useAppSession();
  const [list, setList] = useState<GrievanceRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<GrievancePriority>("Medium");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setList(getStoredGrievances());
  }, []);

  const refresh = () => setList(getStoredGrievances());

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f?.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoDataUrl(reader.result as string);
    reader.readAsDataURL(f);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !description.trim()) return;
    setSubmitting(true);
    addGrievance({
      category,
      description: description.trim(),
      priority,
      photoDataUrl,
      location: location.trim() || (session ? `${session.village}, ${session.mandal}` : ""),
    });
    refresh();
    setShowForm(false);
    setCategory("");
    setDescription("");
    setPriority("Medium");
    setPhotoDataUrl(null);
    setLocation("");
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen grama-pattern pb-24">
      <header className="sticky top-0 z-10 glass-card rounded-b-glass border-t-0 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/app")}
            className="active-scale p-2 rounded-xl border border-slate-200 text-slate-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-heading text-xl text-primary">Grievance</h1>
            <p className="text-xs text-slate-500 font-body">Report & Official Logs</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="active-scale flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-bold"
        >
          <Plus className="w-5 h-5" /> New
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <h2 className="font-body font-bold text-slate-900">Official Logs</h2>
        <div className="space-y-4">
          {list.length === 0 ? (
            <GlassCard className="p-8 text-center text-slate-500">
              No grievances yet. Tap <strong>New</strong> to submit one.
            </GlassCard>
          ) : (
            list.map((g) => (
              <GlassCard key={g.id} className="p-5 terminal-reveal">
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="px-2 py-1 rounded-lg bg-primary/15 text-primary text-xs font-bold">
                    {g.category}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-lg border text-xs font-semibold ${STATUS_STYLE[g.status] ?? STATUS_STYLE.Submitted}`}
                  >
                    {g.status}
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-amber-100 text-amber-800 text-xs font-semibold">
                    {g.priority}
                  </span>
                </div>
                <p className="text-slate-800 font-body font-medium mb-3">{g.description}</p>
                {g.photoDataUrl && (
                  <img
                    src={g.photoDataUrl}
                    alt="Evidence"
                    className="w-full max-h-40 object-cover rounded-xl mb-3"
                  />
                )}
                <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                  {g.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {g.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(g.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </GlassCard>
            ))
          )}
        </div>
      </main>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
          <GlassCard className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white/95 backdrop-blur py-4 px-4 border-b border-slate-100 flex items-center justify-between rounded-t-glass">
              <h3 className="font-heading text-xl text-primary">New Grievance</h3>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="active-scale p-2 rounded-xl border border-slate-200"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={`active-scale px-4 py-2 rounded-xl font-semibold text-sm ${
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
                      className={`active-scale px-4 py-2 rounded-xl font-semibold text-sm ${
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
                  placeholder="Describe the issue..."
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-body"
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
                  <ImageIcon className="w-5 h-5 text-slate-400" />
                  {photoDataUrl ? "Change photo" : "Take or upload photo"}
                </label>
                {photoDataUrl && (
                  <img
                    src={photoDataUrl}
                    alt="Preview"
                    className="mt-2 w-full max-h-32 object-cover rounded-xl"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={session ? `${session.village}, ${session.mandal}` : "Optional"}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-body"
                />
              </div>
              <button
                type="submit"
                disabled={submitting || !category || !description.trim()}
                className="active-scale w-full py-4 rounded-xl bg-primary text-white font-bold disabled:opacity-50"
              >
                {submitting ? "Submitting…" : "Submit Grievance"}
              </button>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
