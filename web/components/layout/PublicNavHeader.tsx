import { Link } from "react-router";
import { Home, LogIn, Siren, Sparkles, PhoneCall } from "lucide-react";
import { BRANDING } from "@web/constants/branding";

interface PublicNavHeaderProps {
  ribbonTitle?: string;
  activePill?: "home" | "login" | "emergency";
}

export default function PublicNavHeader({
  ribbonTitle,
  activePill = "home",
}: PublicNavHeaderProps) {
  return (
    <header className="w-full flex-shrink-0 z-30">
      {/* Official Government of Telangana Top Ribbon */}
      <div
        className="text-white py-2 px-4 shadow-md border-b-2 border-[#CCB252] relative overflow-hidden"
        style={{
          background: "linear-gradient(90deg, #520015 0%, #67001A 40%, #8A1538 70%, #520015 100%)",
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
          {/* Left: State Branding & Emblem */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-white ring-2 ring-[#CCB252] flex items-center justify-center shrink-0 p-0.5 shadow-xs">
              <img
                src={BRANDING.logoEmblem}
                alt="Government of Telangana Emblem"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>
            <p className="font-bold tracking-wide truncate text-[11px] sm:text-xs">
              {ribbonTitle ? (
                <span>{ribbonTitle}</span>
              ) : (
                <>
                  <span className="font-telugu telugu-text font-black text-[#FEF08A] mr-1.5 hidden sm:inline">
                    తెలంగాణ ప్రభుత్వం
                  </span>
                  <span className="hidden md:inline text-white/90 font-medium">|</span>
                  <span className="ml-1.5 font-semibold text-white/95">
                    Government of Telangana
                  </span>
                  <span className="hidden lg:inline text-white/60 font-light mx-1.5">•</span>
                  <span className="hidden lg:inline text-[#FEF08A]/90 font-medium">
                    Panchayat Raj &amp; Rural Development Department
                  </span>
                </>
              )}
            </p>
          </div>

          {/* Right: Jai Telangana & Helpline */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 text-[11px]">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/25 border border-[#CCB252]/40 text-[#FEF08A] font-bold font-telugu telugu-text text-[10px] sm:text-xs">
              <Sparkles size={11} className="text-[#CCB252]" />
              <span>జై తెలంగాణ</span>
            </div>
            <a
              href="tel:112"
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-700/90 hover:bg-red-700 border border-red-400 text-white font-black tracking-wide text-[10px] sm:text-[11px] transition-colors shadow-xs"
              title="National Emergency Helpline"
            >
              <PhoneCall size={11} className="text-white animate-pulse" />
              <span>112 ERSS</span>
            </a>
          </div>
        </div>
      </div>

      {/* Unified 3-Section Executive Navigation Menu */}
      <div className="w-full bg-white/95 backdrop-blur-md border-b-2 border-slate-200/80 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 py-2.5 sm:py-3 flex items-center justify-center gap-2.5 sm:gap-4 flex-wrap">
          {/* Section 1: GramaSeva Home */}
          <Link
            to="/app"
            className={`inline-flex items-center gap-2 sm:gap-2.5 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs font-black tracking-wider uppercase transition-all duration-200 ${
              activePill === "home"
                ? "bg-[#67001A] text-white border-2 border-[#CCB252] shadow-md shadow-[#67001A]/20 scale-[1.02]"
                : "bg-white text-slate-700 border-2 border-slate-200 hover:border-[#CCB252] hover:text-[#67001A] hover:bg-amber-50/30 shadow-xs"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                activePill === "home" ? "bg-[#CCB252] text-[#67001A]" : "bg-slate-100 text-slate-600"
              }`}
            >
              <Home size={12} strokeWidth={2.8} />
            </div>
            <span>GRAMSEVA HOME</span>
          </Link>

          {/* Section 2: Citizen Login */}
          <Link
            to="/login"
            className={`inline-flex items-center gap-2 sm:gap-2.5 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs font-black tracking-wider uppercase transition-all duration-200 ${
              activePill === "login"
                ? "bg-[#67001A] text-white border-2 border-[#CCB252] shadow-md shadow-[#67001A]/20 scale-[1.02]"
                : "bg-white text-slate-700 border-2 border-slate-200 hover:border-[#CCB252] hover:text-[#67001A] hover:bg-amber-50/30 shadow-xs"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                activePill === "login" ? "bg-[#CCB252] text-[#67001A]" : "bg-slate-100 text-slate-600"
              }`}
            >
              <LogIn size={12} strokeWidth={2.8} />
            </div>
            <span>CITIZEN LOGIN</span>
          </Link>

          {/* Section 3: Emergency & Help */}
          <Link
            to="/emergency"
            className={`inline-flex items-center gap-2 sm:gap-2.5 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs font-black tracking-wider uppercase transition-all duration-200 ${
              activePill === "emergency"
                ? "bg-[#67001A] text-white border-2 border-[#CCB252] shadow-md shadow-[#67001A]/20 scale-[1.02]"
                : "bg-white text-slate-700 border-2 border-slate-200 hover:border-[#CCB252] hover:text-[#67001A] hover:bg-amber-50/30 shadow-xs"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                activePill === "emergency" ? "bg-[#CCB252] text-[#67001A]" : "bg-slate-100 text-slate-600"
              }`}
            >
              <Siren size={12} strokeWidth={2.8} />
            </div>
            <span>EMERGENCY &amp; HELP</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
