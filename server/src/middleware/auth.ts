import type { Context, Next } from "hono";
import { resolveAuthContext, type AuthContext } from "../services/session";
import { unauthorized, forbidden } from "./error";
import type { UserRole } from "../db/schema";

type Env = { Variables: { auth: AuthContext } };

/** Resolves the session cookie; 401 when absent or invalid. */
export async function requireAuth(c: Context<Env>, next: Next) {
  const auth = await resolveAuthContext(c);
  if (!auth) throw unauthorized();
  c.set("auth", auth);
  await next();
}

export function getAuth(c: Context<Env>): AuthContext {
  return c.get("auth");
}

/**
 * Role gate. Officials must additionally be approved — a pending or
 * declined sarpanch/admin holds no official powers.
 */
export function requireRole(...roles: UserRole[]) {
  return async (c: Context<Env>, next: Next) => {
    const { user } = getAuth(c);
    const isOfficialRequest = roles.some((r) => r !== "citizen");
    const approvedAsOfficial =
      !isOfficialRequest ||
      user.approvalStatus === "approved" ||
      user.role === "super_admin";

    if (!roles.includes(user.role) || !approvedAsOfficial) {
      throw forbidden();
    }
    await next();
  };
}
