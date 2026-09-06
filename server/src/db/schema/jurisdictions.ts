import { pgTable, text, uuid, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";

/**
 * Canonical geography. Every user and issue binds to a village row here,
 * replacing the free-text district/mandal/village string matching.
 * One row per village: (district, mandal, village).
 */
export const jurisdictions = pgTable(
  "jurisdictions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    district: text("district").notNull(),
    mandal: text("mandal").notNull(),
    village: text("village").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("jurisdictions_geo_unique").on(t.district, t.mandal, t.village),
    index("jurisdictions_district_idx").on(t.district),
    index("jurisdictions_mandal_idx").on(t.district, t.mandal),
  ]
);

export type Jurisdiction = typeof jurisdictions.$inferSelect;
export type NewJurisdiction = typeof jurisdictions.$inferInsert;
