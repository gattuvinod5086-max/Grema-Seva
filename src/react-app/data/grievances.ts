const STORAGE_KEY = "grama_seva_grievances";

export type GrievancePriority = "Low" | "Medium" | "High";
export type GrievanceStatus = "Submitted" | "In Progress" | "Resolved";

export interface GrievanceRecord {
  id: string;
  category: string;
  description: string;
  priority: GrievancePriority;
  photoDataUrl: string | null;
  status: GrievanceStatus;
  createdAt: string;
  updatedAt: string;
  district?: string;
  mandal?: string;
  village?: string;
}

export function getGrievances(): GrievanceRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as GrievanceRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveGrievance(record: Omit<GrievanceRecord, "id" | "createdAt" | "updatedAt" | "status">): GrievanceRecord {
  const list = getGrievances();
  const now = new Date().toISOString();
  const newRecord: GrievanceRecord = {
    ...record,
    id: crypto.randomUUID(),
    status: "Submitted",
    createdAt: now,
    updatedAt: now,
  };
  list.unshift(newRecord);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return newRecord;
}

export function updateGrievanceStatus(id: string, status: GrievanceStatus): void {
  const list = getGrievances();
  const idx = list.findIndex((g) => g.id === id);
  if (idx === -1) return;
  list[idx] = { ...list[idx], status, updatedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
