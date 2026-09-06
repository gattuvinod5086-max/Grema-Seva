import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { db, schema } from "../db/client";
import { getSmsProvider } from "../providers/sms";
import { generateOtpCode, sha256, safeEqual } from "../lib/crypto";
import { tooManyRequests, badRequest } from "../middleware/error";
import { env } from "../env";

const OTP_TTL_SECONDS = 5 * 60;
const MAX_VERIFY_ATTEMPTS = 5;
/**
 * Per-phone/IP throttles exist to protect SMS cost and abuse. They are
 * DISABLED for the POC (env.RATE_LIMITS_ENABLED=false) and must be
 * enabled in production, where limits are stricter for real-SMS drivers.
 */
const MAX_PER_PHONE_PER_HOUR = 3;
const MAX_PER_PHONE_PER_HOUR_DEV = 10;
const MAX_PER_IP_PER_HOUR = 10;
const MAX_PER_IP_PER_HOUR_DEV = 30;

function phoneHourLimit() {
  return getSmsProvider().exposesDevOtp ? MAX_PER_PHONE_PER_HOUR_DEV : MAX_PER_PHONE_PER_HOUR;
}
function ipHourLimit() {
  return getSmsProvider().exposesDevOtp ? MAX_PER_IP_PER_HOUR_DEV : MAX_PER_IP_PER_HOUR;
}

export interface OtpVerificationResult {
  ok: boolean;
  reason?: "expired" | "max_attempts" | "mismatch";
}

export async function requestOtp(phone: string, ip: string | undefined, purpose = "login") {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  if (env.RATE_LIMITS_ENABLED) {
    const [phoneCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.otpRequests)
      .where(
        and(eq(schema.otpRequests.phone, phone), gt(schema.otpRequests.createdAt, oneHourAgo))
      );
    if (phoneCount.count >= phoneHourLimit()) {
      throw tooManyRequests(
        "Too many OTP requests for this number. Please wait an hour, or use the code already shown."
      );
    }

    if (ip) {
      const [ipCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.otpRequests)
        .where(
          and(eq(schema.otpRequests.requestIp, ip), gt(schema.otpRequests.createdAt, oneHourAgo))
        );
      if (ipCount.count >= ipHourLimit()) {
        throw tooManyRequests("Too many OTP requests. Try again later.");
      }
    }
  }

  // Invalidate any outstanding codes for this phone.
  await db
    .update(schema.otpRequests)
    .set({ consumedAt: new Date() })
    .where(and(eq(schema.otpRequests.phone, phone), isNull(schema.otpRequests.consumedAt)));

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000);

  await db.insert(schema.otpRequests).values({
    phone,
    codeHash: sha256(code),
    purpose,
    expiresAt,
    requestIp: ip,
  });

  await getSmsProvider().sendOtp({ phone, code, purpose });

  // `code` is returned so a dev driver can surface it in the UI; the route
  // only includes it when the active provider opts in (exposesDevOtp).
  return { expiresInSec: OTP_TTL_SECONDS, code };
}

export async function verifyOtp(phone: string, code: string): Promise<OtpVerificationResult> {
  const [row] = await db
    .select()
    .from(schema.otpRequests)
    .where(
      and(
        eq(schema.otpRequests.phone, phone),
        isNull(schema.otpRequests.consumedAt),
        gt(schema.otpRequests.expiresAt, new Date())
      )
    )
    .orderBy(desc(schema.otpRequests.createdAt))
    .limit(1);

  if (!row) {
    return { ok: false, reason: "expired" };
  }

  if (row.attempts >= MAX_VERIFY_ATTEMPTS) {
    await db
      .update(schema.otpRequests)
      .set({ consumedAt: new Date() })
      .where(eq(schema.otpRequests.id, row.id));
    throw tooManyRequests("Too many wrong attempts. Request a new OTP.");
  }

  if (!safeEqual(row.codeHash, sha256(code))) {
    await db
      .update(schema.otpRequests)
      .set({ attempts: row.attempts + 1 })
      .where(eq(schema.otpRequests.id, row.id));
    return { ok: false, reason: "mismatch" };
  }

  await db
    .update(schema.otpRequests)
    .set({ consumedAt: new Date() })
    .where(eq(schema.otpRequests.id, row.id));

  return { ok: true };
}

export function assertVerificationOk(result: OtpVerificationResult) {
  if (result.ok) return;
  if (result.reason === "mismatch") {
    throw badRequest("Incorrect OTP. Enter the latest code you received.");
  }
  throw badRequest(
    "This OTP has expired, was already used, or was replaced by a newer request. Please request a new one."
  );
}
