import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import {
  LogIn,
  ArrowRight,
  Siren,
  Newspaper,
  ClipboardList,
  Phone,
  MapPin,
  Users,
  Award,
  PhoneCall,
  Crown,
  Sparkles,
  Shield,
  CheckCircle2,
} from "lucide-react";
import { BRANDING } from "@web/constants/branding";
import PublicNavHeader from "@web/components/layout/PublicNavHeader";

export default function TerminalLanding() {
  const navigate = useNavigate();
  const [mapFallback, setMapFallback] = useState(false);
  const [thalliFallback, setThalliFallback] = useState(false);
  const [emblemFallback, setEmblemFallback] = useState(false);

  // Set body background to the footer's darkest tone on mount to prevent white overscroll bars
  useEffect(() => {
    const prevBodyBg = document.body.style.background;
    const prevHtmlBg = document.documentElement.style.background;
    document.body.style.background = "#1f0008";
    document.documentElement.style.background = "#1f0008";
    return () => {
      document.body.style.background = prevBodyBg;
      document.documentElement.style.background = prevHtmlBg;
    };
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col relative w-full overflow-x-hidden selection:bg-[#CCB252] selection:text-[#67001A]"
      style={{
        background: "linear-gradient(180deg, #FAF8F5 0%, #F5F2EA 50%, #FAF8F5 100%)",
      }}
    >
      {/* 1. Official Government Top Ribbon & Unified 3-Pill Navigation */}
      <PublicNavHeader activePill="home" />

      {/* 2. Flagship Praja Palana Governance Banner */}
      <div className="w-full bg-gradient-to-r from-[#520015] via-[#67001A] to-[#4d0012] text-white py-2 px-4 shadow-sm border-b-2 border-[#CCB252]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#CCB252] text-[#67001A] font-black text-[10px] uppercase tracking-wider shadow-xs flex items-center gap-1">
              <Sparkles size={11} className="text-[#67001A]" />
              <span>ప్రజా పాలన</span>
            </span>
            <span className="font-bold tracking-wide text-white/95 text-[11px] sm:text-xs">
              తెలంగాణ డిజిటల్ ప్రజా పాలన &amp; గ్రామీణాభివృద్ధి వేదిక
            </span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 text-[11px] text-[#FEF08A] font-bold flex-wrap">
            <span className="flex items-center gap-1">🏛️ 33 జిల్లాలు</span>
            <span className="text-white/40">•</span>
            <span className="flex items-center gap-1">589 మండలాలు</span>
            <span className="text-white/40">•</span>
            <span className="flex items-center gap-1">12,769+ గ్రామ పంచాయతీలు</span>
            <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/25 text-[#FEF08A] border border-[#CCB252]/40 text-[10px]">
              <CheckCircle2 size={11} className="text-[#CCB252]" />
              <span>72 గంటల SLA గ్యారెంటీ</span>
            </span>
          </div>
        </div>
      </div>

      {/* 3. Main 3-Column Content Layout */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* ================= LEFT COLUMN: Map, Telangana Thalli & Governance Vision ================= */}
          <div className="lg:col-span-3 flex flex-col justify-between gap-4 order-2 lg:order-1 h-full">
            
            {/* Telangana Map Card (Clean White Background for Maximum Contrast) */}
            <div className="bg-white rounded-3xl border-2 border-[#CCB252]/50 shadow-md p-4 text-center flex flex-col items-center justify-between relative overflow-hidden group hover:shadow-xl hover:border-[#CCB252] transition-all">
              <div className="w-full flex items-center justify-between text-[11px] font-bold border-b border-amber-100 pb-2 mb-1.5">
                <span className="text-[#67001A] font-telugu telugu-text">సమగ్ర పటము</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px]">
                  33 జిల్లాలు
                </span>
              </div>

              <div className="w-full flex-1 flex items-center justify-center py-1">
                {!mapFallback ? (
                  <img
                    src={BRANDING.mapPanel}
                    alt="తెలంగాణ మ్యాప్"
                    className="max-h-36 w-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform"
                    onError={() => setMapFallback(true)}
                  />
                ) : (
                  <svg viewBox="0 0 100 75" className="w-40 h-28 object-contain" aria-hidden>
                    <polygon
                      points="15,20 48,8 85,15 92,45 72,68 30,70 10,50"
                      fill="#059669"
                      stroke="#047857"
                      strokeWidth="1.5"
                    />
                    <polygon
                      points="35,28 45,22 55,30 52,42 38,44"
                      fill="#34d399"
                      stroke="#10b981"
                      strokeWidth="1"
                    />
                    <polygon
                      points="58,32 75,27 82,40 72,52 58,46"
                      fill="#CCB252"
                      stroke="#b8962e"
                      strokeWidth="1"
                    />
                  </svg>
                )}
              </div>

              <div className="w-full pt-2 border-t border-amber-100">
                <p className="text-xs font-black text-[#520015] font-telugu telugu-text">
                  తెలంగాణ సమగ్ర స్వరూపం
                </p>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                  589 మండలాలు • 12,769+ పంచాయతీలు
                </p>
              </div>
            </div>

            {/* Telangana Thalli Card */}
            <div className="bg-white rounded-3xl border-2 border-[#CCB252]/50 shadow-md p-4 text-center flex flex-col items-center justify-between relative overflow-hidden group hover:shadow-xl hover:border-[#CCB252] transition-all flex-1">
              <div className="w-full flex items-center justify-between text-[11px] font-bold border-b border-amber-100 pb-2 mb-1.5">
                <span className="text-[#67001A] font-telugu telugu-text">రాష్ట్ర వైభవం</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px]">
                  పల్లె ప్రగతి
                </span>
              </div>

              <div className="w-full flex-1 flex items-center justify-center py-1">
                {!thalliFallback ? (
                  <img
                    src={BRANDING.telanganaThalli}
                    alt="తెలంగాణ తల్లి"
                    className="max-h-52 w-full object-contain filter drop-shadow-md group-hover:scale-102 transition-transform"
                    onError={() => setThalliFallback(true)}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-3">
                    <span className="text-5xl mb-1">🌾</span>
                    <span className="text-xs font-bold text-amber-900 font-telugu">తెలంగాణ తల్లి</span>
                  </div>
                )}
              </div>

              <div className="w-full pt-2 border-t border-amber-100">
                <p className="text-xs font-black text-[#67001A] font-telugu telugu-text">
                  తెలంగాణ తల్లి ఆశీస్సులతో పల్లె ప్రగతి
                </p>
                <p className="text-[10px] font-bold text-amber-800 tracking-wider uppercase mt-0.5">
                  రైతు సంక్షేమం · గ్రామ సాధికారత
                </p>
              </div>
            </div>

            {/* Political Vision & Leadership Assurance Card */}
            <div className="bg-gradient-to-br from-[#FFFBEB] via-white to-amber-50 rounded-3xl border-2 border-[#CCB252]/50 shadow-xs p-4 text-left">
              <div className="flex items-center gap-2 mb-1.5 border-b border-amber-200/60 pb-1.5">
                <div className="w-6 h-6 rounded-lg bg-[#67001A] text-[#FEF08A] flex items-center justify-center">
                  <Crown size={14} />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    ప్రజా ప్రతినిధుల విజన్
                  </h3>
                  <p className="text-[9px] text-[#67001A] font-bold uppercase tracking-wider">
                    LEADERSHIP DIRECTIVE
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                సర్పంచులు, వార్డు సభ్యులు, ఎంపీడీవోలు, కలెక్టర్లకు నేరుగా ప్రజల సమస్యలు చేరుస్తూ, మధ్యవర్తులు లేని డిజిటల్ పాలన.
              </p>
              <div className="mt-2.5 pt-2 border-t border-amber-200/80 flex items-center justify-between text-[10px] font-bold text-amber-900">
                <span>100% పారదర్శకత</span>
                <span className="text-emerald-800 font-black">✓ నిజ సమయ పర్యవేక్షణ</span>
              </div>
            </div>

          </div>

          {/* ================= CENTER COLUMN: Master Government Terminal (Hero Card) ================= */}
          <div className="lg:col-span-6 order-1 lg:order-2 flex flex-col h-full">
            <div
              className="bg-white rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 text-center relative overflow-hidden shadow-xl border-2 border-[#CCB252]/60 flex-1 flex flex-col justify-center h-full"
              style={{
                backgroundImage:
                  "linear-gradient(180deg, #FFFFFF 0%, #FAF8F2 60%, #FFFDF8 100%)",
              }}
            >
              {/* TOP SECTION: State Seal, Titles & Official Intro */}
              <div className="w-full flex flex-col items-center">
                {/* Clean Transparent State Seal with Radiant Halo */}
                <div className="relative inline-block mb-3">
                  <div
                    className="w-24 h-24 sm:w-26 sm:h-26 mx-auto rounded-full bg-white p-2 shadow-xl border-2 border-[#CCB252] flex items-center justify-center ring-4 ring-[#CCB252]/20 overflow-hidden"
                    style={{ width: "96px", height: "96px" }}
                  >
                    {!emblemFallback ? (
                      <img
                        src={BRANDING.logoEmblem}
                        alt="Government of Telangana Emblem"
                        className="object-contain"
                        style={{ width: "80px", height: "80px", maxWidth: "80px", maxHeight: "80px" }}
                        onError={() => setEmblemFallback(true)}
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-[#67001A] text-[#FEF08A] flex items-center justify-center font-black text-2xl font-serif">
                        TG
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#67001A] text-[#FEF08A] text-[9px] font-black uppercase tracking-widest border border-[#CCB252] shadow-xs whitespace-nowrap">
                    ప్రభుత్వ అధికారిక ముద్ర
                  </div>
                </div>

                {/* State Government Titles */}
                <div className="mt-2 text-center">
                  <p className="text-xs font-bold text-[#67001A] font-telugu">
                    తెలంగాణ ప్రభుత్వం
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8A1538] mt-0.5">
                    GOVERNMENT OF TELANGANA
                  </p>
                </div>

                {/* Main Title */}
                <h1
                  className="font-black text-3xl sm:text-5xl uppercase tracking-tight text-[#520015] mt-1"
                  style={{ fontFamily: "Instrument Serif, Georgia, serif" }}
                >
                  GRAMA SEVA
                </h1>
                <p className="text-xs sm:text-sm font-black text-[#008A3B] font-telugu telugu-text mt-0.5">
                  గ్రామ సేవ - తెలంగాణ డిజిటల్ ప్రజా పాలన వేదిక
                </p>

                {/* Sub-Heading Badge */}
                <div className="mt-2.5 inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-50 border border-amber-300/80 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span
                    className="text-xs font-black uppercase tracking-wider text-slate-800"
                    style={{ fontFamily: "Instrument Serif, Georgia, serif" }}
                  >
                    CITIZEN SERVICE TERMINAL
                  </span>
                  <span className="text-[9px] font-bold text-[#67001A] uppercase tracking-wider">
                    · DIGITAL PANCHAYAT
                  </span>
                </div>

                {/* Value Statement */}
                <p className="text-xs sm:text-sm font-medium text-slate-600 max-w-lg mx-auto mt-2 leading-relaxed">
                  తెలంగాణలోని ప్రతి పల్లె ప్రజలకు మౌలిక సదుపాయాలు, నీటి సరఫరా, విద్యుత్, రోడ్లు, పింఛన్ల సమస్యలను 72 గంటల వ్యవధిలో పరిష్కరించే సమగ్ర డిజిటల్ వేదిక.
                </p>

                {/* 3-Step Citizen Resolution Workflow */}
                <div className="w-full max-w-lg mx-auto mt-3.5 p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80">
                  <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                    <div className="flex flex-col items-center">
                      <span className="w-5 h-5 rounded-full bg-[#008A3B] text-white text-[10px] font-black flex items-center justify-center mb-1">1</span>
                      <span className="font-bold text-slate-800">సమస్య నమోదు</span>
                      <span className="text-[9px] text-slate-500 font-medium">Photo &amp; Geo-tag</span>
                    </div>
                    <div className="flex flex-col items-center border-x border-amber-200/80 px-1">
                      <span className="w-5 h-5 rounded-full bg-[#67001A] text-white text-[10px] font-black flex items-center justify-center mb-1">2</span>
                      <span className="font-bold text-slate-800">అధికారి సమీక్ష</span>
                      <span className="text-[9px] text-slate-500 font-medium">Panchayat Action</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] font-black flex items-center justify-center mb-1">3</span>
                      <span className="font-bold text-slate-800">72 గం. పరిష్కారం</span>
                      <span className="text-[9px] text-slate-500 font-medium">Guaranteed SLA</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CENTER SECTION: Clean High-Impact Action Buttons */}
              <div className="w-full max-w-md mx-auto mt-5 space-y-3">
                {/* 1. CITIZEN LOGIN */}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="w-full py-3.5 px-6 sm:px-8 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-[0.16em] text-white shadow-lg transition-all flex items-center justify-between gap-3 hover:brightness-110 active:scale-[0.99] border-2 border-emerald-400 group"
                  style={{
                    background: "linear-gradient(90deg, #00843D 0%, #008A3B 40%, #059669 80%, #047857 100%)",
                    boxShadow: "0 10px 24px -4px rgba(0, 138, 59, 0.4)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
                      <Users size={17} strokeWidth={2.6} />
                    </div>
                    <span className="font-black text-sm sm:text-base tracking-wider">CITIZEN LOGIN</span>
                  </div>
                  <ArrowRight size={18} strokeWidth={3} className="group-hover:translate-x-1 transition-transform text-[#FEF08A]" />
                </button>

                {/* 2. OFFICIALS LOGIN */}
                <button
                  type="button"
                  onClick={() => navigate("/login?official=1")}
                  className="w-full py-3.5 px-6 sm:px-8 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-[0.16em] shadow-md transition-all flex items-center justify-between gap-3 border-2 border-[#CCB252] text-[#67001A] bg-gradient-to-r from-[#FEF9C3] via-[#FEF08A] to-[#FDE047] hover:brightness-105 active:scale-[0.99] group"
                  style={{
                    boxShadow: "0 8px 20px -4px rgba(204, 178, 82, 0.35)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#67001A]/10 flex items-center justify-center text-[#67001A] shrink-0">
                      <Crown size={17} strokeWidth={2.6} />
                    </div>
                    <span className="font-black text-sm sm:text-base tracking-wider">OFFICIALS LOGIN</span>
                  </div>
                  <ArrowRight size={18} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform text-[#67001A]" />
                </button>
              </div>

              {/* TRUST RIBBON: Government Assurance Strip */}
              <div className="w-full max-w-lg mx-auto mt-5 flex flex-wrap items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-black uppercase tracking-wider text-emerald-900">
                  <Shield size={12} className="text-emerald-700" />
                  ప్రభుత్వ ఆమోదిత వేదిక
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[10px] font-black uppercase tracking-wider text-blue-900">
                  <CheckCircle2 size={12} className="text-blue-700" />
                  NIC సురక్షిత హోస్టింగ్
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-300 text-[10px] font-black uppercase tracking-wider text-amber-900">
                  <Award size={12} className="text-amber-700" />
                  24x7 పర్యవేక్షణ
                </span>
              </div>

              {/* BOTTOM SECTION: Real-time Governance KPI Counters */}
              <div className="w-full mt-6 pt-3.5 border-t border-slate-200/80">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-lg mx-auto">
                  <div className="p-2 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-center">
                    <div className="w-5 h-5 rounded-lg bg-[#008A3B] text-white flex items-center justify-center mx-auto mb-1 shadow-xs">
                      <CheckCircle2 size={12} />
                    </div>
                    <p className="text-xs font-black text-emerald-950">72-Hour SLA</p>
                    <p className="text-[9px] font-bold text-emerald-800 font-telugu">సమస్య పరిష్కారం</p>
                  </div>

                  <div className="p-2 rounded-2xl bg-blue-50/80 border border-blue-200 text-center">
                    <div className="w-5 h-5 rounded-lg bg-blue-700 text-white flex items-center justify-center mx-auto mb-1 shadow-xs">
                      <MapPin size={12} />
                    </div>
                    <p className="text-xs font-black text-blue-950">Geo-Tagged</p>
                    <p className="text-[9px] font-bold text-blue-800 font-telugu">లొకేషన్ ఆడిట్</p>
                  </div>

                  <div className="p-2 rounded-2xl bg-amber-50/80 border border-amber-200 text-center">
                    <div className="w-5 h-5 rounded-lg bg-amber-700 text-white flex items-center justify-center mx-auto mb-1 shadow-xs">
                      <Shield size={12} />
                    </div>
                    <p className="text-xs font-black text-amber-950">Direct OTP</p>
                    <p className="text-[9px] font-bold text-amber-900 font-telugu">సురక్షిత ప్రవేశం</p>
                  </div>

                  <div className="p-2 rounded-2xl bg-purple-50/80 border border-purple-200 text-center">
                    <div className="w-5 h-5 rounded-lg bg-[#67001A] text-white flex items-center justify-center mx-auto mb-1 shadow-xs">
                      <Award size={12} />
                    </div>
                    <p className="text-xs font-black text-purple-950">100% Audit</p>
                    <p className="text-[9px] font-bold text-purple-900 font-telugu">డిజిటల్ రికార్డు</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ================= RIGHT COLUMN: Quick Access, Numbers, Stats & Schemes ================= */}
          <div className="lg:col-span-3 flex flex-col justify-between gap-5 order-3 h-full">
            
            {/* Quick Access Tiles */}
            <div className="bg-white rounded-3xl border-2 border-slate-200/80 shadow-md p-5">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-600 mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
                <span>QUICK ACCESS</span>
                <span className="text-[#67001A] font-telugu font-bold">త్వరిత సేవలు</span>
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  to="/emergency"
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-red-50 hover:bg-red-100/80 border border-red-200 transition-colors text-center group shadow-2xs"
                >
                  <Siren size={20} className="text-red-700 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-red-900">
                    EMERGENCY
                  </span>
                  <span className="text-[9px] text-red-700 font-telugu">అత్యవసరం</span>
                </Link>

                <Link
                  to="/notices"
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-pink-50 hover:bg-pink-100/80 border border-pink-200 transition-colors text-center group shadow-2xs"
                >
                  <Newspaper size={20} className="text-[#67001A] mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#67001A]">
                    NOTICES
                  </span>
                  <span className="text-[9px] text-[#67001A]/80 font-telugu">ప్రకటనలు</span>
                </Link>

                <Link
                  to="/login"
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200 transition-colors text-center group shadow-2xs"
                >
                  <LogIn size={20} className="text-amber-900 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-950">
                    LOGIN
                  </span>
                  <span className="text-[9px] text-amber-800 font-telugu">ప్రవేశం</span>
                </Link>

                <Link
                  to="/login"
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 transition-colors text-center group shadow-2xs"
                >
                  <ClipboardList size={20} className="text-[#008A3B] mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-900">
                    REPORT
                  </span>
                  <span className="text-[9px] text-emerald-700 font-telugu">ఫిర్యాదు</span>
                </Link>
              </div>
            </div>

            {/* 24/7 State Emergency Hotlines Card */}
            <div className="bg-white rounded-3xl border-2 border-red-200/90 shadow-md p-5">
              <div className="flex items-center justify-between mb-3 border-b border-red-100 pb-2">
                <div className="flex items-center gap-2">
                  <Phone size={15} className="text-red-600" />
                  <p className="text-[10px] font-black uppercase tracking-wider text-red-900">
                    24/7 EMERGENCY NUMBERS
                  </p>
                </div>
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Police / ERSS</span>
                    <span className="text-[9px] text-slate-500 font-telugu">పోలీస్ అత్యవసర సేవ</span>
                  </div>
                  <a
                    href="tel:112"
                    className="px-3 py-1 rounded-lg text-xs font-black bg-[#67001A] text-white hover:opacity-90 shadow-xs flex items-center gap-1"
                  >
                    <PhoneCall size={10} /> 112
                  </a>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Medical Ambulance</span>
                    <span className="text-[9px] text-slate-500 font-telugu">వైద్య అంబులెన్స్</span>
                  </div>
                  <a
                    href="tel:108"
                    className="px-3 py-1 rounded-lg text-xs font-black bg-red-600 text-white hover:opacity-90 shadow-xs flex items-center gap-1"
                  >
                    <PhoneCall size={10} /> 108
                  </a>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Women &amp; Child Help</span>
                    <span className="text-[9px] text-slate-500 font-telugu">మహిళా హెల్ప్‌లైన్</span>
                  </div>
                  <a
                    href="tel:181"
                    className="px-3 py-1 rounded-lg text-xs font-black bg-purple-700 text-white hover:opacity-90 shadow-xs flex items-center gap-1"
                  >
                    <PhoneCall size={10} /> 181
                  </a>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Panchayat Raj Tollfree</span>
                    <span className="text-[9px] text-slate-500 font-telugu">పంచాయతీ కాల్ సెంటర్</span>
                  </div>
                  <a
                    href="tel:1905"
                    className="px-3 py-1 rounded-lg text-xs font-black bg-[#008A3B] text-white hover:opacity-90 shadow-xs flex items-center gap-1"
                  >
                    <PhoneCall size={10} /> 1905
                  </a>
                </div>
              </div>

              <Link
                to="/emergency"
                className="block text-right text-[11px] font-bold text-[#67001A] hover:underline mt-3"
              >
                సమగ్ర అత్యవసర నంబర్లు →
              </Link>
            </div>

            {/* Telangana Flagship Welfare Programs */}
            <div className="bg-white rounded-3xl border-2 border-[#CCB252]/40 shadow-md p-5 flex-1 flex flex-col justify-between">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-800 mb-3 flex items-center justify-between border-b border-amber-100 pb-2">
                <span>TELANGANA SCHEMES</span>
                <span className="text-[#008A3B] font-telugu font-bold">ప్రభుత్వ పథకాలు</span>
              </p>
              
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <MapPin size={15} className="text-red-600 mx-auto mb-0.5" />
                  <p className="text-sm font-black text-slate-900">33</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase">జిల్లాలు</p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <Users size={15} className="text-[#008A3B] mx-auto mb-0.5" />
                  <p className="text-sm font-black text-slate-900">589</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase">మండలాలు</p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <Award size={15} className="text-amber-600 mx-auto mb-0.5" />
                  <p className="text-sm font-black text-slate-900">12,769+</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase">గ్రామాలు</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3.5">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white bg-emerald-700 shadow-2xs">
                  రైతు భరోసా
                </span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white bg-blue-700 shadow-2xs">
                  మిషన్ భగీరథ
                </span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white bg-amber-700 shadow-2xs">
                  పల్లె ప్రగతి
                </span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white bg-purple-700 shadow-2xs">
                  ఇందిరమ్మ ఇండ్లు
                </span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white bg-rose-700 shadow-2xs">
                  మహాలక్ష్మి
                </span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white bg-teal-700 shadow-2xs">
                  గృహజ్యోతి
                </span>
              </div>
            </div>

            {/* Demo Access Note */}
            <div className="p-3 rounded-2xl bg-amber-50/90 border border-amber-200 text-center shadow-xs">
              <p className="text-[11px] text-amber-950 font-semibold">
                🔔 డెమో ప్రవేశం: మొబైల్ నంబర్ ఇచ్చి ఆటో-ఫిల్ అయిన 6 అంకెల ఓటీపీతో సులభంగా లాగిన్ అవ్వండి.
              </p>
            </div>

          </div>

        </div>
      </main>

      {/* 4. Official Government of Telangana Footer */}
      <footer
        className="w-full text-white mt-10 relative z-20 border-t-2 border-[#CCB252] shadow-xl"
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
    </div>
  );
}
