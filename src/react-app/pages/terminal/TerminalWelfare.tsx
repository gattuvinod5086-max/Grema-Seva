import {
  Leaf,
  Heart,
  Zap,
  Gift,
  Shield,
  Home,
  GraduationCap,
  Users,
  Building2,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { TerminalGlassCard, Badge } from "./TerminalUI";
import { WELFARE_SCHEMES } from "@/react-app/data/schemes";

const SCHEME_STYLES: {
  icon: LucideIcon;
  color: string;
  border: string;
}[] = [
  { icon: Gift, color: "bg-tg-pink/15 text-tg-pink border-tg-pink/30", border: "border-l-4 border-tg-pink" },
  { icon: Shield, color: "bg-tg-blue/15 text-tg-blue border-tg-blue/30", border: "border-l-4 border-tg-blue" },
  { icon: Heart, color: "bg-tg-maroon/15 text-tg-maroon border-tg-maroon/30", border: "border-l-4 border-tg-maroon" },
  { icon: Leaf, color: "bg-tg-green/15 text-tg-green border-tg-green/30", border: "border-l-4 border-tg-green" },
  { icon: Shield, color: "bg-emerald/15 text-emerald border-emerald/30", border: "border-l-4 border-emerald" },
  { icon: Sparkles, color: "bg-tg-gold/15 text-tg-gold border-tg-gold/30", border: "border-l-4 border-tg-gold" },
  { icon: GraduationCap, color: "bg-tg-purple/15 text-tg-purple border-tg-purple/30", border: "border-l-4 border-tg-purple" },
  { icon: Home, color: "bg-tg-red-orange/15 text-tg-red-orange border-tg-red-orange/30", border: "border-l-4 border-tg-red-orange" },
  { icon: Users, color: "bg-tg-royal-blue/15 text-tg-royal-blue border-tg-royal-blue/30", border: "border-l-4 border-tg-royal-blue" },
  { icon: Zap, color: "bg-tg-gold/15 text-tg-gold border-tg-gold/30", border: "border-l-4 border-tg-gold" },
  { icon: Leaf, color: "bg-tg-green/15 text-tg-green border-tg-green/30", border: "border-l-4 border-tg-green" },
  { icon: Building2, color: "bg-tg-emblem-green/15 text-tg-emblem-green border-tg-emblem-green/30", border: "border-l-4 border-tg-emblem-green" },
  { icon: Zap, color: "bg-amber/15 text-amber border-amber/30", border: "border-l-4 border-amber" },
];

export function TerminalWelfare() {
  return (
    <div className="space-y-12 max-w-6xl mx-auto animate-in">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <Badge variant="gold">State Services</Badge>
        <p className="text-xs font-black text-tg-maroon uppercase tracking-widest">తెలంగాణ ప్రభుత్వం</p>
        <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none italic uppercase">
          Welfare <span className="text-tg-maroon">Prosperity</span>
        </h2>
        <p className="text-lg text-slate-600 font-medium">
          Telangana government schemes at a glance.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {WELFARE_SCHEMES.map((scheme, i) => {
          const style = SCHEME_STYLES[i % SCHEME_STYLES.length];
          const Icon = style.icon;
          return (
            <TerminalGlassCard
              key={scheme.name}
              className={`p-8 flex flex-col group hover:-translate-y-1 transition-all border-2 border-slate-100 shadow-lg hover:shadow-xl ${style.border}`}
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${style.color} border shadow-sm transition-transform group-hover:scale-110`}
              >
                <Icon size={22} strokeWidth={2.25} />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2 leading-tight">{scheme.name}</h3>
              <p className="text-sm text-slate-600 leading-relaxed font-medium flex-1 mb-4">
                {scheme.tagline}
              </p>
              <ul className="flex flex-wrap gap-1.5 mb-6">
                {scheme.keyPoints.map((point) => (
                  <li
                    key={point}
                    className="text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-slate-100 text-slate-600"
                  >
                    {point}
                  </li>
                ))}
              </ul>
              {scheme.portalUrl ? (
                <a
                  href={scheme.portalUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="w-full py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest text-center transition-all shadow-sm bg-tg-maroon/10 text-tg-maroon border-2 border-tg-maroon/30 hover:bg-tg-maroon hover:text-white"
                >
                  Open Portal
                </a>
              ) : (
                <button
                  type="button"
                  className="w-full py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all shadow-sm bg-tg-maroon/10 text-tg-maroon border-2 border-tg-maroon/30 hover:bg-tg-maroon hover:text-white"
                >
                  Learn More
                </button>
              )}
            </TerminalGlassCard>
          );
        })}
      </div>
    </div>
  );
}
