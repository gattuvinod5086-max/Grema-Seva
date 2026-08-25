/** Emergency service types for contact records */
export const EMERGENCY_SERVICE_TYPES = [
  "POLICE",
  "AMBULANCE",
  "HOSPITAL",
  "PHC",
  "FIRE",
  "ELECTRICITY",
  "WATER",
  "PANCHAYAT",
  "WOMEN_SUPPORT",
  "CHILD_SUPPORT",
  "DISASTER",
  "OTHER",
] as const;
export type EmergencyServiceType = (typeof EMERGENCY_SERVICE_TYPES)[number];

export const EMERGENCY_SCOPES = ["STATE", "DISTRICT", "MANDAL", "VILLAGE"] as const;
export type EmergencyScope = (typeof EMERGENCY_SCOPES)[number];

/** Verified national emergency services — verify before production deployment */
export interface NationalEmergencyService {
  id: string;
  name: string;
  number: string;
  description: string;
  availability: string;
  source: string;
  scope: EmergencyScope;
  service_type: EmergencyServiceType;
}

/**
 * Central configurable national/state emergency numbers.
 * Source references included; admin should verify current numbers before production.
 */
export const NATIONAL_EMERGENCY_SERVICES: NationalEmergencyService[] = [
  {
    id: "nat-112",
    name: "Emergency Response (112)",
    number: "112",
    description: "All-in-one emergency number in India for police, fire, and medical emergencies.",
    availability: "24/7",
    source: "Government of India — ERSS / 112 (verify locally before production)",
    scope: "STATE",
    service_type: "OTHER",
  },
  {
    id: "nat-108",
    name: "Ambulance / Emergency Medical (108)",
    number: "108",
    description: "Free ambulance and emergency medical assistance in Telangana.",
    availability: "24/7",
    source: "Telangana EMRI / 108 service (verify locally before production)",
    scope: "STATE",
    service_type: "AMBULANCE",
  },
  {
    id: "nat-100",
    name: "Police Emergency (100)",
    number: "100",
    description: "Legacy police emergency line; 112 is the unified number.",
    availability: "24/7",
    source: "Telangana Police (verify locally before production)",
    scope: "STATE",
    service_type: "POLICE",
  },
  {
    id: "nat-101",
    name: "Fire & Rescue (101)",
    number: "101",
    description: "Fire and rescue emergency.",
    availability: "24/7",
    source: "Telangana Fire Services (verify locally before production)",
    scope: "STATE",
    service_type: "FIRE",
  },
];

export const WOMEN_CHILD_SUPPORT_SERVICES: NationalEmergencyService[] = [
  {
    id: "wom-181",
    name: "Women Helpline",
    number: "181",
    description: "24/7 women support helpline.",
    availability: "24/7",
    source: "Ministry of WCD — verify before production",
    scope: "STATE",
    service_type: "WOMEN_SUPPORT",
  },
  {
    id: "child-1098",
    name: "Childline",
    number: "1098",
    description: "Emergency helpline for children in need of care and protection.",
    availability: "24/7",
    source: "Ministry of WCD — verify before production",
    scope: "STATE",
    service_type: "CHILD_SUPPORT",
  },
];

export const EMERGENCY_ADMIN_ROLES = ["admin", "sarpanch", "mandal_official"] as const;

export function canManageEmergencyContacts(role: string): boolean {
  return (EMERGENCY_ADMIN_ROLES as readonly string[]).includes(role);
}

export function mapTerminalRoleToEmergencyApi(role: string): string {
  const map: Record<string, string> = {
    Admin: "admin",
    Sarpanch: "sarpanch",
    "Mandal Official": "mandal_official",
    "Ward Member": "ward_member",
    Citizen: "citizen",
  };
  return map[role] ?? role.toLowerCase().replace(/\s+/g, "_");
}

/** Issue category mapping for report integration */
export const EMERGENCY_ISSUE_CATEGORY: Record<string, { category: string; priority: string }> = {
  WATER: { category: "Water", priority: "HIGH" },
  ELECTRICITY: { category: "Electricity", priority: "HIGH" },
  ROADS: { category: "Roads", priority: "HIGH" },
  SANITATION: { category: "Sanitation", priority: "HIGH" },
};
