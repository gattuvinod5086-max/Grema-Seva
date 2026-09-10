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
      className="min-h-screen flex flex-col relative pb-16"
      style={{
        background: "linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 50%, #FAF9F6 100%)",
      }}
    >
      {/* Top Header Ribbon and Navigation Pills */}
      <PublicNavHeader
        ribbonTitle="జై తెలంగాణ | Telangana State | Citizen Service Terminal"
        activePill="home"
      />

      {/* Main 3-Column Content Layout */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Map & Telangana Talli */}
          <div className="lg:col-span-3 flex flex-col gap-5 order-2 lg:order-1">
            {/* Telangana Map Card */}
            <div className="bg-[#0B132B] rounded-3xl border border-slate-800 shadow-md p-5 text-center flex flex-col items-center justify-between min-h-[220px]">
              <div className="w-full flex-1 flex items-center justify-center p-2">
                {!mapFallback ? (
                  <img
                    src={BRANDING.mapPanel}
                    alt="తెలంగాణ మ్యాప్"
                    className="max-h-36 w-full object-contain"
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
              <p className="text-[11px] font-black text-emerald-400 mt-2">
                తెలంగాణ మ్యాప్ · 33 Districts
              </p>
            </div>

            {/* Telangana Talli Card */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-5 text-center flex flex-col items-center justify-between min-h-[280px]">
              <div className="w-full flex-1 flex items-center justify-center p-2">
                {!thalliFallback ? (
                  <img
                    src={BRANDING.telanganaThalli}
                    alt="తెలంగాణ తల్లి"
                    className="max-h-52 w-full object-contain"
                    onError={() => setThalliFallback(true)}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-4">
                    <span className="text-5xl mb-2">🌾</span>
                    <span className="text-xs font-bold text-amber-800">తెలంగాణ తల్లి</span>
                  </div>
                )}
              </div>
              <p className="text-[11px] font-black text-amber-800 mt-2">
                తెలంగాణ తల్లి
              </p>
            </div>
          </div>

          {/* CENTER COLUMN: Hero Terminal Card */}
          <div className="lg:col-span-6 order-1 lg:order-2">
            <div
              className="bg-white rounded-[2.5rem] p-8 sm:p-12 text-center relative overflow-hidden shadow-xl border-2"
              style={{
                borderColor: "rgba(5, 150, 105, 0.35)",
                backgroundImage:
                  "linear-gradient(180deg, #F0FDF4 0%, #FFFFFF 30%, #FEFCE8 70%, #FFFBEB 100%)",
                boxShadow:
                  "0 20px 40px -15px rgba(5, 150, 105, 0.15), 0 0 0 1px rgba(204, 178, 82, 0.3)",
              }}
            >
              {/* Emblem inside rounded square */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-3xl bg-white p-3 shadow-md border-2 border-[#CCB252] flex items-center justify-center mb-5">
                {!emblemFallback ? (
                  <img
                    src={BRANDING.logoEmblem}
                    alt="Government of Telangana Emblem"
                    className="w-full h-full object-contain"
                    onError={() => setEmblemFallback(true)}
                  />
                ) : (
                  <div className="w-full h-full rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-bold text-xl">
                    TG
                  </div>
                )}
              </div>

              {/* Title & Branding */}
              <h1
                className="font-black text-3xl sm:text-4xl uppercase tracking-wider text-[#67001A]"
                style={{ fontFamily: "Instrument Serif, Georgia, serif" }}
              >
                GRAMA SEVA
              </h1>
              <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.3em] text-[#CCB252] mt-1">
                GOVERNMENT OF TELANGANA
              </p>

              {/* Heading */}
              <h2
                className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#008A3B] mt-6"
                style={{ fontFamily: "Instrument Serif, Georgia, serif" }}
              >
                CITIZEN SERVICE TERMINAL
              </h2>
              <p className="text-xs font-black uppercase tracking-widest text-[#CCB252] mt-1.5 font-telugu">
                జై తెలంగాణ
              </p>

              {/* Description */}
              <p className="text-xs sm:text-sm font-medium text-slate-600 max-w-md mx-auto mt-4 leading-relaxed">
                Official integrated portal for local governance, grievances, and state welfare monitoring.
              </p>

              {/* CTA Action Buttons */}
              <div className="space-y-4 max-w-md mx-auto pt-6 sm:pt-8 w-full">
                <button
                  type="button"
                  onClick={() => navigate("/login?official=1")}
                  className="w-full py-4 sm:py-5 px-8 rounded-full font-black text-xs sm:text-sm uppercase tracking-[0.18em] shadow-md transition-all flex items-center justify-center gap-2.5 border-2 border-amber-300 text-[#67001A] bg-gradient-to-r from-[#FEF9C3] via-[#FEF08A] to-[#FDE047] hover:brightness-105 active:scale-[0.99] min-h-[56px] sm:min-h-[60px]"
                  style={{
                    boxShadow: "0 8px 20px -4px rgba(204, 178, 82, 0.35)",
                  }}
                >
                  <LogIn size={18} strokeWidth={2.5} />
                  <span>OFFICIALS LOGIN</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="w-full py-4 sm:py-5 px-8 rounded-full font-black text-xs sm:text-sm uppercase tracking-[0.2em] text-white shadow-xl transition-all flex items-center justify-center gap-3 hover:brightness-110 active:scale-[0.99] min-h-[56px] sm:min-h-[60px]"
                  style={{
                    background: "linear-gradient(90deg, #00843D 0%, #008A3B 35%, #16a34a 70%, #65a30d 100%)",
                    boxShadow: "0 12px 28px -4px rgba(0, 138, 59, 0.45), 0 4px 10px rgba(0, 0, 0, 0.08)",
                  }}
                >
                  <span>CITIZEN LOGIN</span>
                  <ArrowRight size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Quick Access, Numbers, Stats & About */}
          <div className="lg:col-span-3 flex flex-col gap-4 order-3">
            {/* Quick Access Tiles */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-3">
                QUICK ACCESS
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  to="/emergency"
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-red-50 hover:bg-red-100/80 border border-red-200 transition-colors text-center group"
                >
                  <Siren size={20} className="text-red-700 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-red-800">
                    EMERGENCY
                  </span>
                </Link>

                <Link
                  to="/notices"
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-pink-50 hover:bg-pink-100/80 border border-pink-200 transition-colors text-center group"
                >
                  <Newspaper size={20} className="text-[#67001A] mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#67001A]">
                    NEWS
                  </span>
                </Link>

                <Link
                  to="/login"
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200 transition-colors text-center group"
                >
                  <LogIn size={20} className="text-amber-800 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-900">
                    LOGIN
                  </span>
                </Link>

                <Link
                  to="/login"
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 transition-colors text-center group"
                >
                  <ClipboardList size={20} className="text-emerald-700 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                    REPORT
                  </span>
                </Link>
              </div>
            </div>

            {/* Emergency Numbers Card */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5">
              <div className="flex items-center gap-2 mb-3">
                <Phone size={16} className="text-red-600" />
                <p className="text-[10px] font-black uppercase tracking-wider text-red-700">
                  EMERGENCY NUMBERS
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50">
                  <span className="text-xs font-semibold text-slate-800">Police / ERSS</span>
                  <a
                    href="tel:112"
                    className="px-2.5 py-1 rounded-lg text-xs font-black bg-[#67001A] text-white hover:opacity-90"
                  >
                    112
                  </a>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50">
                  <span className="text-xs font-semibold text-slate-800">Ambulance</span>
                  <a
                    href="tel:108"
                    className="px-2.5 py-1 rounded-lg text-xs font-black bg-red-600 text-white hover:opacity-90"
                  >
                    108
                  </a>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50">
                  <span className="text-xs font-semibold text-slate-800">Women & Child</span>
                  <a
                    href="tel:181"
                    className="px-2.5 py-1 rounded-lg text-xs font-black bg-purple-700 text-white hover:opacity-90"
                  >
                    181
                  </a>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50">
                  <span className="text-xs font-semibold text-slate-800">Police (legacy)</span>
                  <a
                    href="tel:100"
                    className="px-2.5 py-1 rounded-lg text-xs font-black bg-slate-800 text-white hover:opacity-90"
                  >
                    100
                  </a>
                </div>
              </div>

              <Link
                to="/emergency"
                className="block text-right text-[11px] font-bold text-[#67001A] hover:underline mt-3"
              >
                View all emergency contacts →
              </Link>
            </div>

            {/* Telangana At A Glance */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5">
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800 mb-3">
                TELANGANA AT A GLANCE
              </p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <MapPin size={16} className="text-red-600 mx-auto mb-0.5" />
                  <p className="text-base font-black text-slate-900">33</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Districts</p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <Users size={16} className="text-emerald-700 mx-auto mb-0.5" />
                  <p className="text-base font-black text-slate-900">589</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Mandals</p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <Award size={16} className="text-amber-600 mx-auto mb-0.5" />
                  <p className="text-base font-black text-slate-900">12+</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Schemes</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3">
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold text-white bg-emerald-700">
                  Rythu Bandhu
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold text-white bg-blue-600">
                  Bhagiratha
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold text-white bg-amber-600">
                  Palle Pragathi
                </span>
              </div>
            </div>

            {/* About Grama Seva */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5">
              <p className="text-[10px] font-black uppercase tracking-wider text-[#67001A] mb-2.5">
                ABOUT GRAMA SEVA
              </p>
              <ul className="space-y-2 text-[11px] text-slate-700 leading-snug">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0 mt-1.5" />
                  <span>Report grievances (water, roads, power, pensions)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                  <span>Track issues & Panchayat directory</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#67001A] shrink-0 mt-1.5" />
                  <span>Krishi AI & Vikas Sahayak chat</span>
                </li>
              </ul>

              <div className="mt-3.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <p className="text-[10px] text-slate-600 font-medium">
                  Demo tip: Use OTP <strong className="text-slate-900 font-bold">1234</strong> after entering mobile number
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
