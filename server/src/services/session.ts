import { and, eq, gt, isNull } from "drizzle-orm";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import type { Context } from "hono";
import { db, schema } from "../db/client";
import type { Jurisdiction, Session, User } from "../db/schema";
import { generateToken, sha256 } from "../lib/crypto";
import { env } from "../env";

export const SESSION_COOKIE = "grama_session";
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

export interface AuthContext {
  user: User;
  jurisdiction: Jurisdiction | null;
  session: Session;
}

export async function createSession(
  c: Context,
  userId: string,
  meta: { ip?: string; device?: string } = {}
): Promise<void> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

  await db.insert(schema.sessions).values({
    userId,
    tokenHash: sha256(token),
    device: meta.device,
    ip: meta.ip,
    expiresAt,
  });

  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "Lax",
    secure: env.APP_BASE_URL.startsWith("https"),
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function revokeCurrentSession(c: Context): Promise<void> {
  const token = getCookie(c, SESSION_COOKIE);
  if (token) {
    await db
      .update(schema.sessions)
      .set({ revokedAt: new Date() })
      .where(eq(schema.sessions.tokenHash, sha256(token)));
  }
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
}

/** Resolves the cookie to a live user + jurisdiction, or null. */
export async function resolveAuthContext(c: Context): Promise<AuthContext | null> {
  const token = getCookie(c, SESSION_COOKIE);
  if (!token) return null;

  const [row] = await db
    .select({ session: schema.sessions, user: schema.users })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
    .where(
      and(
        eq(schema.sessions.tokenHash, sha256(token)),
        isNull(schema.sessions.revokedAt),
        gt(schema.sessions.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!row) return null;

  let jurisdiction: Jurisdiction | null = null;
  if (row.user.jurisdictionId) {
    const [j] = await db
      .select()
      .from(schema.jurisdictions)
      .where(eq(schema.jurisdictions.id, row.user.jurisdictionId))
      .limit(1);
    jurisdiction = j ?? null;
  }

  return { user: row.user, jurisdiction, session: row.session };
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  await db
    .update(schema.sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(schema.sessions.userId, userId), isNull(schema.sessions.revokedAt)));
}
