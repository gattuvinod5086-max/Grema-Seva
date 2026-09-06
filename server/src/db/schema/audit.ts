import { pgTable, text, timestamp, uuid, jsonb, index } from "drizzle-orm/pg-core";
import { users } from "./users";

/** General-purpose audit trail covering role changes, approvals, and more. */
export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id").references(() => users.id),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id"),
    before: jsonb("before"),
    after: jsonb("after"),
    ip: text("ip"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("audit_log_entity_idx").on(t.entity, t.entityId),
    index("audit_log_actor_idx").on(t.actorId, t.createdAt),
  ]
);

export type AuditLogEntry = typeof auditLog.$inferSelect;
