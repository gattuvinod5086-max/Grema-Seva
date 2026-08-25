import { useEffect, useMemo, useState } from "react";
import EmergencyHome from "@/react-app/components/emergency/EmergencyHome";
import { EmergencyMockDB } from "@/react-app/data/emergencyData";
import { NewsMockDB } from "@/react-app/data/newsData";
import { getLocalEmergencyBundle, searchLocalContacts } from "@/react-app/services/localEmergency";
import { canManageEmergencyContacts, mapTerminalRoleToEmergencyApi } from "@/shared/constants/emergency";
import type { AppUser } from "@/react-app/data/terminalData";
import type { UserEmergencyLocation } from "@/shared/services/emergencyLookup";
import type { EmergencyContactRecord } from "@/shared/services/emergencyLookup";
import { TerminalEmergencyManage } from "./TerminalEmergencyManage";

export function TerminalEmergency({
  user,
  onReportIssue,
  onManage,
}: {
  user: AppUser;
  onReportIssue?: (category: string, priority: string) => void;
  onManage?: () => void;
}) {
  const [loc, setLoc] = useState<UserEmergencyLocation>({
    district: user.district,
    mandal: user.mandal,
    village: user.village,
    ward: user.ward,
  });
  const [gpsLoading, setGpsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<EmergencyContactRecord[] | undefined>();

  useEffect(() => {
    EmergencyMockDB.seedDemo(user.village, user.district, user.mandal);
  }, [user.village, user.district, user.mandal]);

  const bundle = useMemo(() => getLocalEmergencyBundle(loc), [loc]);

  const alerts = useMemo(
    () =>
      NewsMockDB.getAll()
        .filter((n) => n.priority === "URGENT" && (n.category === "Emergency" || n.title_en.toLowerCase().includes("emergency")))
        .map((n) => ({
          id: n.id,
          title: n.title_en,
          description: n.short_description_en,
          priority: n.priority,
          publishedBy: n.author_name,
        })),
    []
  );

  const canManage = canManageEmergencyContacts(mapTerminalRoleToEmergencyApi(user.role));

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

  return (
    <EmergencyHome
      location={loc}
      bundle={bundle}
      alerts={alerts}
      isDemoMode={bundle.isDemoData}
      onUseGps={handleGps}
      gpsLoading={gpsLoading}
      onReportIssue={onReportIssue}
      onSearch={(q, type) => setSearchResults(searchLocalContacts(loc, q, type))}
      searchResults={searchResults}
      showManageLink={canManage}
      onManage={onManage}
    />
  );
}

export { TerminalEmergencyManage };
