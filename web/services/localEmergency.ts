import {
  NATIONAL_EMERGENCY_SERVICES,
  WOMEN_CHILD_SUPPORT_SERVICES,
} from "@shared/constants/emergency";
import {
  filterContactsForLocation,
  findNearestContact,
  findPrimaryContact,
  type EmergencyContactRecord,
  type UserEmergencyLocation,
} from "@shared/services/emergencyLookup";
import { EmergencyMockDB, type PoliceStationRecord } from "@web/data/emergencyData";

export interface PanchayatLeader {
  id: string;
  name: string;
  role: string;
  ward: string;
  phone: string;
  bio?: string;
}

export const MOCK_PANCHAYAT_LEADERS: PanchayatLeader[] = [
  {
    id: "L-0",
    name: "M. Ramesh Babu",
    role: "Sarpanch",
    ward: "All",
    phone: "9848012345",
    bio: "Panchayat Head, village administration and grievance monitoring.",
  },
  {
    id: "L-1",
    name: "Smt. Kavitha Reddy",
    role: "Upa-Sarpanch",
    ward: "All",
    phone: "9848056789",
    bio: "Women and child welfare, primary education oversight.",
  },
];

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
  panchayatLeaders: PanchayatLeader[];
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
    panchayatLeaders: MOCK_PANCHAYAT_LEADERS,
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
      c.name.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q))
  );
}
