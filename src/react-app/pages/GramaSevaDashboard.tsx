import { Link } from "react-router";
import { MessageCircle, Leaf, FileWarning, Users, LogOut } from "lucide-react";
import GlassCard from "@/react-app/components/GlassCard";
import { useAppSession } from "@/react-app/context/AppSessionContext";

export default function GramaSevaDashboard() {
  const { session, clearSession } = useAppSession();

  const modules = [
    {
      title: "Vikas Sahayak",
      subtitle: "AI Assistant",
      description: "Ask about schemes, Rythu Bandhu, Mission Bhagiratha & more",
      to: "/app/vikas-sahayak",
      icon: MessageCircle,
      accent: "gold",
    },
    {
      title: "Krishi Terminal",
      subtitle: "Visual Agri-AI",
      description: "Upload soil or crop photos for diagnostics & crop suggestions",
      to: "/app/krishi",
      icon: Leaf,
      accent: "emerald",
    },
    {
      title: "Grievance",
      subtitle: "Report & Track",
      description: "New grievance, priority levels, photo evidence & official logs",
      to: "/app/grievance",
      icon: FileWarning,
      accent: "amber",
    },
    {
      title: "Panchayat Directory",
      subtitle: "Leaders & Contact",
      description: "Sarpanch, Ward Members – call directly, view leadership bio",
      to: "/app/panchayat",
      icon: Users,
      accent: "slate",
    },
  ];

  return (
    <div className="min-h-screen grama-pattern watermark-charminar watermark-thoranam pb-24">
      <header className="sticky top-0 z-10 glass-card rounded-b-glass border-t-0 px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl text-primary">Grama Seva</h1>
          <p className="text-slate text-sm font-body font-semibold">
            {session?.village}, {session?.mandal}
          </p>
        </div>
        <button
          type="button"
          onClick={clearSession}
          className="active-scale p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100"
          title="Sign out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <section className="terminal-reveal">
          <p className="text-slate-600 font-body text-sm mb-4">
            తెలంగాణ రాష్ట్రం · Digital Telangana Terminal
          </p>
          <h2 className="font-heading text-3xl text-primary mb-2">Choose a service</h2>
        </section>

        <div className="grid gap-4">
          {modules.map((m, i) => (
            <Link
              key={m.to}
              to={m.to}
              className="active-scale block terminal-reveal"
              style={{ animationDelay: `${(i + 1) * 0.1}s` }}
            >
              <GlassCard className="p-5 flex items-start gap-4 hover:shadow-xl transition-shadow">
                <div
                  className={`p-3 rounded-2xl ${
                    m.accent === "gold"
                      ? "bg-amber-100 text-amber-700"
                      : m.accent === "emerald"
                        ? "bg-emerald-100 text-emerald-700"
                        : m.accent === "amber"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-700"
                  }`}
                >
                  <m.icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-body font-bold text-slate-900">{m.title}</h3>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">
                    {m.subtitle}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">{m.description}</p>
                </div>
                <span className="text-primary font-bold">→</span>
              </GlassCard>
            </Link>
          ))}
        </div>

        <GlassCard className="p-4 terminal-reveal">
          <p className="text-xs text-slate-500 font-body">
            <strong>Schemes at a glance:</strong> Rythu Bandhu (Yasangi/Kharif), Mission Bhagiratha
            (tap connection), Palle Pragathi (sanitation), Aasara Pensions. Ask Vikas Sahayak for
            details.
          </p>
        </GlassCard>
      </main>
    </div>
  );
}
