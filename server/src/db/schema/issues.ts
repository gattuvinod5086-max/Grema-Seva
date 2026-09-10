import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  doublePrecision,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { jurisdictions } from "./jurisdictions";
import { users } from "./users";

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

/**
 * 'village': visible to everyone registered in the same village (the
 * transparency default — villagers can see what's already reported).
 * 'private': reporter and jurisdiction officials only.
 */
export const ISSUE_VISIBILITIES = ["private", "village"] as const;
export type IssueVisibility = (typeof ISSUE_VISIBILITIES)[number];

export const issues = pgTable(
  "issues",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Human-friendly display code, e.g. GS-2609-0042. */
    code: text("code").notNull(),

    reporterId: uuid("reporter_id")
      .notNull()
      .references(() => users.id),
    jurisdictionId: uuid("jurisdiction_id")
      .notNull()
      .references(() => jurisdictions.id),
    wardNumber: text("ward_number"),

    category: text("category").notNull(),
    description: text("description").notNull(),

    status: text("status").$type<IssueStatus>().notNull().default("Submitted"),
    priority: text("priority").$type<IssuePriority>().notNull().default("MEDIUM"),
    department: text("department"),
    /** Official currently responsible (sarpanch by default, may be reassigned). */
    assignedToId: uuid("assigned_to_id").references(() => users.id),

    /** 'private' | 'village' */
    visibility: text("visibility").$type<IssueVisibility>().notNull().default("village"),

    slaHours: integer("sla_hours"),
    slaDueAt: timestamp("sla_due_at", { withTimezone: true }),
    acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    closedAt: timestamp("closed_at", { withTimezone: true }),

    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    accuracyM: doublePrecision("accuracy_m"),
    addressText: text("address_text"),

    /** Idempotency: the same client-supplied key never creates two issues. */
    idempotencyKey: text("idempotency_key"),
    duplicateOfId: uuid("duplicate_of_id"),
    withdrawnAt: timestamp("withdrawn_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("issues_code_unique").on(t.code),
    uniqueIndex("issues_idempotency_unique").on(t.idempotencyKey),
    index("issues_reporter_idx").on(t.reporterId),
    index("issues_jurisdiction_status_idx").on(t.jurisdictionId, t.status),
    index("issues_assigned_idx").on(t.assignedToId),
  ]
);

/** Timeline of an issue: status changes, progress notes, assignments, comments. */
export const issueUpdates = pgTable(
  "issue_updates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    issueId: uuid("issue_id")
      .notNull()
      .references(() => issues.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id").references(() => users.id),

    /** 'created' | 'status_change' | 'progress' | 'assignment' | 'comment' | 'confirmation' */
    action: text("action").notNull(),
    oldStatus: text("old_status"),
    newStatus: text("new_status"),
    note: text("note"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("issue_updates_issue_idx").on(t.issueId, t.createdAt)]
);

export const issueAttachments = pgTable(
  "issue_attachments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    issueId: uuid("issue_id")
      .notNull()
      .references(() => issues.id, { onDelete: "cascade" }),
    uploadedById: uuid("uploaded_by_id").references(() => users.id),
    /** 'photo' | 'voice' | 'document' */
    kind: text("kind").notNull().default("photo"),
    storageKey: text("storage_key").notNull(),
    mime: text("mime").notNull(),
    bytes: integer("bytes").notNull(),
    /** 'report' | 'progress' | 'resolution' */
    phase: text("phase").notNull().default("report"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("issue_attachments_issue_idx").on(t.issueId)]
);

export const issuesRelations = relations(issues, ({ one, many }) => ({
  reporter: one(users, { fields: [issues.reporterId], references: [users.id] }),
  jurisdiction: one(jurisdictions, {
    fields: [issues.jurisdictionId],
    references: [jurisdictions.id],
  }),
  updates: many(issueUpdates),
  attachments: many(issueAttachments),
}));

export const issueUpdatesRelations = relations(issueUpdates, ({ one, many }) => ({
  issue: one(issues, { fields: [issueUpdates.issueId], references: [issues.id] }),
  actor: one(users, { fields: [issueUpdates.actorId], references: [users.id] }),
  attachments: many(issueAttachments),
}));

export const issueAttachmentsRelations = relations(issueAttachments, ({ one }) => ({
  issue: one(issues, { fields: [issueAttachments.issueId], references: [issues.id] }),
}));

export type Issue = typeof issues.$inferSelect;
export type NewIssue = typeof issues.$inferInsert;
export type IssueUpdate = typeof issueUpdates.$inferSelect;
export type IssueAttachment = typeof issueAttachments.$inferSelect;
