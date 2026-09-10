import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Home, LogIn, Siren } from "lucide-react";
import EmergencyHome from "@web/components/emergency/EmergencyHome";
import { EmergencyMockDB } from "@web/data/emergencyData";
import { getLocalEmergencyBundle, searchLocalContacts } from "@web/services/localEmergency";
import { useApi } from "@web/hooks/useApi";
import type { User } from "@shared/types";
import type { UserEmergencyLocation, EmergencyContactRecord } from "@shared/services/emergencyLookup";

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
    <div className="min-h-screen relative pb-16 bg-[#FAF9F6]">
      {/* Top Header & Navigation matching Screenshot */}
      <header className="max-w-5xl mx-auto px-4 pt-8 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1
              className="text-3xl sm:text-4xl font-black text-[#67001A]"
              style={{ fontFamily: "Instrument Serif, Georgia, serif" }}
            >
              Emergency &amp; Help
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
              Verified contacts for your area
            </p>
          </div>

          {/* Navigation Pills */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <Link
              to="/app"
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-[11px] sm:text-xs font-black tracking-wider uppercase transition-all shadow-xs bg-[#67001A] text-white hover:bg-[#520015]"
            >
              <Home size={15} strokeWidth={2.5} />
              <span>GRAMSEVA HOME</span>
            </Link>

            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-[11px] sm:text-xs font-black tracking-wider uppercase transition-all shadow-xs bg-[#67001A] text-white hover:bg-[#520015]"
            >
              <LogIn size={15} strokeWidth={2.5} />
              <span>CITIZEN LOGIN</span>
            </Link>

            <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-[11px] sm:text-xs font-black tracking-wider uppercase shadow-xs bg-white text-red-700 border-2 border-red-300">
              <Siren size={15} strokeWidth={2.5} className="text-red-600" />
              <span>EMERGENCY &amp; HELP</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Emergency Content */}
      <main className="max-w-5xl mx-auto px-4 py-2 relative z-10">
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
