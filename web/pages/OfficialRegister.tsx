import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router';
import { ShieldCheck, Loader2, AlertCircle, Crown, Building2, UserCog } from 'lucide-react';
import {
  getDistrictNames,
  getMandalNames,
  getVillageNames,
  sanitizeGeoSelection,
} from '@shared/data/telangana';
import { OFFICIAL_REGISTRATION_ROLES, type OfficialRegistrationRole } from '@shared/types';
import { isValidIndianMobile, personNameSchema, NAME_ERROR } from '@shared/validation';

interface OtpRequestResponse {
  sent?: boolean;
  expiresInSec?: number;
  /** Present only in dev mode (SMS_DRIVER=console): the code, so the flow works without a real SMS provider. */
  devOtp?: string;
  error?: { message?: string };
}

const ROLE_META: Record<OfficialRegistrationRole, { label: string; hint: string }> = {
  sarpanch: { label: 'Sarpanch (Panchayat)', hint: 'Head of the gram panchayat' },
  ward_member: { label: 'Ward Member', hint: 'Ward-level representative' },
  mandal_official: { label: 'Mandal Official', hint: 'Government official at mandal level' },
  admin: { label: 'State / District Admin', hint: 'Administrative official with statewide oversight' },
};

/**
 * Official sign-up: OTP-verified phone + jurisdiction. Submissions land in
 * the super admin's approval queue; the account holds citizen-level access
 * until approved.
 */
export default function OfficialRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [name, setName] = useState('');
  const [role, setRole] = useState<OfficialRegistrationRole | ''>('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('');
  const [mandal, setMandal] = useState('');
  const [village, setVillage] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const otpRef = useRef<HTMLInputElement>(null);

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

  const requestOtp = async () => {
    setError(null);
    if (!personNameSchema.safeParse(name).success) {
      setError(NAME_ERROR);
      return;
    }
    if (!role) {
      setError('Select the role you are registering for.');
      return;
    }
    if (!isValidIndianMobile(phone)) {
      setError('Enter a valid 10-digit Indian mobile number (digits only, starting 6–9).');
      return;
    }
    if (!district || !mandal || !village) {
      setError('Select your district, mandal and village.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ phone }),
      });
      const body = (await res.json().catch(() => ({}))) as OtpRequestResponse;
      if (!res.ok) {
        setError(body?.error?.message ?? 'Could not send the OTP.');
        return;
      }
      setDevOtp(body.devOtp ?? null);
      if (body.devOtp) setCode(body.devOtp);
      setStep('otp');
      setResendIn(30);
      setTimeout(() => otpRef.current?.focus(), 50);
    } catch {
      setError('Network error. Is the API running?');
    } finally {
      setBusy(false);
    }
  };

  const submitRegistration = async () => {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch('/api/auth/register/official', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ phone, code, name, role, district, mandal, village }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body?.error?.message ?? 'Registration failed.');
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
  const inputCls =
    'w-full p-3 rounded-xl border-2 border-slate-200 focus:border-[#67001A] outline-none disabled:opacity-60';

  return (
    <div className="min-h-screen w-full relative" style={{ minHeight: '100vh', background: 'var(--tg-gradient-page)' }}>
      <div className="max-w-lg mx-auto px-4 py-10">
        <Link to="/login" className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-6">
          ← Back to sign in
        </Link>

        <div className="bg-white rounded-3xl shadow-2xl p-8" style={{ border: `2px solid ${gold}` }}>
          <div className="text-center mb-6">
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3"
              style={{ background: `linear-gradient(135deg, ${maroon}, #8B0026)` }}
            >
              <Crown className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Official Registration</h1>
            <p className="text-sm text-slate-500 mt-1">
              Verified by OTP and approved by the super admin before you get official access.
            </p>
          </div>

          {step === 'otp' && devOtp && (
            <div className="mb-4 bg-sky-50 border-2 border-sky-200 rounded-xl p-4 text-center">
              <p className="text-xs font-bold text-sky-800 uppercase tracking-wider">Development mode</p>
              <p className="text-2xl font-black text-sky-900 tracking-[0.3em] my-1">{devOtp}</p>
              <p className="text-[11px] text-sky-700">
                In production this code will be sent by SMS to your mobile via a real provider (MSG91).
              </p>
            </div>
          )}

          {step === 'details' ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (name && role && phone && district && mandal && village) requestOtp();
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 block">Role</label>
                <div className="grid gap-2">
                  {OFFICIAL_REGISTRATION_ROLES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                        role === r ? 'border-[#67001A] bg-[#67001A]/5' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {r === 'admin' ? <Building2 className="text-slate-500" size={20} /> : <UserCog className="text-slate-500" size={20} />}
                      <span>
                        <span className="block text-sm font-semibold text-slate-800">{ROLE_META[r].label}</span>
                        <span className="block text-xs text-slate-500">{ROLE_META[r].hint}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <input className={inputCls} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />

              <input
                className={inputCls}
                type="tel"
                inputMode="tel"
                placeholder="Mobile number (10 digits)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />

              <div className="grid gap-2">
                <select
                  className={inputCls}
                  value={district}
                  onChange={(e) => {
                    const next = sanitizeGeoSelection(e.target.value, '', '');
                    setDistrict(next.district);
                    setMandal(next.mandal);
                    setVillage(next.village);
                  }}
                  required
                >
                  <option value="">Select district</option>
                  {getDistrictNames().map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                {district && (
                  <select
                    className={inputCls}
                    value={mandal}
                    onChange={(e) => {
                      const next = sanitizeGeoSelection(district, e.target.value, '');
                      setMandal(next.mandal);
                      setVillage(next.village);
                    }}
                    required
                  >
                    <option value="">Select mandal</option>
                    {getMandalNames(district).map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                )}
                {mandal && (
                  <select className={inputCls} value={village} onChange={(e) => setVillage(e.target.value)} required>
                    <option value="">Select village</option>
                    {getVillageNames(district, mandal).map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                )}
              </div>

              <button
                type="submit"
                disabled={busy || !name || !role || !phone || !village}
                className="w-full text-white py-4 rounded-xl font-black text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                style={{ background: `linear-gradient(90deg, ${maroon}, #8B0026)` }}
              >
                {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                Verify with OTP
              </button>
            </form>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (code.length === 6) submitRegistration();
              }}
              className="space-y-4"
            >
              <p className="text-sm text-slate-600 text-center">
                Enter the 6-digit code sent to <strong>{phone}</strong>
              </p>
              <input
                ref={otpRef}
                className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-[#67001A] outline-none text-2xl text-center tracking-[0.5em] font-bold"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                required
              />
              <button
                type="submit"
                disabled={busy || code.length !== 6}
                className="w-full text-white py-4 rounded-xl font-black text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                style={{ background: `linear-gradient(90deg, ${maroon}, #8B0026)` }}
              >
                {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                Submit Registration
              </button>
              <p className="text-center text-sm text-slate-500">
                {resendIn > 0 ? (
                  <span className="text-slate-400">Resend in {resendIn}s</span>
                ) : (
                  <button type="button" onClick={requestOtp} className="font-semibold underline" style={{ color: maroon }}>
                    Resend OTP
                  </button>
                )}
                {' · '}
                <button type="button" onClick={() => setStep('details')} className="font-semibold underline text-slate-500">
                  Edit details
                </button>
              </p>
            </form>
          )}

          {error && (
            <div className="mt-4 bg-amber-50 border-2 border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-amber-800 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
