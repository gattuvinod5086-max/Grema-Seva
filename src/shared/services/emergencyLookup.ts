import type { EmergencyScope, EmergencyServiceType } from "@/shared/constants/emergency";

export interface EmergencyContactRecord {
  id: string | number;
  name: string;
  service_type: string;
  description?: string | null;
  phone: string;
  alternate_phone?: string | null;
  district?: string | null;
  mandal?: string | null;
  village?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  jurisdiction?: string | null;
  scope: string;
  is_emergency?: boolean | number;
  is_active?: boolean | number;
  verified_at?: string | null;
  verified_by?: string | null;
  source?: string | null;
  isDemoData?: boolean;
}

export interface UserEmergencyLocation {
  district?: string | null;
  mandal?: string | null;
  village?: string | null;
  ward?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

function isActive(c: EmergencyContactRecord): boolean {
  return c.is_active !== false && c.is_active !== 0;
}

function isVerified(c: EmergencyContactRecord, requireVerification: boolean): boolean {
  if (!requireVerification) return true;
  return !!c.verified_at || !!c.isDemoData;
}

function matchesScope(
  contact: EmergencyContactRecord,
  loc: UserEmergencyLocation
): boolean {
  const scope = (contact.scope ?? "VILLAGE") as EmergencyScope;
  if (scope === "STATE") return true;
  if (scope === "DISTRICT") {
    return !contact.district || !loc.district || contact.district === loc.district;
  }
  if (scope === "MANDAL") {
    if (contact.district && loc.district && contact.district !== loc.district) return false;
    return !contact.mandal || !loc.mandal || contact.mandal === loc.mandal;
  }
  if (contact.district && loc.district && contact.district !== loc.district) return false;
  if (contact.mandal && loc.mandal && contact.mandal !== loc.mandal) return false;
  return !contact.village || !loc.village || contact.village === loc.village;
}

export function filterContactsForLocation(
  contacts: EmergencyContactRecord[],
  loc: UserEmergencyLocation,
  options?: { serviceType?: EmergencyServiceType | string; requireVerification?: boolean }
): EmergencyContactRecord[] {
  const requireVerification = options?.requireVerification ?? true;
  return contacts
    .filter(isActive)
    .filter((c) => isVerified(c, requireVerification))
    .filter((c) => matchesScope(c, loc))
    .filter((c) => !options?.serviceType || c.service_type === options.serviceType)
    .sort((a, b) => scopeRank(a.scope) - scopeRank(b.scope));
}

function scopeRank(scope: string): number {
  switch (scope) {
    case "VILLAGE": return 0;
    case "MANDAL": return 1;
    case "DISTRICT": return 2;
    case "STATE": return 3;
    default: return 4;
  }
}

export function findPrimaryContact(
  contacts: EmergencyContactRecord[],
  loc: UserEmergencyLocation,
  serviceType: EmergencyServiceType | string,
  requireVerification = true
): EmergencyContactRecord | undefined {
  const matches = filterContactsForLocation(contacts, loc, { serviceType, requireVerification });
  return matches[0];
}

/** Haversine distance in km */
export function distanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findNearestContact(
  contacts: EmergencyContactRecord[],
  loc: UserEmergencyLocation,
  serviceTypes: string[],
  requireVerification = true
): (EmergencyContactRecord & { distance_km?: number }) | undefined {
  if (loc.latitude == null || loc.longitude == null) {
    for (const st of serviceTypes) {
      const c = findPrimaryContact(contacts, loc, st, requireVerification);
      if (c) return c;
    }
    return undefined;
  }

  let best: (EmergencyContactRecord & { distance_km?: number }) | undefined;
  for (const c of filterContactsForLocation(contacts, loc, { requireVerification })) {
    if (!serviceTypes.includes(c.service_type)) continue;
    if (c.latitude == null || c.longitude == null) continue;
    const d = distanceKm(loc.latitude, loc.longitude, c.latitude, c.longitude);
    if (!best || d < (best.distance_km ?? Infinity)) {
      best = { ...c, distance_km: Math.round(d * 10) / 10 };
    }
  }
  if (best) return best;
  for (const st of serviceTypes) {
    const c = findPrimaryContact(contacts, loc, st, requireVerification);
    if (c) return c;
  }
  return undefined;
}

export function formatTelLink(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `tel:+91${digits}`;
  if (digits.startsWith("91") && digits.length === 12) return `tel:+${digits}`;
  return `tel:${digits}`;
}
