import type { Context } from "hono";
import { authMiddleware } from "@getmocha/users-service/backend";
import type { MochaUser } from "@getmocha/users-service/shared";
import type { User } from "@shared/types";
import { verifyJwt, GRAMA_GOOGLE_JWT_COOKIE } from "./google-auth";
import {
  normalizePriority,
  type IssuePriority,
} from "@shared/constants/governance";
import { computeSlaDueAt, getSlaHours } from "@shared/services/sla";
import { evaluateEscalation, nextEscalationLevel } from "@shared/services/escalation";
import { getDepartmentForCategory } from "@shared/services/departmentRouting";
import { classifyIssue } from "@shared/services/issueClassification";

type HonoEnv = { Bindings: Env };

export async function resolveGoogleJwtUser(ctx: {
  env: Env;
  req: Request;
}): Promise<User | null> {
  const cookieHeader = ctx.req.headers.get("Cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`${GRAMA_GOOGLE_JWT_COOKIE}=([^;]+)`));
  const jwtCookie = match?.[1]?.trim();
  if (!jwtCookie || !ctx.env.GOOGLE_CLIENT_SECRET) return null;
  const payload = await verifyJwt(jwtCookie, ctx.env.GOOGLE_CLIENT_SECRET);
  if (!payload?.userId) return null;
  return (
    (await ctx.env.DB.prepare("SELECT * FROM users WHERE id = ?")
      .bind(payload.userId)
      .first<User>()) ?? null
  );
}

export function requireAuth() {
  return async (c: Context<HonoEnv>, next: () => Promise<void>) => {
    const googleUser = await resolveGoogleJwtUser({ env: c.env, req: c.req.raw });
    if (googleUser) {
      c.set("gramaUser", googleUser);
      return next();
    }
    return authMiddleware(c, async () => {
      const mochaUser = c.get("user") as MochaUser;
      const user = await c.env.DB.prepare("SELECT * FROM users WHERE google_sub = ?")
        .bind(mochaUser.google_sub)
        .first<User>();
      if (!user) {
        c.json({ error: "User not found" }, 404);
        return;
      }
      c.set("gramaUser", user);
      await next();
    });
  };
}

export function canViewIssue(user: User, issue: {
  user_id: string;
  village?: string | null;
  mandal?: string | null;
  district?: string | null;
  ward_id?: number | null;
  assigned_to_user_id?: string | null;
}): boolean {
  if (user.role === "admin") return true;
  if (user.role === "mandal_official" && user.mandal && issue.mandal === user.mandal) return true;
  if (user.role === "sarpanch" && user.village && issue.village === user.village) return true;
  if (user.role === "ward_member") {
    return (
      issue.ward_id === user.ward_id ||
      issue.assigned_to_user_id === user.id ||
      (!!user.village && issue.village === user.village)
    );
  }
  if (issue.user_id === user.id) return true;
  if (user.village && issue.village === user.village) return true;
  return false;
}

export function canUpdateIssueStatus(user: User, issue: {
  ward_id?: number | null;
  assigned_to_user_id?: string | null;
  village?: string | null;
  mandal?: string | null;
}): boolean {
  if (user.role === "admin" || user.role === "sarpanch") return true;
  if (user.role === "mandal_official" && user.mandal === issue.mandal) return true;
  if (user.role === "ward_member") {
    return issue.ward_id === user.ward_id || issue.assigned_to_user_id === user.id;
  }
  return false;
}

export async function logIssueAudit(
  db: D1Database,
  params: {
    issueId: number;
    userId: string;
    actorRole: string;
    actionType: string;
    oldStatus?: string | null;
    newStatus: string;
    comment?: string | null;
    oldValue?: string | null;
    newValue?: string | null;
  }
) {
  await db
    .prepare(
      `INSERT INTO issue_updates (issue_id, user_id, old_status, new_status, comment, action_type, actor_role, old_value, new_value)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      params.issueId,
      params.userId,
      params.oldStatus ?? null,
      params.newStatus,
      params.comment ?? null,
      params.actionType,
      params.actorRole,
      params.oldValue ?? null,
      params.newValue ?? null
    )
    .run();
}

export function enrichIssueCreation(body: {
  category?: string;
  description: string;
  priority?: IssuePriority;
}) {
  const classification = classifyIssue(body.description);
  const priority = body.priority ?? classification.priority;
  const category = body.category ?? classification.category;
  const department = getDepartmentForCategory(category);
  const normalized = normalizePriority(priority);
  const now = new Date().toISOString();
  const slaHours = getSlaHours(normalized);
  const slaDueAt = computeSlaDueAt(now, normalized);

  return {
    category,
    priority: normalized,
    department,
    slaHours,
    slaDueAt,
    classification,
  };
}

export async function processEscalations(db: D1Database, issues: Array<{
  id: number;
  priority?: string | null;
  created_at: string;
  sla_due_at?: string | null;
  acknowledged_at?: string | null;
  resolved_at?: string | null;
  status?: string | null;
  escalation_level?: number | null;
  escalation_status?: string | null;
}>) {
  for (const issue of issues) {
    const evalResult = evaluateEscalation(issue);
    if (!evalResult.shouldEscalate) continue;

    const newLevel = nextEscalationLevel(issue.escalation_level ?? 0);
    const newStatus = evalResult.escalationStatus;

    await db
      .prepare(
        `UPDATE issues SET escalation_level = ?, escalation_status = ?, status = CASE WHEN ? = 'SLA_BREACHED' THEN 'SLA_BREACHED' ELSE status END, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
      )
      .bind(newLevel, newStatus, newStatus, issue.id)
      .run();

    await logIssueAudit(db, {
      issueId: issue.id,
      userId: "system",
      actorRole: "System",
      actionType: "escalated",
      newStatus: issue.status ?? "Submitted",
      comment: evalResult.reason,
      newValue: evalResult.nextResponsibleRole ?? undefined,
    });
  }
}

declare module "hono" {
  interface ContextVariableMap {
    gramaUser: User;
  }
}
