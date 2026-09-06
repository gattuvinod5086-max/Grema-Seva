import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Smartphone, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { BRANDING } from '@web/constants/branding';

type Step = 'phone' | 'otp';

/**
 * Phone login: request an OTP over SMS, then verify it. On success the
 * API sets a session cookie and the user is redirected.
 */
export default function PhoneLogin() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const otpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = 'var(--tg-gradient-page)';
    return () => { document.body.style.background = prev; };
  }, []);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  useEffect(() => {
    if (step === 'otp') otpInputRef.current?.focus();
  }, [step]);

  const requestOtp = async () => {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ phone }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body?.error?.message ?? 'Could not send the OTP. Please try again.');
        return;
      }
      setStep('otp');
      setResendIn(30);
    } catch {
      setError('Network error. Is the API running?');
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async () => {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ phone, code }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body?.error?.message ?? 'Verification failed. Please try again.');
        return;
      }
      navigate('/', { replace: true });
    } catch {
      setError('Network error. Is the API running?');
    } finally {
      setBusy(false);
    }
  };

  const maroon = 'var(--tg-maroon)';
  const gold = 'var(--tg-gold)';

  return (
    <div className="min-h-screen w-full flex flex-col relative" style={{ minHeight: '100vh' }}>
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ background: 'var(--tg-gradient-page)' }}
        aria-hidden
      />
      <div
        className="absolute inset-0 pointer-events-none bg-cover bg-center opacity-[0.08]"
        style={{ backgroundImage: `url(${BRANDING.bgMap})` }}
        aria-hidden
      />

      <div className="relative flex-1 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md"
          style={{
            border: '3px solid transparent',
            backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #059669, #CCB252, #ec4899, #7c3aed)',
            backgroundOrigin: 'border-box',
            backgroundClip: 'padding-box, border-box',
          }}
        >
          <button
            type="button"
            onClick={() => (step === 'otp' ? setStep('phone') : navigate('/login'))}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div className="text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
              style={{ background: `linear-gradient(135deg, ${maroon}, #8B0026)` }}
            >
              <Smartphone className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              {step === 'phone' ? 'Sign in with Mobile' : 'Enter OTP'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {step === 'phone'
                ? 'We will send a 6-digit verification code by SMS'
                : `Sent to ${phone}`}
            </p>
          </div>

          {step === 'phone' ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (phone.trim()) requestOtp();
              }}
              className="space-y-4"
            >
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="Mobile number (10 digits)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={busy}
                className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-[#67001A] outline-none text-lg tracking-wide disabled:opacity-60"
                required
              />
              <button
                type="submit"
                disabled={busy || phone.trim().length < 10}
                className={`w-full text-white py-4 rounded-xl font-black text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed ${'transition-all'}`}
                style={{ background: `linear-gradient(90deg, ${maroon}, #8B0026)` }}
              >
                {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                Send OTP
              </button>
            </form>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (code.trim().length === 6) verifyOtp();
              }}
              className="space-y-4"
            >
              <input
                ref={otpInputRef}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                disabled={busy}
                className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-[#67001A] outline-none text-2xl text-center tracking-[0.5em] font-bold disabled:opacity-60"
                required
              />
              <button
                type="submit"
                disabled={busy || code.length !== 6}
                className={`w-full text-white py-4 rounded-xl font-black text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed ${'transition-all'}`}
                style={{ background: `linear-gradient(90deg, ${maroon}, #8B0026)` }}
              >
                {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                Verify & Sign In
              </button>
              <p className="text-center text-sm text-slate-500">
                Didn&apos;t receive it?{' '}
                {resendIn > 0 ? (
                  <span className="text-slate-400">Resend in {resendIn}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={requestOtp}
                    disabled={busy}
                    className="font-semibold underline disabled:opacity-50"
                    style={{ color: maroon }}
                  >
                    Resend OTP
                  </button>
                )}
              </p>
            </form>
          )}

          {error && (
            <div className="mt-4 bg-amber-50 border-2 border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-amber-800 text-sm">{error}</p>
            </div>
          )}

          <div className="mt-8 text-center">
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold border"
              style={{ borderColor: gold, color: maroon, backgroundColor: 'rgba(201,162,39,0.12)' }}
            >
              జై తెలంగాণ | Jai Telangana
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
