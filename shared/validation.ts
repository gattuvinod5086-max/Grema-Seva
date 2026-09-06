import { z } from "zod";

/* ── Phone ─────────────────────────────────────────────────────── */

/** Strips spaces, dashes and parentheses from user-typed phone input. */
export const sanitizePhoneInput = (raw: string): string => raw.replace(/[\s()-]/g, "");

/**
 * Indian mobile number: 10 digits starting 6-9, optionally prefixed with
 * 0, 91 or +91. Note the backtracking-safe prefix: "9100933678" parses as
 * a bare 10-digit number, not as 91 + "00933678".
 */
export const INDIAN_MOBILE_RE = /^(?:(?:\+|0)?91)?[6-9]\d{9}$/;

export const isValidIndianMobile = (raw: string): boolean =>
  INDIAN_MOBILE_RE.test(sanitizePhoneInput(raw));

export const MOBILE_ERROR = "Enter a valid 10-digit Indian mobile number";

export const indianMobileSchema = z
  .string()
  .refine(isValidIndianMobile, MOBILE_ERROR);

/* ── Person names ──────────────────────────────────────────────── */

/** Unicode letters (incl. Telugu), spaces, dots, apostrophes and hyphens. */
export const PERSON_NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M}\s.'-]{1,99}$/u;

export const NAME_ERROR =
  "Name must be 2–100 characters and contain only letters, spaces, dots, apostrophes or hyphens";

export const personNameSchema = z
  .string()
  .trim()
  .regex(PERSON_NAME_RE, NAME_ERROR);

export const optionalPersonNameSchema = z
  .string()
  .trim()
  .regex(PERSON_NAME_RE, NAME_ERROR)
  .optional();
