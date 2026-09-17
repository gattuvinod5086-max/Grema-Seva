import { Link } from "react-router";
import { PhoneCall, Sparkles } from "lucide-react";
import { BRANDING } from "@web/constants/branding";

export default function PublicFooter() {
  return (
    <footer
      className="w-full text-white relative z-20 border-t-2 border-[#CCB252] shadow-xl"
      style={{
        background: "linear-gradient(180deg, #520015 0%, #3a000f 50%, #1f0008 100%)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center border-b border-white/10 pb-6 mb-6">
          
          {/* Col 1: Government Identity (6 cols) */}
          <div className="md:col-span-6 flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-full bg-white p-1 shadow-md flex items-center justify-center shrink-0 border-2 border-[#CCB252] overflow-hidden"
              style={{ width: "48px", height: "48px", minWidth: "48px" }}
            >
              <img
                src={BRANDING.logoEmblem}
                alt="Telangana Government Emblem"
                className="object-contain"
                style={{ width: "38px", height: "38px", maxWidth: "38px", maxHeight: "38px" }}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm sm:text-base font-black tracking-wide text-white uppercase font-telugu telugu-text">
                  తెలంగాణ ప్రభుత్వం
                </h4>
                <span className="text-[11px] font-bold text-[#FEF08A] tracking-wider uppercase">
                  • GOVT OF TELANGANA
                </span>
              </div>
              <p className="text-xs text-white/80 font-medium truncate">
                పంచాయతీ రాజ్ మరియు గ్రామీణాభివృద్ధి శాఖ · Grama Seva
              </p>
            </div>
          </div>

          {/* Col 2: Useful Links (3 cols) */}
          <div className="md:col-span-3 flex items-center gap-4 text-xs text-white/80 flex-wrap">
            <Link to="/app" className="hover:text-[#FEF08A] transition-colors">
              హోమ్
            </Link>
            <span>•</span>
            <Link to="/login" className="hover:text-[#FEF08A] transition-colors">
              పౌర లాగిన్
            </Link>
            <span>•</span>
            <Link to="/login?official=1" className="hover:text-[#FEF08A] transition-colors">
              అధికారులు
            </Link>
            <span>•</span>
            <Link to="/emergency" className="hover:text-[#FEF08A] transition-colors text-red-300 font-bold">
              అత్యవసరం
            </Link>
          </div>

          {/* Col 3: Helplines (3 cols) */}
          <div className="md:col-span-3 flex items-center justify-start md:justify-end gap-3 text-xs text-white/90">
            <a
              href="tel:112"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-700/80 hover:bg-red-700 text-white font-bold border border-red-400/60 shadow-xs text-[11px]"
            >
              <PhoneCall size={10} /> 112
            </a>
            <a
              href="tel:108"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600/80 hover:bg-red-600 text-white font-bold border border-red-400/60 shadow-xs text-[11px]"
            >
              <PhoneCall size={10} /> 108
            </a>
            <a
              href="tel:1905"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#008A3B]/80 hover:bg-[#008A3B] text-white font-bold border border-emerald-400/60 shadow-xs text-[11px]"
            >
              <PhoneCall size={10} /> 1905
            </a>
          </div>

        </div>

        {/* Bottom Copyright & Jai Telangana Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-white/60 text-center sm:text-left">
          <div>
            <p>
              © {new Date().getFullYear()} ప్రభుత్వం తెలంగాణ (Government of Telangana). పంచాయతీ రాజ్ &amp; గ్రామీణాభివృద్ధి శాఖ.
            </p>
            <p className="text-[10px] text-white/40 mt-0.5">
              Right to Information (RTI) Act Compliant · NIC Secure State Infrastructure
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/30 border border-[#CCB252]/40 text-[#FEF08A] text-xs font-bold font-telugu telugu-text shrink-0">
            <Sparkles size={11} className="text-[#CCB252]" />
            <span>జై తెలంగాణ</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
