import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uuid, index, uniqueIndex } from "drizzle-orm/pg-core";
import { jurisdictions } from "./jurisdictions";

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

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    /** E.164. Nullable: a Google-only user may not have a phone yet. */
    phone: text("phone"),
    email: text("email"),
    fatherName: text("father_name"),
    role: text("role").$type<UserRole>().notNull().default("citizen"),
    /** Officials require super_admin approval; citizens are auto-approved. */
    approvalStatus: text("approval_status")
      .$type<ApprovalStatus>()
      .notNull()
      .default("approved"),
    /** Set when approvalStatus = 'declined': the reason shown to the user. */
    approvalNote: text("approval_note"),
    jurisdictionId: uuid("jurisdiction_id").references(() => jurisdictions.id),
    wardNumber: text("ward_number"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("users_phone_unique").on(t.phone),
    uniqueIndex("users_email_unique").on(t.email),
    index("users_jurisdiction_idx").on(t.jurisdictionId),
    index("users_role_approval_idx").on(t.role, t.approvalStatus),
  ]
);

export const usersRelations = relations(users, ({ one }) => ({
  jurisdiction: one(jurisdictions, {
    fields: [users.jurisdictionId],
    references: [jurisdictions.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
