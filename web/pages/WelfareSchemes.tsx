import { useState } from "react";
import {
  Award,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Search,
  CheckCircle2,
  Building2,
  Gift,
  Heart,
  Zap,
  Leaf,
  GraduationCap,
  Home,
  Shield,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { WELFARE_SCHEMES } from "@web/data/schemes";
import { BRANDING } from "@web/constants/branding";

const SCHEME_ICONS: Record<string, { icon: LucideIcon; color: string; border: string }> = {
  "Maha Lakshmi": { icon: Gift, color: "bg-pink-100 text-pink-700", border: "border-pink-300" },
  "Cheyutha / Rajiv Aarogyasri": { icon: Heart, color: "bg-red-100 text-red-700", border: "border-red-300" },
  "Aasara Pensions": { icon: Shield, color: "bg-amber-100 text-amber-700", border: "border-amber-300" },
  "Rythu Bharosa": { icon: Leaf, color: "bg-emerald-100 text-emerald-700", border: "border-emerald-300" },
  "Rythu Bima": { icon: Shield, color: "bg-emerald-100 text-emerald-800", border: "border-emerald-400" },
  "Gruha Jyothi": { icon: Zap, color: "bg-yellow-100 text-yellow-700", border: "border-yellow-300" },
  "Telangana ePASS Scholarships": { icon: GraduationCap, color: "bg-purple-100 text-purple-700", border: "border-purple-300" },
  "Housing Schemes": { icon: Home, color: "bg-blue-100 text-blue-700", border: "border-blue-300" },
  "Dalit Bandhu": { icon: Sparkles, color: "bg-indigo-100 text-indigo-700", border: "border-indigo-300" },
  "Kalyana Lakshmi / Shaadi Mubarak": { icon: Gift, color: "bg-rose-100 text-rose-700", border: "border-rose-300" },
};

export default function WelfareSchemes() {
  const [search, setSearch] = useState("");
  const [expandedScheme, setExpandedScheme] = useState<string | null>(null);

  const filteredSchemes = WELFARE_SCHEMES.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.tagline.toLowerCase().includes(search.toLowerCase()) ||
      s.keyPoints.some((k) => k.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-in pb-12">
      {/* Header Banner */}
      <div
        className="rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-lg border-2 border-[#CCB252]"
        style={{ background: "linear-gradient(135deg, #67001A 0%, #8A1538 50%, #4d0012 100%)" }}
      >
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-[#CCB252] uppercase tracking-wider mb-3">
            <Award size={14} /> Telangana Welfare Directory
          </div>
          <p className="text-xs font-telugu text-[#CCB252] font-semibold telugu-text">తెలంగాణ ప్రభుత్వం సంక్షేమ పథకాలు</p>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mt-2 mb-3 leading-tight">
            Government Welfare & Citizen Schemes
          </h1>
          <p className="text-sm md:text-base text-white/90 leading-relaxed">
            Direct access to eligibility guidelines, benefits, and MeeSeva application procedures for all state flagship programs.
          </p>
        </div>
        <img
          src={BRANDING.bgMap}
          className="absolute -right-20 -bottom-20 w-[350px] opacity-[0.06] pointer-events-none"
          alt=""
          aria-hidden
        />
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search schemes (Rythu Bharosa, Pensions, Maha Lakshmi)..."
          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border-2 border-slate-200 focus:border-[#67001A] outline-none text-sm font-medium shadow-sm"
        />
      </div>

      {/* Scheme Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSchemes.map((scheme) => {
          const config = SCHEME_ICONS[scheme.name] ?? {
            icon: Building2,
            color: "bg-slate-100 text-slate-700",
            border: "border-slate-300",
          };
          const Icon = config.icon;
          const isExpanded = expandedScheme === scheme.name;

          return (
            <div
              key={scheme.name}
              className={`bg-white rounded-2xl p-6 border-2 ${config.border} shadow-sm hover:shadow-md transition-all flex flex-col`}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${config.color}`}>
                  <Icon size={24} />
                </div>
                {scheme.portalUrl && (
                  <a
                    href={scheme.portalUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-xs font-bold text-[#67001A] hover:underline inline-flex items-center gap-1 shrink-0"
                  >
                    Portal <ExternalLink size={12} />
                  </a>
                )}
              </div>

              <h2 className="text-xl font-bold text-slate-900 mb-2 leading-tight">{scheme.name}</h2>
              <p className="text-sm text-slate-600 mb-4 leading-snug flex-1">{scheme.tagline}</p>

              {/* Key Benefits */}
              <div className="space-y-1.5 mb-5">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Key Highlights</p>
                <div className="flex flex-wrap gap-1.5">
                  {scheme.keyPoints.map((point) => (
                    <span
                      key={point}
                      className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1"
                    >
                      <CheckCircle2 size={12} className="text-emerald-600" />
                      {point}
                    </span>
                  ))}
                </div>
              </div>

              {/* Apply At info */}
              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-xs mb-4">
                <span className="font-bold text-amber-900 block">Apply Through:</span>
                <span className="text-amber-800 font-medium">{scheme.applyAt}</span>
              </div>

              {/* How to apply expansion */}
              <div className="mt-auto pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setExpandedScheme(isExpanded ? null : scheme.name)}
                  className="w-full flex items-center justify-between text-xs font-bold text-[#67001A] hover:text-[#8A1538]"
                >
                  <span>{isExpanded ? "Hide Application Steps" : "How to Apply (Steps)"}</span>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {isExpanded && (
                  <ol className="mt-3 space-y-2 text-xs text-slate-600 list-decimal list-inside bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {scheme.howToApply.map((step, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {step}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
