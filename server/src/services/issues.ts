import { and, count, desc, eq, gte, inArray, isNotNull } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db, schema } from "../db/client";
import type { Issue, IssueStatus, Jurisdiction, User } from "../db/schema";
import { badRequest, conflict, forbidden, notFound } from "../middleware/error";
import { haversineMeters } from "../lib/geo";
import { classifyIssue } from "../../../shared/services/issueClassification";
import { getSlaHours } from "../../../shared/services/sla";
import { getDepartmentForCategory } from "../../../shared/services/departmentRouting";
import { generateToken } from "../lib/crypto";
import { assertCanManageIssue, canViewIssue } from "./issueScope";

const DEDUP_RADIUS_METERS = 50;
const DEDUP_WINDOW_DAYS = 7;

const ACTIVE_STATUSES: IssueStatus[] = ["Submitted", "Acknowledged", "In Progress", "Reopened"];

export interface CreateIssueInput {
  category: string;
  description: string;
  latitude?: number | null;
  longitude?: number | null;
  accuracyM?: number | null;
  addressText?: string | null;
  visibility?: "private" | "village";
  wardNumber?: string | null;
  idempotencyKey?: string | null;
}

/** Finds the approved sarpanch responsible for a village. */
async function findVillageSarpanch(jurisdictionId: string) {
  const [sarpanch] = await db
    .select()
    .from(schema.users)
    .where(
      and(
        eq(schema.users.role, "sarpanch"),
        eq(schema.users.approvalStatus, "approved"),
        eq(schema.users.jurisdictionId, jurisdictionId)
      )
    )
    .limit(1);
  return sarpanch ?? null;
}

function issueCode(): string {
  // Human-friendly, unique; the DB unique index is the final guard.
  return `GS-${new Date().getFullYear().toString().slice(-2)}${generateToken().slice(0, 6).toUpperCase()}`;
}

export async function createIssue(
  user: User,
  jurisdiction: Jurisdiction,
  input: CreateIssueInput
): Promise<{ issue: Issue; duplicate: boolean }> {
  if (!input.description.trim()) throw badRequest("Description is required");

  // Idempotency: the same client key never files twice.
  if (input.idempotencyKey) {
    const [existing] = await db
      .select()
      .from(schema.issues)
      .where(eq(schema.issues.idempotencyKey, input.idempotencyKey))
      .limit(1);
    if (existing) return { issue: existing, duplicate: false };
  }

  const classification = classifyIssue(input.description);
  const category = input.category || classification.category;
  const priority = classification.priority;
  const department = getDepartmentForCategory(category);

  // Server-side proximity dedup within the same village.
  let duplicateOfId: string | null = null;
  if (input.latitude != null && input.longitude != null) {
    const windowStart = new Date(Date.now() - DEDUP_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const recent = await db
      .select({ id: schema.issues.id, latitude: schema.issues.latitude, longitude: schema.issues.longitude })
      .from(schema.issues)
      .where(
        and(
          eq(schema.issues.jurisdictionId, jurisdiction.id),
          eq(schema.issues.category, category),
          inArray(schema.issues.status, ACTIVE_STATUSES),
          isNotNull(schema.issues.latitude),
          isNotNull(schema.issues.longitude),
          gte(schema.issues.createdAt, windowStart)
        )
      )
      .limit(50);

    const near = recent.find(
      (r) =>
        r.latitude != null &&
        r.longitude != null &&
        haversineMeters(input.latitude!, input.longitude!, r.latitude, r.longitude) <= DEDUP_RADIUS_METERS
    );
    if (near) duplicateOfId = near.id;
  }

  const sarpanch = await findVillageSarpanch(jurisdiction.id);
  const slaHours = getSlaHours(priority);

  const [issue] = await db
    .insert(schema.issues)
    .values({
      code: issueCode(),
      reporterId: user.id,
      jurisdictionId: jurisdiction.id,
      wardNumber: input.wardNumber ?? null,
      category,
      description: input.description.trim(),
      priority,
      department,
      assignedToId: sarpanch?.id ?? null,
      visibility: input.visibility ?? "private",
      slaHours,
      slaDueAt: new Date(Date.now() + slaHours * 60 * 60 * 1000),
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      accuracyM: input.accuracyM ?? null,
      addressText: input.addressText ?? null,
      idempotencyKey: input.idempotencyKey ?? null,
      duplicateOfId,
    })
    .returning();

  await db.insert(schema.issueUpdates).values({
    issueId: issue.id,
    actorId: user.id,
    action: "created",
    newStatus: issue.status,
    note: duplicateOfId ? `Possible duplicate of another recent report` : null,
  });

  return { issue, duplicate: duplicateOfId !== null };
}

export interface ListIssuesOptions {
  status?: string;
  category?: string;
  page: number;
  limit: number;
}

export async function listIssuesForUser(
  visibilityFilter: SQL | undefined,
  options: ListIssuesOptions
) {
  const conditions = [];
  if (visibilityFilter) conditions.push(visibilityFilter);
  if (options.status) conditions.push(eq(schema.issues.status, options.status as IssueStatus));
  if (options.category) conditions.push(eq(schema.issues.category, options.category));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ total }] = await db
    .select({ total: count() })
    .from(schema.issues)
    .where(where);

  const rows = await db
    .select({ issue: schema.issues, jurisdiction: schema.jurisdictions })
    .from(schema.issues)
    .innerJoin(schema.jurisdictions, eq(schema.issues.jurisdictionId, schema.jurisdictions.id))
    .where(where)
    .orderBy(desc(schema.issues.createdAt))
    .limit(Math.min(options.limit, 100))
    .offset((options.page - 1) * options.limit);

  const ids = rows.map((r) => r.issue.id);
  const photos = ids.length
    ? await db
        .select({ issueId: schema.issueAttachments.issueId, key: schema.issueAttachments.storageKey })
        .from(schema.issueAttachments)
        .where(and(inArray(schema.issueAttachments.issueId, ids), eq(schema.issueAttachments.kind, "photo")))
    : [];
  const photoByIssue = new Map<string, string>();
  for (const p of photos) photoByIssue.set(p.issueId, p.key);

  return {
    issues: rows.map(({ issue, jurisdiction: j }) => ({
      ...issue,
      district: j.district,
      mandal: j.mandal,
      village: j.village,
      photoKey: photoByIssue.get(issue.id) ?? null,
    })),
    total: Number(total),
    page: options.page,
    limit: options.limit,
  };
}

export async function getIssueForUser(
  user: User,
  userJurisdiction: Jurisdiction | null,
  issueId: string
) {
  const [row] = await db
    .select({ issue: schema.issues, jurisdiction: schema.jurisdictions })
    .from(schema.issues)
    .innerJoin(schema.jurisdictions, eq(schema.issues.jurisdictionId, schema.jurisdictions.id))
    .where(eq(schema.issues.id, issueId))
    .limit(1);

  if (!row) throw notFound("Issue not found");

  if (!(await canViewIssue(user, userJurisdiction, row.issue))) {
    throw notFound("Issue not found");
  }

  const timeline = await db
    .select({ update: schema.issueUpdates, actor: schema.users })
    .from(schema.issueUpdates)
    .leftJoin(schema.users, eq(schema.issueUpdates.actorId, schema.users.id))
    .where(eq(schema.issueUpdates.issueId, issueId))
    .orderBy(schema.issueUpdates.createdAt);

  const attachments = await db
    .select()
    .from(schema.issueAttachments)
    .where(eq(schema.issueAttachments.issueId, issueId));

  return {
    ...row.issue,
    district: row.jurisdiction.district,
    mandal: row.jurisdiction.mandal,
    village: row.jurisdiction.village,
    timeline: timeline.map(({ update, actor }) => ({
      id: update.id,
      action: update.action,
      oldStatus: update.oldStatus,
      newStatus: update.newStatus,
      note: update.note,
      actorName: actor?.name ?? null,
      actorRole: actor?.role ?? null,
      createdAt: update.createdAt.toISOString(),
    })),
    attachments: attachments.map((a) => ({
      id: a.id,
      kind: a.kind,
      key: a.storageKey,
      mime: a.mime,
      phase: a.phase,
      createdAt: a.createdAt.toISOString(),
    })),
  };
}

const OFFICIAL_TRANSITIONS: Record<IssueStatus, IssueStatus[]> = {
  Submitted: ["Acknowledged", "In Progress", "Resolved", "Closed"],
  Acknowledged: ["In Progress", "Resolved", "Closed"],
  "In Progress": ["Resolved", "Closed"],
  Resolved: [],
  Closed: [],
  Reopened: ["In Progress", "Resolved", "Closed"],
};

export async function updateIssueStatus(
  user: User,
  userJurisdiction: Jurisdiction | null,
  issueJurisdiction: Jurisdiction | null,
  issueId: string,
  newStatus: IssueStatus,
  note?: string | null
) {
  const [issue] = await db.select().from(schema.issues).where(eq(schema.issues.id, issueId)).limit(1);
  if (!issue) throw notFound("Issue not found");

  assertCanManageIssue(user, userJurisdiction, issue, issueJurisdiction);

  const allowed = OFFICIAL_TRANSITIONS[issue.status];
  if (!allowed.includes(newStatus)) {
    throw conflict(`Cannot move an issue from "${issue.status}" to "${newStatus}"`);
  }

  const updates: Partial<typeof schema.issues.$inferInsert> = {
    status: newStatus,
    updatedAt: new Date(),
  };
  if (newStatus === "Acknowledged" && !issue.acknowledgedAt) {
    updates.acknowledgedAt = new Date();
  }
  if (newStatus === "Resolved") {
    updates.resolvedAt = new Date();
  }
  if (newStatus === "Closed") {
    updates.closedAt = new Date();
    if (!issue.resolvedAt) updates.resolvedAt = new Date();
  }

  const [updated] = await db
    .update(schema.issues)
    .set(updates)
    .where(eq(schema.issues.id, issueId))
    .returning();

  await db.insert(schema.issueUpdates).values({
    issueId,
    actorId: user.id,
    action: "status_change",
    oldStatus: issue.status,
    newStatus,
    note: note ?? null,
  });

  return updated;
}

/** Official progress report: a note (and optional evidence) on the timeline. */
export async function addProgressNote(
  user: User,
  userJurisdiction: Jurisdiction | null,
  issueJurisdiction: Jurisdiction | null,
  issueId: string,
  note: string
) {
  const [issue] = await db.select().from(schema.issues).where(eq(schema.issues.id, issueId)).limit(1);
  if (!issue) throw notFound("Issue not found");

  assertCanManageIssue(user, userJurisdiction, issue, issueJurisdiction);

  if (!issue.resolvedAt) {
    // Implicit acknowledgement: first official touch starts the clock truthfully.
    await db
      .update(schema.issues)
      .set({
        acknowledgedAt: issue.acknowledgedAt ?? new Date(),
        status: issue.status === "Submitted" ? "Acknowledged" : issue.status,
        updatedAt: new Date(),
      })
      .where(eq(schema.issues.id, issueId));
  }

  const [update] = await db
    .insert(schema.issueUpdates)
    .values({ issueId, actorId: user.id, action: "progress", note })
    .returning();

  return update;
}

/** Citizen confirms resolution → Closed. */
export async function confirmResolution(user: User, issueId: string) {
  const [issue] = await db.select().from(schema.issues).where(eq(schema.issues.id, issueId)).limit(1);
  if (!issue) throw notFound("Issue not found");
  if (issue.reporterId !== user.id) throw forbidden("Only the reporter can confirm");
  if (issue.status !== "Resolved") throw conflict("Only resolved issues can be confirmed");

  const [updated] = await db
    .update(schema.issues)
    .set({ status: "Closed", closedAt: new Date(), updatedAt: new Date() })
    .where(eq(schema.issues.id, issueId))
    .returning();

  await db.insert(schema.issueUpdates).values({
    issueId,
    actorId: user.id,
    action: "confirmation",
    oldStatus: "Resolved",
    newStatus: "Closed",
    note: "Reporter confirmed the resolution",
  });

  return updated;
}

/** Citizen reopens a resolved issue. */
export async function reopenIssue(user: User, issueId: string, reason: string) {
  const [issue] = await db.select().from(schema.issues).where(eq(schema.issues.id, issueId)).limit(1);
  if (!issue) throw notFound("Issue not found");
  if (issue.reporterId !== user.id) throw forbidden("Only the reporter can reopen");
  if (issue.status !== "Resolved") throw conflict("Only resolved issues can be reopened");

  const [updated] = await db
    .update(schema.issues)
    .set({ status: "Reopened", resolvedAt: null, updatedAt: new Date() })
    .where(eq(schema.issues.id, issueId))
    .returning();

  await db.insert(schema.issueUpdates).values({
    issueId,
    actorId: user.id,
    action: "status_change",
    oldStatus: "Resolved",
    newStatus: "Reopened",
    note: reason,
  });

  return updated;
}

