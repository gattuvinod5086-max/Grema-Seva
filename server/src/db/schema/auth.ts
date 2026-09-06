import { pgTable, text, timestamp, uuid, integer, index, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./users";

/** One identity per login method; links Google and phone logins to one user. */
export const authIdentities = pgTable(
  "auth_identities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** 'google' | 'phone' */
    provider: text("provider").notNull(),
    /** Google `sub`, or the E.164 phone number for the phone provider. */
    providerUid: text("provider_uid").notNull(),
    verifiedAt: timestamp("verified_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("auth_identities_provider_uid_unique").on(t.provider, t.providerUid),
    index("auth_identities_user_idx").on(t.userId),
  ]
);

/** Hashed OTP codes with expiry, attempt cap and throttle metadata. */
export const otpRequests = pgTable(
  "otp_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    phone: text("phone").notNull(),
    codeHash: text("code_hash").notNull(),
    /** 'login' | 'register_official' */
    purpose: text("purpose").notNull().default("login"),
    attempts: integer("attempts").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    requestIp: text("request_ip"),
  },
  (t) => [
    index("otp_requests_phone_idx").on(t.phone, t.createdAt),
    index("otp_requests_ip_idx").on(t.requestIp, t.createdAt),
  ]
);

/** Server-side sessions: logout and role revocation actually mean something. */
export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    device: text("device"),
    ip: text("ip"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("sessions_token_hash_unique").on(t.tokenHash),
    index("sessions_user_idx").on(t.userId),
  ]
);

export type AuthIdentity = typeof authIdentities.$inferSelect;
export type OtpRequest = typeof otpRequests.$inferSelect;
export type Session = typeof sessions.$inferSelect;
