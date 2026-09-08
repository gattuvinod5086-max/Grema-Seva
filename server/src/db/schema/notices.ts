import { boolean, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";
import { jurisdictions } from "./jurisdictions";

export const POST_TYPES = ["notice", "news"] as const;
export type PostType = (typeof POST_TYPES)[number];

export const POST_PRIORITIES = ["NORMAL", "IMPORTANT", "URGENT"] as const;
export type PostPriority = (typeof POST_PRIORITIES)[number];

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: text("type").$type<PostType>().notNull().default("news"),
    title: text("title").notNull(),
    content: text("content").notNull(),
    category: text("category").notNull(),
    priority: text("priority").$type<PostPriority>().notNull().default("NORMAL"),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id),
    authorName: text("author_name").notNull(),
    authorRole: text("author_role").notNull(),
    jurisdictionId: uuid("jurisdiction_id").references(() => jurisdictions.id),
    wardNumber: text("ward_number"),
    imageUrl: text("image_url"),
    pinned: boolean("pinned").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("posts_type_idx").on(t.type),
    index("posts_jurisdiction_idx").on(t.jurisdictionId),
    index("posts_author_idx").on(t.authorId),
    index("posts_created_at_idx").on(t.createdAt),
    index("posts_type_jurisdiction_idx").on(t.type, t.jurisdictionId, t.createdAt),
  ]
);

export type PostRow = typeof posts.$inferSelect;
export type NewPostRow = typeof posts.$inferInsert;
