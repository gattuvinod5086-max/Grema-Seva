import { FileText, MapPin, ExternalLink } from "lucide-react";
import { TerminalGlassCard, Badge } from "./TerminalUI";
import { WELFARE_SCHEMES } from "@/react-app/data/schemes";

export function TerminalSchemeApply() {
  return (
    <div className="space-y-10 max-w-6xl mx-auto animate-in">
      <div className="text-center space-y-4 max-w-2xl mx-auto px-2">
        <Badge variant="maroon">Application Guide</Badge>
        <p className="text-xs font-black text-tg-gold uppercase tracking-widest">ఎలా దరఖాస్తు చేయాలి</p>
        <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none italic uppercase">
          Telangana Welfare <span className="text-tg-maroon">Schemes</span>
        </h2>
        <p className="text-lg text-slate-600 font-medium">
          Step-by-step guide for Telangana welfare schemes.
        </p>
      </div>

      <div className="space-y-6">
        {WELFARE_SCHEMES.map((scheme) => (
          <TerminalGlassCard
            key={scheme.name}
            className="p-6 md:p-8 border-2 border-slate-100 shadow-lg border-l-4 border-l-tg-maroon"
          >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
              <div className="min-w-0">
                <h3 className="text-xl font-black text-slate-900 mb-1">{scheme.name}</h3>
                <p className="text-sm text-slate-600 font-medium">{scheme.tagline}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0 px-3 py-2 rounded-xl bg-tg-gold/10 border border-tg-gold/30">
                <MapPin size={14} className="text-tg-maroon" />
                <span className="text-[10px] font-black uppercase tracking-wider text-tg-maroon">
                  {scheme.applyAt}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <FileText size={16} className="text-tg-green" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Steps to apply
              </p>
            </div>
            <ol className="space-y-2 mb-4 list-decimal list-inside">
              {scheme.howToApply.map((step) => (
                <li key={step} className="text-sm text-slate-700 font-medium leading-relaxed pl-1">
                  {step}
                </li>
              ))}
            </ol>

            {scheme.portalUrl && (
              <a
                href={scheme.portalUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-tg-maroon hover:text-tg-maroon-light transition-colors"
              >
                Open official portal
                <ExternalLink size={14} />
              </a>
            )}
          </TerminalGlassCard>
        ))}
      </div>
    </div>
  );
}
