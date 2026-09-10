import { Link } from "react-router";
import { Home, LogIn, Siren, Sparkles } from "lucide-react";

interface PublicNavHeaderProps {
  ribbonTitle?: string;
  activePill?: "home" | "login" | "emergency";
}

export default function PublicNavHeader({
  ribbonTitle = "తెలంగాణ రాష్ట్రం | Telangana State | Digital Village Development",
  activePill,
}: PublicNavHeaderProps) {
  return (
    <header className="w-full flex-shrink-0">
      {/* Top Maroon Ribbon with TG Emblem */}
      <div className="bg-[#67001A] text-white py-2.5 px-4 shadow-md border-b-2 border-[#CCB252]">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 sm:gap-3">
          <span className="px-2 py-0.5 rounded-md font-serif text-xs md:text-sm tracking-tight text-[#FEF08A] bg-black/25 font-black uppercase">
            TG
          </span>
          <p className="text-xs sm:text-sm md:text-base font-bold text-center tracking-wide drop-shadow-xs truncate">
            {ribbonTitle}
          </p>
          <Sparkles className="w-4 h-4 text-[#FEF08A] shrink-0" />
        </div>
      </div>

      {/* Global Navigation Pills */}
      <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-center gap-2.5 sm:gap-3.5 flex-wrap">
        <Link
          to="/app"
          className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-[11px] sm:text-xs font-black tracking-wider uppercase transition-all shadow-xs bg-[#67001A] text-white border border-[#67001A] hover:bg-[#520015]"
        >
          <Home size={15} strokeWidth={2.5} />
          <span>GRAMSEVA HOME</span>
        </Link>

        <Link
          to="/login"
          className={`inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-[11px] sm:text-xs font-black tracking-wider uppercase transition-all shadow-xs ${
            activePill === "login"
              ? "bg-[#FDF2F8] text-[#67001A] border-2 border-[#67001A]"
              : activePill === "emergency"
              ? "bg-[#67001A] text-white border border-[#67001A] hover:bg-[#520015]"
              : "bg-white text-slate-800 border border-slate-300 hover:bg-slate-50"
          }`}
        >
          <LogIn size={15} strokeWidth={2.5} />
          <span>CITIZEN LOGIN</span>
        </Link>

        <Link
          to="/emergency"
          className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-[11px] sm:text-xs font-black tracking-wider uppercase transition-all shadow-xs bg-white text-red-700 border-2 border-red-300 hover:bg-red-50"
        >
          <Siren size={15} strokeWidth={2.5} className="text-red-600" />
          <span>EMERGENCY & HELP</span>
        </Link>
      </div>
    </header>
  );
}
