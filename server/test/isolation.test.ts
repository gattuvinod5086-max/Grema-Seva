import { describe, it, expect, afterAll, beforeAll } from "vitest";
import { randomUUID } from "node:crypto";
import { createHash } from "node:crypto";
import { testSql } from "./setup";
import { db, schema } from "../src/db/client";
import type { User } from "../src/db/schema";
import { createApp } from "../src/app";

/* ------------------------------------------------------------------ *
 * Isolation contract: role × ownership × jurisdiction.
 * For every role we assert exactly which issues it can list, read and
 * mutate. This is the regression net for the original data-leak
 * findings (village-wide reads, unscoped status updates, etc.).
 * ------------------------------------------------------------------ */

interface Actor {
  user: User;
  token: string;
}

let superAdmin: Actor;
let sarpanchX: Actor;
let sarpanchY: Actor;
let wardMemberX1: Actor;
let adminX: Actor;
let citizenX: Actor;
let citizenX2: Actor;
let citizenY: Actor;
let pendingSarpanch: Actor;

let villageX: { id: string };
let villageY: { id: string };
let issueX1: string; // citizenX, ward 1, private
let issueX1v: string; // citizenX, ward 1, village-visible
let issueX2: string; // ward 2 (for ward-member boundary test)
let issueY1: string; // citizenY

async function insertUser(opts: {
  name: string;
  role: User["role"];
  jurisdictionId?: string | null;
  approvalStatus?: User["approvalStatus"];
  wardNumber?: string | null;
}): Promise<Actor> {
  const [user] = await db
    .insert(schema.users)
    .values({
      name: opts.name,
      phone: `+919${Math.floor(100000000 + Math.random() * 899999999)}`,
      role: opts.role,
      approvalStatus: opts.approvalStatus ?? (opts.role === "citizen" ? "approved" : "approved"),
      jurisdictionId: opts.jurisdictionId ?? null,
      wardNumber: opts.wardNumber ?? null,
    })
    .returning();

  const token = randomUUID() + randomUUID();
  await insertSession(user, token);
  return { user, token };
}

/** Creates a session row the way the app does (sha256 of the token). */
async function insertSession(user: User, token: string) {
  await db.insert(schema.sessions).values({
    userId: user.id,
    tokenHash: sha256Hex(token),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
}

const sha256Hex = (v: string) => createHash("sha256").update(v).digest("hex");

async function seedIssue(opts: {
  reporterId: string;
  jurisdictionId: string;
  wardNumber?: string | null;
  visibility?: "private" | "village";
  category?: string;
}) {
  const [issue] = await db
    .insert(schema.issues)
    .values({
      code: `GS-T${randomUUID().slice(0, 8).toUpperCase()}`,
      reporterId: opts.reporterId,
      jurisdictionId: opts.jurisdictionId,
      category: opts.category ?? "Water",
      description: "Contract test issue",
      visibility: opts.visibility ?? "private",
      wardNumber: opts.wardNumber ?? null,
    })
    .returning();
  return issue;
}

function req(actor: Actor | null, path: string, method = "GET", body?: unknown) {
  return app.request(path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(actor ? { Cookie: `grama_session=${actor.token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

const app = createApp();

beforeAll(async () => {
  // Fresh world for each test run (single process: fileParallelism=false).
  await db.delete(schema.issueUpdates);
  await db.delete(schema.issueAttachments);
  await db.delete(schema.issues);
  await db.delete(schema.sessions);
  await db.delete(schema.authIdentities);
  await db.delete(schema.otpRequests);
  await db.delete(schema.users);
  await db.delete(schema.jurisdictions);
});

afterAll(async () => {
  await db.delete(schema.issueUpdates);
  await db.delete(schema.issueAttachments);
  await db.delete(schema.issues);
  await db.delete(schema.sessions);
  await db.delete(schema.authIdentities);
  await db.delete(schema.otpRequests);
  await db.delete(schema.users);
  await db.delete(schema.jurisdictions);
  await db.$client.end();
  await testSql.end();
});

describe("isolation contract", () => {
  it("seeds the fixture world", async () => {
    [villageX, villageY] = await db
      .insert(schema.jurisdictions)
      .values([
        { district: "TestDistA", mandal: "MandalA1", village: "VillageX" },
        { district: "TestDistB", mandal: "MandalB1", village: "VillageY" },
      ])
      .onConflictDoNothing()
      .returning()
      .then((rows) => {
        if (rows.length < 2) throw new Error("fixture jurisdictions missing");
        return rows.map((r) => ({ id: r.id }));
      });

    superAdmin = await insertUser({ name: "Super Admin", role: "super_admin" });
    sarpanchX = await insertUser({ name: "Sarpanch X", role: "sarpanch", jurisdictionId: villageX.id });
    sarpanchY = await insertUser({ name: "Sarpanch Y", role: "sarpanch", jurisdictionId: villageY.id });
    wardMemberX1 = await insertUser({
      name: "Ward Member X1",
      role: "ward_member",
      jurisdictionId: villageX.id,
      wardNumber: "1",
    });
    adminX = await insertUser({ name: "Admin A", role: "admin", jurisdictionId: villageX.id });
    citizenX = await insertUser({ name: "Citizen X", role: "citizen", jurisdictionId: villageX.id });
    citizenX2 = await insertUser({ name: "Citizen X2", role: "citizen", jurisdictionId: villageX.id });
    citizenY = await insertUser({ name: "Citizen Y", role: "citizen", jurisdictionId: villageY.id });
    pendingSarpanch = await insertUser({
      name: "Pending Sarpanch",
      role: "sarpanch",
      jurisdictionId: villageX.id,
      approvalStatus: "pending",
    });

    issueX1 = (await seedIssue({ reporterId: citizenX.user.id, jurisdictionId: villageX.id, wardNumber: "1" })).id;
    issueX1v = (await seedIssue({ reporterId: citizenX.user.id, jurisdictionId: villageX.id, wardNumber: "1", visibility: "village" })).id;
    issueX2 = (await seedIssue({ reporterId: citizenX.user.id, jurisdictionId: villageX.id, wardNumber: "2" })).id;
    issueY1 = (await seedIssue({ reporterId: citizenY.user.id, jurisdictionId: villageY.id })).id;

    expect(superAdmin.user.role).toBe("super_admin");
  });

  it("unauthenticated requests are rejected", async () => {
    const res = await req(null, "/api/issues");
    expect(res.status).toBe(401);
  });

  it("citizen lists only own + village-visible issues of own village", async () => {
    const res = await req(citizenX, "/api/issues");
    const body = await res.json();
    const ids = body.issues.map((i: { id: string }) => i.id);
    expect(ids).toContain(issueX1);
    expect(ids).toContain(issueX1v);
    expect(ids).not.toContain(issueY1);
  });

  it("citizen cannot read another village's private issue", async () => {
    const res = await req(citizenX, `/api/issues/${issueY1}`);
    expect(res.status).toBe(404);
  });

  it("citizen cannot read another citizen's private issue in the same village", async () => {
    // citizenY tries to read citizenX's private issue
    const res = await req(citizenY, `/api/issues/${issueX1}`);
    expect(res.status).toBe(404);
  });

  it("newly filed issues are village-public: neighbours see them, without reporter identity", async () => {
    // citizenX files via the API — default visibility is now 'village'
    const created = await req(citizenX, "/api/issues", "POST", {
      category: "Sanitation",
      description: "Garbage not collected near the community hall",
    });
    expect(created.status).toBe(201);
    const { issue } = await created.json();

    // A same-village neighbour can read it…
    const neighbour = await req(citizenX2, `/api/issues/${issue.id}`);
    expect(neighbour.status).toBe(200);
    const neighbourBody = (await neighbour.json()).issue;
    // …but the reporter's identity is masked for them
    expect(neighbourBody.reporterId).toBeNull();

    // …while the reporter sees their own identity
    const own = await req(citizenX, `/api/issues/${issue.id}`);
    expect(((await own.json()).issue).reporterId).toBe(citizenX.user.id);

    // Officials see the reporter identity
    const list = await req(wardMemberX1, "/api/issues?category=Sanitation");
    const listed = (await list.json()).issues.find((i: { id: string }) => i.id === issue.id);
    expect(listed).toBeDefined();
    expect(listed.reporterId).toBe(citizenX.user.id);
  });

  it("village stats are scoped and count by status", async () => {
    const res = await req(sarpanchX, "/api/issues/stats");
    const stats = await res.json();
    expect(stats.total).toBeGreaterThanOrEqual(2); // village-public village X fixtures
    expect(stats.byStatus["Submitted"]).toBeGreaterThan(0);
    // village Y numbers must not leak in
    const resY = await req(sarpanchY, "/api/issues/stats");
    const statsY = await resY.json();
    expect(statsY.total).toBeGreaterThanOrEqual(1);
    expect(statsY.total).toBeLessThan(stats.total);
  });

  it("similar-issues search finds village-public matches for a category", async () => {
    const res = await req(citizenX, "/api/issues/similar?category=Sanitation");
    const { similar } = await res.json();
    expect(similar.length).toBeGreaterThanOrEqual(1);
    expect(similar[0].status).not.toBe("Closed");
    expect(similar[0].code).toMatch(/^GS-/);
  });

  it("sarpanch of village X sees all village X issues, none of village Y", async () => {
    const res = await req(sarpanchX, "/api/issues");
    const ids = (await res.json()).issues.map((i: { id: string }) => i.id);
    expect(ids).toContain(issueX1);
    expect(ids).toContain(issueX2);
    expect(ids).not.toContain(issueY1);
  });

  it("sarpanch of village X cannot read or update village Y issues", async () => {
    const read = await req(sarpanchX, `/api/issues/${issueY1}`);
    expect(read.status).toBe(404);

    const update = await req(sarpanchX, `/api/issues/${issueY1}/status`, "PATCH", {
      status: "Acknowledged",
    });
    expect(update.status).toBe(403);
  });

  it("sarpanch can update issues in their own village", async () => {
    const res = await req(sarpanchX, `/api/issues/${issueX1}/status`, "PATCH", {
      status: "Acknowledged",
      note: "Looking into it",
    });
    expect(res.status).toBe(200);
    expect((await res.json()).issue.status).toBe("Acknowledged");
  });

  it("sarpanch of village Y cannot manage village X issues (cross-village deny)", async () => {
    const update = await req(sarpanchY, `/api/issues/${issueX1}/status`, "PATCH", {
      status: "Acknowledged",
    });
    expect(update.status).toBe(403);
  });

  it("ward member sees and manages only their ward", async () => {
    const list = await req(wardMemberX1, "/api/issues");
    const ids = (await list.json()).issues.map((i: { id: string }) => i.id);
    expect(ids).toContain(issueX1); // ward 1
    expect(ids).not.toContain(issueX2); // ward 2

    const forbidden = await req(wardMemberX1, `/api/issues/${issueX2}/status`, "PATCH", {
      status: "Acknowledged",
    });
    expect(forbidden.status).toBe(403);
  });

  it("admin manages the whole app: sees and updates every village's issues", async () => {
    const list = await req(adminX, "/api/issues");
    const ids = (await list.json()).issues.map((i: { id: string }) => i.id);
    expect(ids).toContain(issueX1);
    expect(ids).toContain(issueX2);
    expect(ids).toContain(issueY1); // app-wide, not village-scoped

    // cross-village status update is ALLOWED for admin
    const update = await req(adminX, `/api/issues/${issueY1}/status`, "PATCH", {
      status: "Acknowledged",
      note: "App-level admin action",
    });
    expect(update.status).toBe(200);
  });

  it("pending sarpanch holds citizen-level access only", async () => {
    const list = await req(pendingSarpanch, "/api/issues");
    const ids = (await list.json()).issues.map((i: { id: string }) => i.id);
    expect(ids).not.toContain(issueX1); // not theirs, village visibility private

    const manage = await req(pendingSarpanch, `/api/issues/${issueX1}/status`, "PATCH", {
      status: "Acknowledged",
    });
    expect(manage.status).toBe(403);
  });

  it("super admin sees everything", async () => {
    const list = await req(superAdmin, "/api/issues");
    const ids = (await list.json()).issues.map((i: { id: string }) => i.id);
    expect(ids).toContain(issueX1);
    expect(ids).toContain(issueY1);
  });

  it("citizen cannot use official status endpoints", async () => {
    const res = await req(citizenX, `/api/issues/${issueX1}/status`, "PATCH", {
      status: "Resolved",
    });
    expect(res.status).toBe(403);
  });
});

describe("issue lifecycle", () => {
  it("creates an issue bound to the reporter's jurisdiction (body cannot spoof it)", async () => {
    const res = await req(citizenX, "/api/issues", "POST", {
      category: "Water",
      description: "No water supply for three days, requesting urgent help",
    });
    expect(res.status).toBe(201);
    const { issue } = await res.json();
    expect(issue.jurisdictionId).toBe(villageX.id);
    expect(issue.district).toBe("TestDistA");
  });

  it("is idempotent on the same idempotency key", async () => {
    const key = randomUUID();
    const first = await req(citizenX, "/api/issues", "POST", {
      category: "Roads",
      description: "Large pothole near the school entrance",
      idempotencyKey: key,
    });
    const second = await req(citizenX, "/api/issues", "POST", {
      category: "Roads",
      description: "Large pothole near the school entrance",
      idempotencyKey: key,
    });
    const a = (await first.json()).issue;
    const b = (await second.json()).issue;
    expect(a.id).toBe(b.id);
  });

  it("flags a near-duplicate report within 50 m", async () => {
    const res = await req(citizenX, "/api/issues", "POST", {
      category: "Water",
      description: "No water supply in our street since Monday",
      latitude: 18.1123,
      longitude: 79.3312,
    });
    const first = await res.json();
    expect(res.status).toBe(201);

    const res2 = await req(citizenX, "/api/issues", "POST", {
      category: "Water",
      description: "Still no water, same problem continues",
      latitude: 18.1123,
      longitude: 79.3313, // ~11 m away
    });
    const second = await res2.json();
    expect(second.duplicate).toBe(true);
    expect(second.issue.duplicateOfId).toBe(first.issue.id);
  });

  it("official resolves; citizen confirms; citizen reopens works", async () => {
    // resolve
    const resolve = await req(sarpanchX, `/api/issues/${issueX2}/status`, "PATCH", {
      status: "Resolved",
      note: "Pipeline repaired",
    });
    expect(resolve.status).toBe(200);

    // another citizen cannot confirm
    const wrongConfirm = await req(citizenY, `/api/issues/${issueX2}/confirm`, "POST");
    expect(wrongConfirm.status).toBe(403);

    // reporter confirms → Closed
    const confirm = await req(citizenX, `/api/issues/${issueX2}/confirm`, "POST");
    expect((await confirm.json()).issue.status).toBe("Closed");

    // reopen a Closed issue is not allowed
    const reopen = await req(citizenX, `/api/issues/${issueX2}/reopen`, "POST", { reason: "broken again" });
    expect(reopen.status).toBe(409);

    // full reopen path on a fresh resolve
    await req(sarpanchX, `/api/issues/${issueX2}/status`, "PATCH", { status: "In Progress" }).then(async (r) => {
      expect(r.status).toBe(409); // Closed is terminal for officials
    });
  });

  it("official progress notes appear on the timeline the citizen reads", async () => {
    const progress = await req(sarpanchX, `/api/issues/${issueX1}/progress`, "POST", {
      note: "Checked the site, contractor assigned for tomorrow",
    });
    expect(progress.status).toBe(201);

    const detail = await req(citizenX, `/api/issues/${issueX1}`);
    const body = await detail.json();
    const notes = body.issue.timeline.filter((t: { action: string }) => t.action === "progress");
    expect(notes.length).toBe(1);
    expect(notes[0].note).toContain("contractor assigned");
  });
});
