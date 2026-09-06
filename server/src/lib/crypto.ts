import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

export const sha256 = (value: string) =>
  createHash("sha256").update(value).digest("hex");

/** Opaque session token: only its hash is ever stored server-side. */
export const generateToken = () => randomBytes(32).toString("hex");

export const generateOtpCode = () => randomInt(0, 1_000_000).toString().padStart(6, "0");

export const safeEqual = (a: string, b: string) => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
};
