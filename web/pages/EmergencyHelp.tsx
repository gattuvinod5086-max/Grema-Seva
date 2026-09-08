import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, Siren, MapPin } from "lucide-react";
import EmergencyHome from "@web/components/emergency/EmergencyHome";
import { EmergencyMockDB } from "@web/data/emergencyData";
import { getLocalEmergencyBundle, searchLocalContacts } from "@web/services/localEmergency";
import { useApi } from "@web/hooks/useApi";
import type { User } from "@shared/types";
import type { UserEmergencyLocation, EmergencyContactRecord } from "@shared/services/emergencyLookup";
import { getDistrictNames, getMandalNames, getVillageNames } from "@shared/data/telangana";
import { BRANDING } from "@web/constants/branding";

const DEFAULT_DEMO_LOC: UserEmergencyLocation = {
  district: "Yadadri Bhuvanagiri",
  mandal: "Bhongir",
  village: "Bhongir City",
};

export default function EmergencyHelp() {
  const navigate = useNavigate();
  const { data: userResp } = useApi<{ user: User }>("/api/users/me");
  const user = userResp?.user;

  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedMandal, setSelectedMandal] = useState<string>("");
  const [selectedVillage, setSelectedVillage] = useState<string>("");

  const [gpsLoading, setGpsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<EmergencyContactRecord[] | undefined>();

  useEffect(() => {
    if (user?.village) {
      setSelectedDistrict(user.district || DEFAULT_DEMO_LOC.district!);
      setSelectedMandal(user.mandal || DEFAULT_DEMO_LOC.mandal!);
      setSelectedVillage(user.village || DEFAULT_DEMO_LOC.village!);
    } else {
      setSelectedDistrict(DEFAULT_DEMO_LOC.district!);
      setSelectedMandal(DEFAULT_DEMO_LOC.mandal!);
      setSelectedVillage(DEFAULT_DEMO_LOC.village!);
    }
  }, [user]);

  const loc: UserEmergencyLocation = useMemo(() => ({
    district: selectedDistrict,
    mandal: selectedMandal,
    village: selectedVillage,
    ward: user?.wardNumber ?? undefined,
  }), [selectedDistrict, selectedMandal, selectedVillage, user?.wardNumber]);

  useEffect(() => {
    if (loc.village && loc.district && loc.mandal) {
      EmergencyMockDB.seedDemo(loc.village, loc.district, loc.mandal);
    }
  }, [loc.village, loc.district, loc.mandal]);

  const bundle = useMemo(() => getLocalEmergencyBundle(loc), [loc]);

  const handleGps = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      () => {
        setGpsLoading(false);
      },
      () => setGpsLoading(false)
    );
  };

  return (
    <div className="min-h-screen relative pb-16" style={{ background: "var(--tg-gradient-page)" }}>
      {/* Map watermark */}
      <div
        className="absolute inset-0 pointer-events-none bg-cover bg-center opacity-[0.04]"
        style={{ backgroundImage: `url(${BRANDING.bgMap})` }}
        aria-hidden
      />

      {/* Top emergency header */}
      <header className="sticky top-0 z-30 shadow-md border-b-2 border-[#CCB252]" style={{ background: "var(--tg-gradient-header)" }}>
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white"
              aria-label="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white shadow">
                <Siren size={20} />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight leading-tight">Emergency & Help Directory</h1>
                <p className="text-[10px] font-bold text-[#CCB252] uppercase tracking-widest">
                  తెలంగాణ అత్యవసర సేవలు · 24/7 Response
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <Link
                to="/"
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#CCB252] text-[#67001A] hover:opacity-95"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 relative z-10 space-y-6">
        {/* Location display: Locked for citizens, selector for guests / admins */}
        {user?.role === "citizen" && user?.village ? (
          <section className="bg-white rounded-2xl border-2 border-slate-200 p-4 shadow-sm flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5 text-slate-800">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <MapPin size={20} className="text-[#008A3B]" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Your Registered Village Jurisdiction</p>
                <p className="text-sm font-bold text-slate-900">{user.village}, {user.mandal}, {user.district} District</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-800">
              Local PHC, 108 & Police Mapped
            </span>
          </section>
        ) : (
          <section className="bg-white rounded-2xl border-2 border-slate-200 p-4 shadow-sm">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <MapPin size={14} className="text-[#008A3B]" /> Select District & Mandal for local hospital and police station:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select
                value={selectedDistrict}
                onChange={(e) => {
                  setSelectedDistrict(e.target.value);
                  setSelectedMandal("");
                  setSelectedVillage("");
                }}
                className="p-2.5 rounded-xl border border-slate-300 font-semibold text-sm outline-none focus:border-[#67001A]"
              >
                <option value="">Select District</option>
                {getDistrictNames().map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              <select
                value={selectedMandal}
                onChange={(e) => {
                  setSelectedMandal(e.target.value);
                  setSelectedVillage("");
                }}
                disabled={!selectedDistrict}
                className="p-2.5 rounded-xl border border-slate-300 font-semibold text-sm outline-none focus:border-[#67001A] disabled:opacity-50"
              >
                <option value="">Select Mandal</option>
                {selectedDistrict && getMandalNames(selectedDistrict).map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>

              <select
                value={selectedVillage}
                onChange={(e) => setSelectedVillage(e.target.value)}
                disabled={!selectedMandal}
                className="p-2.5 rounded-xl border border-slate-300 font-semibold text-sm outline-none focus:border-[#67001A] disabled:opacity-50"
              >
                <option value="">Select Village</option>
                {selectedDistrict && selectedMandal && getVillageNames(selectedDistrict, selectedMandal).map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </section>
        )}

        <EmergencyHome
          location={loc}
          bundle={bundle}
          isDemoMode={bundle.isDemoData}
          onUseGps={handleGps}
          gpsLoading={gpsLoading}
          onReportIssue={!user ? () => navigate("/login") : user.role === "citizen" ? (category, priority) => {
            navigate(`/board?category=${encodeURIComponent(category)}&priority=${encodeURIComponent(priority)}`);
          } : undefined}
          onSearch={(q, type) => setSearchResults(searchLocalContacts(loc, q, type))}
          searchResults={searchResults}
        />
      </main>
    </div>
  );
}
