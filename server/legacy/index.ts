import { Hono } from "hono";
import { cors } from "hono/cors";
import { getCookie, setCookie } from "hono/cookie";
import {
  exchangeCodeForSessionToken,
  getOAuthRedirectUrl,
  authMiddleware,
  deleteSession,
  MOCHA_SESSION_TOKEN_COOKIE_NAME,
} from "@getmocha/users-service/backend";
import type { MochaUser } from "@getmocha/users-service/shared";
import {
  CreateIssueSchema,
  UpdateIssueStatusSchema,
  AssignIssueSchema,
  UpdateUserLocationSchema,
  CitizenConfirmationSchema,
  UpdateAffectedPopulationSchema,
  type Issue,
  type User,
} from "@shared/types";
import {
  buildGoogleRedirectUrl,
  exchangeGoogleCode,
  getGoogleUserFromTokens,
  signJwt,
  GRAMA_GOOGLE_JWT_COOKIE,
} from "./google-auth";
import {
  resolveGoogleJwtUser,
  requireAuth,
  canViewIssue,
  canUpdateIssueStatus,
  logIssueAudit,
  enrichIssueCreation,
  processEscalations,
} from "./governance";
import { computeDashboardStats, computeVillageAnalytics, filterIssues } from "@shared/services/analytics";
import { auditToTimeline } from "@shared/services/audit";
import { registerNewsRoutes } from "./news";
import { registerEmergencyRoutes } from "./emergency";
import { evaluateEscalation } from "@shared/services/escalation";

const app = new Hono<{ Bindings: Env }>();

app.use("/*", cors());

// Prefer direct Google OAuth when GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set (redirect_uri can be from env or request)
const useDirectGoogle = (env: Env) =>
  !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

// ============================================
// AUTHENTICATION ENDPOINTS
// ============================================

const OAUTH_REDIRECT_URI_COOKIE = "grama_oauth_redirect_uri";

app.get("/api/oauth/google/redirect_url", async (c) => {
  try {
    if (c.env.GOOGLE_CLIENT_ID && c.env.GOOGLE_CLIENT_SECRET) {
      const origin = c.req.header("Origin") || c.req.header("Referer")?.replace(/\/[^/]*$/, "") || "";
      const derivedRedirectUri = origin ? `${origin.replace(/\/$/, "")}/auth/callback` : "";
      const redirectUri = c.env.GOOGLE_REDIRECT_URI || derivedRedirectUri;
      const redirectUrl = buildGoogleRedirectUrl({ ...c.env, GOOGLE_REDIRECT_URI: redirectUri });
      if (redirectUrl) {
        if (redirectUri) {
          setCookie(c, OAUTH_REDIRECT_URI_COOKIE, redirectUri, {
            httpOnly: true,
            path: "/",
            sameSite: "lax",
            secure: c.req.url.startsWith("https"),
            maxAge: 600,
          });
        }
        return c.json({ redirectUrl }, 200);
      }
    }
    if (c.env.MOCHA_USERS_SERVICE_API_KEY) {
      const redirectUrl = await getOAuthRedirectUrl("google", {
        apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL || "https://getmocha.com/u",
        apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
      });
      return c.json({ redirectUrl }, 200);
    }
    return c.json({
      error: "Configure either (1) GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .dev.vars (GOOGLE_REDIRECT_URI optional for same-origin), or (2) MOCHA_USERS_SERVICE_API_KEY. See .dev.vars.example.",
    }, 500);
  } catch (error) {
    console.error("Error getting OAuth redirect URL:", error);
    return c.json({
      error: "Failed to get OAuth redirect URL",
      details: error instanceof Error ? error.message : String(error),
    }, 500);
  }
});

app.post("/api/sessions", async (c) => {
  try {
    const body = (await c.req.json()) as { code?: string };
    if (!body.code) {
      return c.json({ error: "No authorization code provided" }, 400);
    }

    if (useDirectGoogle(c.env)) {
      const redirectUri =
        c.env.GOOGLE_REDIRECT_URI ||
        getCookie(c, OAUTH_REDIRECT_URI_COOKIE) ||
        "";
      if (!redirectUri) {
        return c.json({
          error: "Missing redirect_uri. Set GOOGLE_REDIRECT_URI in .dev.vars (e.g. http://localhost:5173/auth/callback) or retry Sign in with Google from the same origin.",
        }, 400);
      }
      const tokens = await exchangeGoogleCode(
        body.code,
        redirectUri,
        c.env.GOOGLE_CLIENT_ID!,
        c.env.GOOGLE_CLIENT_SECRET!
      );
      const googleUser = await getGoogleUserFromTokens(tokens);
      let user = await c.env.DB.prepare(
        "SELECT * FROM users WHERE google_sub = ?"
      )
        .bind(googleUser.sub)
        .first<User>();
      if (!user) {
        const userId = crypto.randomUUID();
        await c.env.DB.prepare(
          "INSERT INTO users (id, email, name, role, google_sub) VALUES (?, ?, ?, ?, ?)"
        )
          .bind(
            userId,
            googleUser.email,
            googleUser.name || null,
            "citizen",
            googleUser.sub
          )
          .run();
        user = await c.env.DB.prepare("SELECT * FROM users WHERE id = ?")
          .bind(userId)
          .first<User>();
      }
      if (!user) throw new Error("Failed to create or fetch user");
      const jwt = await signJwt(
        {
          sub: googleUser.sub,
          email: user.email,
          name: user.name,
          userId: user.id,
        },
        c.env.GOOGLE_CLIENT_SECRET!
      );
      setCookie(c, GRAMA_GOOGLE_JWT_COOKIE, jwt, {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secure: c.req.url.startsWith("https"),
        maxAge: 60 * 24 * 60 * 60,
      });
      setCookie(c, OAUTH_REDIRECT_URI_COOKIE, "", { path: "/", maxAge: 0 });
      return c.json({ success: true }, 200);
    }

    if (!c.env.MOCHA_USERS_SERVICE_API_KEY) {
      return c.json({
        error: "MOCHA_USERS_SERVICE_API_KEY is not configured. Or use GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET + GOOGLE_REDIRECT_URI.",
      }, 500);
    }
    const sessionToken = await exchangeCodeForSessionToken(body.code, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL || "https://getmocha.com/u",
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
    setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      path: "/",
      sameSite: "none",
      secure: true,
      maxAge: 60 * 24 * 60 * 60,
    });
    return c.json({ success: true }, 200);
  } catch (error) {
    console.error("Error exchanging code for session token:", error);
    return c.json({
      error: "Failed to exchange authorization code",
      details: error instanceof Error ? error.message : String(error),
    }, 500);
  }
});

app.get("/api/users/me", async (c, next) => {
  const googleUser = await resolveGoogleJwtUser({ env: c.env, req: c.req.raw });
  if (googleUser) return c.json(googleUser);
  return authMiddleware(c, next);
}, async (c) => {
  const mochaUser = c.get("user") as MochaUser;
  let user = await c.env.DB.prepare(
    "SELECT * FROM users WHERE google_sub = ?"
  )
    .bind(mochaUser.google_sub)
    .first<User>();
  if (!user) {
    const userId = crypto.randomUUID();
    await c.env.DB.prepare(
      "INSERT INTO users (id, email, name, role, google_sub) VALUES (?, ?, ?, ?, ?)"
    )
      .bind(
        userId,
        mochaUser.email,
        mochaUser.google_user_data?.name ?? null,
        "citizen",
        mochaUser.google_sub
      )
      .run();
    user = await c.env.DB.prepare("SELECT * FROM users WHERE id = ?")
      .bind(userId)
      .first<User>();
  }
  return c.json(user!);
});

app.get("/api/logout", async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);
  if (typeof sessionToken === "string" && c.env.MOCHA_USERS_SERVICE_API_KEY) {
    await deleteSession(sessionToken, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
  }
  setCookie(c, GRAMA_GOOGLE_JWT_COOKIE, "", {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: c.req.url.startsWith("https"),
    maxAge: 0,
  });
  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// ============================================
// ISSUES ENDPOINTS
// ============================================

app.get("/api/issues", requireAuth(), async (c) => {
  const user = c.get("gramaUser");

  let query: string;
  let bindings: (string | number | null)[] = [];

  const url = new URL(c.req.url);
  const qDistrict = url.searchParams.get("district");
  const qMandal = url.searchParams.get("mandal");
  const qVillage = url.searchParams.get("village");
  const qWard = url.searchParams.get("ward");
  const qCategory = url.searchParams.get("category");
  const qPriority = url.searchParams.get("priority");
  const qStatus = url.searchParams.get("status");

  if (user.role === 'admin' || user.role === 'sarpanch' || user.role === 'mandal_official') {
    const filters: string[] = [];
    const qBindings: (string | number | null)[] = [];

    if (qDistrict) { filters.push("district = ?"); qBindings.push(qDistrict); }
    if (qMandal) { filters.push("mandal = ?"); qBindings.push(qMandal); }
    if (qVillage) { filters.push("village = ?"); qBindings.push(qVillage); }
    if (qWard) { filters.push("ward = ?"); qBindings.push(qWard); }
    if (qCategory) { filters.push("category = ?"); qBindings.push(qCategory); }
    if (qPriority) { filters.push("priority = ?"); qBindings.push(qPriority.toUpperCase()); }
    if (qStatus) { filters.push("status = ?"); qBindings.push(qStatus); }

    if (user.role === 'mandal_official' && user.mandal && !qMandal) {
      filters.push("mandal = ?");
      qBindings.push(user.mandal);
    } else if (user.role === 'sarpanch' && user.village && filters.length === 0) {
      filters.push("village = ?");
      qBindings.push(user.village);
    }

    if (filters.length) {
      query = `SELECT * FROM issues WHERE ${filters.join(" AND ")} ORDER BY created_at DESC`;
      bindings = qBindings;
    } else if (user.village) {
      query = "SELECT * FROM issues WHERE village = ? ORDER BY created_at DESC";
      bindings = [user.village];
    } else {
      query = "SELECT * FROM issues ORDER BY created_at DESC";
    }
  } else if (user.role === 'ward_member' && user.ward_id) {
    if (user.village) {
      query = "SELECT * FROM issues WHERE (ward_id = ? OR assigned_to_user_id = ?) AND village = ? ORDER BY created_at DESC";
      bindings = [user.ward_id, user.id, user.village];
    } else {
      query = "SELECT * FROM issues WHERE ward_id = ? OR assigned_to_user_id = ? ORDER BY created_at DESC";
      bindings = [user.ward_id, user.id];
    }
  } else {
    if (user.village) {
      query = "SELECT * FROM issues WHERE village = ? ORDER BY created_at DESC";
      bindings = [user.village];
    } else {
      query = "SELECT * FROM issues WHERE user_id = ? ORDER BY created_at DESC";
      bindings = [user.id];
    }
  }

  const { results } = await c.env.DB.prepare(query).bind(...bindings).all<Issue>();
  await processEscalations(c.env.DB, results);

  let issuesWithUrls = results.map(issue => ({
    ...issue,
    photo_url: issue.photo_key ? `/api/files/${issue.photo_key}` : null,
  }));

  const slaStatus = url.searchParams.get("slaStatus");
  if (slaStatus) {
    issuesWithUrls = filterIssues(issuesWithUrls, {
      slaStatus: slaStatus as "green" | "amber" | "red" | "breached",
    });
  }

  return c.json(issuesWithUrls);
});

app.get("/api/issues/:id", requireAuth(), async (c) => {
  const user = c.get("gramaUser");
  const issueId = parseInt(c.req.param("id"));
  const issue = await c.env.DB.prepare("SELECT * FROM issues WHERE id = ?").bind(issueId).first<Issue>();
  if (!issue) return c.json({ error: "Issue not found" }, 404);
  if (!canViewIssue(user, issue)) return c.json({ error: "Unauthorized" }, 403);
  return c.json({
    ...issue,
    photo_url: issue.photo_key ? `/api/files/${issue.photo_key}` : null,
    escalation: evaluateEscalation(issue),
  });
});

app.get("/api/issues/:id/timeline", requireAuth(), async (c) => {
  const user = c.get("gramaUser");
  const issueId = parseInt(c.req.param("id"));
  const issue = await c.env.DB.prepare("SELECT * FROM issues WHERE id = ?").bind(issueId).first<Issue>();
  if (!issue) return c.json({ error: "Issue not found" }, 404);
  if (!canViewIssue(user, issue)) return c.json({ error: "Unauthorized" }, 403);

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM issue_updates WHERE issue_id = ? ORDER BY created_at ASC"
  ).bind(issueId).all();

  const timeline = auditToTimeline(results as Parameters<typeof auditToTimeline>[0]);
  return c.json(timeline);
});

app.post("/api/issues", requireAuth(), async (c) => {
  const user = c.get("gramaUser");
  const body = await c.req.json();
  const validatedData = CreateIssueSchema.parse(body);
  const enriched = enrichIssueCreation(validatedData);

  const { success, meta } = await c.env.DB.prepare(
    `INSERT INTO issues (user_id, category, description, location, latitude, longitude, status, district, mandal, village,
      priority, sla_hours, sla_due_at, department, ward, estimated_affected_citizens, sync_state)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    user.id,
    enriched.category,
    validatedData.description,
    validatedData.location || null,
    validatedData.latitude || null,
    validatedData.longitude || null,
    'Submitted',
    user.district || null,
    user.mandal || null,
    user.village || null,
    enriched.priority,
    enriched.slaHours,
    enriched.slaDueAt,
    enriched.department,
    validatedData.ward || null,
    validatedData.estimated_affected_citizens ?? null,
    'synced'
  ).run();

  if (!success) return c.json({ error: "Failed to create issue" }, 500);

  const issueId = (meta?.last_row_id ?? 0) as number;
  if (!issueId) {
    return c.json({ error: "Failed to create issue" }, 500);
  }
  await logIssueAudit(c.env.DB, {
    issueId,
    userId: user.id,
    actorRole: user.role,
    actionType: "created",
    newStatus: "Submitted",
    comment: "Complaint submitted by citizen",
  });

  return c.json({ success: true, id: issueId, classification: enriched.classification }, 201);
});

app.patch("/api/issues/:id/status", requireAuth(), async (c) => {
  const user = c.get("gramaUser");
  if (!canUpdateIssueStatus(user, {})) {
    /* checked per-issue below */
  }

  const issueId = parseInt(c.req.param("id"));
  const body = await c.req.json();
  const validatedData = UpdateIssueStatusSchema.parse(body);

  const issue = await c.env.DB.prepare("SELECT * FROM issues WHERE id = ?").bind(issueId).first<Issue>();
  if (!issue) return c.json({ error: "Issue not found" }, 404);
  if (!canUpdateIssueStatus(user, issue)) return c.json({ error: "Unauthorized" }, 403);

  const now = new Date().toISOString();
  let acknowledgedAt = issue.acknowledged_at;
  let resolvedAt = issue.resolved_at;
  let assignedAt = issue.assigned_at;

  if (validatedData.status === "Acknowledged" && !acknowledgedAt) acknowledgedAt = now;
  if (validatedData.status === "In Progress" && !assignedAt) assignedAt = now;
  if ((validatedData.status === "Resolved" || validatedData.status === "Closed") && !resolvedAt) {
    resolvedAt = now;
  }
  if (validatedData.status === "Reopened") {
    resolvedAt = null;
  }

  await c.env.DB.prepare(
    `UPDATE issues SET status = ?, acknowledged_at = ?, assigned_at = ?, resolved_at = ?,
      citizen_confirmation_status = CASE WHEN ? = 'Resolved' THEN 'pending' ELSE citizen_confirmation_status END,
      updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).bind(validatedData.status, acknowledgedAt, assignedAt, resolvedAt, validatedData.status, issueId).run();

  const actionType = validatedData.status === "Acknowledged" ? "acknowledged" : "status_change";
  await logIssueAudit(c.env.DB, {
    issueId,
    userId: user.id,
    actorRole: user.role,
    actionType,
    oldStatus: issue.status,
    newStatus: validatedData.status,
    comment: validatedData.comment || null,
    oldValue: issue.status,
    newValue: validatedData.status,
  });

  return c.json({ success: true });
});

app.post("/api/issues/:id/confirm", requireAuth(), async (c) => {
  const user = c.get("gramaUser");
  const issueId = parseInt(c.req.param("id"));
  const body = await c.req.json();
  const validated = CitizenConfirmationSchema.parse(body);

  const issue = await c.env.DB.prepare("SELECT * FROM issues WHERE id = ?").bind(issueId).first<Issue>();
  if (!issue) return c.json({ error: "Issue not found" }, 404);
  if (issue.user_id !== user.id) return c.json({ error: "Only the reporting citizen can confirm" }, 403);
  if (issue.status !== "Resolved") return c.json({ error: "Issue must be resolved before confirmation" }, 400);

  const now = new Date().toISOString();

  if (validated.confirmed) {
    await c.env.DB.prepare(
      `UPDATE issues SET status = 'Closed', citizen_confirmation_status = 'confirmed',
        citizen_confirmed_at = ?, citizen_rating = ?, citizen_feedback = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(now, validated.rating ?? null, validated.feedback ?? null, issueId).run();

    await logIssueAudit(c.env.DB, {
      issueId, userId: user.id, actorRole: user.role, actionType: "citizen_confirmed",
      newStatus: "Closed", comment: validated.feedback ?? "Citizen confirmed resolution",
    });
  } else {
    await c.env.DB.prepare(
      `UPDATE issues SET status = 'Reopened', citizen_confirmation_status = 'rejected',
        citizen_feedback = ?, resolved_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(validated.reason ?? validated.feedback ?? "Citizen reported unresolved", issueId).run();

    await logIssueAudit(c.env.DB, {
      issueId, userId: user.id, actorRole: user.role, actionType: "citizen_rejected",
      newStatus: "Reopened", comment: validated.reason ?? validated.feedback ?? null,
    });
    await processEscalations(c.env.DB, [{ ...issue, status: "Reopened", resolved_at: null }]);
  }

  return c.json({ success: true });
});

app.patch("/api/issues/:id/affected", requireAuth(), async (c) => {
  const user = c.get("gramaUser");
  if (!canUpdateIssueStatus(user, {})) {
    /* per-issue check */
  }
  const issueId = parseInt(c.req.param("id"));
  const body = await c.req.json();
  const validated = UpdateAffectedPopulationSchema.parse(body);
  const issue = await c.env.DB.prepare("SELECT * FROM issues WHERE id = ?").bind(issueId).first<Issue>();
  if (!issue) return c.json({ error: "Issue not found" }, 404);
  if (!canUpdateIssueStatus(user, issue)) return c.json({ error: "Unauthorized" }, 403);

  await c.env.DB.prepare(
    "UPDATE issues SET estimated_affected_citizens = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(validated.estimated_affected_citizens, issueId).run();

  await logIssueAudit(c.env.DB, {
    issueId, userId: user.id, actorRole: user.role, actionType: "affected_population_updated",
    newStatus: issue.status,
    oldValue: String(issue.estimated_affected_citizens ?? ""),
    newValue: String(validated.estimated_affected_citizens),
  });

  return c.json({ success: true });
});

app.patch("/api/issues/:id/assign", requireAuth(), async (c) => {
  const user = c.get("gramaUser");
  if (user.role !== 'admin' && user.role !== 'sarpanch' && user.role !== 'mandal_official') {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const issueId = parseInt(c.req.param("id"));
  const body = await c.req.json();
  const validatedData = AssignIssueSchema.parse(body);
  const issue = await c.env.DB.prepare("SELECT * FROM issues WHERE id = ?").bind(issueId).first<Issue>();
  if (!issue) return c.json({ error: "Issue not found" }, 404);

  const now = new Date().toISOString();
  const { success } = await c.env.DB.prepare(
    "UPDATE issues SET assigned_to_user_id = ?, ward_id = ?, assigned_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(validatedData.assigned_to_user_id, validatedData.ward_id || null, now, issueId).run();

  if (!success) return c.json({ error: "Failed to assign issue" }, 500);

  await logIssueAudit(c.env.DB, {
    issueId, userId: user.id, actorRole: user.role, actionType: "assigned",
    newStatus: issue.status, newValue: validatedData.assigned_to_user_id,
  });

  return c.json({ success: true });
});

app.post("/api/issues/:id/photo", requireAuth(), async (c) => {
  const user = c.get("gramaUser");
  const issueId = parseInt(c.req.param("id"));
  const issue = await c.env.DB.prepare("SELECT * FROM issues WHERE id = ?").bind(issueId).first<Issue>();
  if (!issue) return c.json({ error: "Issue not found" }, 404);
  if (issue.user_id !== user.id && !canUpdateIssueStatus(user, issue)) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const formData = await c.req.formData();
  const file = formData.get("photo") as File;

  if (!file) {
    return c.json({ error: "No photo provided" }, 400);
  }

  const fileExtension = file.name.split('.').pop() || 'jpg';
  const photoKey = `issues/${issueId}/${Date.now()}.${fileExtension}`;

  await c.env.R2_BUCKET.put(photoKey, await file.arrayBuffer(), {
    httpMetadata: {
      contentType: file.type,
    },
  });

  await c.env.DB.prepare(
    "UPDATE issues SET photo_key = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(photoKey, issueId).run();

  await logIssueAudit(c.env.DB, {
    issueId, userId: user.id, actorRole: user.role, actionType: "photo_uploaded",
    newStatus: issue.status, comment: "Resolution photo uploaded",
  });

  return c.json({ success: true, photo_key: photoKey });
});

// ============================================
// ANALYTICS ENDPOINTS
// ============================================

app.get("/api/analytics/dashboard", requireAuth(), async (c) => {
  const user = c.get("gramaUser");
  if (!["admin", "sarpanch", "ward_member", "mandal_official"].includes(user.role)) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const url = new URL(c.req.url);
  let query = "SELECT * FROM issues";
  const bindings: string[] = [];
  const filters: string[] = [];

  if (url.searchParams.get("district")) {
    filters.push("district = ?");
    bindings.push(url.searchParams.get("district")!);
  }
  if (url.searchParams.get("mandal")) {
    filters.push("mandal = ?");
    bindings.push(url.searchParams.get("mandal")!);
  }
  if (url.searchParams.get("village")) {
    filters.push("village = ?");
    bindings.push(url.searchParams.get("village")!);
  } else if (user.role === "sarpanch" && user.village) {
    filters.push("village = ?");
    bindings.push(user.village);
  } else if (user.role === "mandal_official" && user.mandal) {
    filters.push("mandal = ?");
    bindings.push(user.mandal);
  }

  if (filters.length) query += ` WHERE ${filters.join(" AND ")}`;
  query += " ORDER BY created_at DESC";

  const { results } = await c.env.DB.prepare(query).bind(...bindings).all<Issue>();
  const stats = computeDashboardStats(results, { isDemoData: results.length < 5 });

  const priorityIssues = results.filter((i) =>
    ["HIGH", "CRITICAL"].includes((i.priority ?? "").toUpperCase()) &&
    i.status !== "Resolved" && i.status !== "Closed"
  ).slice(0, 10);

  const slaBreached = filterIssues(results, { slaStatus: "breached" }).slice(0, 10);
  const recentlyAssigned = results.filter((i) => i.assigned_at).slice(0, 10);
  const recentlyResolved = results.filter((i) => i.resolved_at).slice(0, 10);

  const categoryCounts: Record<string, number> = {};
  for (const i of results.filter((x) => x.status !== "Resolved" && x.status !== "Closed")) {
    categoryCounts[i.category] = (categoryCounts[i.category] ?? 0) + 1;
  }
  const recurringProblems = Object.entries(categoryCounts)
    .map(([category, count]) => ({ category, count }))
    .filter((x) => x.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return c.json({
    stats,
    priorityIssues,
    slaBreached,
    recentlyAssigned,
    recentlyResolved,
    recurringProblems,
  });
});

app.get("/api/analytics/village/:village", requireAuth(), async (c) => {
  const user = c.get("gramaUser");
  const village = c.req.param("village");
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM issues WHERE village = ? ORDER BY created_at DESC"
  ).bind(village).all<Issue>();

  if (!canViewIssue(user, { user_id: user.id, village })) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const analytics = computeVillageAnalytics(village, results, { isDemoData: results.length < 3 });
  return c.json(analytics);
});

app.get("/api/files/:key{.+}", async (c) => {
  const key = c.req.param("key");
  const object = await c.env.R2_BUCKET.get(key);

  if (!object) {
    return c.json({ error: "File not found" }, 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata?.(headers);
  headers.set("etag", object.httpEtag ?? "");

  return c.body(object.body, { headers });
});

// ============================================
// WARDS ENDPOINTS
// ============================================

app.get("/api/wards", authMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM wards ORDER BY name"
  ).all();

  return c.json(results);
});

// ============================================
// USERS ENDPOINTS
// ============================================

app.get("/api/users", authMiddleware, async (c) => {
  const mochaUser = c.get("user") as MochaUser;
  const user = await c.env.DB.prepare(
    "SELECT * FROM users WHERE google_sub = ?"
  ).bind(mochaUser.google_sub).first<User>();

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  // Only admins can list users
  if (user.role !== 'admin' && user.role !== 'sarpanch') {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM users ORDER BY created_at DESC"
  ).all();

  return c.json(results);
});

app.patch("/api/users/:id/role", authMiddleware, async (c) => {
  const mochaUser = c.get("user") as MochaUser;
  const user = await c.env.DB.prepare(
    "SELECT * FROM users WHERE google_sub = ?"
  ).bind(mochaUser.google_sub).first<User>();

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  // Only admins can change roles
  if (user.role !== 'admin' && user.role !== 'sarpanch') {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const userId = c.req.param("id");
  const body = await c.req.json();

  const { success } = await c.env.DB.prepare(
    "UPDATE users SET role = ?, ward_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(body.role, body.ward_id || null, userId).run();

  if (!success) {
    return c.json({ error: "Failed to update user" }, 500);
  }

  return c.json({ success: true });
});

app.patch("/api/users/me/location", authMiddleware, async (c) => {
  const mochaUser = c.get("user") as MochaUser;
  const user = await c.env.DB.prepare(
    "SELECT * FROM users WHERE google_sub = ?"
  ).bind(mochaUser.google_sub).first<User>();

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  const body = await c.req.json();
  const validatedData = UpdateUserLocationSchema.parse(body);

  const { success } = await c.env.DB.prepare(
    "UPDATE users SET district = ?, mandal = ?, village = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(
    validatedData.district,
    validatedData.mandal,
    validatedData.village,
    user.id
  ).run();

  if (!success) {
    return c.json({ error: "Failed to update location" }, 500);
  }

  return c.json({ success: true });
});

app.patch("/api/users/me/complete-registration", authMiddleware, async (c) => {
  const mochaUser = c.get("user") as MochaUser;
  const user = await c.env.DB.prepare(
    "SELECT * FROM users WHERE google_sub = ?"
  ).bind(mochaUser.google_sub).first<User>();

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  const body = await c.req.json();

  const { success } = await c.env.DB.prepare(
    `UPDATE users SET 
      name = ?, 
      father_name = ?, 
      phone = ?, 
      district = ?, 
      mandal = ?, 
      village = ?, 
      updated_at = CURRENT_TIMESTAMP 
     WHERE id = ?`
  ).bind(
    body.name,
    body.father_name,
    body.phone,
    body.district,
    body.mandal,
    body.village,
    user.id
  ).run();

  if (!success) {
    return c.json({ error: "Failed to complete registration" }, 500);
  }

  return c.json({ success: true });
});

registerNewsRoutes(app);
registerEmergencyRoutes(app);

export default app;
