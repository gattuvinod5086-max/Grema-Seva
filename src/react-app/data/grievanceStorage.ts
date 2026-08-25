const STORAGE_KEY = "grama_seva_grievances";

export type GrievancePriority = "Low" | "Medium" | "High";
export type GrievanceStatus = "Submitted" | "In Progress" | "Resolved";

export interface GrievanceRecord {
  id: string;
  category: string;
  description: string;
  priority: GrievancePriority;
  status: GrievanceStatus;
  photoDataUrl: string | null;
  location: string;
  createdAt: string;
  updatedAt: string;
}

export function getStoredGrievances(): GrievanceRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as GrievanceRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveGrievances(list: GrievanceRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function addGrievance(record: Omit<GrievanceRecord, "id" | "createdAt" | "updatedAt" | "status">): GrievanceRecord {
  const list = getStoredGrievances();
  const now = new Date().toISOString();
  const newRecord: GrievanceRecord = {
    ...record,
    id: crypto.randomUUID(),
    status: "Submitted",
    createdAt: now,
    updatedAt: now,
  };
  list.unshift(newRecord);
  saveGrievances(list);
  return newRecord;
}
