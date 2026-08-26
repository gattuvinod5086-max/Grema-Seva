import {
  buildTelanganaLookup,
  getDistrictNames,
  getMandalNames,
  getVillageNames,
  sanitizeGeoSelection,
} from "@/data/telangana";

export { getDistrictNames, getMandalNames, getVillageNames, sanitizeGeoSelection };

export type UserRole = "Citizen" | "Ward Member" | "Sarpanch" | "Upasarpanch" | "Admin" | "Mandal Official" | "District Official";
export type PriorityLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "Low" | "Medium" | "High";

export interface IssueAuditRecord {
  id: string;
  timestamp: string;
  action: string;
  actorName?: string;
  actorRole?: string;
  detail?: string;
}

export interface AppUser {
  id: string;
  name: string;
  role: UserRole;
  phone: string;
  district: string;
  mandal: string;
  village: string;
  ward: string;
  registeredAt: string;
}

export interface VillageIssue {
  id: string;
  citizenId: string;
  citizenName: string;
  category: string;
  description: string;
  status: "Submitted" | "Acknowledged" | "In Progress" | "Resolved" | "Closed" | "Reopened" | "SLA_BREACHED";
  priority: PriorityLevel;
  assignedToMemberName?: string;
  createdAt: string;
  updatedAt?: string;
  ward: string;
  village: string;
  district?: string;
  mandal?: string;
  photo?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  department?: string;
  slaHours?: number;
  slaDueAt?: string;
  acknowledgedAt?: string;
  assignedAt?: string;
  resolvedAt?: string;
  escalationLevel?: number;
  escalationStatus?: string;
  estimatedAffectedCitizens?: number | null;
  citizenConfirmationStatus?: "pending" | "confirmed" | "rejected";
  citizenConfirmedAt?: string;
  citizenRating?: number;
  citizenFeedback?: string;
  syncState?: "offline" | "pending_sync" | "synced";
  timeline?: IssueAuditRecord[];
}

export interface PanchayatLeader {
  id: string;
  name: string;
  role: string;
  ward: string;
  phone: string;
  bio?: string;
  responsibilities?: string[];
}

export const DB_KEYS = {
  USERS: "tg_grama_seva_users",
  ISSUES: "tg_grama_seva_issues",
  SESSION: "tg_grama_seva_session",
  DEMO_SEEDED: "tg_grama_seva_demo_seeded",
};

function safeReadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWriteJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export const MockDB = {
  getUserByPhone: (phone: string): AppUser | null => {
    const users = safeReadJson<AppUser[]>(DB_KEYS.USERS, []);
    return users.find((u: AppUser) => u.phone === phone) || null;
  },
  saveUser: (user: AppUser) => {
    const users = safeReadJson<AppUser[]>(DB_KEYS.USERS, []);
    const existingIdx = users.findIndex((u: AppUser) => u.phone === user.phone);
    if (existingIdx > -1) users[existingIdx] = user;
    else users.push(user);
    safeWriteJson(DB_KEYS.USERS, users);
  },
  getIssuesByVillage: (village: string): VillageIssue[] => {
    const allIssues = safeReadJson<VillageIssue[]>(DB_KEYS.ISSUES, []);
    const v = (village || "").trim();
    if (!v) return allIssues;
    return allIssues.filter((i: VillageIssue) => (i.village || "").trim() === v);
  },
  getAllIssues: (): VillageIssue[] => safeReadJson<VillageIssue[]>(DB_KEYS.ISSUES, []),
  saveIssue: (issue: VillageIssue) => {
    const issues = safeReadJson<VillageIssue[]>(DB_KEYS.ISSUES, []);
    issues.unshift(issue);
    safeWriteJson(DB_KEYS.ISSUES, issues);
  },
  saveAllIssues: (issues: VillageIssue[]) => {
    safeWriteJson(DB_KEYS.ISSUES, issues);
  },
  updateIssue: (issue: VillageIssue) => {
    const issues = safeReadJson<VillageIssue[]>(DB_KEYS.ISSUES, []);
    const idx = issues.findIndex((i) => i.id === issue.id);
    if (idx >= 0) issues[idx] = issue;
    safeWriteJson(DB_KEYS.ISSUES, issues);
  },
  seedDemoIssues: (village: string) => {
    if (localStorage.getItem(DB_KEYS.DEMO_SEEDED)) return;
    const demo = createDemoIssues(village);
    const existing = safeReadJson<VillageIssue[]>(DB_KEYS.ISSUES, []);
    safeWriteJson(DB_KEYS.ISSUES, [...demo, ...existing]);
    localStorage.setItem(DB_KEYS.DEMO_SEEDED, "1");
  },
};

/** All 33 Telangana districts → mandals → villages (from telangana.ts) */
export const TELANGANA_DATA: Record<string, Record<string, string[]>> = buildTelanganaLookup();

/** Sorted list of all district names */
export const TELANGANA_DISTRICTS = getDistrictNames();

export const MOCK_PANCHAYAT: PanchayatLeader[] = [
  {
    id: "L-0",
    name: "M. Ramesh Babu",
    role: "Sarpanch",
    ward: "All",
    phone: "9848012345",
    bio: "Dedicated public leader focused on sustainable rural infrastructure and digital empowerment for the youth. Served as a social worker for 10 years before being elected as Sarpanch.",
    responsibilities: [
      "General Village Administration",
      "Palle Pragathi Coordination",
      "Mission Bhagiratha Water Management",
      "Grievance Redressal Monitoring",
    ],
  },
  {
    id: "L-1",
    name: "Smt. Kavitha Reddy",
    role: "Upa-Sarpanch",
    ward: "All",
    phone: "9848056789",
    bio: "Champion of women's education and economic independence. Leading the local self-help groups (SHG) to create sustainable livelihoods.",
    responsibilities: [
      "Women and Child Welfare",
      "Primary School Infrastructure Oversight",
      "Self-Help Group (SHG) Mentorship",
      "Village Sanitation Maintenance",
    ],
  },
  { id: "W-1", name: "G. Suresh Kumar", role: "Ward Member", ward: "1", phone: "9000011111", bio: "Ward-level activist for street lighting and drainage in Ward 1.", responsibilities: ["Ward 1 Utility Maintenance", "Street Light Vigilance", "Local Drainage"] },
  { id: "W-2", name: "B. Lakshmi", role: "Ward Member", ward: "2", phone: "9000022222", bio: "Focused on sanitation and drinking water in Ward 2.", responsibilities: ["Sanitation", "Drinking Water", "Ward 2 Grievances"] },
  { id: "W-3", name: "K. Venkatesh", role: "Ward Member", ward: "3", phone: "9000033333", bio: "Works on roads and electricity in Ward 3.", responsibilities: ["Roads & Drainage", "Electricity", "Ward 3 Grievances"] },
  { id: "W-4", name: "Smt. P. Sunitha", role: "Ward Member", ward: "4", phone: "9000044444", bio: "Women welfare and school infrastructure in Ward 4.", responsibilities: ["Women Welfare", "School Oversight", "Ward 4 Grievances"] },
  { id: "W-5", name: "M. Raju", role: "Ward Member", ward: "5", phone: "9000055555", bio: "Agriculture and Rythu Bandhu liaison for Ward 5.", responsibilities: ["Agriculture", "Rythu Bandhu", "Ward 5 Grievances"] },
  { id: "W-6", name: "T. Anjaiah", role: "Ward Member", ward: "6", phone: "9000066666", bio: "Pensions and welfare schemes in Ward 6.", responsibilities: ["Pensions", "Aasara", "Ward 6 Grievances"] },
  { id: "W-7", name: "Smt. R. Vijaya", role: "Ward Member", ward: "7", phone: "9000077777", bio: "Health and hygiene awareness in Ward 7.", responsibilities: ["Health", "Hygiene", "Ward 7 Grievances"] },
  { id: "W-8", name: "N. Mahesh", role: "Ward Member", ward: "8", phone: "9000088888", bio: "Mission Bhagiratha and water supply in Ward 8.", responsibilities: ["Water Supply", "Mission Bhagiratha", "Ward 8 Grievances"] },
  { id: "W-9", name: "D. Srinivas", role: "Ward Member", ward: "9", phone: "9000099999", bio: "Street lights and waste management in Ward 9.", responsibilities: ["Street Lights", "Waste", "Ward 9 Grievances"] },
  { id: "W-10", name: "Smt. G. Padma", role: "Ward Member", ward: "10", phone: "9000101010", bio: "SHG and livelihood in Ward 10.", responsibilities: ["SHG", "Livelihood", "Ward 10 Grievances"] },
  { id: "W-11", name: "P. Ramesh", role: "Ward Member", ward: "11", phone: "9000111111", bio: "Roads and drainage in Ward 11.", responsibilities: ["Roads", "Drainage", "Ward 11 Grievances"] },
  { id: "W-12", name: "K. Swamy", role: "Ward Member", ward: "12", phone: "9000121212", bio: "Land and revenue liaison in Ward 12.", responsibilities: ["Land & Revenue", "Ward 12 Grievances"] },
  { id: "W-13", name: "Smt. L. Manjula", role: "Ward Member", ward: "13", phone: "9000131313", bio: "Education and Grama Jyothi in Ward 13.", responsibilities: ["Education", "Grama Jyothi", "Ward 13 Grievances"] },
  { id: "W-14", name: "J. Narsimha", role: "Ward Member", ward: "14", phone: "9000141414", bio: "Housing (PMAY) and animal husbandry in Ward 14.", responsibilities: ["PMAY", "Animal Husbandry", "Ward 14 Grievances"] },
  { id: "W-15", name: "R. Prakash", role: "Ward Member", ward: "15", phone: "9000151515", bio: "General ward development and grievances in Ward 15.", responsibilities: ["Ward 15 Development", "Grievance Redressal"] },
];

export const CATEGORIES = [
  "Mission Bhagiratha",
  "Rythu Bandhu",
  "Palle Pragathi",
  "Roads & Drainage",
  "Electricity",
  "Grama Jyothi",
  "Pensions",
  "Aasara Pensions",
  "Sanitation & Toilets",
  "Street Lights",
  "Drinking Water",
  "Health & Hospital",
  "School & Education",
  "Land & Revenue",
  "Agriculture",
  "Housing (PMAY)",
  "Waste Management",
  "Animal Husbandry",
  "Other",
];

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

/** DEMO DATA — clearly illustrative sample issues */
export function createDemoIssues(village: string): VillageIssue[] {
  return [
    {
      id: "ISS-DEMO-1024",
      citizenId: "demo-c1",
      citizenName: "R. Lakshmi",
      category: "Roads",
      description: "Road damage near Government School, potholes causing accidents",
      status: "In Progress",
      priority: "MEDIUM",
      department: "Panchayat/R&B",
      slaHours: 48,
      slaDueAt: new Date(Date.now() + 20 * 3600000).toISOString(),
      acknowledgedAt: daysAgo(1),
      assignedAt: daysAgo(1),
      assignedToMemberName: "G. Suresh Kumar",
      escalationLevel: 1,
      escalationStatus: "NONE",
      estimatedAffectedCitizens: 47,
      createdAt: daysAgo(2),
      ward: "1",
      village,
      district: "Yadadri Bhuvanagiri",
      mandal: "Bhongir",
      syncState: "synced",
      timeline: [
        { id: "a1", timestamp: daysAgo(2), action: "created", actorName: "R. Lakshmi", actorRole: "Citizen", detail: "Complaint submitted by citizen" },
        { id: "a2", timestamp: daysAgo(1), action: "acknowledged", actorName: "G. Suresh Kumar", actorRole: "Ward Member", detail: "Acknowledged by Ward Member" },
        { id: "a3", timestamp: daysAgo(1), action: "status_change", actorRole: "Ward Member", detail: "Status changed to In Progress" },
      ],
    },
    {
      id: "ISS-DEMO-1025",
      citizenId: "demo-c2",
      citizenName: "K. Venkatesh",
      category: "Water",
      description: "No drinking water supply for 3 days in Ward 4",
      status: "Submitted",
      priority: "HIGH",
      department: "Water/Panchayat",
      slaHours: 24,
      slaDueAt: new Date(Date.now() + 8 * 3600000).toISOString(),
      escalationLevel: 0,
      escalationStatus: "NONE",
      estimatedAffectedCitizens: 120,
      createdAt: daysAgo(0),
      ward: "4",
      village,
      syncState: "synced",
      timeline: [
        { id: "b1", timestamp: daysAgo(0), action: "created", actorName: "K. Venkatesh", actorRole: "Citizen", detail: "Complaint submitted by citizen" },
      ],
    },
    {
      id: "ISS-DEMO-1020",
      citizenId: "demo-c3",
      citizenName: "Smt. P. Sunitha",
      category: "Electricity",
      description: "Street lights not working in Ward 4",
      status: "Resolved",
      priority: "MEDIUM",
      department: "Electricity Department",
      slaHours: 48,
      slaDueAt: daysAgo(3),
      acknowledgedAt: daysAgo(5),
      resolvedAt: daysAgo(4),
      citizenConfirmationStatus: "pending",
      escalationLevel: 1,
      escalationStatus: "NONE",
      createdAt: daysAgo(6),
      ward: "4",
      village,
      syncState: "synced",
      timeline: [
        { id: "c1", timestamp: daysAgo(6), action: "created", actorName: "Smt. P. Sunitha", actorRole: "Citizen", detail: "Complaint submitted" },
        { id: "c2", timestamp: daysAgo(4), action: "status_change", detail: "Marked Resolved" },
      ],
    },
  ];
}
