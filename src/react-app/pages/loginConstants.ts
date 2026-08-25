export const PENDING_OFFICIAL_KEY = "gramaseva_official_pending";
export const OFFICIAL_ROLES = ["Admin", "Sarpanch", "Ward Member", "Upasarpanch"] as const;
export type OfficialRole = (typeof OFFICIAL_ROLES)[number];

export interface PendingOfficial {
  role: OfficialRole;
  district: string;
  mandal: string;
  village: string;
}
