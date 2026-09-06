import z from "zod";

/* ── Users ─────────────────────────────────────────────────────── */

export const USER_ROLES = [
  "citizen",
  "ward_member",
  "sarpanch",
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

export const OFFICIAL_REGISTRATION_ROLES = ["sarpanch", "admin", "ward_member"] as const;
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
