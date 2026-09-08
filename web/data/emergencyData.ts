import type { EmergencyContactRecord } from "@shared/services/emergencyLookup";

export interface PoliceStationRecord {
  id: string | number;
  name: string;
  district?: string | null;
  mandal?: string | null;
  address?: string | null;
  phone?: string | null;
  alternate_phone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  jurisdiction?: string | null;
  is_active?: boolean | number;
  verified_at?: string | null;
  verified_by?: string | null;
  source?: string | null;
  isDemoData?: boolean;
}

export interface VillagePoliceMapping {
  id: string | number;
  district: string;
  mandal: string;
  village: string;
  police_station_id: string | number;
}

export const EMERGENCY_STORAGE_KEY = "tg_grama_seva_emergency";
export const EMERGENCY_DEMO_SEEDED_KEY = "tg_grama_seva_emergency_demo";

interface EmergencyStore {
  contacts: EmergencyContactRecord[];
  policeStations: PoliceStationRecord[];
  villagePoliceMapping: VillagePoliceMapping[];
}

function readStore(): EmergencyStore {
  try {
    const raw = localStorage.getItem(EMERGENCY_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as EmergencyStore;
  } catch {
    /* ignore */
  }
  return { contacts: [], policeStations: [], villagePoliceMapping: [] };
}

function writeStore(store: EmergencyStore) {
  localStorage.setItem(EMERGENCY_STORAGE_KEY, JSON.stringify(store));
}

/** DEMO placeholder phone — not for real emergency use */
const DEMO_PHONE = "9000000000";

function createDemoStore(district: string, mandal: string, village: string): EmergencyStore {
  const psId = "ps-bhongir-demo";
  const policeStations: PoliceStationRecord[] = [
    {
      id: psId,
      name: `${mandal || "Town"} Police Station`,
      district: district || "Yadadri Bhuvanagiri",
      mandal: mandal || "Bhongir",
      address: `Near ${mandal || "Town"} Bus Stand`,
      phone: DEMO_PHONE,
      alternate_phone: "9000000001",
      latitude: 17.5155,
      longitude: 78.8856,
      jurisdiction: `${mandal || "Local"} mandal and surrounding villages`,
      is_active: true,
      verified_at: null,
      source: "Telangana Police directory",
      isDemoData: true,
    },
  ];

  const villagePoliceMapping: VillagePoliceMapping[] = [
    { id: "vpm-1", district, mandal, village, police_station_id: psId },
  ];

  const contacts: EmergencyContactRecord[] = [
    {
      id: "ec-phc-1",
      name: `${mandal || "Mandal"} Primary Health Centre (PHC)`,
      service_type: "PHC",
      description: "Primary health centre facility",
      phone: DEMO_PHONE,
      district,
      mandal,
      village,
      address: `Near Mandal HQ, ${mandal || "Telangana"}`,
      latitude: 17.52,
      longitude: 78.88,
      scope: "VILLAGE",
      is_emergency: true,
      is_active: true,
      verified_at: null,
      source: "Health facility registry",
      isDemoData: true,
    },
    {
      id: "ec-hosp-1",
      name: `${district || "District"} Government Hospital`,
      service_type: "HOSPITAL",
      description: "Area Government hospital",
      phone: "9000000002",
      district,
      mandal,
      address: `${mandal || "Town"} Main Road`,
      latitude: 17.518,
      longitude: 78.89,
      scope: "DISTRICT",
      is_emergency: true,
      is_active: true,
      verified_at: null,
      source: "Telangana Health Services",
      isDemoData: true,
    },
    {
      id: "ec-fire-1",
      name: `${mandal || "Town"} Fire Station`,
      service_type: "FIRE",
      phone: "9000000003",
      district,
      mandal,
      address: "Fire Station Road",
      latitude: 17.516,
      longitude: 78.884,
      scope: "MANDAL",
      is_emergency: true,
      is_active: true,
      verified_at: null,
      source: "Telangana Fire Services",
      isDemoData: true,
    },
    {
      id: "ec-elec-1",
      name: "TGSPDCL Electricity Emergency",
      service_type: "ELECTRICITY",
      description: "Electricity breakdown and line emergency helpline",
      phone: "1912",
      district,
      scope: "STATE",
      is_emergency: true,
      is_active: true,
      verified_at: "2026-08-01T00:00:00.000Z",
      verified_by: "tgspdcl-config",
      source: "TGSPDCL Helpline 1912",
      isDemoData: false,
    },
    {
      id: "ec-water-1",
      name: "Mission Bhagiratha / Water Supply",
      service_type: "WATER",
      description: "Drinking water supply grievance and emergency support",
      phone: DEMO_PHONE,
      district,
      mandal,
      village,
      scope: "MANDAL",
      is_emergency: true,
      is_active: true,
      verified_at: null,
      source: "Mission Bhagiratha Helpline",
      isDemoData: true,
    },
    {
      id: "ec-panch-1",
      name: `${village || "Gram"} Panchayat Office`,
      service_type: "PANCHAYAT",
      phone: DEMO_PHONE,
      district,
      mandal,
      village,
      scope: "VILLAGE",
      is_emergency: false,
      is_active: true,
      verified_at: null,
      source: "Panchayat Raj Department",
      isDemoData: true,
    },
  ];

  return { contacts, policeStations, villagePoliceMapping };
}

export const EmergencyMockDB = {
  getStore: (): EmergencyStore => readStore(),

  seedDemo: (village: string, district: string, mandal: string) => {
    const store = readStore();
    const needsSeed =
      !localStorage.getItem(EMERGENCY_DEMO_SEEDED_KEY) ||
      store.contacts.length === 0 ||
      store.policeStations.length === 0;

    if (needsSeed) {
      writeStore(createDemoStore(district, mandal, village));
      localStorage.setItem(EMERGENCY_DEMO_SEEDED_KEY, "1");
      return;
    }

    const hasMapping = store.villagePoliceMapping.some(
      (m) => m.district === district && m.mandal === mandal && m.village === village
    );
    if (!hasMapping && store.policeStations.length > 0) {
      store.villagePoliceMapping.push({
        id: `vpm-${village}-${Date.now()}`,
        district,
        mandal,
        village,
        police_station_id: store.policeStations[0].id,
      });
    }

    const hasVillagePhc = store.contacts.some(
      (c) => c.service_type === "PHC" && c.village === village && c.mandal === mandal
    );
    if (!hasVillagePhc) {
      const demo = createDemoStore(district, mandal, village);
      const newContacts = demo.contacts.filter(
        (c) => c.scope === "VILLAGE" || (c.scope === "MANDAL" && c.mandal === mandal)
      );
      store.contacts.push(...newContacts);
      store.villagePoliceMapping.push(
        ...demo.villagePoliceMapping.filter(
          (m) => !store.villagePoliceMapping.some(
            (e) => e.village === m.village && e.mandal === m.mandal
          )
        )
      );
    }

    writeStore(store);
  },

  getContacts: (): EmergencyContactRecord[] => readStore().contacts,

  getContactById: (id: string | number): EmergencyContactRecord | undefined =>
    readStore().contacts.find((c) => String(c.id) === String(id)),

  saveContact: (contact: EmergencyContactRecord) => {
    const store = readStore();
    const idx = store.contacts.findIndex((c) => String(c.id) === String(contact.id));
    if (idx >= 0) store.contacts[idx] = contact;
    else store.contacts.unshift(contact);
    writeStore(store);
  },

  deleteContact: (id: string | number) => {
    const store = readStore();
    store.contacts = store.contacts.filter((c) => String(c.id) !== String(id));
    writeStore(store);
  },

  getPoliceStations: (): PoliceStationRecord[] => readStore().policeStations,

  getPoliceForVillage: (
    district: string,
    mandal: string,
    village: string
  ): PoliceStationRecord | undefined => {
    const store = readStore();
    const mapping = store.villagePoliceMapping.find(
      (m) => m.district === district && m.mandal === mandal && m.village === village
    );
    if (!mapping) {
      const fallback = store.villagePoliceMapping.find(
        (m) => m.district === district && m.mandal === mandal
      );
      if (fallback) {
        return store.policeStations.find((p) => String(p.id) === String(fallback.police_station_id));
      }
      return undefined;
    }
    return store.policeStations.find((p) => String(p.id) === String(mapping.police_station_id));
  },
};
