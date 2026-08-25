import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import EmergencyHome from "@/react-app/components/emergency/EmergencyHome";
import { EmergencyMockDB, type PoliceStationRecord } from "@/react-app/data/emergencyData";
import { DB_KEYS, MockDB } from "@/react-app/data/terminalData";
import { NewsMockDB } from "@/react-app/data/newsData";
import { getLocalEmergencyBundle, searchLocalContacts } from "@/react-app/services/localEmergency";
import { useApi } from "@/react-app/hooks/useApi";
import type { News } from "@/shared/types";
import type { UserEmergencyLocation } from "@/shared/services/emergencyLookup";
import {
  NATIONAL_EMERGENCY_SERVICES,
  WOMEN_CHILD_SUPPORT_SERVICES,
} from "@/shared/constants/emergency";
import {
  filterContactsForLocation,
  findNearestContact,
  findPrimaryContact,
  type EmergencyContactRecord,
} from "@/shared/services/emergencyLookup";

/** Default demo location when user is not logged in (local mode) */
const DEFAULT_DEMO_LOC: UserEmergencyLocation = {
  district: "Yadadri Bhuvanagiri",
  mandal: "Bhongir",
  village: "Bhongir City",
};

function buildApiBundle(
  loc: UserEmergencyLocation,
  contacts: EmergencyContactRecord[],
  police: PoliceStationRecord | null | undefined
) {
  const phc = findPrimaryContact(contacts, loc, "PHC");
  const hospital = findPrimaryContact(contacts, loc, "HOSPITAL");
  const nearest = findNearestContact(contacts, loc, ["HOSPITAL", "PHC"]);
  return {
    national: NATIONAL_EMERGENCY_SERVICES,
    womenChild: WOMEN_CHILD_SUPPORT_SERVICES,
    police: police ?? undefined,
    health: { phc, hospital, nearest },
    fire: findPrimaryContact(contacts, loc, "FIRE"),
    electricity: findPrimaryContact(contacts, loc, "ELECTRICITY"),
    water: findPrimaryContact(contacts, loc, "WATER"),
    panchayat: filterContactsForLocation(contacts, loc, { serviceType: "PANCHAYAT" }),
    localContacts: filterContactsForLocation(contacts, loc),
    panchayatLeaders: [],
    isDemoData: contacts.length === 0,
  };
}

function buildNationalOnlyBundle(): ReturnType<typeof buildApiBundle> {
  return {
    national: NATIONAL_EMERGENCY_SERVICES,
    womenChild: WOMEN_CHILD_SUPPORT_SERVICES,
    police: undefined,
    health: { phc: undefined, hospital: undefined, nearest: undefined },
    fire: undefined,
    electricity: undefined,
    water: undefined,
    panchayat: [],
    localContacts: [],
    panchayatLeaders: [],
    isDemoData: true,
  };
}

export default function EmergencyHomePage() {
  const isLocal = __GRAMA_LOCAL_DEV__;
  const localUser = isLocal ? MockDB.getUserByPhone(localStorage.getItem(DB_KEYS.SESSION) ?? "") : null;

  const { data: apiUser, isLoading: userLoading } = useApi<{
    district?: string;
    mandal?: string;
    village?: string;
    ward?: string;
    role?: string;
  }>("/api/users/me", { enabled: !isLocal });

  const baseLoc: UserEmergencyLocation =
    isLocal && localUser
      ? {
          district: localUser.district,
          mandal: localUser.mandal,
          village: localUser.village,
          ward: localUser.ward,
        }
      : !isLocal && apiUser?.village
        ? {
            district: apiUser.district,
            mandal: apiUser.mandal,
            village: apiUser.village,
            ward: apiUser.ward,
          }
        : isLocal
          ? DEFAULT_DEMO_LOC
          : {};

  const [loc, setLoc] = useState<UserEmergencyLocation>(baseLoc);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<EmergencyContactRecord[] | undefined>();
  const [seedReady, setSeedReady] = useState(false);

  useEffect(() => {
    setLoc(baseLoc);
  }, [baseLoc.district, baseLoc.mandal, baseLoc.village, baseLoc.ward]);

  useEffect(() => {
    if (!isLocal) {
      setSeedReady(true);
      return;
    }
    const v = localUser?.village ?? DEFAULT_DEMO_LOC.village!;
    const d = localUser?.district ?? DEFAULT_DEMO_LOC.district!;
    const m = localUser?.mandal ?? DEFAULT_DEMO_LOC.mandal!;
    EmergencyMockDB.seedDemo(v, d, m);
    setSeedReady(true);
  }, [isLocal, localUser]);

  const locParams = new URLSearchParams({
    district: loc.district ?? "",
    mandal: loc.mandal ?? "",
    village: loc.village ?? "",
    ...(loc.latitude != null ? { lat: String(loc.latitude), lng: String(loc.longitude ?? "") } : {}),
  }).toString();

  const {
    data: apiContacts,
    isLoading: contactsLoading,
    error: contactsError,
  } = useApi<EmergencyContactRecord[]>(`/api/emergency/contacts?${locParams}`, {
    enabled: !isLocal && !!loc.village,
  });
  const { data: apiPolice } = useApi<PoliceStationRecord | null>(
    `/api/emergency/police?${locParams}`,
    { enabled: !isLocal && !!loc.village }
  );
  const { data: apiNews } = useApi<News[]>("/api/news", { enabled: !isLocal });

  const localBundle = useMemo(() => {
    if (!isLocal || !seedReady) return null;
    return getLocalEmergencyBundle(loc);
  }, [isLocal, seedReady, loc]);

  const apiBundle = useMemo(() => {
    if (isLocal) return null;
    if (!loc.village) return buildNationalOnlyBundle();
    if (contactsLoading) return null;
    return buildApiBundle(loc, apiContacts ?? [], apiPolice ?? undefined);
  }, [isLocal, loc, apiContacts, apiPolice, contactsLoading]);

  const bundle = localBundle ?? apiBundle;

  const alerts = useMemo(() => {
    if (isLocal) {
      return NewsMockDB.getAll()
        .filter(
          (n) =>
            n.priority === "URGENT" &&
            (n.category === "Emergency" || n.title_en.toLowerCase().includes("emergency"))
        )
        .map((n) => ({
          id: n.id,
          title: n.title_en,
          description: n.short_description_en,
          priority: n.priority,
          publishedBy: n.author_name,
        }));
    }
    return (apiNews ?? [])
      .filter((n) => n.priority === "URGENT" && n.category === "Emergency")
      .map((n) => ({
        id: n.id,
        title: n.title_en,
        description: n.short_description_en ?? undefined,
        priority: n.priority,
        publishedBy: n.author_name ?? undefined,
      }));
  }, [isLocal, apiNews]);

  const handleGps = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoc((l) => ({
          ...l,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }));
        setGpsLoading(false);
      },
      () => setGpsLoading(false)
    );
  };

  const handleSearch = (q: string, type?: string) => {
    if (isLocal) {
      setSearchResults(searchLocalContacts(loc, q, type));
    }
  };

  if (!bundle) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <p className="text-[#64748B] font-semibold">Loading emergency contacts…</p>
      </div>
    );
  }

  const showNoVillageHint = !isLocal && !userLoading && !apiUser?.village;
  const showApiError = !isLocal && contactsError && !contactsLoading;

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-heading text-[#67001A]">Emergency & Help</h1>
            <p className="text-sm text-[#64748B]">Verified contacts for your area</p>
          </div>
          <Link to={isLocal ? "/app" : "/"} className="text-xs font-semibold text-[#64748B] whitespace-nowrap">
            ← Back
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        {showNoVillageHint && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Set your village in profile to see local emergency contacts. National numbers (112, 108) are always available below.
          </div>
        )}
        {showApiError && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Local contacts could not be loaded from the server. National emergency numbers are still available.
          </div>
        )}
        {isLocal && !localUser && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            Showing demo contacts for {DEFAULT_DEMO_LOC.village}. Log in to the terminal for contacts matched to your village.
          </div>
        )}

        <EmergencyHome
          location={loc}
          bundle={bundle}
          alerts={alerts}
          isDemoMode={bundle.isDemoData || isLocal}
          onUseGps={handleGps}
          gpsLoading={gpsLoading}
          onSearch={isLocal ? handleSearch : undefined}
          searchResults={searchResults}
          onReportIssue={(category, priority) => {
            if (isLocal) {
              window.location.href = `/app?category=${encodeURIComponent(category)}&priority=${encodeURIComponent(priority)}`;
            } else {
              window.location.href = `/?category=${encodeURIComponent(category)}&priority=${encodeURIComponent(priority)}`;
            }
          }}
          showManageLink={!isLocal && (apiUser?.role === "admin" || apiUser?.role === "sarpanch")}
          onManage={() => {
            window.location.href = "/emergency/manage";
          }}
        />
      </main>
    </div>
  );
}
