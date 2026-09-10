import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  LogIn,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  Loader2,
  Building2,
  UserCog,
  ArrowLeft,
  Crown,
  Smartphone,
  Check,
  Users,
  TrendingUp,
  Bookmark,
} from "lucide-react";
import { BRANDING } from "@web/constants/branding";
import PublicNavHeader from "@web/components/layout/PublicNavHeader";
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

  const isOfficialInitial = searchParams.get("official") === "1";
  const [viewMode, setViewMode] = useState<"citizen" | "official">(
    isOfficialInitial ? "official" : "citizen"
  );
  // Whether citizen is viewing the hero overview or the mobile number / OTP form
  const [isPhoneExpanded, setIsPhoneExpanded] = useState(false);

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

  // Fallbacks
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
    document.body.style.background = "#FAF9F6";
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
    setIsPhoneExpanded(false);
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
      {/* Top Header Ribbon & Centered Navigation Pills */}
      <PublicNavHeader
        ribbonTitle="తెలంగాణ రాష్ట్రం | Telangana State | Digital Village Development"
        activePill="login"
      />

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row items-stretch lg:items-start justify-center gap-6 lg:gap-8 py-2">
          
          {/* LEFT COLUMN: 2 Cards (Telangana State Emblem + Schemes) */}
          <div className="w-full lg:w-[380px] xl:w-[420px] flex flex-col gap-6 flex-shrink-0 order-2 lg:order-1">
            
            {/* Left Card 1: Telangana State Emblem Card */}
            <div
              className="rounded-[2.5rem] bg-white p-8 text-center shadow-md relative"
              style={{
                border: "2px solid transparent",
                backgroundImage:
                  "linear-gradient(white, white), linear-gradient(135deg, #059669 0%, #CCB252 50%, #EA580C 100%)",
                backgroundOrigin: "border-box",
                backgroundClip: "padding-box, border-box",
              }}
            >
              <div className="w-28 h-28 sm:w-32 sm:h-32 mx-auto rounded-3xl border-2 border-[#CCB252] flex items-center justify-center bg-white p-3 shadow-xs">
                {!emblemFallback ? (
                  <img
                    src={BRANDING.logoEmblem}
                    alt="Telangana State Emblem"
                    className="w-full h-full object-contain"
                    onError={() => setEmblemFallback(true)}
                  />
                ) : (
                  <div className="w-full h-full rounded-2xl bg-[#008A3B] text-white flex items-center justify-center font-bold text-xl">
                    TG
                  </div>
                )}
              </div>

              <h2
                className="text-2xl sm:text-3xl font-black text-[#67001A] mt-5"
                style={{ fontFamily: "Instrument Serif, Georgia, serif" }}
              >
                తెలంగాణ రాష్ట్రం
              </h2>
              <p className="text-xl font-bold text-slate-900 mt-1">
                Telangana State
              </p>
              <p className="text-sm font-semibold text-slate-500 mt-2 flex items-center justify-center gap-2">
                <span>33 Districts</span>
                <span className="text-slate-300">•</span>
                <span>589 Mandals</span>
              </p>
            </div>

            {/* Left Card 2: Telangana Government Schemes Card */}
            <div
              className="rounded-[2.5rem] p-7 shadow-xl text-white"
              style={{
                background: "linear-gradient(180deg, #67001A 0%, #520015 100%)",
                boxShadow: "0 20px 30px -10px rgba(103, 0, 26, 0.35)",
              }}
            >
              <div className="flex items-center gap-2.5 mb-5">
                <Bookmark className="w-5 h-5 text-[#CCB252] fill-[#CCB252]" />
                <h3 className="text-lg sm:text-xl font-bold tracking-wide text-white">
                  Telangana Government Schemes
                </h3>
              </div>

              <div className="space-y-3.5">
                {/* Scheme 1: Maha Lakshmi (Orange) */}
                <div className="rounded-2xl p-4 bg-[#D97706] border border-amber-300/40 shadow-xs">
                  <p className="font-bold text-white text-base">Maha Lakshmi</p>
                  <p className="text-xs sm:text-sm text-amber-50 mt-1 leading-snug font-normal">
                    ₹2,500 assistance, ₹500 LPG cylinders &amp; free TSRTC bus travel for eligible women.
                  </p>
                </div>

                {/* Scheme 2: Cheyutha (Blue) */}
                <div className="rounded-2xl p-4 bg-[#0284C7] border border-sky-300/40 shadow-xs">
                  <p className="font-bold text-white text-base">Cheyutha / Rajiv Aarogyasri</p>
                  <p className="text-xs sm:text-sm text-sky-50 mt-1 leading-snug font-normal">
                    Health coverage up to ₹10 lakh for eligible families.
                  </p>
                </div>

                {/* Scheme 3: Aasara Pensions (Green) */}
                <div className="rounded-2xl p-4 bg-[#059669] border border-emerald-300/40 shadow-xs">
                  <p className="font-bold text-white text-base">Aasara Pensions</p>
                  <p className="text-xs sm:text-sm text-emerald-50 mt-1 leading-snug font-normal">
                    Social-security pensions for elderly, widows, PwD &amp; other vulnerable groups.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Main Grama Seva Card */}
          <div
            className="w-full lg:w-[480px] xl:w-[520px] rounded-[2.5rem] bg-white p-7 sm:p-10 shadow-xl relative order-1 lg:order-2"
            style={{
              border: "3px solid transparent",
              backgroundImage:
                "linear-gradient(white, white), linear-gradient(135deg, #10B981 0%, #CCB252 35%, #EC4899 70%, #8B5CF6 100%)",
              backgroundOrigin: "border-box",
              backgroundClip: "padding-box, border-box",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.08)",
            }}
          >
            {/* Top Emblem Box */}
            <div className="text-center">
              <div className="w-20 h-20 mx-auto rounded-2xl border-2 border-[#CCB252] flex items-center justify-center bg-white p-2.5 shadow-xs mb-4">
                {!emblemFallback ? (
                  <img
                    src={BRANDING.logoEmblem}
                    alt="Telangana Emblem"
                    className="w-full h-full object-contain"
                    onError={() => setEmblemFallback(true)}
                  />
                ) : (
                  <div className="w-full h-full rounded-xl bg-[#008A3B] text-white flex items-center justify-center font-bold text-lg">
                    TG
                  </div>
                )}
              </div>

              {/* Burgundy Capsule Outline with Cursive Grama Seva */}
              <div className="border-2 border-[#67001A] px-7 py-1.5 rounded-2xl inline-block">
                <span
                  className="font-black italic text-3xl sm:text-4xl text-[#67001A]"
                  style={{ fontFamily: "Instrument Serif, Georgia, serif" }}
                >
                  Grama Seva
                </span>
              </div>

              {/* Sub-labels */}
              <h2 className="text-base sm:text-lg font-bold text-[#67001A] mt-2.5">
                గ్రామ సేవ | Village Service
              </h2>
              <p className="text-sm font-semibold text-slate-800">
                Digital Governance Portal
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Telangana State Government Initiative
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mt-4 bg-amber-50 border border-amber-300 rounded-2xl p-3.5 flex items-start gap-2.5 text-left animate-in">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-amber-900 text-xs font-semibold">{error}</p>
              </div>
            )}

            {/* MODE 1: OFFICIALS PORTAL (when ?official=1 is selected) */}
            {viewMode === "official" ? (
              <div className="mt-6 space-y-4 animate-in">
                <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                  <button
                    type="button"
                    onClick={handleOpenCitizen}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    <ArrowLeft size={16} /> Back to Citizen Login
                  </button>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300 flex items-center gap-1">
                    <Crown size={12} className="text-[#CCB252]" />
                    Officials Portal
                  </span>
                </div>

                {/* Sub-mode Toggle: Sign In vs New Registration */}
                <div className="p-1 rounded-2xl bg-slate-100 border border-slate-200 flex items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setOfficialSubMode("signin");
                      setStep("form");
                      setError(null);
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
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
                    className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                      officialSubMode === "register"
                        ? "bg-[#67001A] text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    New Registration
                  </button>
                </div>

                {/* Official Sign In */}
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
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                          <strong>Panchayat &amp; Administrative Officers:</strong> Enter your registered mobile number to access the Official Governance Console.
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
                              className="w-full pl-14 pr-4 py-3.5 bg-white border-2 border-slate-200 focus:border-[#67001A] rounded-2xl text-xl font-black text-center outline-none transition-all shadow-xs"
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
                          className="w-full py-4 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-md flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50 transition-all bg-[#67001A]"
                        >
                          {busy ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
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
                          className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl text-center text-3xl font-black outline-none tracking-[0.4em] shadow-xs focus:border-[#67001A] text-[#67001A]"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                          placeholder="000000"
                          disabled={busy}
                        />

                        <button
                          type="submit"
                          disabled={busy || otpCode.length !== 6}
                          className="w-full py-4 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-md flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50 transition-all bg-[#67001A]"
                        >
                          {busy ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
                          Verify &amp; Access Official Console
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {/* Official Registration */}
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
                        <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-950">
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
                                    ? "border-[#67001A] bg-[#67001A]/5 shadow-xs"
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

                        {/* Jurisdiction Selector */}
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
                          className="w-full text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50 transition-all bg-[#67001A]"
                        >
                          {busy ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
                          Verify &amp; Submit Registration
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
                          className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl text-center text-3xl font-black outline-none tracking-[0.4em] shadow-xs focus:border-[#67001A] text-[#67001A]"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                          placeholder="000000"
                          disabled={busy}
                        />

                        <button
                          type="submit"
                          disabled={busy || otpCode.length !== 6}
                          className="w-full py-4 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-md flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50 transition-all bg-[#67001A]"
                        >
                          {busy ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
                          Confirm &amp; Submit Official Registration
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            ) : isPhoneExpanded ? (
              /* MODE 2: EXPANDED CITIZEN MOBILE OTP FLOW */
              <div className="mt-6 space-y-4 animate-in">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPhoneExpanded(false);
                      setStep("form");
                      setError(null);
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    <ArrowLeft size={16} /> Back to Overview
                  </button>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-300 flex items-center gap-1">
                    <Smartphone size={12} />
                    Mobile Verification
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
                      <h3 className="text-base font-bold text-slate-800">
                        Citizen Mobile Access
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        We will send a 6-digit verification code by SMS
                      </p>
                    </div>

                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        autoFocus
                        inputMode="tel"
                        className="w-full pl-14 pr-4 py-3.5 bg-white border-2 border-slate-200 focus:border-[#67001A] rounded-2xl text-xl font-black text-center outline-none transition-all shadow-xs"
                        placeholder="91XXXXXXXX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                        disabled={busy}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={busy || phone.trim().length < 10}
                      className="w-full py-4 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-md flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50 transition-all bg-[#67001A]"
                    >
                      {busy ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
                      Request OTP Code
                    </button>

                    <div className="relative my-2 text-center">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200" />
                      </div>
                      <span className="relative bg-white px-3 text-[10px] text-slate-400 font-bold uppercase">or</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleSignInWithGoogle}
                      disabled={busy}
                      className="w-full py-3 px-6 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center justify-center gap-2 border border-amber-300 transition-all hover:bg-amber-100 bg-[#FEF3C7] shadow-xs"
                    >
                      <LogIn className="w-4 h-4 text-[#67001A]" />
                      Sign in with Google
                    </button>
                  </form>
                ) : (
                  /* OTP Entry Screen */
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
                      <h3 className="text-base font-bold text-slate-800">
                        Enter Security Token
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Code dispatched to <b>+91 {phone}</b>
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
                      className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl text-center text-3xl font-black outline-none tracking-[0.4em] shadow-xs focus:border-[#67001A] text-[#67001A]"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="000000"
                      disabled={busy}
                    />

                    <button
                      type="submit"
                      disabled={busy || otpCode.length !== 6}
                      className="w-full py-4 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-md flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50 transition-all bg-[#67001A]"
                    >
                      {busy ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
                      Verify &amp; Enter
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
                          className="font-bold underline text-[#67001A]"
                        >
                          Resend Code
                        </button>
                      )}
                    </p>
                  </form>
                )}
              </div>
            ) : (
              /* MODE 3: DEFAULT HERO OVERVIEW MATCHING SCREENSHOT */
              <div className="mt-5 space-y-4 animate-in">
                {/* Welcome Box (Pink/Purple) */}
                <div className="rounded-2xl p-4 bg-[#FAF5FF] border border-pink-100 text-left">
                  <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                    <span
                      className="text-base font-black"
                      style={{ fontFamily: "Instrument Serif, Georgia, serif" }}
                    >
                      Welcome to Digital Village Development!
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                    Empowering citizens to report issues, track progress, and participate in village development initiatives.
                  </p>
                </div>

                {/* 3 Value Prop Cards */}
                <div className="space-y-2.5">
                  {/* Card 1: Citizens Report Issues */}
                  <div className="rounded-2xl p-3.5 bg-[#FAF5F7] border border-slate-100 flex items-center gap-3.5 text-left">
                    <div className="w-8 h-8 rounded-full bg-[#008A3B] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Check size={16} strokeWidth={3} />
                    </div>
                    <div>
                      <p className="font-bold text-xs sm:text-sm text-slate-900">
                        Citizens Report Issues
                      </p>
                      <p className="text-[11px] sm:text-xs text-slate-500">
                        Water, Roads, Electricity, Sanitation &amp; More
                      </p>
                    </div>
                  </div>

                  {/* Card 2: Ward Members & Sarpanch */}
                  <div className="rounded-2xl p-3.5 bg-[#FAF5F7] border border-slate-100 flex items-center gap-3.5 text-left">
                    <div className="w-8 h-8 rounded-full bg-[#67001A] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Users size={16} strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="font-bold text-xs sm:text-sm text-slate-900">
                        Ward Members &amp; Sarpanch
                      </p>
                      <p className="text-[11px] sm:text-xs text-slate-500">
                        Manage and resolve community issues
                      </p>
                    </div>
                  </div>

                  {/* Card 3: Track Progress */}
                  <div className="rounded-2xl p-3.5 bg-[#FEF9C3]/50 border border-amber-200 flex items-center gap-3.5 text-left">
                    <div className="w-8 h-8 rounded-full bg-[#CCB252] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <TrendingUp size={16} strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="font-bold text-xs sm:text-sm text-slate-900">
                        Track Progress
                      </p>
                      <p className="text-[11px] sm:text-xs text-slate-500">
                        Real-time updates and transparency
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sign-in Section */}
                <div className="pt-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">
                    SIGN IN WITH MOBILE OR GOOGLE
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setIsPhoneExpanded(true);
                      setStep("form");
                    }}
                    className="w-full mt-3 py-3.5 px-6 rounded-xl font-black text-xs uppercase tracking-wider text-white bg-[#67001A] hover:bg-[#520015] shadow-md flex items-center justify-center gap-2.5 transition-all active:scale-[0.99]"
                  >
                    <Smartphone size={16} />
                    <span>CONTINUE WITH MOBILE</span>
                  </button>

                  <p className="text-xs text-slate-400 font-medium text-center my-2">or</p>

                  <button
                    type="button"
                    onClick={handleSignInWithGoogle}
                    disabled={busy}
                    className="w-full py-3 px-6 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-900 bg-[#FEF3C7] hover:bg-[#FDE68A] border border-amber-300 shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                  >
                    <LogIn size={15} className="text-[#67001A]" />
                    <span>Sign in with Google</span>
                  </button>

                  <p className="text-[11px] text-slate-500 text-center max-w-sm mx-auto mt-3 leading-relaxed">
                    Google needs npm run dev and .dev.vars . Use Mobile and enter OTP 1234 on the next screen.
                  </p>

                  {/* Jai Telangana Pills */}
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#FEF9C3] text-[#67001A] border border-amber-200">
                      జై తెలంగాణ
                    </span>
                    <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#FDF2F8] text-[#67001A] border border-pink-200">
                      Jai Telangana
                    </span>
                  </div>

                  {/* Discrete Official Portal Toggle Link */}
                  <div className="text-center mt-3">
                    <button
                      type="button"
                      onClick={handleOpenOfficial}
                      className="text-[11px] font-bold text-[#67001A] hover:underline"
                    >
                      Officials Login &amp; Registration →
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
