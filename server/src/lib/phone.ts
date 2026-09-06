/**
 * Normalises user-supplied phone input to E.164.
 * Bare 10-digit numbers are treated as Indian numbers (+91).
 */
export function normalizePhone(raw: string): string | null {
  const trimmed = raw.replace(/[\s()-]/g, "");
  if (/^\+[1-9]\d{7,14}$/.test(trimmed)) {
    return trimmed;
  }
  if (/^[6-9]\d{9}$/.test(trimmed)) {
    return `+91${trimmed}`;
  }
  return null;
}

/** Masks a phone for logs/responses: +919876543210 -> +9198765*****0. */
export function maskPhone(phone: string): string {
  return phone.length > 6 ? `${phone.slice(0, phone.length - 6)}*****${phone.slice(-1)}` : phone;
}
