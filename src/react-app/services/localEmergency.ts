import {
  NATIONAL_EMERGENCY_SERVICES,
  WOMEN_CHILD_SUPPORT_SERVICES,
} from "@/shared/constants/emergency";
import {
  filterContactsForLocation,
  findNearestContact,
  findPrimaryContact,
  type EmergencyContactRecord,
  type UserEmergencyLocation,
} from "@/shared/services/emergencyLookup";
import { EmergencyMockDB, type PoliceStationRecord } from "@/react-app/data/emergencyData";
import { MOCK_PANCHAYAT } from "@/react-app/data/terminalData";

/** Public panchayat roles whose contact may be shown to citizens */
const PUBLIC_PANCHAYAT_ROLES = ["Sarpanch", "Upa-Sarpanch"];

export interface EmergencyBundle {
  national: typeof NATIONAL_EMERGENCY_SERVICES;
  womenChild: typeof WOMEN_CHILD_SUPPORT_SERVICES;
  police: PoliceStationRecord | undefined;
  health: {
    phc?: EmergencyContactRecord;
    hospital?: EmergencyContactRecord;
    nearest?: EmergencyContactRecord & { distance_km?: number };
  };
  fire?: EmergencyContactRecord;
  electricity?: EmergencyContactRecord;
  water?: EmergencyContactRecord;
  panchayat: EmergencyContactRecord[];
  localContacts: EmergencyContactRecord[];
  panchayatLeaders: typeof MOCK_PANCHAYAT;
  isDemoData: boolean;
}

export function getLocalEmergencyBundle(loc: UserEmergencyLocation): EmergencyBundle {
  const contacts = EmergencyMockDB.getContacts();
  const police = loc.district && loc.mandal && loc.village
    ? EmergencyMockDB.getPoliceForVillage(loc.district, loc.mandal, loc.village)
    : undefined;

  const lookupOpts = { requireVerification: false as const };

  const phc = findPrimaryContact(contacts, loc, "PHC", false);
  const hospital = findPrimaryContact(contacts, loc, "HOSPITAL", false);
  const nearest = findNearestContact(contacts, loc, ["HOSPITAL", "PHC"], false);
  const fire = findPrimaryContact(contacts, loc, "FIRE", false);
  const electricity = findPrimaryContact(contacts, loc, "ELECTRICITY", false);
  const water = findPrimaryContact(contacts, loc, "WATER", false);
  const panchayat = filterContactsForLocation(contacts, loc, { serviceType: "PANCHAYAT", ...lookupOpts });
  const localContacts = filterContactsForLocation(contacts, loc, lookupOpts)
    .filter((c) => !["WOMEN_SUPPORT", "CHILD_SUPPORT"].includes(c.service_type));

  const ward = loc.ward;
  const panchayatLeaders = MOCK_PANCHAYAT.filter((l) => {
    if (!PUBLIC_PANCHAYAT_ROLES.includes(l.role)) {
      if (ward && l.role === "Ward Member" && l.ward === ward) return true;
      return false;
    }
    return true;
  });

  const isDemoData = contacts.some((c) => c.isDemoData) || !!police?.isDemoData;

  return {
    national: NATIONAL_EMERGENCY_SERVICES,
    womenChild: WOMEN_CHILD_SUPPORT_SERVICES,
    police,
    health: { phc, hospital, nearest },
    fire,
    electricity,
    water,
    panchayat,
    localContacts,
    panchayatLeaders,
    isDemoData,
  };
}

export function searchLocalContacts(
  loc: UserEmergencyLocation,
  query: string,
  serviceType?: string
): EmergencyContactRecord[] {
  const q = query.toLowerCase();
  return filterContactsForLocation(EmergencyMockDB.getContacts(), loc, {
    serviceType,
    requireVerification: false,
  }).filter(
    (c) =>
      !q ||
      c.name.toLowerCase().includes(q) ||
      (c.description ?? "").toLowerCase().includes(q) ||
      c.service_type.toLowerCase().includes(q)
  );
}
