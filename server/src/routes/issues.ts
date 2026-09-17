import path from "node:path";
import { Hono } from "hono";
import { z } from "zod";
import { eq, or } from "drizzle-orm";
import { db, schema } from "../db/client";
import { requireAuth, getAuth } from "../middleware/auth";
import { badRequest, notFound, forbidden } from "../middleware/error";
import {
  createIssue,
  listIssuesForUser,
  getIssueForUser,
  updateIssueStatus,
  addProgressNote,
  confirmResolution,
  reopenIssue,
  getVillageIssueStats,
  findSimilarIssues,
} from "../services/issues";
import { issueVisibilityFilter, canViewIssue, assertCanManageIssue } from "../services/issueScope";
import { ISSUE_STATUSES, ISSUE_VISIBILITIES } from "../db/schema";
import { ISSUE_CATEGORIES } from "../../../shared/constants/governance";
import { getStorage, ALLOWED_MIME, MAX_UPLOAD_BYTES } from "../providers/storage";
import { realtimeHub } from "../services/realtime";

const createIssueSchema = z.object({
  category: z.enum(ISSUE_CATEGORIES),
  description: z.string().trim().min(5, "Description must have at least 5 characters").max(4000),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  accuracyM: z.number().min(0).max(100000).nullable().optional(),
  addressText: z.string().trim().max(500).nullable().optional(),
  visibility: z.enum(ISSUE_VISIBILITIES).optional(),
  wardNumber: z.string().trim().max(20).nullable().optional(),
  idempotencyKey: z.string().trim().min(8).max(100).nullable().optional(),
});

const statusSchema = z.object({
  status: z.enum(ISSUE_STATUSES),
  note: z.string().trim().max(2000).optional(),
});

const progressSchema = z.object({
  note: z.string().trim().min(3).max(2000),
});

export const issuesRoutes = new Hono()
  .use("*", requireAuth)
  /* Village stats: how many issues and their status, scoped to the caller. */
  .get("/stats", async (c) => {
    const { user, jurisdiction } = getAuth(c);
    if (!jurisdiction && user.role !== "super_admin" && user.role !== "admin") {
      return c.json({ total: 0, byStatus: {}, byCategory: {} });
    }
    let district = c.req.query("district")?.trim() || undefined;
    let mandal = c.req.query("mandal")?.trim() || undefined;
    let village = c.req.query("village")?.trim() || undefined;
    let wardNumber = c.req.query("wardNumber")?.trim() || undefined;

    // Hierarchy enforcement: mandal officials are always bound to their district and mandal
    if (user.role === "mandal_official" && jurisdiction) {
      district = jurisdiction.district;
      mandal = jurisdiction.mandal;
    } else if (user.role === "ward_member" && jurisdiction) {
      district = jurisdiction.district;
      mandal = jurisdiction.mandal;
      village = jurisdiction.village;
      wardNumber = user.wardNumber || undefined;
    } else if (user.role === "sarpanch" && jurisdiction) {
      district = jurisdiction.district;
      mandal = jurisdiction.mandal;
      village = jurisdiction.village;
    } else if (user.role === "citizen" && jurisdiction) {
      district = jurisdiction.district;
      mandal = jurisdiction.mandal;
      if (c.req.query("village") && c.req.query("village")?.trim().toLowerCase() !== jurisdiction.village.toLowerCase()) {
        village = c.req.query("village")?.trim();
      } else {
        village = jurisdiction.village;
      }
    }

    return c.json(
      await getVillageIssueStats(issueVisibilityFilter(user, jurisdiction), {
        district,
        mandal,
        village,
        wardNumber,
      })
    );
  })
  /* Similar open issues in the village — check before filing. */
  .get("/similar", async (c) => {
    const { user, jurisdiction } = getAuth(c);
    if (!jurisdiction) return c.json({ similar: [] });

    const category = c.req.query("category");
    if (!category || !ISSUE_CATEGORIES.includes(category as (typeof ISSUE_CATEGORIES)[number])) {
      throw badRequest("Provide a valid category");
    }
    const lat = c.req.query("lat") ? Number(c.req.query("lat")) : null;
    const lng = c.req.query("lng") ? Number(c.req.query("lng")) : null;

    const similar = await findSimilarIssues(
      issueVisibilityFilter(user, jurisdiction),
      category,
      lat != null && !Number.isNaN(lat) ? lat : null,
      lng != null && !Number.isNaN(lng) ? lng : null
    );
    return c.json({ similar });
  })
  /* List — the visibility filter is composed from the session user. */
  .get("/", async (c) => {
    const { user, jurisdiction } = getAuth(c);
    const page = Math.max(1, Number(c.req.query("page") ?? "1") || 1);
    const limit = Math.min(100, Math.max(1, Number(c.req.query("limit") ?? "20") || 20));
    let district = c.req.query("district")?.trim() || undefined;
    let mandal = c.req.query("mandal")?.trim() || undefined;
    let village = c.req.query("village")?.trim() || undefined;
    let wardNumber = c.req.query("wardNumber")?.trim() || undefined;

    // Hierarchy enforcement:
    // admin / super_admin: sees all data, can filter freely by district, mandal, village, ward
    // mandal_official: forced to their district and mandal; can filter by village within that mandal
    // sarpanch: strictly locked to their assigned district, mandal, village
    // ward_member: strictly locked to their assigned district, mandal, village, and wardNumber
    // citizen: locked to their district and mandal; respects village filter if querying other village (returns 0)
    if (user.role === "mandal_official" && jurisdiction) {
      district = jurisdiction.district;
      mandal = jurisdiction.mandal;
    } else if (user.role === "ward_member" && jurisdiction) {
      district = jurisdiction.district;
      mandal = jurisdiction.mandal;
      village = jurisdiction.village;
      wardNumber = user.wardNumber || undefined;
    } else if (user.role === "sarpanch" && jurisdiction) {
      district = jurisdiction.district;
      mandal = jurisdiction.mandal;
      village = jurisdiction.village;
    } else if (user.role === "citizen" && jurisdiction) {
      district = jurisdiction.district;
      mandal = jurisdiction.mandal;
      if (c.req.query("village") && c.req.query("village")?.trim().toLowerCase() !== jurisdiction.village.toLowerCase()) {
        village = c.req.query("village")?.trim();
      } else {
        village = jurisdiction.village;
      }
    }

    const result = await listIssuesForUser(user, issueVisibilityFilter(user, jurisdiction), {
      status: c.req.query("status") ?? undefined,
      category: c.req.query("category") ?? undefined,
      district,
      mandal,
      village,
      wardNumber,
      page,
      limit,
    });
    return c.json(result);
  })
  /* Create — jurisdiction comes from the authenticated profile, never the body. */
  .post("/", async (c) => {
    const { user, jurisdiction } = getAuth(c);
    if (user.role !== "citizen") {
      throw forbidden("Only citizens can report civic issues. Officials and administrators review and govern reports.");
    }
    if (!jurisdiction || !jurisdiction.village || !user.name || user.name === "New User") {
      throw badRequest("Please complete your profile details and village jurisdiction before reporting an issue.");
    }

    const body = await c.req.json().catch(() => null);
    const parsed = createIssueSchema.parse(body);
    const idempotencyKey =
      parsed.idempotencyKey ?? c.req.header("Idempotency-Key") ?? null;

    const { issue, duplicate } = await createIssue(user, jurisdiction, {
      ...parsed,
      idempotencyKey,
    });

    if (!duplicate) {
      realtimeHub.publish({
        type: "issue",
        action: "created",
        jurisdictionId: jurisdiction.id,
        reporterId: user.id,
        district: jurisdiction.district,
        mandal: jurisdiction.mandal,
        village: jurisdiction.village,
        data: {
          id: issue.id,
          code: issue.code,
          category: issue.category,
          status: issue.status,
          priority: issue.priority,
          village: jurisdiction.village,
        },
      });
    }

    return c.json(
      {
        issue: {
          ...issue,
          district: jurisdiction.district,
          mandal: jurisdiction.mandal,
          village: jurisdiction.village,
        },
        duplicate,
      },
      duplicate ? 200 : 201
    );
  })
  /* Detail with timeline + attachments. */
  .get("/:id", async (c) => {
    const { user, jurisdiction } = getAuth(c);
    const id = c.req.param("id") ?? "";
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw badRequest("Invalid issue id");
    return c.json({ issue: await getIssueForUser(user, jurisdiction, id) });
  })
  /* Official status update. */
  .patch("/:id/status", async (c) => {
    const { user, jurisdiction } = getAuth(c);
    const id = c.req.param("id") ?? "";
    const { status, note } = statusSchema.parse(await c.req.json());

    const updated = await updateIssueStatus(user, jurisdiction, id, status, note);

    realtimeHub.publish({
      type: "issue",
      action: "updated",
      jurisdictionId: updated.jurisdictionId,
      reporterId: updated.reporterId,
      data: {
        id: updated.id,
        code: updated.code,
        status: updated.status,
        note,
      },
    });

    return c.json({ issue: updated });
  })
  /* Official progress report. */
  .post("/:id/progress", async (c) => {
    const { user, jurisdiction } = getAuth(c);
    const id = c.req.param("id") ?? "";
    const { note } = progressSchema.parse(await c.req.json());

    const update = await addProgressNote(user, jurisdiction, id, note);

    const [issueRow] = await db
      .select({ jurisdictionId: schema.issues.jurisdictionId, reporterId: schema.issues.reporterId, code: schema.issues.code, status: schema.issues.status })
      .from(schema.issues)
      .where(eq(schema.issues.id, id))
      .limit(1);

    if (issueRow) {
      realtimeHub.publish({
        type: "issue",
        action: "updated",
        jurisdictionId: issueRow.jurisdictionId,
        reporterId: issueRow.reporterId,
        data: {
          id,
          code: issueRow.code,
          status: issueRow.status,
          action: "progress",
          note,
        },
      });
    }

    return c.json({ update }, 201);
  })
  /* Reporter confirms resolution → Closed. */
  .post("/:id/confirm", async (c) => {
    const { user } = getAuth(c);
    const id = c.req.param("id") ?? "";
    const issue = await confirmResolution(user, id);

    realtimeHub.publish({
      type: "issue",
      action: "updated",
      jurisdictionId: issue.jurisdictionId,
      reporterId: issue.reporterId,
      data: {
        id: issue.id,
        code: issue.code,
        status: issue.status,
        action: "confirm",
      },
    });

    return c.json({ issue });
  })
  /* Reporter reopens a resolved issue. */
  .post("/:id/reopen", async (c) => {
    const { user } = getAuth(c);
    const id = c.req.param("id") ?? "";
    const { reason } = z
      .object({ reason: z.string().trim().max(1000) })
      .parse(await c.req.json().catch(() => ({ reason: "Not actually resolved" })));
    const issue = await reopenIssue(user, id, reason);

    realtimeHub.publish({
      type: "issue",
      action: "updated",
      jurisdictionId: issue.jurisdictionId,
      reporterId: issue.reporterId,
      data: {
        id: issue.id,
        code: issue.code,
        status: issue.status,
        action: "reopen",
        reason,
      },
    });

    return c.json({ issue });
  })
  /* Evidence upload (multipart): photo/voice attached to the issue. */
  .post("/:id/attachments", async (c) => {
    const { user, jurisdiction } = getAuth(c);
    const id = c.req.param("id") ?? "";

    const [issue] = await db.select().from(schema.issues).where(eq(schema.issues.id, id)).limit(1);
    if (!issue) throw notFound("Issue not found");

    const isReporter = issue.reporterId === user.id;
    if (!isReporter) {
      // Officials may attach evidence; ACL mirrors the manage rule.
      await assertCanManageIssue(user, jurisdiction, issue);
    }

    const body = await c.req.parseBody();
    const file = body["file"];
    const phaseRaw = body["phase"];
    const phase = phaseRaw === "progress" || phaseRaw === "resolution" ? phaseRaw : "report";

    if (!(file instanceof File)) throw badRequest("Missing 'file' field");
    if (file.size > MAX_UPLOAD_BYTES) throw badRequest("File too large (max 10 MB)");
    const mime = file.type || "application/octet-stream";
    if (!ALLOWED_MIME.includes(mime)) throw badRequest(`Unsupported file type: ${mime}`);

    const stored = await getStorage().save(Buffer.from(await file.arrayBuffer()), mime);
    const kind = mime.startsWith("audio/") ? "voice" : "photo";

    const [attachment] = await db
      .insert(schema.issueAttachments)
      .values({
        issueId: id,
        uploadedById: user.id,
        kind,
        storageKey: stored.key,
        mime: stored.mime,
        bytes: stored.bytes,
        phase,
      })
      .returning();

    await db.insert(schema.issueUpdates).values({
      issueId: id,
      actorId: user.id,
      action: "attachment",
      note: `Uploaded ${kind} (${phase})`,
    });

    return c.json({ attachment: { id: attachment.id, key: attachment.storageKey, kind, mime, phase } }, 201);
  });


/** Auth-gated file serving — no issue photo is readable without a session. */
export const filesRoutes = new Hono()
  .use("*", requireAuth)
  .get("/:key", async (c) => {
    const { user, jurisdiction } = getAuth(c);
    const key = c.req.param("key") ?? "";

    const [row] = await db
      .select({ attachment: schema.issueAttachments, issue: schema.issues })
      .from(schema.issueAttachments)
      .innerJoin(schema.issues, eq(schema.issueAttachments.issueId, schema.issues.id))
      .where(eq(schema.issueAttachments.storageKey, key))
      .limit(1);
    if (row) {
      if (
        row.issue.reporterId !== user.id &&
        !(await canViewIssue(user, jurisdiction, row.issue))
      ) {
        throw forbidden();
      }

      const data = await getStorage().read(key);
      return c.body(
        new Uint8Array(data),
        200,
        {
          "Content-Type": row.attachment.mime,
          "Cache-Control": "private, max-age=3600",
          "Content-Disposition": "inline",
        }
      );
    }

    // Check if it's an image attached to a post or a valid stored media file
    const [postRow] = await db
      .select()
      .from(schema.posts)
      .where(
        or(
          eq(schema.posts.imageUrl, key),
          eq(schema.posts.imageUrl, `/api/files/${key}`)
        )
      )
      .limit(1);

    if (postRow || /^[a-f0-9-]{36}(\.\w+)?$/.test(key)) {
      try {
        const data = await getStorage().read(key);
        const ext = path.extname(key).toLowerCase();
        const mimeMap: Record<string, string> = {
          ".jpg": "image/jpeg",
          ".jpeg": "image/jpeg",
          ".png": "image/png",
          ".webp": "image/webp",
          ".heic": "image/heic",
          ".gif": "image/gif",
        };
        const mime = mimeMap[ext] ?? "image/jpeg";
        return c.body(
          new Uint8Array(data),
          200,
          {
            "Content-Type": mime,
            "Cache-Control": "public, max-age=3600",
            "Content-Disposition": "inline",
          }
        );
      } catch {
        throw notFound("File not found");
      }
    }

    throw notFound("File not found");
  });
