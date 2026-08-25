import { useState } from "react";
import { NewsMockDB } from "@/react-app/data/newsData";
import { formatNewsLocation } from "@/shared/services/newsVisibility";
import type { AppUser } from "@/react-app/data/terminalData";

export function TerminalNewsManage({
  user,
  onEdit,
  onBack,
}: {
  user: AppUser;
  onEdit: (id: string) => void;
  onBack: () => void;
}) {
  const [filter, setFilter] = useState<string>("all");
  const [items, setItems] = useState(() => {
    const all = NewsMockDB.getAll();
    if (user.role === "Admin" || user.role === "Sarpanch") return all;
    return all.filter((n) => n.author_id === user.id);
  });

  const refresh = () => setItems(NewsMockDB.getAll());

  const filtered = filter === "all" ? items : items.filter((n) => n.status === filter);

  const handleDelete = (id: string, status: string) => {
    if (status === "PUBLISHED" && !window.confirm("Delete this published news? This cannot be undone.")) return;
    NewsMockDB.delete(id);
    refresh();
  };

  const handlePublish = (id: string) => {
    const a = NewsMockDB.getById(id);
    if (!a) return;
    NewsMockDB.save({ ...a, status: "PUBLISHED", published_at: new Date().toISOString() });
    refresh();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-tg-maroon uppercase">Manage News</h2>
        <button type="button" onClick={onBack} className="text-[10px] font-black uppercase text-slate-500">← Back</button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["all", "DRAFT", "SCHEDULED", "PUBLISHED", "EXPIRED"].map((s) => (
          <button key={s} type="button" onClick={() => setFilter(s)} className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${filter === s ? "bg-tg-maroon text-white" : "bg-white border"}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto bg-white rounded-2xl border shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-500">
            <tr>
              <th className="p-3 text-left">Title</th>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-left">Location</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Views</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((n) => (
              <tr key={n.id} className="border-t">
                <td className="p-3 font-medium">{n.title_en}</td>
                <td className="p-3">{n.category}</td>
                <td className="p-3 text-xs">{formatNewsLocation(n)}</td>
                <td className="p-3">{n.status}</td>
                <td className="p-3">{n.view_count}</td>
                <td className="p-3 flex gap-2 flex-wrap">
                  <button type="button" onClick={() => onEdit(n.id)} className="text-[9px] font-black uppercase text-blue-600">Edit</button>
                  {n.status !== "PUBLISHED" && (
                    <button type="button" onClick={() => handlePublish(n.id)} className="text-[9px] font-black uppercase text-green-600">Publish</button>
                  )}
                  <button type="button" onClick={() => handleDelete(n.id, n.status)} className="text-[9px] font-black uppercase text-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="p-8 text-center text-slate-400 italic">No news items.</p>}
      </div>
    </div>
  );
}
