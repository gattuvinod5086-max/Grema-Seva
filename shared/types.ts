import z from "zod";
import { ISSUE_PRIORITIES, ISSUE_STATUSES, SYNC_STATES, CITIZEN_CONFIRMATION_STATUSES } from "@shared/constants/governance";
import {
  NEWS_CATEGORIES,
  NEWS_PRIORITIES,
  NEWS_STATUSES,
  NEWS_APPROVAL_STATUSES,
  NEWS_VISIBILITY_SCOPES,
} from "@shared/constants/news";

export const IssueSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  category: z.string(),
  description: z.string(),
  status: z.string(),
  location: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  photo_key: z.string().nullable(),
  photo_url: z.string().optional(),
  ward_id: z.number().nullable(),
  ward: z.string().nullable().optional(),
  assigned_to_user_id: z.string().nullable(),
  district: z.string().nullable(),
  mandal: z.string().nullable(),
  village: z.string().nullable(),
  priority: z.enum(ISSUE_PRIORITIES).nullable().optional(),
  sla_hours: z.number().nullable().optional(),
  sla_due_at: z.string().nullable().optional(),
  acknowledged_at: z.string().nullable().optional(),
  assigned_at: z.string().nullable().optional(),
  resolved_at: z.string().nullable().optional(),
  escalation_level: z.number().nullable().optional(),
  escalation_status: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  estimated_affected_citizens: z.number().nullable().optional(),
  citizen_confirmed_at: z.string().nullable().optional(),
  citizen_confirmation_status: z.enum(CITIZEN_CONFIRMATION_STATUSES).nullable().optional(),
  citizen_rating: z.number().nullable().optional(),
  citizen_feedback: z.string().nullable().optional(),
  sync_state: z.enum(SYNC_STATES).nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const UserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  father_name: z.string().nullable(),
  role: z.string(),
  ward_id: z.number().nullable(),
  district: z.string().nullable(),
  mandal: z.string().nullable(),
  village: z.string().nullable(),
  phone: z.string().nullable(),
  ward_number: z.number().nullable(),
  google_sub: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const WardSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const IssueUpdateSchema = z.object({
  id: z.number(),
  issue_id: z.number(),
  user_id: z.string(),
  old_status: z.string().nullable(),
  new_status: z.string(),
  comment: z.string().nullable(),
  action_type: z.string().nullable().optional(),
  actor_role: z.string().nullable().optional(),
  old_value: z.string().nullable().optional(),
  new_value: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateIssueSchema = z.object({
  category: z.string(),
  description: z.string(),
  location: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  priority: z.enum(ISSUE_PRIORITIES).optional(),
  ward: z.string().optional(),
  estimated_affected_citizens: z.number().optional(),
});

export const UpdateIssueStatusSchema = z.object({
  status: z.enum(ISSUE_STATUSES),
  comment: z.string().optional(),
});

export const AssignIssueSchema = z.object({
  assigned_to_user_id: z.string(),
  ward_id: z.number().optional(),
});

export const CitizenConfirmationSchema = z.object({
  confirmed: z.boolean(),
  rating: z.number().min(1).max(5).optional(),
  feedback: z.string().optional(),
  reason: z.string().optional(),
});

export const UpdateAffectedPopulationSchema = z.object({
  estimated_affected_citizens: z.number().min(0),
});

export const UpdateUserLocationSchema = z.object({
  district: z.string(),
  mandal: z.string(),
  village: z.string(),
});

export const NewsSchema = z.object({
  id: z.number(),
  title_en: z.string(),
  title_te: z.string().nullable().optional(),
  short_description_en: z.string().nullable().optional(),
  short_description_te: z.string().nullable().optional(),
  content_en: z.string(),
  content_te: z.string().nullable().optional(),
  category: z.enum(NEWS_CATEGORIES),
  image_key: z.string().nullable().optional(),
  image_url: z.string().optional(),
  district: z.string().nullable().optional(),
  mandal: z.string().nullable().optional(),
  village: z.string().nullable().optional(),
  visibility_scope: z.enum(NEWS_VISIBILITY_SCOPES),
  priority: z.enum(NEWS_PRIORITIES),
  status: z.enum(NEWS_STATUSES),
  approval_status: z.enum(NEWS_APPROVAL_STATUSES),
  author_id: z.string(),
  author_name: z.string().nullable().optional(),
  published_at: z.string().nullable().optional(),
  scheduled_at: z.string().nullable().optional(),
  expires_at: z.string().nullable().optional(),
  view_count: z.number().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateNewsSchema = z.object({
  title_en: z.string().min(1),
  title_te: z.string().optional(),
  short_description_en: z.string().min(1),
  short_description_te: z.string().optional(),
  content_en: z.string().min(1),
  content_te: z.string().optional(),
  category: z.enum(NEWS_CATEGORIES),
  district: z.string().optional(),
  mandal: z.string().optional(),
  village: z.string().optional(),
  visibility_scope: z.enum(NEWS_VISIBILITY_SCOPES),
  priority: z.enum(NEWS_PRIORITIES).optional(),
  status: z.enum(NEWS_STATUSES).optional(),
  scheduled_at: z.string().optional(),
  expires_at: z.string().optional(),
});

export const UpdateNewsSchema = CreateNewsSchema.partial();

export const LiveNewsItemSchema = z.object({
  id: z.string(),
  source: z.string(),
  headline: z.string(),
  summary: z.string().nullable().optional(),
  url: z.string(),
  published_at: z.string(),
  is_external: z.literal(true),
});

export type News = z.infer<typeof NewsSchema>;
export type CreateNews = z.infer<typeof CreateNewsSchema>;
export type UpdateNews = z.infer<typeof UpdateNewsSchema>;
export type LiveNewsItem = z.infer<typeof LiveNewsItemSchema>;

export type Issue = z.infer<typeof IssueSchema>;
export type User = z.infer<typeof UserSchema>;
export type Ward = z.infer<typeof WardSchema>;
export type IssueUpdate = z.infer<typeof IssueUpdateSchema>;
export type CreateIssue = z.infer<typeof CreateIssueSchema>;
export type UpdateIssueStatus = z.infer<typeof UpdateIssueStatusSchema>;
export type AssignIssue = z.infer<typeof AssignIssueSchema>;
export type CitizenConfirmation = z.infer<typeof CitizenConfirmationSchema>;
export type UpdateUserLocation = z.infer<typeof UpdateUserLocationSchema>;

/** Timeline entry for UI */
export interface IssueTimelineEvent {
  id?: number | string;
  timestamp: string;
  label: string;
  action?: string;
  detail?: string;
  actorName?: string;
  actorRole?: string;
}
