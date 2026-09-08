import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
  LogIn,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  Loader2,
  Building2,
  UserCog,
  ArrowLeft,
  ArrowRight,
  Crown,
  Siren,
  Smartphone,
} from "lucide-react";
import { BRANDING } from "@web/constants/branding";
import {
  getDistrictNames,
  getMandalNames,
  getVillageNames,
  sanitizeGeoSelection,
} from "@shared/data/telangana";
import { OFFICIAL_REGISTRATION_ROLES, type OfficialRegistrationRole } from "@shared/types";
import { isValidIndianMobile, personNameSchema, NAME_ERROR } from "@shared/validation";

const ROLE_META: Record<OfficialRegistrationRole, { label: string; hint: string }> = {
  sarpanch: { label: "Sarpanch (Panchayat)", hint: "Head of the Gram Panchayat" },
  ward_member: { label: "Ward Member", hint: "Ward representative" },
  mandal_official: { label: "Mandal Official", hint: "Government official at mandal level" },
  admin: { label: "State / District Admin", hint: "Administrative official with statewide oversight" },
};

interface OtpResponse {
  sent?: boolean;
  expiresInSec?: number;
  devOtp?: string;
  error?: { message?: string };
}

export default function Login() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Primary view modes:
  // "welcome": The hero terminal screen matching main branch 11-login.png
  // "citizen": Citizen mobile input & OTP verification
  // "official": Official portal (Sign In or New Registration)
  const isOfficialInitial = searchParams.get("official") === "1";
  const [viewMode, setViewMode] = useState<"welcome" | "citizen" | "official">(
    isOfficialInitial ? "official" : "welcome"
  );

  // Official sub-mode: 'signin' or 'register'
  const [officialSubMode, setOfficialSubMode] = useState<"signin" | "register">("signin");

  // Step within citizen or official flow: 'form' or 'otp'
  const [step, setStep] = useState<"form" | "otp">("form");
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fallback states for images if local assets encounter issues
  const [mapFallback, setMapFallback] = useState(false);
  const [thalliFallback, setThalliFallback] = useState(false);
  const [emblemFallback, setEmblemFallback] = useState(false);

  // Official Registration fields
  const [name, setName] = useState("");
  const [officialRole, setOfficialRole] = useState<OfficialRegistrationRole | "">("");
  const [district, setDistrict] = useState("");
  const [mandal, setMandal] = useState("");
  const [village, setVillage] = useState("");

  const otpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = "var(--tg-gradient-page, #FAF9F6)";
    return () => {
      document.body.style.background = prev;
    };
  }, []);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => otpInputRef.current?.focus(), 60);
    }
  }, [step]);

  const handleOpenCitizen = () => {
    setViewMode("citizen");
    setStep("form");
    setError(null);
    setSearchParams({});
  };

  const handleOpenOfficial = () => {
    setViewMode("official");
    setOfficialSubMode("signin");
    setStep("form");
    setError(null);
    setSearchParams({ official: "1" });
  };

  const handleBackToWelcome = () => {
    setViewMode("welcome");
    setStep("form");
    setError(null);
    setSearchParams({});
  };

  // 1. Request OTP for Citizen or Official Sign In / Registration
  const handleRequestOtp = async () => {
    setError(null);

    if (!isValidIndianMobile(phone)) {
      setError("Please enter a valid 10-digit Indian mobile number (digits only, starting with 6–9).");
      return;
    }

    if (viewMode === "official" && officialSubMode === "register") {
      if (!personNameSchema.safeParse(name).success) {
        setError(NAME_ERROR);
        return;
      }
      if (!officialRole) {
        setError("Please select your official role.");
        return;
      }
      if (!district || !mandal || !village) {
        setError("Please select your district, mandal, and village jurisdiction.");
        return;
      }
    }

    setBusy(true);
    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ phone }),
      });
      const data = (await res.json().catch(() => ({}))) as OtpResponse;

      if (!res.ok) {
        setError(data?.error?.message ?? "Failed to send verification code. Please try again.");
        return;
      }

      setDevOtp(data.devOtp ?? null);
      if (data.devOtp) setOtpCode(data.devOtp);
      setStep("otp");
      setResendIn(30);
    } catch {
      setError("Network or server error. Is the server running?");
    } finally {
      setBusy(false);
    }
  };

  // 2. Verify OTP & Complete Login / Registration
  const handleVerifyOtp = async () => {
    setError(null);
    setBusy(true);

    try {
      if (viewMode === "official" && officialSubMode === "register") {
        const res = await fetch("/api/auth/register/official", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            phone,
            code: otpCode,
            name,
            role: officialRole,
            district,
            mandal,
            village,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data?.error?.message ?? "Official registration failed.");
          return;
        }
        navigate("/", { replace: true });
        return;
      }

      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ phone, code: otpCode }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error?.message ?? "Invalid or expired verification code.");
        return;
      }

      // If citizen logging in for first time or missing profile details, ask them to fill up details
      const loggedUser = data.user;
      if (
        loggedUser?.role === "citizen" &&
        (loggedUser.needsRegistration || !loggedUser.village || !loggedUser.name || loggedUser.name === "New User")
      ) {
        navigate("/registration", { replace: true });
        return;
      }

      navigate("/", { replace: true });
    } catch {
      setError("Network or server error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleSignInWithGoogle = async () => {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/google/redirect-url", { credentials: "same-origin" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? `Google Sign-in failed (${res.status}).`);
        return;
      }
      if (data?.redirectUrl && typeof data.redirectUrl === "string" && data.redirectUrl.startsWith("http")) {
        window.location.href = data.redirectUrl;
        return;
      }
      setError("Backend returned no redirect URL. Check Google OAuth configuration.");
    } catch {
      setError("Unable to connect to Google OAuth service.");
    } finally {
      setBusy(false);
    }
  };

  const maroon = "var(--tg-maroon, #67001A)";
  const gold = "var(--tg-gold, #CCB252)";
  const green = "var(--tg-green, #008A3B)";
  const emerald = "#059669";
  const emblemGreen = "#008A3B";
  const amber = "#b45309";
  const gradientHeader = "var(--tg-gradient-header, #67001A)";

  const inputCls =
    "w-full p-3.5 rounded-2xl border-2 border-slate-200 focus:border-[#67001A] bg-white outline-none text-sm font-medium transition-colors disabled:opacity-60";

  return (
    <div
      data-page="login"
      className="min-h-screen w-full flex flex-col relative"
      style={{
        background: "linear-gradient(180deg, #FAF9F6 0%, #F5F4EE 100%)",
        minHeight: "100vh",
      }}
    >
      {/* Top Header – Bright Telangana Maroon/Green with Gold accents */}
      <div
        className="relative text-white py-3 md:py-4 shadow-lg flex-shrink-0 z-20"
        style={{
          background: gradientHeader,
          borderBottom: `3px solid ${gold}`,
          boxShadow: "0 4px 14px rgba(0, 138, 59, 0.25)",
        }}
      >
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
          <div className="flex-1 flex items-center justify-center gap-2.5 md:gap-3">
            <span
              className="flex-shrink-0 px-2 py-0.5 rounded-md font-black text-xs md:text-sm tracking-tighter uppercase"
              style={{
                fontFamily: "Instrument Serif, Georgia, serif",
                color: "#fef08a",
                textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                background: "rgba(0,0,0,0.2)",
              }}
            >
              TG
            </span>
            <p className="text-xs md:text-base font-bold text-center drop-shadow-sm truncate">
              జై తెలంగాణ | Telangana State | Citizen Service Terminal
            </p>
            <Sparkles className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" style={{ color: "#fef08a" }} />
          </div>

          <Link
            to="/emergency"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/10 hover:bg-white/20 text-amber-200 border border-amber-300/40 transition-colors"
            title="Emergency & 24x7 Helplines"
          >
            <Siren size={13} className="text-amber-300" />
            <span>Emergency 24x7</span>
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        className="flex-1 flex items-center justify-center relative p-4 md:p-8 overflow-y-auto min-h-0 pb-12"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, rgba(254, 249, 195, 0.2) 50%, transparent 100%)",
        }}
      >
        <div className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row items-stretch lg:items-start justify-center gap-6 lg:gap-8 py-2">
          
          {/* RIGHT COLUMN: Terminal Hero Card (order-1 on mobile so it is immediately visible) */}
          <div
            className="w-full max-w-xl p-6 sm:p-10 md:p-12 relative z-10 shadow-2xl flex-shrink-0 order-1 lg:order-2 mx-auto"
            style={{
              borderRadius: "2.5rem",
              border: "3px solid transparent",
              backgroundImage: `linear-gradient(135deg, #ecfdf5 0%, #d1fae5 20%, #fef9c3 40%, #fef3c7 60%, #fce7f3 80%, #fdf2f8 100%), linear-gradient(135deg, ${emerald}, ${emblemGreen}, ${gold}, ${maroon})`,
              backgroundOrigin: "padding-box, border-box",
              backgroundClip: "padding-box, border-box",
              backgroundColor: "#ecfdf5",
              boxShadow: "0 25px 50px -12px rgba(0, 138, 59, 0.2), 0 0 0 2px rgba(204, 178, 82, 0.4)",
            }}
          >
            {/* Top Emblem and Title */}
            <div className={`text-center ${viewMode === "welcome" ? "mb-8 md:mb-10" : "mb-6"}`}>
              <div
                className={`mx-auto relative rounded-2xl flex items-center justify-center overflow-hidden ring-4 ring-[#CCB252] ring-offset-2 ring-offset-emerald-50 shadow-lg ${
                  viewMode === "welcome" ? "w-28 h-28 md:w-36 md:h-36 mb-4 md:mb-5" : "w-20 h-20 md:w-24 md:h-24 mb-3"
                }`}
                style={{
                  background: "linear-gradient(145deg, #ecfdf5 0%, #d1fae5 30%, #fef9c3 70%, #fef3c7 100%)",
                  boxShadow: "0 8px 24px rgba(5,150,105,0.25), inset 0 1px 0 rgba(255,255,255,0.8)",
                }}
              >
                {emblemFallback ? (
                  <svg
                    viewBox="0 0 100 100"
                    className="relative w-full h-full p-2 z-10"
                    preserveAspectRatio="xMidYMid meet"
                    aria-label="Government of Telangana – State Emblem"
                  >
                    <circle cx="50" cy="50" r="47" fill="none" stroke="#b8860b" strokeWidth="8" />
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#CCB252" strokeWidth="2" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#00843D" strokeWidth="4" />
                    <circle cx="50" cy="50" r="36" fill="none" stroke="#00B341" strokeWidth="2" />
                    <circle cx="50" cy="50" r="34" fill="#ffffff" stroke="#166534" strokeWidth="1.5" />
                    <ellipse cx="50" cy="32" rx="8" ry="6" fill="none" stroke="#b8860b" strokeWidth="2" />
                    <path d="M42 38 L50 34 L58 38 L50 42 Z" fill="none" stroke="#CCB252" strokeWidth="1.5" />
                    <path d="M35 42 Q50 36 65 42 L62 52 Q50 48 38 52 Z" fill="none" stroke="#00843D" strokeWidth="2" />
                    <path d="M44 54 L50 50 L56 54 L56 62 L50 66 L44 62 Z" fill="none" stroke="#00B341" strokeWidth="1.5" />
                    <text x="50" y="78" textAnchor="middle" fill="#166534" fontWeight="bold" fontSize="8" fontFamily="sans-serif">TG</text>
                  </svg>
                ) : (
                  <img
                    src={BRANDING.logoEmblem}
                    alt="Government of Telangana – State Emblem"
                    className="relative w-full h-full object-contain p-2 z-10 drop-shadow-sm"
                    referrerPolicy="no-referrer"
                    onError={() => setEmblemFallback(true)}
                  />
                )}
              </div>

              <h1
                className={`font-black tracking-tight uppercase mb-1 ${
                  viewMode === "welcome" ? "text-3xl md:text-4xl" : "text-2xl md:text-3xl"
                }`}
                style={{ color: maroon, fontFamily: "Instrument Serif, Georgia, serif" }}
              >
                GRAMA SEVA
              </h1>
              <p
                className={`font-bold uppercase tracking-[0.35em] ${
                  viewMode === "welcome" ? "text-[10px] md:text-[11px]" : "text-[9px] md:text-[10px]"
                }`}
                style={{ color: gold }}
              >
                GOVERNMENT OF TELANGANA
              </p>
            </div>

            {/* VIEW 1: WELCOME SCREEN (Matching Presentation Screenshot 11-login.png) */}
            {viewMode === "welcome" && (
              <div className="space-y-6 md:space-y-7 text-center animate-in">
                <div>
                  <h2
                    className="text-xl md:text-2xl font-black uppercase tracking-tight"
                    style={{ color: green, fontFamily: "Instrument Serif, Georgia, serif" }}
                  >
                    CITIZEN SERVICE TERMINAL
                  </h2>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-wider" style={{ color: gold }}>
                    జై తెలంగాణ
                  </p>
                </div>

                <p className="text-xs md:text-sm font-medium text-slate-600 max-w-md mx-auto leading-relaxed">
                  Official integrated portal for local governance, grievances, and state welfare monitoring.
                </p>

                <div className="space-y-3.5 pt-2">
                  <button
                    type="button"
                    onClick={handleOpenOfficial}
                    className="w-full py-4 md:py-4.5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-md transition-all flex items-center justify-center gap-2 border-2 hover:bg-amber-100/60 active:scale-[0.99]"
                    style={{
                      borderColor: gold,
                      color: maroon,
                      background: "rgba(254, 240, 138, 0.4)",
                    }}
                  >
                    <LogIn size={18} /> OFFICIALS LOGIN
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenCitizen}
                    className="w-full py-4.5 md:py-5 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 hover:opacity-95 active:scale-[0.99]"
                    style={{
                      background: `linear-gradient(90deg, ${emerald}, ${emblemGreen}, ${gold})`,
                      boxShadow: "0 8px 24px rgba(0, 138, 59, 0.35)",
                    }}
                  >
                    CITIZEN LOGIN <ArrowRight size={18} />
                  </button>
                </div>

                {/* Mobile direct emergency access */}
                <div className="pt-2 sm:hidden text-center">
                  <Link
                    to="/emergency"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-800 hover:text-rose-950"
                  >
                    <Siren size={14} className="text-rose-600" />
                    <span>Emergency Direct Calling (24x7)</span>
                  </Link>
                </div>
              </div>
            )}

            {/* VIEW 2: CITIZEN ACCESS / OTP FLOW */}
            {viewMode === "citizen" && (
              <div className="space-y-4 animate-in">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60">
                  <button
                    type="button"
                    onClick={handleBackToWelcome}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    <ArrowLeft size={16} /> Back to Terminal
                  </button>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-300 flex items-center gap-1">
                    <Smartphone size={12} />
                    Citizen Access
                  </span>
                </div>

                {step === "form" ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleRequestOtp();
                    }}
                    className="space-y-4 pt-1"
                  >
                    <div className="text-center">
                      <h2 className="text-base md:text-lg font-black text-slate-800 uppercase tracking-tight">
                        Access Control
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">Authentication via registered 10-digit mobile number</p>
                    </div>

                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm md:text-base font-black text-slate-400">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        autoFocus
                        inputMode="tel"
                        className="w-full pl-14 pr-4 py-3.5 md:py-4 bg-white border-2 border-slate-200 focus:border-[#67001A] rounded-2xl text-xl md:text-2xl font-black text-center outline-none transition-all shadow-sm"
                        placeholder="91XXXXXXXX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                        disabled={busy}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={busy || phone.trim().length < 10}
                      className="w-full py-4 text-white rounded-2xl md:rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50 transition-all"
                      style={{ backgroundColor: maroon }}
                    >
                      {busy ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
                      Request OTP Code
                    </button>

                    <div className="relative my-3 text-center">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200/80" />
                      </div>
                      <span className="relative bg-[#ecfdf5] px-3 text-[10px] text-slate-400 font-bold uppercase">or</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleSignInWithGoogle}
                      disabled={busy}
                      className="w-full py-3 px-6 rounded-2xl font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center justify-center gap-2 border-2 transition-all hover:bg-amber-50 shadow-sm"
                      style={{ borderColor: gold, background: "linear-gradient(135deg, #fef9c3, #fef3c7)" }}
                    >
                      <LogIn className="w-4 h-4" style={{ color: maroon }} />
                      Sign in with Google
                    </button>
                  </form>
                ) : (
                  /* OTP Entry */
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (otpCode.length === 6) handleVerifyOtp();
                    }}
                    className="space-y-4 pt-1 text-center"
                  >
                    <div className="flex items-center justify-start">
                      <button
                        type="button"
                        onClick={() => setStep("form")}
                        className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                      >
                        <ArrowLeft size={14} /> Change Number
                      </button>
                    </div>

                    <div>
                      <h2 className="text-base md:text-lg font-black text-slate-800 uppercase tracking-tight">
                        Identity Token
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Security code dispatched to <b>+91 {phone}</b>
                      </p>
                    </div>

                    {devOtp && (
                      <div className="bg-sky-50 border-2 border-sky-200 rounded-2xl p-3 text-center">
                        <p className="text-[10px] font-black uppercase text-sky-800">Development OTP</p>
                        <p className="text-2xl font-black text-sky-900 tracking-[0.3em] my-0.5">{devOtp}</p>
                        <p className="text-[10px] text-sky-600">Auto-filled for testing</p>
                      </div>
                    )}

                    <input
                      ref={otpInputRef}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      className="w-full p-4 md:p-5 bg-white border-2 border-slate-200 rounded-2xl md:rounded-3xl text-center text-3xl md:text-4xl font-black outline-none tracking-[0.4em] shadow-sm focus:border-[#67001A]"
                      style={{ color: maroon }}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="000000"
                      disabled={busy}
                    />

                    <button
                      type="submit"
                      disabled={busy || otpCode.length !== 6}
                      className="w-full py-4 text-white rounded-2xl md:rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50 transition-all"
                      style={{ backgroundColor: maroon }}
                    >
                      {busy ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
                      Verify & Enter
                    </button>

                    <p className="text-center text-xs text-slate-500 pt-1">
                      Didn&apos;t receive it?{" "}
                      {resendIn > 0 ? (
                        <span className="text-slate-400">Resend in {resendIn}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleRequestOtp}
                          disabled={busy}
                          className="font-bold underline"
                          style={{ color: maroon }}
                        >
                          Resend Code
                        </button>
                      )}
                    </p>
                  </form>
                )}
              </div>
            )}

            {/* VIEW 3: OFFICIALS PORTAL (Sign In & New Registration) */}
            {viewMode === "official" && (
              <div className="space-y-4 animate-in">
                <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                  <button
                    type="button"
                    onClick={handleBackToWelcome}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    <ArrowLeft size={16} /> Back to Terminal
                  </button>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-100/90 px-2.5 py-1 rounded-full border border-amber-300 flex items-center gap-1">
                    <Crown size={12} className="text-[#CCB252]" />
                    Officials Portal
                  </span>
                </div>

                {/* Sub-mode Toggle: Sign In vs New Registration */}
                <div className="p-1 rounded-2xl bg-white/70 border border-amber-200/80 flex items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setOfficialSubMode("signin");
                      setStep("form");
                      setError(null);
                    }}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                      officialSubMode === "signin"
                        ? "bg-[#67001A] text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Official Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOfficialSubMode("register");
                      setStep("form");
                      setError(null);
                    }}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                      officialSubMode === "register"
                        ? "bg-[#67001A] text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    New Registration
                  </button>
                </div>

                {/* OFFICIAL SIGN IN */}
                {officialSubMode === "signin" && (
                  <div>
                    {step === "form" ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleRequestOtp();
                        }}
                        className="space-y-4"
                      >
                        <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900">
                          <strong>Panchayat & Administrative Officers:</strong> Enter your registered mobile number to access the Official Governance Console.
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                            Registered Mobile Number
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
                              +91
                            </span>
                            <input
                              type="tel"
                              maxLength={10}
                              autoFocus
                              inputMode="tel"
                              className="w-full pl-14 pr-4 py-3.5 bg-white border-2 border-slate-200 focus:border-[#67001A] rounded-2xl text-xl font-black text-center outline-none transition-all shadow-sm"
                              placeholder="91XXXXXXXX"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                              disabled={busy}
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={busy || phone.trim().length < 10}
                          className="w-full py-4 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50 transition-all"
                          style={{ backgroundColor: maroon }}
                        >
                          {busy ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
                          Send Official Login OTP
                        </button>
                      </form>
                    ) : (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (otpCode.length === 6) handleVerifyOtp();
                        }}
                        className="space-y-4 text-center"
                      >
                        <div className="flex items-center justify-start">
                          <button
                            type="button"
                            onClick={() => setStep("form")}
                            className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                          >
                            <ArrowLeft size={14} /> Back
                          </button>
                        </div>

                        {devOtp && (
                          <div className="bg-sky-50 border-2 border-sky-200 rounded-2xl p-3 text-center">
                            <p className="text-[10px] font-black uppercase text-sky-800">Development OTP</p>
                            <p className="text-2xl font-black text-sky-900 tracking-[0.3em] my-0.5">{devOtp}</p>
                          </div>
                        )}

                        <input
                          ref={otpInputRef}
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl text-center text-3xl font-black outline-none tracking-[0.4em] shadow-sm focus:border-[#67001A]"
                          style={{ color: maroon }}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                          placeholder="000000"
                          disabled={busy}
                        />

                        <button
                          type="submit"
                          disabled={busy || otpCode.length !== 6}
                          className="w-full py-4 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50 transition-all"
                          style={{ backgroundColor: maroon }}
                        >
                          {busy ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
                          Verify & Access Official Console
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {/* NEW OFFICIAL REGISTRATION */}
                {officialSubMode === "register" && (
                  <div>
                    {step === "form" ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleRequestOtp();
                        }}
                        className="space-y-3"
                      >
                        <div className="p-3 rounded-xl bg-purple-50/80 border border-purple-200 text-xs text-purple-950">
                          <strong>Official Registration:</strong> Verified with OTP and approved by Super Admin before elevated privileges are granted.
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                            Select Designation
                          </label>
                          <div className="grid grid-cols-1 gap-1.5">
                            {OFFICIAL_REGISTRATION_ROLES.map((r) => (
                              <button
                                key={r}
                                type="button"
                                onClick={() => setOfficialRole(r)}
                                className={`flex items-center gap-2.5 p-2.5 rounded-xl border-2 text-left transition-all ${
                                  officialRole === r
                                    ? "border-[#67001A] bg-[#67001A]/5 shadow-sm"
                                    : "border-slate-200 hover:border-slate-300 bg-white"
                                }`}
                              >
                                {r === "admin" ? (
                                  <Building2 className="text-[#67001A]" size={16} />
                                ) : (
                                  <UserCog className="text-[#67001A]" size={16} />
                                )}
                                <div>
                                  <span className="block text-xs font-bold text-slate-900">{ROLE_META[r].label}</span>
                                  <span className="block text-[10px] text-slate-500">{ROLE_META[r].hint}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        <input
                          className={inputCls}
                          placeholder="Official Full Legal Name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />

                        <input
                          className={inputCls}
                          type="tel"
                          placeholder="Mobile Number (10 digits)"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                          required
                        />

                        {/* 3-Tier Geography Selector */}
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                            Jurisdiction Assignment
                          </label>
                          <select
                            className={inputCls}
                            value={district}
                            onChange={(e) => {
                              const next = sanitizeGeoSelection(e.target.value, "", "");
                              setDistrict(next.district);
                              setMandal(next.mandal);
                              setVillage(next.village);
                            }}
                            required
                          >
                            <option value="">-- Select Official District --</option>
                            {getDistrictNames().map((d) => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>

                          {district && (
                            <select
                              className={inputCls}
                              value={mandal}
                              onChange={(e) => {
                                const next = sanitizeGeoSelection(district, e.target.value, "");
                                setMandal(next.mandal);
                                setVillage(next.village);
                              }}
                              required
                            >
                              <option value="">-- Select Mandal --</option>
                              {getMandalNames(district).map((m) => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>
                          )}

                          {mandal && (
                            <select
                              className={inputCls}
                              value={village}
                              onChange={(e) => setVillage(e.target.value)}
                              required
                            >
                              <option value="">-- Select Village --</option>
                              {getVillageNames(district, mandal).map((v) => (
                                <option key={v} value={v}>{v}</option>
                              ))}
                            </select>
                          )}
                        </div>

                        <button
                          type="submit"
                          disabled={busy || !name || !officialRole || !phone || !village}
                          className="w-full text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50 transition-all"
                          style={{ backgroundColor: maroon }}
                        >
                          {busy ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
                          Verify & Submit Registration
                        </button>
                      </form>
                    ) : (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (otpCode.length === 6) handleVerifyOtp();
                        }}
                        className="space-y-4 text-center"
                      >
                        <div className="flex items-center justify-start">
                          <button
                            type="button"
                            onClick={() => setStep("form")}
                            className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                          >
                            <ArrowLeft size={14} /> Back to details
                          </button>
                        </div>

                        <div className="text-center">
                          <p className="text-sm font-bold text-slate-800">Verify Official Mobile Number</p>
                          <p className="text-xs text-slate-500 mt-0.5">Enter the 6-digit code sent to {phone}</p>
                        </div>

                        {devOtp && (
                          <div className="bg-sky-50 border-2 border-sky-200 rounded-2xl p-3 text-center">
                            <p className="text-[10px] font-black uppercase text-sky-800">Development OTP</p>
                            <p className="text-2xl font-black text-sky-900 tracking-[0.3em] my-0.5">{devOtp}</p>
                          </div>
                        )}

                        <input
                          ref={otpInputRef}
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl text-center text-3xl font-black outline-none tracking-[0.4em] shadow-sm focus:border-[#67001A]"
                          style={{ color: maroon }}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                          placeholder="000000"
                          disabled={busy}
                        />

                        <button
                          type="submit"
                          disabled={busy || otpCode.length !== 6}
                          className="w-full py-4 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50 transition-all"
                          style={{ backgroundColor: maroon }}
                        >
                          {busy ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
                          Confirm & Submit Official Registration
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Error Message Box */}
            {error && (
              <div className="mt-4 bg-amber-50 border-2 border-amber-200 rounded-2xl p-3.5 flex items-start gap-2.5 animate-in">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-amber-900 text-xs font-semibold">{error}</p>
              </div>
            )}
          </div>

          {/* LEFT COLUMN: 4 Colorful Telangana Info Cards (order-2 on mobile, order-1 on desktop) */}
          <div className="flex flex-col gap-4 w-full lg:w-72 xl:w-80 flex-shrink-0 order-2 lg:order-1">
            
            {/* Card 1: Telangana Map – 33 Districts */}
            <div
              className="rounded-2xl border-2 border-emerald-400/80 shadow-lg overflow-hidden w-full flex flex-col"
              style={{ background: "linear-gradient(180deg, #d1fae5 0%, #a7f3d0 50%, #6ee7b7 100%)" }}
            >
              <div className="w-full flex-1 min-h-[140px] aspect-[4/3] rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center m-1.5 mb-0">
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
              <p
                className="text-center py-2 text-[11px] font-black flex-shrink-0"
                style={{ color: "#047857", background: "rgba(255,255,255,0.6)" }}
              >
                తెలంగాణ మ్యాప్ | 33 Districts
              </p>
            </div>

            {/* Card 2: Telangana Thalli */}
            <div
              className="rounded-2xl border-2 border-amber-400/80 shadow-lg p-2.5 flex flex-col"
              style={{ background: "linear-gradient(145deg, #fef3c7, #fde68a, #fcd34d)" }}
            >
              <div
                className="w-full min-h-[220px] max-h-[300px] aspect-[3/4] rounded-xl flex items-center justify-center overflow-hidden p-1"
                style={{
                  background: "linear-gradient(180deg, #fef9c3 0%, #fef3c7 50%, #fde68a 100%)",
                  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.06)",
                }}
              >
                {thalliFallback ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-amber-700 rounded-lg" style={{ background: "#fffbeb" }}>
                    <span className="text-4xl mb-1">🌾</span>
                    <span className="text-[10px] font-bold text-center px-2">తెలంగాణ తల్లి</span>
                  </div>
                ) : (
                  <img
                    src={BRANDING.telanganaThalli}
                    alt="తెలంగాణ తల్లి – Mother Telangana"
                    className="w-full h-full object-contain object-center flex-shrink-0 min-w-0 min-h-[200px]"
                    referrerPolicy="no-referrer"
                    loading="eager"
                    onError={(e) => {
                      const el = e.target as HTMLImageElement;
                      if (el.src.endsWith("/thalli.png") && BRANDING.telanganaThalliFallback) {
                        el.src = BRANDING.telanganaThalliFallback;
                      } else {
                        setThalliFallback(true);
                      }
                    }}
                  />
                )}
              </div>
              <p className="text-center pt-2 pb-0.5 text-[11px] font-black" style={{ color: amber }}>
                తెలంగాణ తల్లి
              </p>
            </div>

            {/* Card 3: Report Village Issues · Resolve Faster + Agriculture & Schemes */}
            <div
              className="rounded-2xl border-2 border-green-400/60 shadow-md p-3.5"
              style={{ background: "linear-gradient(145deg, #dcfce7, #bbf7d0)" }}
            >
              <p className="text-[10px] font-black uppercase tracking-wider mb-1 text-center" style={{ color: green }}>
                REPORT VILLAGE ISSUES · RESOLVE FASTER
              </p>
              <p className="text-[10px] text-slate-700 text-center mb-2 leading-snug">
                Report grievances from your village. Track status with Panchayat and departments for quicker resolution.
              </p>
              <div className="flex items-center justify-center gap-2.5 mb-3 py-2 px-2 rounded-xl bg-white/80 shadow-sm">
                <svg viewBox="0 0 64 48" className="w-12 h-8 flex-shrink-0" aria-hidden>
                  <path d="M8 40 L8 24 L16 16 L24 24 L24 40 Z" fill="#166534" fillOpacity="0.3" stroke="#166534" strokeWidth="1.5" />
                  <path d="M32 40 L32 20 L44 12 L52 20 L52 40 Z" fill="#059669" fillOpacity="0.4" stroke="#059669" strokeWidth="1.5" />
                  <path d="M4 44 L60 44" stroke="#64748b" strokeWidth="1" strokeDasharray="2 2" />
                  <circle cx="28" cy="28" r="6" fill="none" stroke="#059669" strokeWidth="2" />
                  <path d="M26 28 L27.5 29.5 L31 26" fill="none" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-[10px] font-bold text-slate-700">Village → Report → Track → Resolved</span>
              </div>

              <p className="text-[9px] font-black uppercase tracking-wider mb-1.5 text-center" style={{ color: green }}>
                AGRICULTURE & SCHEMES
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-base shadow-sm" style={{ background: "#fef3c7" }} title="Paddy">🌾</span>
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-base shadow-sm" style={{ background: "#e0e7ff" }} title="Corn">🌽</span>
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-base shadow-sm" style={{ background: "#dbeafe" }} title="Water">💧</span>
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-base shadow-sm" style={{ background: "#fce7f3" }} title="Farm">🚜</span>
              </div>
              <div className="flex flex-wrap justify-center gap-1.5 mt-2.5">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold text-white shadow-sm" style={{ background: emerald }}>Rythu Bandhu</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold text-white shadow-sm" style={{ background: "#2563eb" }}>Bhagiratha</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold text-slate-800 shadow-sm" style={{ background: "#86efac" }}>Palle Pragathi</span>
              </div>
            </div>

            {/* Card 4: About Grama Seva */}
            <div
              className="rounded-2xl border-2 shadow-md p-3.5"
              style={{ background: "linear-gradient(145deg, #fdf2f8, #fce7f3)", borderColor: "rgba(219,39,119,0.3)" }}
            >
              <p className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: maroon }}>
                ABOUT GRAMA SEVA
              </p>
              <ul className="text-[10px] text-slate-700 space-y-1.5 font-medium">
                <li className="flex items-start gap-2">
                  <span className="rounded-full w-1.5 h-1.5 mt-1.5 flex-shrink-0" style={{ background: "#059669" }} />
                  <span>Report grievances (water, roads, power, pensions)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="rounded-full w-1.5 h-1.5 mt-1.5 flex-shrink-0" style={{ background: "#CCB252" }} />
                  <span>Track issue status & Panchayat directory</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="rounded-full w-1.5 h-1.5 mt-1.5 flex-shrink-0" style={{ background: "#9333ea" }} />
                  <span>Krishi AI – soil & crop guidance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="rounded-full w-1.5 h-1.5 mt-1.5 flex-shrink-0" style={{ background: "#e11d48" }} />
                  <span>Welfare schemes & Vikas Sahayak chat</span>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
