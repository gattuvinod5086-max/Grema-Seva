import { useState } from "react";
import { ArrowRight, Phone, MapPin, CheckCircle } from "lucide-react";
import GlassCard from "@/react-app/components/GlassCard";
import { telanganaData, type District, type Mandal, type Village } from "@/data/telangana";
import { useAppSession, type GramaSevaSession } from "@/react-app/context/AppSessionContext";

type Step = "welcome" | "mobile" | "regional" | "otp";

const OTP_DEMO = "123456";

export default function Onboarding() {
  const { setSession } = useAppSession();
  const [step, setStep] = useState<Step>("welcome");
  const [mobile, setMobile] = useState("");
  const [district, setDistrict] = useState<District | null>(null);
  const [mandal, setMandal] = useState<Mandal | null>(null);
  const [village, setVillage] = useState<Village | null>(null);
  const [otp, setOtp] = useState("");
  const [, setOtpVerified] = useState(false);

  const handleMobileNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (/^[6-9]\d{9}$/.test(mobile.replace(/\s/g, ""))) {
      setStep("regional");
    }
  };

  const handleRegionalNext = () => {
    if (district && mandal && village) setStep("otp");
  };

  const handleOtpVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp === OTP_DEMO) {
      setOtpVerified(true);
      const sessionData: GramaSevaSession = {
        mobile: mobile.replace(/\s/g, ""),
        district: district!.name,
        mandal: mandal!.name,
        village: village!.name,
        verifiedAt: Date.now(),
      };
      setSession(sessionData);
    }
  };

  const goBack = () => {
    if (step === "regional") setStep("mobile");
    else if (step === "otp") setStep("regional");
  };

  return (
    <div className="min-h-screen grama-pattern watermark-charminar watermark-thoranam flex flex-col items-center justify-center p-4">
      {/* State Emblem with fallback */}
      {step === "welcome" && (
        <div className="flex flex-col items-center mb-6 terminal-reveal">
          <div
            className="emblem-fallback terminal-reveal"
            role="img"
            aria-label="State Emblem"
          >
            తెలంగాణ
          </div>
          <p className="text-primary text-xs font-body font-bold mt-2 opacity-80">State of Telangana</p>
        </div>
      )}

      <GlassCard className="w-full max-w-md p-8 terminal-reveal terminal-reveal-delay-1">
        {step === "welcome" && (
          <>
            <h1 className="font-heading text-3xl md:text-4xl text-primary text-center mb-2">
              Grama Seva
            </h1>
            <p className="text-slate text-center font-body font-medium mb-6">
              Digital Telangana Terminal
            </p>
            <p className="text-slate-600 text-sm text-center mb-8">
              Your single window to local governance, agriculture support, and welfare schemes.
            </p>
            <button
              type="button"
              onClick={() => setStep("mobile")}
              className="active-scale w-full bg-primary hover:bg-primary-light text-white font-body font-bold py-4 px-6 rounded-glass shadow-glass transition-all flex items-center justify-center gap-2"
            >
              Get Started <ArrowRight className="w-5 h-5" />
            </button>
          </>
        )}

        {step === "mobile" && (
          <>
            <h2 className="font-heading text-2xl text-primary mb-1">Mobile number</h2>
            <p className="text-slate text-sm mb-6">We’ll send a verification code to this number.</p>
            <form onSubmit={handleMobileNext} className="space-y-4">
              <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
                <Phone className="w-5 h-5 text-slate-400" />
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="10-digit mobile number"
                  className="flex-1 bg-transparent outline-none font-body font-semibold"
                  maxLength={10}
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={!/^[6-9]\d{9}$/.test(mobile)}
                className="active-scale w-full bg-primary hover:bg-primary-light disabled:opacity-50 disabled:pointer-events-none text-white font-body font-bold py-4 px-6 rounded-glass transition-all"
              >
                Continue
              </button>
            </form>
          </>
        )}

        {step === "regional" && (
          <>
            <h2 className="font-heading text-2xl text-primary mb-1">Your location</h2>
            <p className="text-slate text-sm mb-6">Select District → Mandal → Village.</p>

            {!district ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {telanganaData.map((d) => (
                  <button
                    key={d.name}
                    type="button"
                    onClick={() => setDistrict(d)}
                    className="active-scale w-full flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-primary/30 hover:bg-primary/5 transition-all text-left"
                  >
                    <MapPin className="w-5 h-5 text-primary" />
                    <span className="font-body font-bold text-slate-800">{d.name}</span>
                  </button>
                ))}
              </div>
            ) : !mandal ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setDistrict(null)}
                  className="text-sm text-primary font-semibold mb-2"
                >
                  ← Change district
                </button>
                {district.mandals.map((m) => (
                  <button
                    key={m.name}
                    type="button"
                    onClick={() => setMandal(m)}
                    className="active-scale w-full flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-primary/30 hover:bg-primary/5 transition-all text-left"
                  >
                    <MapPin className="w-5 h-5 text-emerald-600" />
                    <span className="font-body font-bold text-slate-800">{m.name}</span>
                  </button>
                ))}
              </div>
            ) : !village ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setMandal(null)}
                  className="text-sm text-primary font-semibold mb-2"
                >
                  ← Change mandal
                </button>
                {mandal.villages.map((v) => (
                  <button
                    key={v.name}
                    type="button"
                    onClick={() => setVillage(v)}
                    className="active-scale w-full flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-primary/30 hover:bg-primary/5 transition-all text-left"
                  >
                    <MapPin className="w-5 h-5 text-gold" />
                    <span className="font-body font-bold text-slate-800">{v.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 text-primary font-semibold">
                  <CheckCircle className="w-5 h-5" />
                  {village.name}, {mandal.name}, {district.name}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={goBack}
                    className="active-scale flex-1 py-3 rounded-xl border border-slate-300 font-semibold text-slate-700"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleRegionalNext}
                    className="active-scale flex-1 bg-primary text-white font-bold py-3 rounded-xl"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {step === "otp" && (
          <>
            <h2 className="font-heading text-2xl text-primary mb-1">Verify OTP</h2>
            <p className="text-slate text-sm mb-6">
              Enter the 6-digit code sent to {mobile.slice(0, 5)}*****
            </p>
            <p className="text-amber-600 text-xs mb-4 font-semibold">
              Demo: use OTP <strong>123456</strong>
            </p>
            <form onSubmit={handleOtpVerify} className="space-y-4">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="w-full text-center text-2xl tracking-[0.5em] font-bold border border-slate-200 rounded-xl py-4 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                maxLength={6}
                autoFocus
              />
              <button
                type="button"
                onClick={goBack}
                className="w-full py-3 rounded-xl border border-slate-300 font-semibold text-slate-700"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={otp.length !== 6}
                className="active-scale w-full bg-primary hover:bg-primary-light disabled:opacity-50 text-white font-body font-bold py-4 px-6 rounded-glass transition-all flex items-center justify-center gap-2"
              >
                Verify & Enter <CheckCircle className="w-5 h-5" />
              </button>
            </form>
          </>
        )}
      </GlassCard>
    </div>
  );
}
