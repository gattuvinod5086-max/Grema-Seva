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
} from "lucide-react";
import { BRANDING } from "@web/constants/branding";
import PublicNavHeader from "@web/components/layout/PublicNavHeader";
import PublicFooter from "@web/components/layout/PublicFooter";
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

  // Form busy and error states

  // Official Registration fields
  const [name, setName] = useState("");
  const [officialRole, setOfficialRole] = useState<OfficialRegistrationRole | "">("");
  const [district, setDistrict] = useState("");
  const [mandal, setMandal] = useState("");
  const [village, setVillage] = useState("");
  const [wardNumber, setWardNumber] = useState("");

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

  // Keep viewMode synchronized whenever the URL or active nav pill changes
  useEffect(() => {
    const isOfficial = searchParams.get("official") === "1";
    setViewMode(isOfficial ? "official" : "citizen");
    setError(null);
    setStep("form");
  }, [searchParams]);

  const isOfficialLocationValid = () => {
    if (!officialRole) return false;
    if (officialRole === "admin") return true;
    if (officialRole === "mandal_official") return Boolean(district && mandal);
    if (officialRole === "sarpanch") return Boolean(district && mandal && village);
    if (officialRole === "ward_member") return Boolean(district && mandal && village && wardNumber.trim());
    return false;
  };

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
      if (!isOfficialLocationValid()) {
        if (officialRole === "mandal_official") {
          setError("Please select your district and mandal.");
        } else if (officialRole === "ward_member") {
          setError("Please select your district, mandal, village, and specify your ward number.");
        } else if (officialRole === "sarpanch") {
          setError("Please select your district, mandal, and village jurisdiction.");
        }
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
        const payload: Record<string, any> = {
          phone,
          code: otpCode,
          name,
          role: officialRole,
        };

        if (officialRole === "mandal_official") {
          payload.district = district;
          payload.mandal = mandal;
        } else if (officialRole === "sarpanch") {
          payload.district = district;
          payload.mandal = mandal;
          payload.village = village;
        } else if (officialRole === "ward_member") {
          payload.district = district;
          payload.mandal = mandal;
          payload.village = village;
          payload.wardNumber = wardNumber.trim();
        }

        const res = await fetch("/api/auth/register/official", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify(payload),
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
      className="min-h-screen w-full flex flex-col justify-between relative"
      style={{
        background: "linear-gradient(180deg, #FAF9F6 0%, #F5F4EE 100%)",
        minHeight: "100vh",
      }}
    >
      {/* Top Header Ribbon & Centered Navigation Pills */}
      <PublicNavHeader activePill={viewMode === "official" ? "official" : "citizen"} />

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch py-2">
          
          {/* ================= LEFT COLUMN: Telangana State Authority & Purpose Showcase ================= */}
          <div className="lg:col-span-5 flex flex-col h-full">
            <div
              className="bg-white rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-7 text-center shadow-xl border-2 border-[#CCB252]/60 flex-1 flex flex-col justify-between h-full"
              style={{
                backgroundImage:
                  "linear-gradient(180deg, #FFFFFF 0%, #FAF8F2 60%, #FFFDF8 100%)",
              }}
            >
              {/* Top: Telangana State Identity & Authority */}
              <div className="flex flex-col items-center pt-2">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-100/90 border border-amber-300 text-[#67001A] text-[11px] font-black uppercase tracking-wider mb-2.5 shadow-2xs">
                  <Sparkles size={12} className="text-[#CCB252]" />
                  <span>తెలంగాణ ప్రభుత్వం</span>
                </div>

                <h2
                  className="text-2xl sm:text-3xl font-black text-[#520015] tracking-tight uppercase"
                  style={{ fontFamily: "Instrument Serif, Georgia, serif" }}
                >
                  GOVERNMENT OF TELANGANA
                </h2>
                <p className="text-xs sm:text-sm font-bold text-slate-700 font-telugu mt-1">
                  పంచాయతీ రాజ్ &amp; గ్రామీణాభివృద్ధి శాఖ
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] text-slate-600 font-semibold">
                  <span>33 జిల్లాలు</span>
                  <span>•</span>
                  <span>589 మండలాలు</span>
                  <span>•</span>
                  <span>12,769+ పంచాయతీలు</span>
                </div>
              </div>

              {/* Center: Dynamic Highlights */}
              <div className="my-5 w-full space-y-2.5 text-left">
                {viewMode === "citizen" ? (
                  <>
                    <div className="flex items-center justify-between pb-1.5 border-b border-amber-200/60">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                        పౌర సంక్షేమ సేవలు
                      </span>
                      <span className="text-[10px] font-bold text-[#008A3B]">
                        CITIZEN WELFARE
                      </span>
                    </div>

                    <div className="rounded-2xl p-3 bg-gradient-to-br from-amber-50 to-orange-50/60 border border-amber-200 shadow-2xs">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-[#D97706] text-white flex items-center justify-center text-xs font-black shrink-0">
                          1
                        </span>
                        <div>
                          <p className="text-xs font-black text-amber-950">మహాలక్ష్మి &amp; గృహజ్యోతి</p>
                          <p className="text-[10px] text-amber-800 leading-snug">₹2,500 సాయం, ₹500 గ్యాస్ సిలిండర్, ఉచిత ఆర్టీసీ ప్రయాణం</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl p-3 bg-gradient-to-br from-blue-50 to-sky-50/60 border border-sky-200 shadow-2xs">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-[#0284C7] text-white flex items-center justify-center text-xs font-black shrink-0">
                          2
                        </span>
                        <div>
                          <p className="text-xs font-black text-sky-950">రైతు భరోసా &amp; రాజీవ్ ఆరోగ్యశ్రీ</p>
                          <p className="text-[10px] text-sky-800 leading-snug">రైతులకు పెట్టుబడి సాయం, ₹10 లక్షల ఉచిత ఆరోగ్య రక్షణ</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl p-3 bg-gradient-to-br from-emerald-50 to-teal-50/60 border border-emerald-200 shadow-2xs">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-[#059669] text-white flex items-center justify-center text-xs font-black shrink-0">
                          3
                        </span>
                        <div>
                          <p className="text-xs font-black text-emerald-950">72 గంటల SLA సమస్య పరిష్కారం</p>
                          <p className="text-[10px] text-emerald-800 leading-snug">మంచినీరు, రోడ్లు, విద్యుత్, డ్రైనేజీ సమస్యల తక్షణ పరిష్కారం</p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between pb-1.5 border-b border-amber-200/60">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                        అధికారిక పాలనా నియమావళి
                      </span>
                      <span className="text-[10px] font-bold text-[#67001A]">
                        GOVERNANCE PROTOCOL
                      </span>
                    </div>

                    <div className="rounded-2xl p-3 bg-gradient-to-br from-purple-50 to-pink-50/60 border border-purple-200 shadow-2xs">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-[#67001A] text-white flex items-center justify-center text-xs font-black shrink-0">
                          <Crown size={13} />
                        </span>
                        <div>
                          <p className="text-xs font-black text-purple-950">గ్రామ పంచాయతీ కన్సోల్</p>
                          <p className="text-[10px] text-purple-800 leading-snug">సర్పంచ్ &amp; వార్డు సభ్యుల అధికారిక డ్యాష్‌బోర్డ్</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl p-3 bg-gradient-to-br from-indigo-50 to-blue-50/60 border border-indigo-200 shadow-2xs">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-indigo-700 text-white flex items-center justify-center text-xs font-black shrink-0">
                          <Building2 size={13} />
                        </span>
                        <div>
                          <p className="text-xs font-black text-indigo-950">మండల &amp; జిల్లా స్థాయి పర్యవేక్షణ</p>
                          <p className="text-[10px] text-indigo-800 leading-snug">MPDOలు, జిల్లా కలెక్టర్లకు నివేదికల వ్యవస్థ</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl p-3 bg-gradient-to-br from-emerald-50 to-teal-50/60 border border-emerald-200 shadow-2xs">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-[#008A3B] text-white flex items-center justify-center text-xs font-black shrink-0">
                          <ShieldCheck size={13} />
                        </span>
                        <div>
                          <p className="text-xs font-black text-emerald-950">100% డిజిటల్ ఆడిట్ ట్రయల్</p>
                          <p className="text-[10px] text-emerald-800 leading-snug">ప్రతి పరిష్కారం జియో-ట్యాగింగ్ ద్వారా ప్రభుత్వ ధృవీకరణ</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Bottom Support & Security Compliance */}
              <div className="w-full pt-3 border-t border-slate-200/80">
                <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1.5 flex-wrap gap-1">
                  <span className="font-semibold">24/7 హెల్ప్‌లైన్:</span>
                  <div className="flex items-center gap-2 font-black text-[#67001A]">
                    <span>112</span>
                    <span>•</span>
                    <span>108</span>
                    <span>•</span>
                    <span>1905</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                  <span>NIC Secure Infrastructure</span>
                  <span className="font-bold text-[#67001A] font-telugu">జై తెలంగాణ</span>
                </div>
              </div>

            </div>
          </div>

          {/* ================= RIGHT COLUMN: Interactive Authentication Terminal ================= */}
          <div className="lg:col-span-7 flex flex-col h-full">
            <div
              className="bg-white rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 text-center relative overflow-hidden shadow-xl border-2 border-[#CCB252]/60 flex-1 flex flex-col justify-between h-full"
              style={{
                backgroundImage:
                  "linear-gradient(180deg, #FFFFFF 0%, #FAF8F2 60%, #FFFDF8 100%)",
              }}
            >
              {/* Top: Terminal Title & Active Mode Badge */}
              <div className="flex flex-col items-center">
                <div
                  className="w-14 h-14 rounded-full bg-white p-1.5 shadow-md border-2 border-[#CCB252] flex items-center justify-center ring-4 ring-[#CCB252]/20 overflow-hidden mb-2"
                  style={{ width: "56px", height: "56px" }}
                >
                  <img
                    src={BRANDING.logoEmblem}
                    alt="Grama Seva Logo"
                    className="object-contain"
                    style={{ width: "42px", height: "42px", maxWidth: "42px", maxHeight: "42px" }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = BRANDING.logoFallback;
                    }}
                  />
                </div>

                <h1
                  className="font-black text-2xl sm:text-3xl uppercase tracking-tight text-[#520015]"
                  style={{ fontFamily: "Instrument Serif, Georgia, serif" }}
                >
                  GRAMA SEVA
                </h1>
                <p className="text-xs sm:text-sm font-black text-[#008A3B] font-telugu telugu-text mt-0.5">
                  గ్రామ సేవ - తెలంగాణ డిజిటల్ ప్రజా పాలన వేదిక
                </p>

                <div className="mt-2 inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-50 border border-amber-300/80 shadow-2xs">
                  <span className={`w-2 h-2 rounded-full ${viewMode === "official" ? "bg-[#67001A]" : "bg-emerald-600"} animate-pulse`} />
                  <span
                    className="text-xs font-black uppercase tracking-wider text-slate-800"
                    style={{ fontFamily: "Instrument Serif, Georgia, serif" }}
                  >
                    {viewMode === "official" ? "OFFICIALS GOVERNANCE CONSOLE" : "CITIZEN ACCESS TERMINAL"}
                  </span>
                  <span className="text-[9px] font-bold text-[#67001A] uppercase tracking-wider font-telugu">
                    {viewMode === "official" ? "· అధికారిక ప్రవేశం" : "· పౌర సేవలు"}
                  </span>
                </div>
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

                        {/* Role-adaptive Location Selector */}
                        {officialRole === "admin" && (
                          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1">
                            <p className="font-bold flex items-center gap-1.5 text-amber-950">
                              <Building2 size={14} /> Statewide Administrative Jurisdiction
                            </p>
                            <p className="text-amber-800 text-[11px]">
                              As an Administrator, you have statewide oversight. No specific district or village selection is required.
                            </p>
                          </div>
                        )}

                        {officialRole === "mandal_official" && (
                          <div className="space-y-2 p-3 rounded-xl bg-indigo-50/60 border border-indigo-200">
                            <div>
                              <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider mb-0.5">
                                Mandal Jurisdiction
                              </label>
                              <p className="text-[11px] text-indigo-700">
                                Select your district and mandal. You will manage and view all villages in this mandal.
                              </p>
                            </div>
                            <select
                              className={inputCls}
                              value={district}
                              onChange={(e) => {
                                const next = sanitizeGeoSelection(e.target.value, "", "");
                                setDistrict(next.district);
                                setMandal(next.mandal);
                                setVillage("");
                              }}
                              required
                            >
                              <option value="">-- Select District --</option>
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
                                  setVillage("");
                                }}
                                required
                              >
                                <option value="">-- Select Mandal --</option>
                                {getMandalNames(district).map((m) => (
                                  <option key={m} value={m}>{m}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        )}

                        {(officialRole === "sarpanch" || officialRole === "ward_member") && (
                          <div className="space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-0.5">
                                {officialRole === "sarpanch" ? "Gram Panchayat Jurisdiction" : "Ward & Village Jurisdiction"}
                              </label>
                              <p className="text-[11px] text-slate-500">
                                {officialRole === "sarpanch"
                                  ? "Select your gram panchayat village location."
                                  : "Select your village and specify your assigned ward number."}
                              </p>
                            </div>

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
                              <option value="">-- Select District --</option>
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

                            {officialRole === "ward_member" && village && (
                              <div>
                                <label className="block text-xs font-bold text-purple-900 mb-1">Ward Number *</label>
                                <input
                                  className={inputCls}
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="e.g. 1, 2, 3..."
                                  value={wardNumber}
                                  onChange={(e) => setWardNumber(e.target.value.replace(/\D/g, "").slice(0, 3))}
                                  required
                                />
                                <p className="text-[10px] text-purple-700 mt-1">
                                  You will strictly manage and view issues for Ward {wardNumber || "..."}.
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={busy || !name || !officialRole || !phone || !isOfficialLocationValid()}
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
            ) : (
              /* CITIZEN FLOW */
              <div className="my-auto py-3 space-y-4 w-full animate-in">
                {step === "form" ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleRequestOtp();
                    }}
                    className="space-y-3.5"
                  >
                    <div className="text-center">
                      <h3 className="text-sm sm:text-base font-bold text-slate-800">
                        Citizen Mobile Access
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Enter your 10-digit mobile number to receive a secure SMS OTP
                      </p>
                    </div>

                    <div className="relative max-w-sm mx-auto">
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

                    <div className="max-w-sm mx-auto space-y-2.5">
                      <button
                        type="submit"
                        disabled={busy || phone.trim().length < 10}
                        className="w-full py-3.5 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-md flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50 transition-all bg-[#008A3B]"
                        style={{
                          boxShadow: "0 8px 20px -4px rgba(0, 138, 59, 0.35)",
                        }}
                      >
                        {busy ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
                        <span>Request OTP Code</span>
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
                        className="w-full py-2.5 px-6 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center justify-center gap-2 border border-amber-300 transition-all hover:bg-amber-100 bg-[#FEF3C7] shadow-xs"
                      >
                        <LogIn className="w-4 h-4 text-[#67001A]" />
                        <span>Sign in with Google</span>
                      </button>
                    </div>

                    {/* Quick Citizen Services Pill Bar */}
                    <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-emerald-900 bg-emerald-100 border border-emerald-300">
                        💧 తాగునీరు
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-blue-900 bg-blue-100 border border-blue-300">
                        🛣️ రోడ్లు
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300">
                        💡 విద్యుత్
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-purple-900 bg-purple-100 border border-purple-300">
                        👵 పింఛన్లు
                      </span>
                    </div>
                  </form>
                ) : (
                  /* OTP Entry Screen */
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (otpCode.length === 6) handleVerifyOtp();
                    }}
                    className="space-y-4 text-center max-w-sm mx-auto"
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
                      className="w-full py-3.5 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-md flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50 transition-all bg-[#008A3B]"
                      style={{
                        boxShadow: "0 8px 20px -4px rgba(0, 138, 59, 0.35)",
                      }}
                    >
                      {busy ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
                      <span>Verify &amp; Enter</span>
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
            )}

            {/* Bottom Footer Action & Jai Telangana */}
            <div className="w-full pt-3 mt-3 border-t border-slate-200/80 flex items-center justify-between text-xs flex-wrap gap-2">
              {viewMode === "citizen" ? (
                <button
                  type="button"
                  onClick={handleOpenOfficial}
                  className="font-bold text-[#67001A] hover:underline flex items-center gap-1 text-[11px]"
                >
                  <span>Panchayat Official / Representative?</span>
                  <span className="font-black">Officials Login →</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenCitizen}
                  className="font-bold text-[#008A3B] hover:underline flex items-center gap-1 text-[11px]"
                >
                  <span>← Back to Citizen Login</span>
                </button>
              )}

              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[#67001A] text-[10px] font-bold font-telugu">
                <Sparkles size={11} className="text-[#CCB252]" />
                <span>జై తెలంగాణ</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
    <PublicFooter />
  </div>
  );
}
