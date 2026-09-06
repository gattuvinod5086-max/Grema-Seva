/**
 * Direct Google OAuth 2.0 (no Mocha). Use GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET + GOOGLE_REDIRECT_URI in .dev.vars.
 */

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
export const GRAMA_GOOGLE_JWT_COOKIE = "grama_google_jwt";
const JWT_ALG = "HS256";
const JWT_EXP_DAYS = 30;

function base64UrlEncode(data: ArrayBuffer | string): string {
  const bytes =
    typeof data === "string"
      ? new TextEncoder().encode(data)
      : new Uint8Array(data);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Build Google OAuth URL. redirectUriFromRequest can be e.g. requestOrigin + "/auth/callback" when GOOGLE_REDIRECT_URI is not set. */
export function buildGoogleRedirectUrl(
  env: { GOOGLE_CLIENT_ID?: string; GOOGLE_REDIRECT_URI?: string },
  redirectUriFromRequest?: string
): string | null {
  const redirectUri = env.GOOGLE_REDIRECT_URI ?? redirectUriFromRequest;
  if (!env.GOOGLE_CLIENT_ID || !redirectUri || !redirectUri.startsWith("http")) return null;
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeGoogleCode(
  code: string,
  redirectUri: string,
  clientId: string,
  clientSecret: string
): Promise<{ access_token: string; id_token?: string }> {
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token exchange failed: ${res.status} ${text}`);
  }
  return (await res.json()) as { access_token: string; id_token?: string };
}

/** Decode JWT payload without verifying (Google id_token is signed by Google). For our own JWT we verify with HMAC. */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = base64UrlDecode(parts[1]);
    return JSON.parse(new TextDecoder().decode(payload)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function getGoogleUserFromTokens(tokens: {
  access_token: string;
  id_token?: string;
}): Promise<{ sub: string; email: string; name: string }> {
  if (tokens.id_token) {
    const payload = decodeJwtPayload(tokens.id_token);
    if (payload && payload.sub && payload.email) {
      return {
        sub: String(payload.sub),
        email: String(payload.email),
        name: payload.name != null ? String(payload.name) : "",
      };
    }
  }
  const res = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch Google user info");
  const user = (await res.json()) as { id?: string; sub?: string; email?: string; name?: string };
  const sub = user.sub ?? user.id ?? "";
  const email = user.email ?? "";
  const name = user.name ?? "";
  if (!sub || !email) throw new Error("Invalid Google user info");
  return { sub, email, name };
}

/** Sign a JWT with HMAC-SHA256 using the given secret. */
export async function signJwt(
  payload: Record<string, unknown>,
  secret: string
): Promise<string> {
  const header = { alg: JWT_ALG, typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payloadWithExp = { ...payload, iat: now, exp: now + JWT_EXP_DAYS * 24 * 3600 };
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payloadWithExp));
  const message = `${headerB64}.${payloadB64}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message)
  );
  const sigB64 = base64UrlEncode(sig);
  return `${message}.${sigB64}`;
}

/** Verify and decode our JWT. Returns payload or null. */
export async function verifyJwt(
  token: string,
  secret: string
): Promise<Record<string, unknown> | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, sigB64] = parts;
  const message = `${headerB64}.${payloadB64}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const sig = base64UrlDecode(sigB64);
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    sig,
    new TextEncoder().encode(message)
  );
  if (!valid) return null;
  try {
    const payload = JSON.parse(
      new TextDecoder().decode(base64UrlDecode(payloadB64))
    ) as Record<string, unknown>;
    const exp = payload.exp as number | undefined;
    if (exp && Date.now() / 1000 > exp) return null;
    return payload;
  } catch {
    return null;
  }
}
