import { useState } from "react";
import { X, Contact, User, Briefcase, PhoneCall, MessageSquare } from "lucide-react";
import { TerminalGlassCard, Badge } from "./TerminalUI";
import { MOCK_PANCHAYAT } from "@/react-app/data/terminalData";
import type { AppUser, PanchayatLeader } from "@/react-app/data/terminalData";

export function TerminalPanchayat({ user }: { user: AppUser }) {
  const [selectedLeader, setSelectedLeader] = useState<PanchayatLeader | null>(null);

  return (
    <div className="space-y-10 max-w-6xl mx-auto animate-in relative">
      <div className="flex items-center justify-between border-b-2 border-tg-gold/30 pb-10 px-2">
        <div>
          <p className="text-[10px] font-black text-tg-maroon uppercase tracking-widest mb-0.5">జై తెలంగాణ</p>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none italic">
            <span className="text-tg-maroon">Registry</span>
          </h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-3">
            {user.village} Administration hub
          </p>
        </div>
        <Contact className="text-tg-gold" size={40} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_PANCHAYAT.map((l) => (
          <TerminalGlassCard
            key={l.id}
            className={`p-8 border-transparent hover:border-tg-maroon/20 transition-all cursor-pointer group hover:-translate-y-1 ${
              l.ward === user.ward ? "ring-2 ring-tg-maroon/10 bg-white shadow-2xl z-10" : ""
            }`}
            onClick={() => setSelectedLeader(l)}
          >
            <div className="flex items-center gap-5">
              <div
                className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center font-black text-white shadow-xl text-2xl group-hover:scale-110 transition-transform ${
                  l.ward === user.ward ? "bg-tg-maroon" : "bg-slate-800"
                }`}
              >
                {l.name[0]}
              </div>
              <div>
                <h4 className="font-black text-lg text-slate-900">{l.name}</h4>
                <p className="text-[10px] font-black text-tg-gold uppercase tracking-widest mt-0.5">
                  {l.role} {l.ward !== "All" ? `• Ward ${l.ward}` : ""}
                </p>
              </div>
            </div>
            <div className="mt-8 flex gap-3">
              <a
                href={`tel:${l.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 py-4 bg-slate-50 text-tg-maroon rounded-2xl text-center font-black text-[9px] uppercase tracking-widest border border-slate-100 hover:bg-tg-maroon hover:text-white transition-all shadow-sm"
              >
                Direct Call
              </a>
              <button className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 shadow-sm transition-all">
                <MessageSquare size={18} />
              </button>
            </div>
            <p className="mt-6 text-[9px] font-black text-slate-300 uppercase tracking-widest text-center group-hover:text-slate-500 transition-colors">
              Click for Profile Details
            </p>
          </TerminalGlassCard>
        ))}
      </div>

      {selectedLeader && (
        <div className="fixed inset-0 z-[100] flex items-start md:items-center justify-center p-4 md:p-6 bg-tg-sidebar/50 backdrop-blur-md animate-in overflow-y-auto">
          <TerminalGlassCard className="w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar p-8 md:p-14 relative shadow-[0_0_100px_rgba(0,0,0,0.2)] my-4 md:my-0 flex-shrink-0">
            <button
              onClick={() => setSelectedLeader(null)}
              className="absolute top-8 right-8 p-3 bg-white text-slate-500 rounded-2xl hover:bg-red-50 hover:text-tg-maroon transition-all shadow-sm"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
              <div
                className={`w-24 h-24 md:w-32 md:h-32 rounded-[2.5rem] flex items-center justify-center font-black text-white text-5xl shadow-2xl ${
                  selectedLeader.ward === user.ward ? "bg-tg-maroon" : "bg-slate-800"
                }`}
              >
                {selectedLeader.name[0]}
              </div>
              <div className="text-center md:text-left">
                <Badge variant="maroon">{selectedLeader.role}</Badge>
                <h3 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase italic mt-4">
                  {selectedLeader.name}
                </h3>
                <p className="text-xs font-black text-tg-gold uppercase tracking-[0.2em] mt-1">
                  Official Jurisdiction:{" "}
                  {selectedLeader.ward === "All" ? "Village-Wide" : `Ward ${selectedLeader.ward}`}
                </p>
              </div>
            </div>

            <div className="space-y-10">
              <section className="space-y-4">
                <div className="flex items-center gap-3 text-slate-400">
                  <User size={18} />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">
                    Leadership Biography
                  </h4>
                </div>
                <p className="text-slate-600 font-medium leading-relaxed bg-slate-50/50 p-6 rounded-3xl border border-slate-100 shadow-sm">
                  {selectedLeader.bio ?? "No biography provided for this official terminal entry."}
                </p>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-3 text-slate-400">
                  <Briefcase size={18} />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">
                    Official Responsibilities
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(selectedLeader.responsibilities ?? ["Administration", "Public Service"]).map(
                    (r, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm group hover:border-emerald-200 transition-all"
                      >
                        <div className="w-2 h-2 rounded-full bg-tg-green group-hover:scale-125 transition-transform shadow-sm" />
                        <span className="text-[11px] font-bold text-slate-700">{r}</span>
                      </div>
                    )
                  )}
                </div>
              </section>

              <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
                <a
                  href={`tel:${selectedLeader.phone}`}
                  className="flex-1 py-5 bg-tg-maroon text-white rounded-[2rem] text-center font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3"
                >
                  <PhoneCall size={18} /> Call Terminal
                </a>
                <button className="flex-1 py-5 bg-white text-slate-800 border border-slate-200 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
                  Send Documentation
                </button>
              </div>
            </div>
          </TerminalGlassCard>
        </div>
      )}
    </div>
  );
}
