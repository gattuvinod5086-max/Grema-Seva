import { useState, useEffect } from "react";
import { Link } from "react-router";
import { ArrowRight, Loader2, Sparkles, LogIn } from "lucide-react";
import { TerminalGlassCard } from "./TerminalUI";
import {
  MockDB,
  TELANGANA_DATA,
  type AppUser,
  type UserRole,
} from "@/react-app/data/terminalData";
import { BRANDING } from "@/react-app/constants/branding";
import { PENDING_OFFICIAL_KEY, type PendingOfficial } from "@/react-app/pages/loginConstants";

const STORAGE_EMBLEM = "gramaseva_emblem_image";

export function TerminalAuth({ onLoginSuccess }: { onLoginSuccess: (user: AppUser) => void }) {
  const [step, setStep] = useState<"welcome" | "mobile" | "otp" | "register">("welcome");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  /** true = show inline SVG (only when /logo.png fails); false = show uploaded logo image */
  const [emblemFallback, setEmblemFallback] = useState(false);
  /** true = show inline SVG map when image fails; false = show map image */
  const [mapFallback, setMapFallback] = useState(false);
  /** true = Thalli image failed to load (e.g. network block); show placeholder */
  const [thalliImgFailed, setThalliImgFailed] = useState(false);
  /** Uploaded emblem/logo (data URL from localStorage, if set earlier) */
  const [emblemDataUrl] = useState<string | null>(() => localStorage.getItem(STORAGE_EMBLEM));

  const [pendingOfficial, setPendingOfficial] = useState<PendingOfficial | null>(() => {
    try {
      const s = localStorage.getItem(PENDING_OFFICIAL_KEY);
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });

  const [regData, setRegData] = useState({
    name: "",
    role: "Citizen" as UserRole,
    district: "",
    mandal: "",
    village: "",
    ward: "1",
  });

  useEffect(() => {
    if (step === "register" && pendingOfficial) {
      setRegData((prev) => ({
        ...prev,
        role: pendingOfficial.role as UserRole,
        district: pendingOfficial.district,
        mandal: pendingOfficial.mandal,
        village: pendingOfficial.village,
      }));
    }
  }, [step, pendingOfficial]);

  const handleMobileSubmit = () => {
    if (mobile.length !== 10) return setError("Enter valid 10-digit number");
    setIsLoading(true);
    setError("");
    setTimeout(() => {
      const existing = MockDB.getUserByPhone(mobile);
      setStep(existing ? "otp" : "register");
      setIsLoading(false);
    }, 1000);
  };

  const handleRegister = () => {
    if (!regData.name || !regData.district || !regData.mandal || !regData.village) {
      return setError("Geographical hierarchy is incomplete. Please select all fields.");
    }
    setIsLoading(true);
    setError("");
    setTimeout(() => {
      const newUser: AppUser = {
        id: `USR-${Date.now()}`,
        ...regData,
        phone: mobile,
        registeredAt: new Date().toISOString(),
      };
      MockDB.saveUser(newUser);
      setStep("otp");
      setIsLoading(false);
    }, 1200);
  };

  const handleOtpVerify = () => {
    if (otp !== "1234") return setError("System: Verification token 1234");
    let u = MockDB.getUserByPhone(mobile);
    if (!u) return;
    if (pendingOfficial) {
      u = {
        ...u,
        role: pendingOfficial.role as UserRole,
        district: pendingOfficial.district,
        mandal: pendingOfficial.mandal,
        village: pendingOfficial.village,
        ward: u.role === "Ward Member" ? u.ward : "1",
      };
      MockDB.saveUser(u);
      try {
        localStorage.removeItem(PENDING_OFFICIAL_KEY);
      } catch {
        /* ignore */
      }
      setPendingOfficial(null);
    }
    onLoginSuccess(u);
  };

  /* Bright Telangana colours: emblem green, gold, maroon – attractive for Telangana people */
  const gold = "var(--tg-gold)";
  const maroon = "var(--tg-maroon)";
  const green = "var(--tg-green)";
  const emerald = "var(--color-emerald)";
  const emblemGreen = "var(--tg-emblem-green)";
  const pink = "var(--tg-pink)";
  const amber = "var(--color-amber)";
  const violet = "var(--tg-purple)";
  const gradientBg = "var(--tg-gradient-page)";
  const gradientHeader = "var(--tg-gradient-header)";
  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = gradientBg;
    return () => { document.body.style.background = prev; };
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{ background: gradientBg }}
    >
      {/* Header – bright Telangana green & gold */}
      <div
        className="relative text-white py-3 md:py-4 shadow-lg flex-shrink-0"
        style={{
          background: gradientHeader,
          borderBottom: `3px solid ${gold}`,
          boxShadow: "0 4px 14px rgba(0,179,65,0.35)",
        }}
      >
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-center gap-3 md:gap-4">
            <span
              className="flex-shrink-0 px-2 py-0.5 rounded-md font-black text-sm md:text-base tracking-tighter uppercase"
              style={{ fontFamily: "Instrument Serif, Georgia, serif", color: "#fef08a", textShadow: "0 1px 2px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.2)", background: "rgba(0,0,0,0.15)" }}
            >
              TG
            </span>
            <p className="text-sm md:text-lg font-bold text-center drop-shadow-sm" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>
              జై తెలంగాణ | Telangana State | Citizen Service Terminal
            </p>
            <Sparkles className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" style={{ color: "#fef08a" }} />
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center relative p-4 md:p-6 overflow-y-auto min-h-0 pb-10" style={{ background: "linear-gradient(180deg, transparent 0%, rgba(254,249,195,0.3) 50%, transparent 100%)" }}>
        <div className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-8 py-4">
          {/* Auth card first on mobile so it is visible without scrolling */}
          <TerminalGlassCard
        className="w-full max-w-xl p-6 md:p-14 relative z-10 shadow-xl flex-shrink-0 order-1 lg:order-2"
        style={{
          border: `3px solid transparent`,
          backgroundImage: `linear-gradient(135deg, #ecfdf5 0%, #d1fae5 20%, #fef9c3 40%, #fef3c7 60%, #fce7f3 80%, #fdf2f8 100%), linear-gradient(135deg, ${emerald}, ${emblemGreen}, ${gold}, ${maroon})`,
          backgroundOrigin: "padding-box, border-box",
          backgroundClip: "padding-box, border-box",
          backgroundColor: "#ecfdf5",
          boxShadow: "0 25px 50px -12px rgba(0,179,65,0.2), 0 0 0 2px rgba(204,178,82,0.5)",
        }}
      >
        <div className={`text-center ${step === "mobile" || step === "register" || step === "otp" ? "mb-6" : "mb-10 md:mb-12"}`}>
          <div
            className={`mx-auto relative rounded-2xl flex items-center justify-center overflow-hidden ring-4 ring-tg-gold ring-offset-2 ring-offset-pink-100 shadow-lg ${
              step === "mobile" || step === "register" || step === "otp" ? "w-20 h-20 md:w-28 md:h-28 mb-4" : "w-32 h-32 md:w-40 md:h-40 mb-6"
            }`}
            style={{
              background: "linear-gradient(145deg, #ecfdf5 0%, #d1fae5 30%, #fef9c3 70%, #fef3c7 100%)",
              boxShadow: "0 8px 24px rgba(5,150,105,0.25), 0 0 0 1px rgba(204,178,82,0.5), inset 0 1px 0 rgba(255,255,255,0.5)",
            }}
          >
            {emblemDataUrl ? (
              <img
                src={emblemDataUrl}
                alt="Government of Telangana – State Emblem"
                className="relative w-full h-full object-contain p-2 min-h-[80px] z-10 drop-shadow-sm"
              />
            ) : emblemFallback ? (
              <svg
                viewBox="0 0 100 100"
                className="relative w-full h-full p-2 z-10"
                width="100%"
                height="100%"
                preserveAspectRatio="xMidYMid meet"
                aria-label="Government of Telangana – State Emblem"
                style={{ display: "block" }}
              >
                {/* Outer gold ring (Magenta 20, Yellow 60, Black 20) */}
                <circle cx="50" cy="50" r="47" fill="none" stroke="#b8860b" strokeWidth="8" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="#CCB252" strokeWidth="2" />
                {/* Green ring – serrated inner edge (Cyan 100, Yellow 100) */}
                <circle cx="50" cy="50" r="40" fill="none" stroke="#00843D" strokeWidth="4" />
                <circle cx="50" cy="50" r="36" fill="none" stroke="#00B341" strokeWidth="2" />
                {/* Inner white + green central area */}
                <circle cx="50" cy="50" r="34" fill="#ffffff" stroke="#166534" strokeWidth="1.5" />
                {/* Simplified Lion Capital (gold) – top */}
                <ellipse cx="50" cy="32" rx="8" ry="6" fill="none" stroke="#b8860b" strokeWidth="2" />
                <path d="M42 38 L50 34 L58 38 L50 42 Z" fill="none" stroke="#CCB252" strokeWidth="1.5" />
                <circle cx="50" cy="38" r="2" fill="none" stroke="#b8860b" strokeWidth="1" />
                {/* Kakatiya arch (green) – middle */}
                <path d="M35 42 Q50 36 65 42 L62 52 Q50 48 38 52 Z" fill="none" stroke="#00843D" strokeWidth="2" />
                {/* Charminar (green) – bottom */}
                <path d="M44 54 L50 50 L56 54 L56 62 L50 66 L44 62 Z" fill="none" stroke="#00B341" strokeWidth="1.5" />
                <text x="50" y="78" textAnchor="middle" fill="#166534" fontWeight="bold" fontSize="8" fontFamily="sans-serif">TG</text>
              </svg>
            ) : (
              <img
                src={BRANDING.logoEmblem}
                className="relative w-full h-full object-contain p-2 min-h-[80px] z-10 drop-shadow-sm"
                alt="Government of Telangana – State Emblem"
                referrerPolicy="no-referrer"
                style={{ backgroundColor: "transparent" }}
                onError={() => setEmblemFallback(true)}
              />
            )}
          </div>
          <h1
            className={`font-black tracking-tighter uppercase mb-2 ${step === "mobile" || step === "register" || step === "otp" ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl"}`}
            style={{ color: maroon }}
          >
            Grama Seva
          </h1>
          <p
            className={`font-bold uppercase tracking-[0.4em] ${step === "mobile" || step === "register" || step === "otp" ? "text-[9px] md:text-[10px]" : "text-[10px] md:text-[11px]"}`}
            style={{ color: gold }}
          >
            Government of Telangana
          </p>
        </div>

        {step === "welcome" && (
          <div className="space-y-6 md:space-y-8 text-center">
            <h2 className="text-2xl font-black uppercase tracking-tight" style={{ color: green }}>
              Citizen Service Terminal
            </h2>
            <p className="mb-6 text-[10px] font-bold uppercase tracking-wider" style={{ color: gold }}>
              జై తెలంగాణ
            </p>
            <p className="mb-8 md:mb-10 text-sm font-medium" style={{ color: "#475569" }}>
              Official integrated portal for local governance, grievances, and state welfare monitoring.
            </p>
            {pendingOfficial && (
              <p className="mb-4 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider" style={{ background: "rgba(5,150,105,0.15)", color: green }}>
                Signing in as <strong>{pendingOfficial.role}</strong> · {pendingOfficial.village}. Use mobile (OTP) or continue below.
              </p>
            )}
            <Link
              to="/login?official=1"
              className="w-full py-4 md:py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-lg transition-all flex items-center justify-center gap-2 border-2 hover:opacity-95"
              style={{ borderColor: gold, color: maroon, background: "rgba(254,240,138,0.4)" }}
            >
              <LogIn size={18} /> Officials Login
            </Link>
            <button
              onClick={() => setStep("mobile")}
              className="w-full py-5 md:py-6 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-3 hover:opacity-95"
              style={{ background: `linear-gradient(90deg, ${emerald}, ${emblemGreen}, ${gold})`, boxShadow: "0 8px 24px rgba(0,179,65,0.4)" }}
            >
              Proceed <ArrowRight size={18} />
            </button>
          </div>
        )}

        {step === "mobile" && (
          <div className="space-y-4 md:space-y-6 animate-in">
            <div className="text-center">
              <h2 className="text-lg md:text-xl font-black text-slate-800 uppercase tracking-tight">Access Control</h2>
              <p className="text-xs text-slate-400 mt-1">Authentication via registered mobile number</p>
            </div>
            <input
              type="tel"
              maxLength={10}
              className="w-full p-4 md:p-6 bg-white border border-slate-200 rounded-2xl md:rounded-3xl text-2xl md:text-3xl font-black text-center focus:ring-4 focus:ring-red-50 outline-none transition-all shadow-sm"
              placeholder="91XXXXXXXX"
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
            />
            <button
              onClick={handleMobileSubmit}
              disabled={isLoading}
              className="w-full py-4 md:py-6 bg-tg-maroon text-white rounded-2xl md:rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-2"
              style={{ backgroundColor: maroon }}
            >
              {isLoading ? <Loader2 className="animate-spin" size={24} /> : "Request Access"}
            </button>
            <button
              onClick={() => setStep("welcome")}
              className="w-full text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-slate-500 py-2"
            >
              Back
            </button>
          </div>
        )}

        {step === "register" && (
          <div className="space-y-4 animate-in">
            <h2 className="text-lg md:text-xl font-black text-slate-800 text-center uppercase tracking-tight">
              Regional Profile
            </h2>
            <div className="grid grid-cols-1 gap-3 max-h-[280px] sm:max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">
                  Full Name
                </label>
                <input
                  className="w-full p-5 bg-white border border-slate-100 rounded-2xl font-bold text-sm focus:border-tg-maroon outline-none shadow-sm"
                  value={regData.name}
                  onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                  placeholder="Legal Name"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">
                  District
                </label>
                <select
                  className="w-full p-5 bg-white border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:border-tg-maroon shadow-sm"
                  value={regData.district}
                  onChange={(e) =>
                    setRegData({ ...regData, district: e.target.value, mandal: "", village: "" })
                  }
                >
                  <option value="">Select Official District</option>
                  {Object.keys(TELANGANA_DATA)
                    .sort()
                    .map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                </select>
              </div>
              {regData.district && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">
                    Mandal
                  </label>
                  <select
                    className="w-full p-5 bg-white border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:border-tg-maroon shadow-sm"
                    value={regData.mandal}
                    onChange={(e) => setRegData({ ...regData, mandal: e.target.value, village: "" })}
                  >
                    <option value="">Select Mandal</option>
                    {Object.keys(TELANGANA_DATA[regData.district] ?? {})
                      .sort()
                      .map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                  </select>
                </div>
              )}
              {regData.mandal && regData.district && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">
                    Village
                  </label>
                  <select
                    className="w-full p-5 bg-white border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:border-tg-maroon shadow-sm"
                    value={regData.village}
                    onChange={(e) => setRegData({ ...regData, village: e.target.value })}
                  >
                    <option value="">Select Village</option>
                    {(TELANGANA_DATA[regData.district]?.[regData.mandal] ?? []).sort().map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">
                  User Role
                </label>
                <select
                  className="w-full p-5 bg-white border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:border-tg-maroon shadow-sm"
                  value={regData.role}
                  onChange={(e) => setRegData({ ...regData, role: e.target.value as UserRole })}
                >
                  <option value="Citizen">Citizen</option>
                  <option value="Ward Member">Ward Member</option>
                  <option value="Sarpanch">Sarpanch</option>
                  <option value="Upasarpanch">Upasarpanch</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>
            {error && (
              <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest text-center">
                {error}
              </p>
            )}
            <button
              onClick={handleRegister}
              className="w-full py-4 md:py-6 text-white rounded-2xl md:rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl min-h-[48px]"
              style={{ backgroundColor: maroon }}
            >
              Establish Identity
            </button>
          </div>
        )}

        {step === "otp" && (
          <div className="space-y-5 md:space-y-8 text-center animate-in">
            <h2 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tight">
              Identity Token
            </h2>
            <p className="text-sm text-slate-400">
              Security code dispatched to <b>+91 {mobile}</b>
            </p>
            <p className="text-xs text-emerald-600 font-semibold mb-1">Demo: enter <strong>1234</strong></p>
            <input
              className="w-full p-5 md:p-8 bg-white border-2 border-slate-200 rounded-[2rem] text-center text-3xl md:text-5xl font-black outline-none tracking-[0.4em] md:tracking-[0.5em] shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-red-200"
              style={{ color: maroon }}
              maxLength={4}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="0000"
            />
            <button
              onClick={handleOtpVerify}
              className="w-full py-4 md:py-6 text-white rounded-2xl md:rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl min-h-[48px]"
              style={{ backgroundColor: maroon }}
            >
              Verify & Enter
            </button>
            {error && <p className="text-xs text-red-600 font-bold">{error}</p>}
          </div>
        )}
      </TerminalGlassCard>

          {/* Info panel: colourful SVGs + farming + app info */}
          <div className="flex flex-col gap-4 lg:w-72 xl:w-80 flex-shrink-0 order-2 lg:order-1 space-y-4">
            {/* Telangana map – full background, image fills and adjusts to panel */}
            <div
              className="rounded-xl border-2 border-emerald-400/80 shadow-lg overflow-hidden w-full min-h-[140px] flex flex-col"
              style={{ background: "linear-gradient(180deg, #d1fae5 0%, #a7f3d0 50%, #6ee7b7 100%)" }}
            >
              <div className="w-full flex-1 min-h-[100px] aspect-[4/3] rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center">
                {mapFallback ? (
                  <svg viewBox="0 0 100 75" className="w-full h-full object-contain" aria-hidden style={{ background: "#0f172a" }}>
                    <path d="M15 15 L50 8 L85 15 L90 45 L70 65 L30 68 L10 50 Z" fill="#059669" stroke="#047857" strokeWidth="1.2" />
                    <path d="M35 25 L45 20 L55 28 L52 40 L38 42 Z" fill="#34d399" stroke="#10b981" strokeWidth="1" />
                    <path d="M60 30 L75 25 L82 38 L72 50 L58 45 Z" fill="#CCB252" stroke="#b8962e" strokeWidth="1" />
                  </svg>
                ) : (
                  <img
                    src={BRANDING.mapPanel}
                    alt="తెలంగాణ మ్యాప్ – 33 Districts"
                    className="w-full h-full object-contain object-center min-w-0 min-h-0"
                    referrerPolicy="no-referrer"
                    loading="eager"
                    onError={(e) => {
                      const el = e.target as HTMLImageElement;
                      if (el.src.endsWith("/bg-map.png") && BRANDING.mapPanelFallback) {
                        el.src = BRANDING.mapPanelFallback;
                      } else {
                        setMapFallback(true);
                      }
                    }}
                  />
                )}
              </div>
              <p className="text-center py-1.5 text-[10px] font-black flex-shrink-0" style={{ color: green, background: "rgba(255,255,255,0.5)" }}>తెలంగాణ మ్యాప్ | 33 Districts</p>
            </div>
            {/* Telangana Thalli – background behind image; image shown at full size (no pixel decrease) */}
            <div
              className="rounded-xl border-2 border-amber-400/80 shadow-lg p-3"
              style={{ background: "linear-gradient(145deg, #fef3c7, #fde68a, #fcd34d)" }}
            >
              <div
                className="w-full min-h-[200px] aspect-[3/4] rounded-lg flex items-center justify-center overflow-hidden p-1"
                style={{ background: "linear-gradient(180deg, #fef9c3 0%, #fef3c7 50%, #fde68a 100%)", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.06)" }}
              >
                {thalliImgFailed ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-amber-700 rounded-lg" style={{ background: "#fffbeb" }}>
                    <span className="text-4xl mb-1">🌾</span>
                    <span className="text-[10px] font-bold text-center px-2">తెలంగాణ తల్లి</span>
                  </div>
                ) : (
                  <img
                    src={BRANDING.telanganaThalli}
                    alt="తెలంగాణ తల్లి – Mother Telangana"
                    className="w-full h-full object-contain object-center flex-shrink-0 min-w-0 min-h-[180px]"
                    referrerPolicy="no-referrer"
                    loading="eager"
                    decoding="async"
                    style={{ imageRendering: "auto" }}
                    onError={(e) => {
                      const el = e.target as HTMLImageElement;
                      if (el.src.endsWith("/thalli.png") && BRANDING.telanganaThalliFallback) {
                        el.src = BRANDING.telanganaThalliFallback;
                      } else {
                        setThalliImgFailed(true);
                      }
                    }}
                  />
                )}
              </div>
              <p className="text-center py-1 text-[10px] font-black" style={{ color: amber }}>తెలంగాణ తల్లి</p>
            </div>
            {/* App explain: report village issues, resolve quicker + visual + schemes */}
            <div
              className="rounded-xl border-2 border-green-400/60 shadow-md p-3"
              style={{ background: "linear-gradient(145deg, #dcfce7, #bbf7d0)" }}
            >
              <p className="text-[9px] font-black uppercase tracking-wider mb-1.5 text-center" style={{ color: green }}>Report village issues · Resolve faster</p>
              <p className="text-[10px] text-slate-700 text-center mb-2 leading-snug">
                Report grievances from your village. Track status with Panchayat and departments for quicker resolution.
              </p>
              <div className="flex items-center justify-center gap-3 mb-3 py-2 px-2 rounded-lg bg-white/70">
                <svg viewBox="0 0 64 48" className="w-14 h-10 flex-shrink-0" aria-hidden>
                  <path d="M8 40 L8 24 L16 16 L24 24 L24 40 Z" fill="#166534" fillOpacity="0.3" stroke="#166534" strokeWidth="1.5" />
                  <path d="M32 40 L32 20 L44 12 L52 20 L52 40 Z" fill="#059669" fillOpacity="0.4" stroke="#059669" strokeWidth="1.5" />
                  <path d="M4 44 L60 44" stroke="#64748b" strokeWidth="1" strokeDasharray="2 2" />
                  <circle cx="28" cy="28" r="6" fill="none" stroke="#059669" strokeWidth="2" />
                  <path d="M26 28 L27.5 29.5 L31 26" fill="none" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-[9px] font-bold text-slate-600 text-left">Village → Report → Track → Resolved</span>
              </div>
              <p className="text-[9px] font-black uppercase tracking-wider mb-1.5 text-center" style={{ color: green }}>Agriculture & Schemes</p>
              <div className="flex flex-wrap justify-center gap-2">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full text-xl shadow-sm" style={{ background: "#fef3c7" }} title="Paddy">🌾</span>
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full text-xl shadow-sm" style={{ background: "#e0e7ff" }} title="Corn">🌽</span>
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full text-xl shadow-sm" style={{ background: "#dbeafe" }} title="Water">💧</span>
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full text-xl shadow-sm" style={{ background: "#fce7f3" }} title="Farm">🚜</span>
              </div>
              <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold text-white" style={{ background: emerald }}>Rythu Bandhu</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold text-white" style={{ background: "#2563eb" }}>Bhagiratha</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold text-white" style={{ background: amber }}>Palle Pragathi</span>
              </div>
            </div>
            {/* About Grama Seva – coloured bullets */}
            <div
              className="rounded-xl border-2 shadow-md p-3"
              style={{ background: "linear-gradient(145deg, #fdf2f8, #fce7f3)", borderColor: "rgba(219,39,119,0.4)" }}
            >
              <p className="text-[9px] font-black uppercase tracking-wider mb-2" style={{ color: maroon }}>About Grama Seva</p>
              <ul className="text-[10px] text-slate-700 space-y-1.5">
                <li className="flex items-start gap-2"><span className="rounded-full w-1.5 h-1.5 mt-1.5 flex-shrink-0" style={{ background: "#059669" }} /> Report grievances (water, roads, power, pensions)</li>
                <li className="flex items-start gap-2"><span className="rounded-full w-1.5 h-1.5 mt-1.5 flex-shrink-0" style={{ background: "#CCB252" }} /> Track issue status & Panchayat directory</li>
                <li className="flex items-start gap-2"><span className="rounded-full w-1.5 h-1.5 mt-1.5 flex-shrink-0" style={{ background: violet }} /> Krishi AI – soil & crop guidance</li>
                <li className="flex items-start gap-2"><span className="rounded-full w-1.5 h-1.5 mt-1.5 flex-shrink-0" style={{ background: pink }} /> Welfare schemes & Vikas Sahayak chat</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
