import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Phone, User, Crown, FileText } from "lucide-react";
import GlassCard from "@/react-app/components/GlassCard";
import { useAppSession } from "@/react-app/context/AppSessionContext";

function getSarpanch(villageName: string, districtName: string) {
  const h = villageName.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const first = ["Venkatesh", "Laxmi", "Narasimha", "Savitha", "Balaji", "Manjula", "Srinivas", "Padma"][h % 8];
  const last = ["Reddy", "Rao", "Naidu", "Goud", "Kumar"][h % 5];
  return {
    name: `${first} ${last}`,
    phone: `+91 ${9500000000 + (h % 10000000)}`,
    village: villageName,
    district: districtName,
    bio: `Sarpanch of ${villageName} since 2021. Focus areas: Palle Pragathi, Mission Bhagiratha implementation, and Rythu Bandhu awareness. Previously served as Ward Member for two terms.`,
  };
}

function getWardMembers(villageName: string, districtName: string) {
  const h = villageName.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const first = ["Rajesh", "Srinivas", "Lakshmi", "Padma", "Kumar", "Ramesh", "Sunita", "Anitha", "Venkat", "Priya"];
  const last = ["Reddy", "Rao", "Naidu", "Goud", "Kumar", "Prasad"];
  return Array.from({ length: 8 }, (_, i) => ({
    id: `wm-${villageName}-${i + 1}`,
    name: `${first[(h + i) % first.length]} ${last[(h + i) % last.length]}`,
    wardNumber: i + 1,
    phone: `+91 ${9000000000 + (h % 1000000) + i}`,
    village: villageName,
    district: districtName,
    bio: `Ward ${i + 1} member, ${villageName}. Works on local sanitation, water supply coordination, and welfare scheme enrollment.`,
  }));
}

export default function PanchayatDirectory() {
  const navigate = useNavigate();
  const { session } = useAppSession();
  const [bioFor, setBioFor] = useState<string | null>(null);

  if (!session?.village || !session?.district) {
    return (
      <div className="min-h-screen grama-pattern flex items-center justify-center p-4">
        <GlassCard className="p-8 text-center max-w-md">
          <p className="text-slate-600 mb-4">Set your village in onboarding to see the Panchayat directory.</p>
          <button
            type="button"
            onClick={() => navigate("/app")}
            className="active-scale px-4 py-2 rounded-xl bg-primary text-white font-bold"
          >
            Back to Dashboard
          </button>
        </GlassCard>
      </div>
    );
  }

  const sarpanch = getSarpanch(session.village, session.district);
  const wardMembers = getWardMembers(session.village, session.district);
  const selectedBio = bioFor === "sarpanch" ? { ...sarpanch, role: "Sarpanch" as const } : bioFor ? wardMembers.find((w) => w.id === bioFor) : null;

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
          <h1 className="font-heading text-xl text-primary">Panchayat Directory</h1>
          <p className="text-xs text-slate-500 font-body">
            {session.village}, {session.mandal}
          </p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Crown className="w-6 h-6 text-gold" />
          <h2 className="font-body font-bold text-slate-900">Village Sarpanch</h2>
        </div>
        <GlassCard className="p-5 terminal-reveal">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-bold text-slate-900">{sarpanch.name}</p>
                <p className="text-sm text-slate-500">Sarpanch · {sarpanch.village}</p>
              </div>
            </div>
            <a
              href={`tel:${sarpanch.phone.replace(/\s/g, "")}`}
              className="active-scale flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold"
            >
              <Phone className="w-5 h-5" /> Call
            </a>
          </div>
          <button
            type="button"
            onClick={() => setBioFor("sarpanch")}
            className="mt-3 flex items-center gap-2 text-sm text-primary font-semibold"
          >
            <FileText className="w-4 h-4" /> Leadership Bio
          </button>
        </GlassCard>

        <h2 className="font-body font-bold text-slate-900 mt-8">Ward Members</h2>
        <div className="space-y-4">
          {wardMembers.map((wm) => (
            <GlassCard key={wm.id} className="p-5 terminal-reveal">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                    <User className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{wm.name}</p>
                    <p className="text-sm text-slate-500">Ward {wm.wardNumber} · {wm.village}</p>
                  </div>
                </div>
                <a
                  href={`tel:${wm.phone.replace(/\s/g, "")}`}
                  className="active-scale flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-700"
                >
                  <Phone className="w-4 h-4" /> Call
                </a>
              </div>
              <button
                type="button"
                onClick={() => setBioFor(wm.id)}
                className="mt-3 flex items-center gap-2 text-sm text-primary font-semibold"
              >
                <FileText className="w-4 h-4" /> Leadership Bio
              </button>
            </GlassCard>
          ))}
        </div>
      </main>

      {selectedBio && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
          <GlassCard className="w-full max-w-md max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-lg text-primary">Leadership Bio</h3>
              <button
                type="button"
                onClick={() => setBioFor(null)}
                className="active-scale p-2 rounded-xl border border-slate-200"
              >
                ✕
              </button>
            </div>
            <p className="font-bold text-slate-900">{selectedBio.name}</p>
            <p className="text-sm text-slate-500 mb-3">
              {"role" in selectedBio ? selectedBio.role : "Ward Member"} · {selectedBio.village}
            </p>
            <p className="text-sm text-slate-700 font-body">{selectedBio.bio ?? "No bio available."}</p>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
