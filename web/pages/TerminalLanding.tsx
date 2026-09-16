import { useState } from "react";
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
} from "lucide-react";
import { BRANDING } from "@web/constants/branding";
import PublicNavHeader from "@web/components/layout/PublicNavHeader";

export default function TerminalLanding() {
  const navigate = useNavigate();
  const [mapFallback, setMapFallback] = useState(false);
  const [thalliFallback, setThalliFallback] = useState(false);
  const [emblemFallback, setEmblemFallback] = useState(false);

  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{
        background: "linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 40%, #FAF9F6 100%)",
      }}
    >
      {/* Top Header Ribbon and Unified 3-Pill Navigation */}
      <PublicNavHeader
        ribbonTitle="తెలంగాణ ప్రభుత్వం | GOVERNMENT OF TELANGANA | పంచాయతీ రాజ్ & గ్రామీణాభివృద్ధి శాఖ"
        activePill="home"
      />

      {/* Flagship Praja Palana Banner for Political & State Leadership Appeal */}
      <div className="w-full bg-gradient-to-r from-[#67001A] via-[#8A1538] to-[#4d0012] text-white py-2.5 px-4 shadow-sm border-b border-[#CCB252]/40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-[#CCB252] text-[#67001A] font-black text-[10px] uppercase tracking-wider shadow-xs">
              ప్రజా పాలన
            </span>
            <span className="font-bold tracking-wide text-white/95">
              తెలంగాణ ప్రజా పాలన · Praja Palana Digital Rural Initiative
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-[#FEF08A] font-semibold">
            <span className="hidden sm:inline">🏛️ 33 జిల్లాలు</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">589 మండలాలు</span>
            <span className="hidden sm:inline">•</span>
            <span>12,769+ గ్రామ పంచాయతీలు</span>
            <span className="hidden md:inline px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/20">
              ⚡ 100% డిజిటల్ పారదర్శకత
            </span>
          </div>
        </div>
      </div>

      {/* Main 3-Column Content Layout */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Map, Telangana Talli & Governance Vision */}
          <div className="lg:col-span-3 flex flex-col gap-5 order-2 lg:order-1">
            {/* Telangana Map Card */}
            <div className="bg-[#0B132B] rounded-3xl border-2 border-[#CCB252]/50 shadow-lg p-5 text-center flex flex-col items-center justify-between min-h-[230px] relative overflow-hidden group hover:border-[#CCB252] transition-colors">
              <div className="absolute top-2 left-3 right-3 flex items-center justify-between text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                <span>సమగ్ర పటము</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">33 జిల్లాలు</span>
              </div>
              <div className="w-full flex-1 flex items-center justify-center pt-5 pb-2">
                {!mapFallback ? (
                  <img
                    src={BRANDING.mapPanel}
                    alt="తెలంగాణ మ్యాప్"
                    className="max-h-36 w-full object-contain filter drop-shadow-[0_4px_12px_rgba(5,150,105,0.3)] group-hover:scale-105 transition-transform"
                    onError={() => setMapFallback(true)}
                  />
                ) : (
                  <svg viewBox="0 0 100 75" className="w-44 h-32 object-contain" aria-hidden>
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
              <div className="w-full pt-2 border-t border-slate-800">
                <p className="text-xs font-black text-[#FEF08A] font-telugu telugu-text">
                  తెలంగాణ సమగ్ర స్వరూపం
                </p>
                <p className="text-[10px] text-slate-400 font-medium">
                  North · South · Central Telangana
                </p>
              </div>
            </div>

            {/* Telangana Talli Card */}
            <div className="bg-white rounded-3xl border-2 border-[#CCB252]/40 shadow-md p-5 text-center flex flex-col items-center justify-between min-h-[300px] relative overflow-hidden group hover:shadow-xl hover:border-[#CCB252] transition-all">
              <div className="w-full flex-1 flex items-center justify-center p-2">
                {!thalliFallback ? (
                  <img
                    src={BRANDING.telanganaThalli}
                    alt="తెలంగాణ తల్లి"
                    className="max-h-56 w-full object-contain filter drop-shadow-md group-hover:scale-102 transition-transform"
                    onError={() => setThalliFallback(true)}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-4">
                    <span className="text-6xl mb-2">🌾</span>
                    <span className="text-sm font-bold text-amber-900 font-telugu">తెలంగాణ తల్లి</span>
                  </div>
                )}
              </div>
              <div className="w-full pt-2 border-t border-amber-100">
                <p className="text-xs font-black text-[#67001A] font-telugu telugu-text">
                  తెలంగాణ తల్లి ఆశీస్సులతో పల్లె ప్రగతి
                </p>
                <p className="text-[10px] font-bold text-amber-800 tracking-wider uppercase mt-0.5">
                  గ్రామ స్వరాజ్యం · రైతు సంక్షేమం
                </p>
              </div>
            </div>

            {/* Political Vision & Leadership Assurance Card */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50/60 rounded-3xl border-2 border-amber-200 shadow-xs p-4.5 text-left">
              <div className="flex items-center gap-2 mb-2">
                <Crown size={18} className="text-amber-700" />
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-950">
                  ప్రజా ప్రతినిధుల విజన్
                </h3>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                సర్పంచులు, వార్డు సభ్యులు, ఎంపీడీవోలు, జిల్లా కలెక్టర్లకు నేరుగా ప్రజల సమస్యలు చేరుస్తూ, మధ్యవర్తులు లేని స్వచ్ఛమైన పాలన.
              </p>
              <div className="mt-3 pt-2.5 border-t border-amber-200/80 flex items-center justify-between text-[10px] font-bold text-amber-900">
                <span>100% పారదర్శకత</span>
                <span className="text-emerald-700 font-black">✓ నిజ సమయ పర్యవేక్షణ</span>
              </div>
            </div>
          </div>

          {/* CENTER COLUMN: Master Government Terminal (Hero Card) */}
          <div className="lg:col-span-6 order-1 lg:order-2">
            <div
              className="bg-white rounded-[2.5rem] p-6 sm:p-10 md:p-12 text-center relative overflow-hidden shadow-2xl border-2"
              style={{
                borderColor: "rgba(204, 178, 82, 0.5)",
                backgroundImage:
                  "linear-gradient(180deg, #F0FDF4 0%, #FFFFFF 25%, #FEFCE8 75%, #FFFBEB 100%)",
                boxShadow:
                  "0 25px 50px -12px rgba(103, 0, 26, 0.18), 0 0 0 1px rgba(204, 178, 82, 0.4)",
              }}
            >
              {/* Emblem inside rounded square with golden radiant halo */}
              <div className="relative inline-block mb-4 sm:mb-5">
                <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-3xl bg-white p-3 shadow-xl border-2 border-[#CCB252] flex items-center justify-center ring-4 ring-[#CCB252]/20">
                  {!emblemFallback ? (
                    <img
                      src={BRANDING.logoEmblem}
                      alt="Government of Telangana Emblem"
                      className="w-full h-full object-contain"
                      onError={() => setEmblemFallback(true)}
                    />
                  ) : (
                    <div className="w-full h-full rounded-2xl bg-[#67001A] text-[#FEF08A] flex items-center justify-center font-black text-2xl font-serif">
                      TG
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#67001A] text-[#FEF08A] text-[9px] font-black uppercase tracking-widest border border-[#CCB252] shadow-sm whitespace-nowrap">
                  ప్రభుత్వ ముద్ర
                </div>
              </div>

              {/* Title & State Branding */}
              <p className="text-[11px] sm:text-xs font-black uppercase tracking-[0.25em] text-[#CCB252] mt-2 font-telugu">
                తెలంగాణ ప్రభుత్వం · GOVERNMENT OF TELANGANA
              </p>
              <h1
                className="font-black text-3xl sm:text-4xl md:text-5xl uppercase tracking-wider text-[#67001A] mt-1"
                style={{ fontFamily: "Instrument Serif, Georgia, serif" }}
              >
                GRAMA SEVA
              </h1>
              <p className="text-xs sm:text-sm font-black text-[#008A3B] font-telugu telugu-text mt-1">
                గ్రామ సేవ - తెలంగాణ డిజిటల్ ప్రజా పాలన వేదిక
              </p>

              {/* Sub-Heading */}
              <h2
                className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-800 mt-5"
                style={{ fontFamily: "Instrument Serif, Georgia, serif" }}
              >
                CITIZEN SERVICE TERMINAL
              </h2>
              <p className="text-xs font-black uppercase tracking-widest text-[#67001A] mt-1">
                DIGITAL PANCHAYAT GOVERNANCE &amp; WELFARE DELIVERY
              </p>

              {/* Description appealing to citizens and political dignitaries */}
              <p className="text-xs sm:text-sm font-medium text-slate-600 max-w-lg mx-auto mt-3.5 leading-relaxed">
                తెలంగాణలోని ప్రతి పల్లె ప్రజలకు మౌలిక సదుపాయాలు, నీటి సరఫరా, విద్యుత్, రోడ్లు, పింఛన్ల సమస్యలను 72 గంటల వ్యవధిలో పరిష్కరించే సమగ్ర డిజిటల్ వేదిక.
              </p>

              {/* High-Impact CTA Action Buttons */}
              <div className="space-y-3.5 max-w-md mx-auto pt-6 sm:pt-8 w-full">
                {/* 1. CITIZEN LOGIN (Primary Vibrant Emerald Green) */}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="w-full py-4 px-6 sm:px-8 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-[0.16em] text-white shadow-xl transition-all flex items-center justify-between gap-3 hover:brightness-110 active:scale-[0.99] border-2 border-emerald-400 group"
                  style={{
                    background: "linear-gradient(90deg, #00843D 0%, #008A3B 40%, #059669 80%, #047857 100%)",
                    boxShadow: "0 14px 28px -4px rgba(0, 138, 59, 0.45), 0 4px 10px rgba(0, 0, 0, 0.08)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white">
                      <Users size={16} strokeWidth={2.8} />
                    </div>
                    <div className="text-left">
                      <span className="block font-black text-sm sm:text-base">CITIZEN LOGIN</span>
                      <span className="block text-[10px] font-medium text-emerald-100 font-telugu normal-case">
                        పౌర సేవలు &amp; సమస్య నమోదు
                      </span>
                    </div>
                  </div>
                  <ArrowRight size={18} strokeWidth={3} className="group-hover:translate-x-1 transition-transform text-[#FEF08A]" />
                </button>

                {/* 2. OFFICIALS LOGIN (Regal Telangana Gold & Maroon) */}
                <button
                  type="button"
                  onClick={() => navigate("/login?official=1")}
                  className="w-full py-4 px-6 sm:px-8 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-[0.16em] shadow-md transition-all flex items-center justify-between gap-3 border-2 border-[#CCB252] text-[#67001A] bg-gradient-to-r from-[#FEF9C3] via-[#FEF08A] to-[#FDE047] hover:brightness-105 active:scale-[0.99] group"
                  style={{
                    boxShadow: "0 8px 20px -4px rgba(204, 178, 82, 0.4)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#67001A]/10 flex items-center justify-center text-[#67001A]">
                      <LogIn size={16} strokeWidth={2.8} />
                    </div>
                    <div className="text-left">
                      <span className="block font-black text-sm sm:text-base">OFFICIALS LOGIN</span>
                      <span className="block text-[10px] font-bold text-[#67001A]/80 font-telugu normal-case">
                        సర్పంచ్ · వార్డు సభ్యులు · మండల అధికారి · అడ్మిన్
                      </span>
                    </div>
                  </div>
                  <Crown size={18} strokeWidth={2.5} className="group-hover:scale-110 transition-transform text-[#67001A]" />
                </button>
              </div>

              {/* Real-time Governance KPI Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-6 sm:pt-8 mt-6 border-t border-slate-200">
                <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-200 text-center">
                  <p className="text-xs font-black text-emerald-900">72-Hour SLA</p>
                  <p className="text-[9px] font-bold text-emerald-700 uppercase">సమస్య పరిష్కారం</p>
                </div>
                <div className="p-2 rounded-xl bg-blue-50/70 border border-blue-200 text-center">
                  <p className="text-xs font-black text-blue-900">Geo-Tagged</p>
                  <p className="text-[9px] font-bold text-blue-700 uppercase">స్థాన పరిశీలన</p>
                </div>
                <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-200 text-center">
                  <p className="text-xs font-black text-amber-900">Direct OTP</p>
                  <p className="text-[9px] font-bold text-amber-700 uppercase">సురక్షిత లాగిన్</p>
                </div>
                <div className="p-2 rounded-xl bg-purple-50/70 border border-purple-200 text-center">
                  <p className="text-xs font-black text-purple-900">100% Audit</p>
                  <p className="text-[9px] font-bold text-purple-700 uppercase">డిజిటల్ రికార్డు</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Quick Access, Numbers, Stats & Flagship Schemes */}
          <div className="lg:col-span-3 flex flex-col gap-4 order-3">
            {/* Quick Access Tiles */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
                <span>QUICK ACCESS</span>
                <span className="text-[#67001A] font-telugu">త్వరిత సేవలు</span>
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  to="/emergency"
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-red-50 hover:bg-red-100/80 border border-red-200 transition-colors text-center group shadow-2xs"
                >
                  <Siren size={20} className="text-red-700 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-red-800">
                    EMERGENCY
                  </span>
                  <span className="text-[9px] text-red-600 font-telugu">అత్యవసరం</span>
                </Link>

                <Link
                  to="/notices"
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-pink-50 hover:bg-pink-100/80 border border-pink-200 transition-colors text-center group shadow-2xs"
                >
                  <Newspaper size={20} className="text-[#67001A] mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#67001A]">
                    NOTICES
                  </span>
                  <span className="text-[9px] text-[#67001A]/70 font-telugu">ప్రకటనలు</span>
                </Link>

                <Link
                  to="/login"
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200 transition-colors text-center group shadow-2xs"
                >
                  <LogIn size={20} className="text-amber-800 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-900">
                    LOGIN
                  </span>
                  <span className="text-[9px] text-amber-700 font-telugu">ప్రవేశం</span>
                </Link>

                <Link
                  to="/login"
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 transition-colors text-center group shadow-2xs"
                >
                  <ClipboardList size={20} className="text-emerald-700 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                    REPORT
                  </span>
                  <span className="text-[9px] text-emerald-600 font-telugu">ఫిర్యాదు</span>
                </Link>
              </div>
            </div>

            {/* 24/7 State Emergency Hotlines Card */}
            <div className="bg-white rounded-3xl border-2 border-red-200 shadow-xs p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-red-600" />
                  <p className="text-[10px] font-black uppercase tracking-wider text-red-700">
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
                    className="px-3 py-1 rounded-lg text-xs font-black bg-emerald-700 text-white hover:opacity-90 shadow-xs flex items-center gap-1"
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
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5">
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800 mb-3 flex items-center justify-between">
                <span>TELANGANA SCHEMES</span>
                <span className="text-emerald-700 font-telugu">ప్రభుత్వ పథకాలు</span>
              </p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <MapPin size={16} className="text-red-600 mx-auto mb-0.5" />
                  <p className="text-base font-black text-slate-900">33</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase">జిల్లాలు</p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <Users size={16} className="text-emerald-700 mx-auto mb-0.5" />
                  <p className="text-base font-black text-slate-900">589</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase">మండలాలు</p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <Award size={16} className="text-amber-600 mx-auto mb-0.5" />
                  <p className="text-base font-black text-slate-900">12,769+</p>
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

            {/* Quick Demo Access Note */}
            <div className="p-3 rounded-2xl bg-amber-50/90 border border-amber-200 text-center shadow-xs">
              <p className="text-[11px] text-amber-950 font-semibold">
                🔔 డెమో ప్రవేశం: మొబైల్ నంబర్ ఇచ్చి <strong className="text-[#67001A] font-black underline">1234</strong> ఓటీపీ నమోదు చేయండి.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Official Government of Telangana Footer (Eliminating Any Bottom White Space) */}
      <footer
        className="w-full text-white mt-12 relative z-20 border-t-4 border-[#CCB252] shadow-2xl"
        style={{
          background: "linear-gradient(180deg, #520015 0%, #3e0010 45%, #24000a 100%)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-white/15">
            {/* Col 1: Government Identity */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white p-1.5 shadow-md flex items-center justify-center shrink-0 border border-[#CCB252]">
                  <img
                    src={BRANDING.logoEmblem}
                    alt="Telangana Government Emblem"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h4 className="text-base font-black tracking-wide text-white uppercase font-telugu telugu-text">
                    తెలంగాణ ప్రభుత్వం
                  </h4>
                  <p className="text-xs font-bold text-[#FEF08A] tracking-wider uppercase">
                    GOVERNMENT OF TELANGANA
                  </p>
                  <p className="text-[11px] text-white/80">
                    పంచాయతీ రాజ్ మరియు గ్రామీణాభివృద్ధి శాఖ
                  </p>
                </div>
              </div>
              <p className="text-xs text-white/75 leading-relaxed max-w-md pt-1">
                గ్రామ సేవ (Grama Seva) పోర్టల్ తెలంగాణలోని సమస్త పల్లె ప్రజలకు, పంచాయతీలకు, ప్రజా ప్రతినిధులకు పారదర్శకమైన, వేగవంతమైన డిజిటల్ సేవలందిస్తుంది.
              </p>
            </div>

            {/* Col 2: Key Portals & Links */}
            <div className="space-y-2.5">
              <h5 className="text-xs font-black uppercase tracking-wider text-[#FEF08A] border-b border-white/15 pb-1">
                ముఖ్య లింకులు · Useful Links
              </h5>
              <ul className="space-y-1.5 text-xs text-white/80">
                <li>
                  <Link to="/app" className="hover:text-[#FEF08A] transition-colors flex items-center gap-1.5">
                    <span>• గ్రామ సేవ హోమ్ (Home)</span>
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-[#FEF08A] transition-colors flex items-center gap-1.5">
                    <span>• పౌర సేవలు (Citizen Login)</span>
                  </Link>
                </li>
                <li>
                  <Link to="/login?official=1" className="hover:text-[#FEF08A] transition-colors flex items-center gap-1.5">
                    <span>• అధికారుల లాగిన్ (Officials Portal)</span>
                  </Link>
                </li>
                <li>
                  <Link to="/emergency" className="hover:text-[#FEF08A] transition-colors flex items-center gap-1.5">
                    <span>• 24/7 అత్యవసర హెల్ప్‌లైన్</span>
                  </Link>
                </li>
                <li>
                  <Link to="/notices" className="hover:text-[#FEF08A] transition-colors flex items-center gap-1.5">
                    <span>• ప్రభుత్వ ప్రకటనలు (Notices)</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: State Emergency & Helplines */}
            <div className="space-y-2.5">
              <h5 className="text-xs font-black uppercase tracking-wider text-[#FEF08A] border-b border-white/15 pb-1">
                అత్యవసర హెల్ప్‌లైన్ · Helplines
              </h5>
              <ul className="space-y-2 text-xs text-white/85">
                <li className="flex items-center justify-between">
                  <span>పోలీస్ / ERSS:</span>
                  <span className="font-black text-[#FEF08A] bg-black/30 px-2 py-0.5 rounded-md">112</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>వైద్య అంబులెన్స్:</span>
                  <span className="font-black text-[#FEF08A] bg-black/30 px-2 py-0.5 rounded-md">108</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>మహిళా హెల్ప్‌లైన్:</span>
                  <span className="font-black text-[#FEF08A] bg-black/30 px-2 py-0.5 rounded-md">181</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>పంచాయతీ రాజ్ కాల్ సెంటర్:</span>
                  <span className="font-black text-[#FEF08A] bg-black/30 px-2 py-0.5 rounded-md">1905</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright & State Compliance Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-xs text-white/70">
            <div>
              <p className="font-medium">
                © 2026 తెలంగాణ ప్రభుత్వం (Government of Telangana). సర్వ హక్కులు ప్రత్యేకించబడ్డాయి.
              </p>
              <p className="text-[10px] text-white/50 mt-0.5">
                Panchayat Raj &amp; Rural Development Department · Designed for Transparent Village Self-Governance.
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-[#FEF08A] font-bold">
              <span>డిజిటల్ తెలంగాణ</span>
              <span>•</span>
              <span>జై తెలంగాణ</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
