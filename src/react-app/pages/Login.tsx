import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router';
import { useAuth } from '@getmocha/users-service/react';
import { LogIn, Sparkles, Users, TrendingUp, Award, AlertCircle, Smartphone, UserCog, MapPin, Siren } from 'lucide-react';
import { BRANDING } from '@/react-app/constants/branding';
import { TELANGANA_DATA } from '@/react-app/data/terminalData';
import { WELFARE_SCHEMES } from '@/react-app/data/schemes';
import {
  PENDING_OFFICIAL_KEY,
  OFFICIAL_ROLES,
  type OfficialRole,
  type PendingOfficial,
} from './loginConstants';

const OFFICIAL_ROLE_KEY = 'gramaseva_official_role';

const LOGIN_SCHEME_CARD_STYLES = [
  { border: 'border-amber-300/50', bg: 'linear-gradient(135deg, rgba(245,158,11,0.9), rgba(217,119,6,0.95))' },
  { border: 'border-sky-300/50', bg: 'linear-gradient(135deg, rgba(14,165,233,0.9), rgba(2,132,199,0.95))' },
  { border: 'border-emerald-300/50', bg: 'linear-gradient(135deg, rgba(16,185,129,0.9), rgba(5,150,105,0.95))' },
  { border: 'border-violet-300/50', bg: 'linear-gradient(135deg, rgba(139,92,246,0.9), rgba(124,58,237,0.95))' },
  { border: 'border-pink-300/50', bg: 'linear-gradient(135deg, rgba(236,72,153,0.9), rgba(219,39,119,0.95))' },
  { border: 'border-teal-300/50', bg: 'linear-gradient(135deg, rgba(20,184,166,0.9), rgba(13,148,136,0.95))' },
] as const;

export default function Login() {
  const [searchParams] = useSearchParams();
  const isOfficial = searchParams.get('official') === '1';
  useAuth(); // AuthProvider required for app; Google sign-in uses direct API call for better error handling
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const [officialRole, setOfficialRole] = useState<OfficialRole | ''>(() => {
    if (typeof localStorage !== 'undefined') {
      const r = localStorage.getItem(OFFICIAL_ROLE_KEY);
      if (r && OFFICIAL_ROLES.includes(r as OfficialRole)) return r as OfficialRole;
    }
    return '';
  });
  const [officialDistrict, setOfficialDistrict] = useState('');
  const [officialMandal, setOfficialMandal] = useState('');
  const [officialVillage, setOfficialVillage] = useState('');

  useEffect(() => {
    fetch('/api/oauth/google/redirect_url')
      .then((r) => setBackendAvailable(r.ok))
      .catch(() => setBackendAvailable(false));
  }, []);

  /* Colourful Telangana gradient on login */
  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = 'var(--tg-gradient-page)';
    return () => { document.body.style.background = prev; };
  }, []);

  const maroon = 'var(--tg-maroon)';
  const gold = 'var(--tg-gold)';
  const green = 'var(--tg-green)';
  const gradientHeader = 'var(--tg-gradient-header)';
  const gradientBg = 'var(--tg-gradient-page)';

  const handleOfficialRoleChange = (role: OfficialRole) => {
    setOfficialRole(role);
    setOfficialDistrict('');
    setOfficialMandal('');
    setOfficialVillage('');
    try {
      localStorage.setItem(OFFICIAL_ROLE_KEY, role);
    } catch {
      /* ignore */
    }
  };

  const handleSignInWithGoogle = async () => {
    setError(null);
    setIsLoading(true);
    try {
      if (isOfficial && officialRole && officialDistrict && officialMandal && officialVillage) {
        const pending: PendingOfficial = {
          role: officialRole,
          district: officialDistrict,
          mandal: officialMandal,
          village: officialVillage,
        };
        try {
          localStorage.setItem(PENDING_OFFICIAL_KEY, JSON.stringify(pending));
        } catch {
          /* ignore */
        }
      }
      const apiUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/oauth/google/redirect_url` : '/api/oauth/google/redirect_url';
      const res = await fetch(apiUrl, { method: 'GET', credentials: 'same-origin' });
      const contentType = res.headers.get('content-type') ?? '';
      const isJson = contentType.includes('application/json');
      const data = isJson ? await res.json().catch(() => ({})) : {};
      if (!res.ok) {
        const msg = data?.error || data?.details || `Request failed (${res.status}). See setup steps below.`;
        setError(msg);
        return;
      }
      const redirectUrl = data?.redirectUrl ?? data?.redirect_url;
      if (redirectUrl && typeof redirectUrl === 'string' && redirectUrl.startsWith('http')) {
        window.location.href = redirectUrl;
        return;
      }
      if (!isJson || contentType.includes('text/html')) {
        setError('The server returned HTML instead of JSON. The Worker API may not be running. Use "npm run dev" (not dev:local) so /api requests hit the Worker. Ensure .dev.vars exists in the project root.');
        return;
      }
      setError('Backend returned no redirect URL. In .dev.vars set Option A (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI=http://localhost:5173/auth/callback) or Option B (MOCHA_USERS_SERVICE_API_KEY). Restart "npm run dev" after editing .dev.vars.');
    } catch (err) {
      console.error('Sign-in error:', err);
      const isNetwork = err instanceof TypeError && (err.message === 'Failed to fetch' || err.message?.includes('fetch'));
      const msg = isNetwork
        ? 'Backend not reachable. Use "npm run dev" (not dev:local) so the API runs. See setup steps below.'
        : (err instanceof Error ? err.message : 'Network or server error. See setup steps below.');
      // Local/dev fallback: if official fields are already selected, finish login via terminal OTP.
      if (isOfficial && officialRole && officialDistrict && officialMandal && officialVillage) {
        const pending: PendingOfficial = {
          role: officialRole,
          district: officialDistrict,
          mandal: officialMandal,
          village: officialVillage,
        };
        try {
          localStorage.setItem(PENDING_OFFICIAL_KEY, JSON.stringify(pending));
        } catch {
          /* ignore */
        }
        navigate('/app');
        return;
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      data-page="login"
      className="min-h-screen w-full flex flex-col relative"
      style={{ minHeight: '100vh' }}
    >
      {/* Full-page background: gradient + Telangana map */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ background: gradientBg }}
        aria-hidden
      />
      <div
        className="absolute inset-0 pointer-events-none bg-cover bg-center opacity-[0.08]"
        style={{ backgroundImage: `url(${BRANDING.bgMap})` }}
        aria-hidden
      />

      {/* Telangana emblem: green → gold header with logo + TG */}
      <div
        className="relative text-white py-3 md:py-4 shadow-lg flex-shrink-0"
        style={{ background: gradientHeader, borderBottom: `3px solid ${gold}` }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center gap-3 md:gap-4">
            <span
              className="flex-shrink-0 px-2 py-0.5 rounded-md font-black text-sm md:text-base tracking-tighter uppercase"
              style={{ fontFamily: 'Instrument Serif, Georgia, serif', color: '#fef08a', textShadow: '0 1px 2px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.2)', background: 'rgba(0,0,0,0.15)' }}
            >
              TG
            </span>
            <p className="text-sm md:text-lg font-bold text-center">తెలంగాణ రాష్ట్రం | Telangana State | Digital Village Development</p>
            <Sparkles className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" style={{ color: gold }} />
          </div>
        </div>
      </div>

      <div className="relative flex-1 overflow-y-auto min-h-0">
        <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 pb-10">
          <Link
            to="/emergency"
            className="mb-6 flex items-center justify-center gap-3 w-full max-w-md mx-auto py-4 px-6 rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg border-2 transition-all hover:opacity-95"
            style={{ background: `linear-gradient(90deg, ${maroon}, #8B0026)`, borderColor: gold, color: 'white' }}
          >
            <Siren className="w-5 h-5" style={{ color: gold }} />
            🚨 Emergency & Help
          </Link>
          <div className="w-full grid md:grid-cols-2 gap-6 md:gap-8 items-start md:items-center">
          {/* Left Side - Branding & Schemes */}
          <div className="space-y-6">
            {/* Telangana Emblem Section */}
            <div
              className="bg-white rounded-3xl shadow-2xl p-8 overflow-hidden"
              style={{
                border: '3px solid transparent',
                backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #059669, #CCB252, #ea580c)',
                backgroundOrigin: 'border-box',
                backgroundClip: 'padding-box, border-box',
                boxShadow: '0 25px 50px -12px rgba(0,179,65,0.15)',
              }}
            >
              <div className="text-center mb-6">
                <img
                  src={BRANDING.logoEmblem}
                  alt="Government of Telangana – State Emblem"
                  className="w-full h-auto max-h-48 max-w-[200px] mx-auto rounded-2xl mb-4 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = BRANDING.logoFallback;
                  }}
                />
                <h3 className="text-3xl font-bold mb-2" style={{ color: maroon }}>
                  తెలంగాణ రాష్ట్రం
                </h3>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Telangana State</h3>
                <div className="flex items-center justify-center gap-4 text-slate-600">
                  <span className="font-semibold">33 Districts</span>
                  <span style={{ color: gold }}>•</span>
                  <span className="font-semibold">589 Mandals</span>
                </div>
              </div>
            </div>

            {/* Government Schemes – colourful cards */}
            <div className="rounded-3xl shadow-2xl p-8 overflow-hidden" style={{ background: gradientHeader, border: `2px solid ${gold}` }}>
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-white drop-shadow-sm">
                <Award className="w-7 h-7" style={{ color: gold }} />
                Telangana Government Schemes
              </h3>
              <div className="space-y-3 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
                {WELFARE_SCHEMES.map((scheme, i) => {
                  const style = LOGIN_SCHEME_CARD_STYLES[i % LOGIN_SCHEME_CARD_STYLES.length];
                  return (
                    <div
                      key={scheme.name}
                      className={`rounded-xl p-4 border-2 ${style.border} text-white shadow-md`}
                      style={{ background: style.bg }}
                    >
                      <h4 className="font-bold text-base mb-1">{scheme.name}</h4>
                      <p className="text-sm text-white/95 leading-snug">{scheme.tagline}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div
            className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 w-full"
            style={{
              border: '3px solid transparent',
              backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #059669, #CCB252, #ec4899, #7c3aed)',
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box',
              boxShadow: '0 25px 50px -12px rgba(103,0,26,0.2)',
            }}
          >
            <div className="text-center mb-8">
              <img
                src={BRANDING.logoEmblem}
                alt=""
                className="mx-auto h-16 w-16 md:h-20 md:w-20 object-contain mb-3"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = BRANDING.logoFallback;
                }}
              />
              <div className="inline-block p-1 rounded-2xl mb-4" style={{ background: gradientHeader }}>
                <div className="bg-white px-6 py-2 rounded-xl">
                  <h1 className="text-4xl md:text-5xl font-bold italic" style={{ color: maroon }}>
                    Grama Seva
                  </h1>
                </div>
              </div>
              <p className="text-xl font-semibold text-slate-800 mb-1">గ్రామ సేవ | Village Service</p>
              <p className="text-lg text-slate-600">Digital Governance Portal</p>
              <p className="text-sm text-slate-500 mt-2">Telangana State Government Initiative</p>
            </div>

            <div className="mb-8">
              <div
                className="rounded-2xl p-6 mb-6 border"
                style={{ backgroundColor: 'rgba(236,72,153,0.08)', borderColor: 'rgba(147,51,234,0.2)' }}
              >
                <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Sparkles className="w-6 h-6" style={{ color: gold }} />
                  Welcome to Digital Village Development!
                </h2>
                <p className="text-slate-700">
                  Empowering citizens to report issues, track progress, and participate in village development initiatives.
                </p>
              </div>

              <div className="space-y-3">
                <div
                  className="flex items-start gap-3 p-3 rounded-xl border"
                  style={{ backgroundColor: 'rgba(236,72,153,0.08)', borderColor: 'rgba(147,51,234,0.2)' }}
                >
                  <div className="rounded-full p-1 mt-1" style={{ backgroundColor: '#166534' }}>
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">Citizens Report Issues</p>
                    <p className="text-sm text-slate-600">Water, Roads, Electricity, Sanitation & More</p>
                  </div>
                </div>
                <div
                  className="flex items-start gap-3 p-3 rounded-xl border"
                  style={{ backgroundColor: 'rgba(103,0,26,0.1)', borderColor: 'rgba(103,0,26,0.2)' }}
                >
                  <div className="rounded-full p-1 mt-1" style={{ backgroundColor: maroon }}>
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">Ward Members & Sarpanch</p>
                    <p className="text-sm text-slate-600">Manage and resolve community issues</p>
                  </div>
                </div>
                <div
                  className="flex items-start gap-3 p-3 rounded-xl border"
                  style={{ backgroundColor: 'rgba(201,162,39,0.12)', borderColor: 'rgba(201,162,39,0.3)' }}
                >
                  <div className="rounded-full p-1 mt-1" style={{ backgroundColor: gold }}>
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">Track Progress</p>
                    <p className="text-sm text-slate-600">Real-time updates and transparency</p>
                  </div>
                </div>
              </div>
            </div>

            {isOfficial && (
              <div className="mb-6 p-4 rounded-2xl border-2" style={{ backgroundColor: 'rgba(5,150,105,0.08)', borderColor: 'rgba(5,150,105,0.35)' }}>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <UserCog className="w-4 h-4" style={{ color: green }} />
                  Login as Official – Select role & your village
                </h3>
                <select
                  value={officialRole}
                  onChange={(e) => handleOfficialRoleChange(e.target.value as OfficialRole)}
                  className="w-full p-3 rounded-xl font-bold text-slate-800 border-2 outline-none focus:ring-2 focus:ring-offset-1 mb-3"
                  style={{ borderColor: gold, backgroundColor: '#fffbeb' }}
                >
                  <option value="">-- Select role --</option>
                  {OFFICIAL_ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                {officialRole && (
                  <>
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <MapPin size={12} style={{ color: green }} /> Your village
                    </p>
                    <div className="grid grid-cols-1 gap-2 mb-3">
                      <select
                        value={officialDistrict}
                        onChange={(e) => { setOfficialDistrict(e.target.value); setOfficialMandal(''); setOfficialVillage(''); }}
                        className="w-full p-3 rounded-xl font-bold text-slate-800 border-2 outline-none focus:ring-2 focus:ring-offset-1"
                        style={{ borderColor: gold, backgroundColor: '#fffbeb' }}
                      >
                        <option value="">District</option>
                        {Object.keys(TELANGANA_DATA).sort().map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                      {officialDistrict && (
                        <select
                          value={officialMandal}
                          onChange={(e) => { setOfficialMandal(e.target.value); setOfficialVillage(''); }}
                          className="w-full p-3 rounded-xl font-bold text-slate-800 border-2 outline-none focus:ring-2 focus:ring-offset-1"
                          style={{ borderColor: gold, backgroundColor: '#fffbeb' }}
                        >
                          <option value="">Mandal</option>
                          {Object.keys(TELANGANA_DATA[officialDistrict] ?? {}).sort().map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      )}
                      {officialMandal && (
                        <select
                          value={officialVillage}
                          onChange={(e) => setOfficialVillage(e.target.value)}
                          className="w-full p-3 rounded-xl font-bold text-slate-800 border-2 outline-none focus:ring-2 focus:ring-offset-1"
                          style={{ borderColor: gold, backgroundColor: '#fffbeb' }}
                        >
                          <option value="">Village</option>
                          {(TELANGANA_DATA[officialDistrict]?.[officialMandal] ?? []).sort().map((v) => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Always show both sign-in options for everyone */}
            <div className="mb-6">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 mt-2">Sign in with Mobile or Google</p>
              <button
                type="button"
                onClick={() => {
                  if (isOfficial && officialRole && officialDistrict && officialMandal && officialVillage) {
                    const pending: PendingOfficial = {
                      role: officialRole,
                      district: officialDistrict,
                      mandal: officialMandal,
                      village: officialVillage,
                    };
                    try {
                      localStorage.setItem(PENDING_OFFICIAL_KEY, JSON.stringify(pending));
                    } catch {
                      /* ignore */
                    }
                  }
                  navigate('/app');
                }}
                className="w-full text-white py-4 px-6 rounded-xl font-black text-sm uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 border-0 hover:opacity-95"
                style={{ background: `linear-gradient(90deg, ${maroon}, #8B0026)` }}
              >
                <Smartphone className="w-5 h-5" />
                Continue with Mobile
              </button>
              <p className="text-center text-slate-500 text-xs my-2">or</p>
              <button
                type="button"
                onClick={handleSignInWithGoogle}
                disabled={isLoading}
                className="w-full text-slate-800 py-3 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 border-2 transition-all hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #fef9c3, #fef3c7)', borderColor: gold }}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent" style={{ borderColor: maroon }} />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" style={{ color: maroon }} />
                    Sign in with Google
                  </>
                )}
              </button>
              {backendAvailable === false && (
                <p className="text-xs text-amber-700 mt-2 text-center">
                  Google needs <code className="bg-amber-100 px-1 rounded">npm run dev</code> and <code className="bg-amber-100 px-1 rounded">.dev.vars</code>. Use Mobile and enter OTP <strong>1234</strong> on the next screen.
                </p>
              )}
            </div>

            {error && (
              <div className="mt-4 bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-amber-900 font-semibold mb-1">Google sign-in setup</p>
                    <p className="text-amber-800 text-sm mb-3">{error}</p>
                    <ol className="text-sm text-amber-800 list-decimal list-inside space-y-1 mb-3">
                      <li><strong>Option A (recommended):</strong> In <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer noopener" className="font-semibold underline">Google Cloud Console</a> create an OAuth 2.0 Client ID (Web). Add redirect URI <code className="text-xs">http://localhost:5173/auth/callback</code>. In project root create <code className="bg-amber-100 px-1 rounded text-xs">.dev.vars</code> with <code className="block bg-amber-100 px-2 py-1 rounded mt-1 text-xs break-all">GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... GOOGLE_REDIRECT_URI=http://localhost:5173/auth/callback</code></li>
                      <li><strong>Option B:</strong> Or use <a href="https://getmocha.com/dashboard" target="_blank" rel="noreferrer noopener" className="font-semibold underline">getmocha.com</a> and set <code className="bg-amber-100 px-1 rounded text-xs">MOCHA_USERS_SERVICE_API_KEY=your_key</code> in <code className="bg-amber-100 px-1 rounded text-xs">.dev.vars</code>.</li>
                      <li>Run <code className="bg-amber-100 px-1 rounded text-xs">npm run dev</code> (not dev:local), then try again.</li>
                    </ol>
                    <Link to="/app" className="text-amber-800 text-sm font-semibold underline inline-block">
                      Continue with Mobile (OTP 1234) instead →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 text-center">
              <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
                <span
                  className="px-3 py-1 rounded-full font-semibold border"
                  style={{ backgroundColor: 'rgba(201,162,39,0.2)', color: gold, borderColor: 'rgba(201,162,39,0.4)' }}
                >
                  జై తెలంగాణ
                </span>
                <span
                  className="px-3 py-1 rounded-full font-semibold border"
                  style={{ backgroundColor: 'rgba(103,0,26,0.1)', color: maroon, borderColor: 'rgba(103,0,26,0.25)' }}
                >
                  Jai Telangana
                </span>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
