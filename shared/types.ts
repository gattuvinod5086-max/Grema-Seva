import z from "zod";

/* ── Users ─────────────────────────────────────────────────────── */

export const USER_ROLES = [
  "citizen",
  "ward_member",
  "sarpanch",
  "mandal_official",
  "admin",
  "super_admin",
] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const APPROVAL_STATUSES = ["pending", "approved", "declined"] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  fatherName: z.string().nullable(),
  role: z.enum(USER_ROLES),
  approvalStatus: z.enum(APPROVAL_STATUSES),
  approvalNote: z.string().nullable(),
  wardNumber: z.string().nullable(),
  district: z.string().nullable(),
  mandal: z.string().nullable(),
  village: z.string().nullable(),
  jurisdictionId: z.string().nullable(),
  needsRegistration: z.boolean(),
  createdAt: z.string(),
});
export type User = z.infer<typeof UserSchema>;

export const OFFICIAL_REGISTRATION_ROLES = [
  "sarpanch",
  "ward_member",
  "mandal_official",
  "admin",
] as const;
export type OfficialRegistrationRole = (typeof OFFICIAL_REGISTRATION_ROLES)[number];

export const OfficialRecordSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string().nullable(),
  role: z.enum(OFFICIAL_REGISTRATION_ROLES),
  approvalStatus: z.enum(APPROVAL_STATUSES),
  approvalNote: z.string().nullable(),
  wardNumber: z.string().nullable(),
  district: z.string().nullable(),
  mandal: z.string().nullable(),
  village: z.string().nullable(),
  createdAt: z.string(),
});
export type OfficialRecord = z.infer<typeof OfficialRecordSchema>;

/* ── Issues ────────────────────────────────────────────────────── */

export const ISSUE_STATUSES = [
  "Submitted",
  "Acknowledged",
  "In Progress",
  "Resolved",
  "Closed",
  "Reopened",
  "SLA_BREACHED",
] as const;
export type IssueStatus = (typeof ISSUE_STATUSES)[number];

export const ISSUE_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type IssuePriority = (typeof ISSUE_PRIORITIES)[number];

export const ISSUE_VISIBILITIES = ["private", "village"] as const;
export type IssueVisibility = (typeof ISSUE_VISIBILITIES)[number];

export const IssueSchema = z.object({
  id: z.string(),
  code: z.string(),
  reporterId: z.string(),
  jurisdictionId: z.string(),
  wardNumber: z.string().nullable(),
  category: z.string(),
  description: z.string(),
  status: z.enum(ISSUE_STATUSES),
  priority: z.enum(ISSUE_PRIORITIES),
  department: z.string().nullable(),
  assignedToId: z.string().nullable(),
  visibility: z.enum(ISSUE_VISIBILITIES),
  slaHours: z.number().nullable(),
  slaDueAt: z.string().nullable(),
  acknowledgedAt: z.string().nullable(),
  resolvedAt: z.string().nullable(),
  closedAt: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  accuracyM: z.number().nullable(),
  addressText: z.string().nullable(),
  /** Flattened jurisdiction (present on list/detail responses). */
  district: z.string().optional(),
  mandal: z.string().optional(),
  village: z.string().optional(),
  /** Key of the first report-phase photo, for list thumbnails. */
  photoKey: z.string().nullable().optional(),
  duplicateOfId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Issue = z.infer<typeof IssueSchema>;

export const CreateIssueSchema = z.object({
  category: z.string(),
  description: z.string().trim().min(5).max(4000),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  accuracyM: z.number().nullable().optional(),
  addressText: z.string().nullable().optional(),
  visibility: z.enum(ISSUE_VISIBILITIES).optional(),
  wardNumber: z.string().nullable().optional(),
  idempotencyKey: z.string().nullable().optional(),
});
export type CreateIssue = z.infer<typeof CreateIssueSchema>;

export const IssueTimelineEventSchema = z.object({
  id: z.string(),
  action: z.string(),
  oldStatus: z.string().nullable(),
  newStatus: z.string().nullable(),
  note: z.string().nullable(),
  actorName: z.string().nullable(),
  actorRole: z.string().nullable(),
  createdAt: z.string(),
});
export type IssueTimelineEvent = z.infer<typeof IssueTimelineEventSchema>;

export const IssueAttachmentSchema = z.object({
  id: z.string(),
  kind: z.string(),
  key: z.string(),
  mime: z.string(),
  phase: z.string(),
  createdAt: z.string(),
});
export type IssueAttachment = z.infer<typeof IssueAttachmentSchema>;

export const IssueDetailSchema = IssueSchema.extend({
  timeline: z.array(IssueTimelineEventSchema),
  attachments: z.array(IssueAttachmentSchema),
});
export type IssueDetail = z.infer<typeof IssueDetailSchema>;

export const IssueListResponseSchema = z.object({
  issues: z.array(IssueSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});
export type IssueListResponse = z.infer<typeof IssueListResponseSchema>;

export interface VillageIssueStats {
  total: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, Record<string, number>>;
}

export interface SimilarIssue {
  code: string;
  category: string;
  description: string;
  status: string;
  village: string;
  createdAt: string;
  distanceM: number | null;
}

/* ── Sarpanches & Village Directory ────────────────────────────── */

export interface SarpanchRecord {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  role: "sarpanch";
  approvalStatus: ApprovalStatus;
  approvalNote: string | null;
  wardNumber: string | null;
  jurisdictionId: string | null;
  district: string | null;
  mandal: string | null;
  village: string | null;
  createdAt: string;
  issuesCount?: {
    total: number;
    open: number;
    resolved: number;
  };
}

export interface SarpanchOverview {
  totalSarpanches: number;
  approvedSarpanches: number;
  pendingSarpanches: number;
  declinedSarpanches: number;
  villagesCovered: number;
}

export interface SarpanchListResponse {
  overview: SarpanchOverview;
  sarpanches: SarpanchRecord[];
}

export interface VillageDetailResponse {
  jurisdiction: {
    id: string;
    district: string;
    mandal: string;
    village: string;
  };
  sarpanch: SarpanchRecord | null;
  allSarpanches: SarpanchRecord[];
  wardMembers: Array<{
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    wardNumber: string | null;
    approvalStatus: ApprovalStatus;
    approvalNote: string | null;
    createdAt: string;
  }>;
  issuesSummary: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
  };
  recentIssues: Array<{
    id: string;
    code: string;
    category: string;
    status: IssueStatus;
    createdAt: string;
  }>;
}

/* ── Notices & News ─────────────────────────────────────────────── */

export const POST_TYPES = ["notice", "news"] as const;
export type PostType = (typeof POST_TYPES)[number];

export const POST_PRIORITIES = ["NORMAL", "IMPORTANT", "URGENT"] as const;
export type PostPriority = (typeof POST_PRIORITIES)[number];

export const NOTICE_CATEGORIES = [
  "Gram Panchayat Announcement",
  "Water & Sanitation",
  "Health & Medical Camp",
  "Electricity & Power",
  "Roads & Public Works",
  "Agriculture & Ration",
  "Emergency Alert",
] as const;
export type NoticeCategory = (typeof NOTICE_CATEGORIES)[number];

export const NEWS_CATEGORIES = [
  "Village News",
  "Telangana State News",
  "Agriculture & Weather",
  "Education & Youth",
  "Welfare & Schemes",
  "Sports & Culture",
  "General",
] as const;
export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

export const PostSchema = z.object({
  id: z.string(),
  type: z.enum(POST_TYPES),
  title: z.string(),
  content: z.string().optional().default(""),
  category: z.string(),
  priority: z.enum(POST_PRIORITIES),
  authorId: z.string(),
  authorName: z.string(),
  authorRole: z.string(),
  jurisdictionId: z.string().nullable(),
  wardNumber: z.string().nullable(),
  district: z.string().nullable(),
  mandal: z.string().nullable(),
  village: z.string().nullable(),
  imageUrl: z.string().nullable().optional(),
  pinned: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Post = z.infer<typeof PostSchema>;

export const CreatePostSchema = z.object({
  type: z.enum(POST_TYPES),
  title: z.string().trim().min(3).max(200),
  content: z.string().trim().max(5000).optional().default(""),
  category: z.string().trim().min(1).max(100),
  priority: z.enum(POST_PRIORITIES).default("NORMAL"),
  district: z.string().trim().optional(),
  mandal: z.string().trim().optional(),
  village: z.string().trim().optional(),
  wardNumber: z.string().trim().max(20).optional(),
  imageUrl: z.string().trim().nullable().optional(),
  pinned: z.boolean().optional(),
});
export type CreatePostInput = z.infer<typeof CreatePostSchema>;

export interface ListPostsResponse {
  posts: Post[];
  total: number;
  page: number;
  limit: number;
}

export type RealtimeEventType = "issue" | "notice" | "news" | "post";
export type RealtimeActionType = "created" | "updated" | "deleted";

export interface RealtimeEvent {
  type: RealtimeEventType;
  action: RealtimeActionType;
  jurisdictionId?: string | null;
  reporterId?: string | null;
  district?: string | null;
  mandal?: string | null;
  village?: string | null;
  data: Record<string, any>;
  timestamp: string;
}

/* ── Place Media / Cover Images ────────────────────────── */

export type PlaceLevel = "district" | "mandal" | "village";

export interface PlaceImageRecord {
  id: string;
  level: PlaceLevel;
  district: string;
  mandal?: string | null;
  village?: string | null;
  imageUrl: string;
  caption?: string | null;
  updatedAt: string;
}

export const SetPlaceImageSchema = z.object({
  level: z.enum(["district", "mandal", "village"]),
  district: z.string().trim().min(1),
  mandal: z.string().trim().optional(),
  village: z.string().trim().optional(),
  imageUrl: z.string().trim(),
  caption: z.string().trim().max(200).optional(),
});
export type SetPlaceImageInput = z.infer<typeof SetPlaceImageSchema>;


