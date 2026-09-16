import { pgTable, text, uuid, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "./users";

/**
 * Representative images for places (districts, mandals, villages/panchayats).
 * Configured by administrators to showcase popular landmarks and identity
 * (e.g. Charminar for Hyderabad, historic gates/temples for villages).
 */
export const placeImages = pgTable(
  "place_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    level: text("level").notNull(), // 'district' | 'mandal' | 'village'
    district: text("district").notNull(),
    mandal: text("mandal"),
    village: text("village"),
    imageUrl: text("image_url").notNull(),
    caption: text("caption"),
    updatedById: uuid("updated_by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("place_images_geo_idx").on(t.district, t.mandal, t.village),
    index("place_images_level_idx").on(t.level),
  ]
);

export type PlaceImage = typeof placeImages.$inferSelect;
export type NewPlaceImage = typeof placeImages.$inferInsert;
