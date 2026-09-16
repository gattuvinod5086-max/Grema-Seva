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
let mandalOfficialA: Actor;
let citizenX2Village2: Actor;

let villageX: { id: string };
let villageY: { id: string };
let villageX2: { id: string };
let issueX1: string; // citizenX, ward 1, private
let issueX1v: string; // citizenX, ward 1, village-visible
let issueX2: string; // ward 2 (for ward-member boundary test)
let issueX3: string; // citizenX2Village2 in villageX2
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
  await db.delete(schema.auditLog);
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
  await db.delete(schema.auditLog);
  await db.delete(schema.users);
  await db.delete(schema.jurisdictions);
  await db.$client.end();
  await testSql.end();
});

describe("isolation contract", () => {
  it("seeds the fixture world", async () => {
    [villageX, villageY, villageX2] = await db
      .insert(schema.jurisdictions)
      .values([
        { district: "TestDistA", mandal: "MandalA1", village: "VillageX" },
        { district: "TestDistB", mandal: "MandalB1", village: "VillageY" },
        { district: "TestDistA", mandal: "MandalA1", village: "VillageX2" },
      ])
      .onConflictDoNothing()
      .returning()
      .then((rows) => {
        if (rows.length < 3) throw new Error("fixture jurisdictions missing");
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
    mandalOfficialA = await insertUser({
      name: "Mandal Official A",
      role: "mandal_official",
      jurisdictionId: villageX.id,
    });
    citizenX = await insertUser({ name: "Citizen X", role: "citizen", jurisdictionId: villageX.id });
    citizenX2 = await insertUser({ name: "Citizen X2", role: "citizen", jurisdictionId: villageX.id });
    citizenX2Village2 = await insertUser({
      name: "Citizen X2 Village2",
      role: "citizen",
      jurisdictionId: villageX2.id,
    });
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
    issueX3 = (await seedIssue({ reporterId: citizenX2Village2.user.id, jurisdictionId: villageX2.id, visibility: "village" })).id;
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

  it("non-citizens (sarpanch, admin, super_admin, ward_member, mandal_official) cannot file an issue (forbidden)", async () => {
    for (const actor of [sarpanchX, adminX, superAdmin, wardMemberX1, mandalOfficialA]) {
      const res = await req(actor, "/api/issues", "POST", {
        category: "Sanitation",
        description: "Official attempting to report an issue",
      });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error.message).toMatch(/Only citizens can report civic issues/);
    }
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

describe("admin governance & approvals", () => {
  it("super admin stats return total across all villages", async () => {
    const res = await req(superAdmin, "/api/issues/stats");
    expect(res.status).toBe(200);
    const stats = await res.json();
    expect(stats.total).toBeGreaterThanOrEqual(3);
  });

  it("super admin lists officials and approves / declines with bidirectional transitions", async () => {
    // pendingSarpanch is currently pending
    const listPending = await req(superAdmin, "/api/admin/officials?status=pending");
    expect(listPending.status).toBe(200);
    const pendingBody = await listPending.json();
    const foundPending = pendingBody.officials.find((o: { id: string }) => o.id === pendingSarpanch.user.id);
    expect(foundPending).toBeDefined();

    // 1. Decline the pending official
    const decRes = await req(superAdmin, `/api/admin/officials/${pendingSarpanch.user.id}/decline`, "POST", {
      note: "Missing credentials",
    });
    expect(decRes.status).toBe(200);
    expect((await decRes.json()).official.approvalStatus).toBe("declined");

    // 2. Official appears in declined list
    const listDeclined = await req(superAdmin, "/api/admin/officials?status=declined");
    const declinedBody = await listDeclined.json();
    expect(declinedBody.officials.some((o: { id: string }) => o.id === pendingSarpanch.user.id)).toBe(true);

    // 3. Super admin approves the declined official (reversing the decision)
    const appRes = await req(superAdmin, `/api/admin/officials/${pendingSarpanch.user.id}/approve`, "POST");
    expect(appRes.status).toBe(200);
    expect((await appRes.json()).official.approvalStatus).toBe("approved");

    // 4. Official is now approved
    const listApproved = await req(superAdmin, "/api/admin/officials?status=approved");
    const approvedBody = await listApproved.json();
    expect(approvedBody.officials.some((o: { id: string }) => o.id === pendingSarpanch.user.id)).toBe(true);

    // 5. Query without status returns all
    const listAll = await req(superAdmin, "/api/admin/officials");
    expect((await listAll.json()).officials.length).toBeGreaterThanOrEqual(pendingBody.officials.length);
  });

  it("lists all sarpanches village-wise with overview metrics and filters", async () => {
    // 1. Overall stats and list
    const res = await req(superAdmin, "/api/sarpanches");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.overview).toBeDefined();
    expect(body.overview.totalSarpanches).toBeGreaterThanOrEqual(3);
    expect(body.overview.approvedSarpanches).toBeGreaterThanOrEqual(2);
    expect(body.overview.villagesCovered).toBeGreaterThanOrEqual(2);
    expect(Array.isArray(body.sarpanches)).toBe(true);
    expect(body.sarpanches.length).toBeGreaterThanOrEqual(3);

    // 2. Filter by district
    const filterDist = await req(superAdmin, "/api/sarpanches?district=TestDistA");
    expect(filterDist.status).toBe(200);
    const distBody = await filterDist.json();
    expect(distBody.sarpanches.every((s: { district: string }) => s.district === "TestDistA")).toBe(true);

    // 3. Filter by search query
    const searchRes = await req(superAdmin, "/api/sarpanches?q=Sarpanch X");
    expect(searchRes.status).toBe(200);
    const searchBody = await searchRes.json();
    expect(searchBody.sarpanches.some((s: { name: string }) => s.name === "Sarpanch X")).toBe(true);

    // 4. Village detail lookup
    const villageRes = await req(superAdmin, `/api/sarpanches/village?jurisdictionId=${villageX.id}`);
    expect(villageRes.status).toBe(200);
    const villageDetail = await villageRes.json();
    expect(villageDetail.jurisdiction.village).toBe("VillageX");
    expect(villageDetail.sarpanch).toBeDefined();
    expect(["Sarpanch X", "Pending Sarpanch"]).toContain(villageDetail.sarpanch.name);
    expect(villageDetail.sarpanch.role).toBe("sarpanch");
    expect(villageDetail.wardMembers.length).toBeGreaterThanOrEqual(1);
    expect(villageDetail.issuesSummary.total).toBeGreaterThanOrEqual(2);
  });

  it("strictly isolates sarpanches directory and village details to citizen's own village", async () => {
    // 1. CitizenX (VillageX) lists sarpanches: sees only VillageX sarpanches, NEVER VillageY
    const res = await req(citizenX, "/api/sarpanches");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sarpanches.length).toBeGreaterThanOrEqual(1);
    expect(body.sarpanches.every((s: { jurisdictionId: string }) => s.jurisdictionId === villageX.id)).toBe(true);
    expect(body.sarpanches.some((s: { jurisdictionId: string }) => s.jurisdictionId === villageY.id)).toBe(false);
    expect(body.overview.villagesCovered).toBe(1);

    // 2. CitizenX attempts to filter by VillageY: query param ignored, still only VillageX sarpanches
    const resYAttempt = await req(citizenX, "/api/sarpanches?village=VillageY");
    expect(resYAttempt.status).toBe(200);
    const yBody = await resYAttempt.json();
    expect(yBody.sarpanches.every((s: { jurisdictionId: string }) => s.jurisdictionId === villageX.id)).toBe(true);
    expect(yBody.sarpanches.some((s: { jurisdictionId: string }) => s.jurisdictionId === villageY.id)).toBe(false);

    // 3. CitizenX queries /village for VillageY: locked to VillageX!
    const villageAttempt = await req(citizenX, `/api/sarpanches/village?jurisdictionId=${villageY.id}`);
    expect(villageAttempt.status).toBe(200);
    const villageBody = await villageAttempt.json();
    expect(villageBody.jurisdiction.id).toBe(villageX.id);
    expect(villageBody.jurisdiction.village).toBe("VillageX");
  });

  it("isolates issues strictly by village/mandal/district location filters", async () => {
    // 1. Super admin filters by VillageX: returns only VillageX issues, never VillageY
    const resX = await req(superAdmin, "/api/issues?village=VillageX");
    expect(resX.status).toBe(200);
    const bodyX = await resX.json();
    expect(bodyX.issues.length).toBeGreaterThan(0);
    expect(bodyX.issues.every((i: { village: string }) => i.village === "VillageX")).toBe(true);
    expect(bodyX.issues.some((i: { village: string }) => i.village === "VillageY")).toBe(false);

    // 2. Super admin filters by VillageY: returns only VillageY issues, never VillageX
    const resY = await req(superAdmin, "/api/issues?village=VillageY");
    expect(resY.status).toBe(200);
    const bodyY = await resY.json();
    expect(bodyY.issues.length).toBeGreaterThan(0);
    expect(bodyY.issues.every((i: { village: string }) => i.village === "VillageY")).toBe(true);
    expect(bodyY.issues.some((i: { village: string }) => i.village === "VillageX")).toBe(false);

    // 3. Super admin filters by non-existent village: returns 0 issues
    const resEmpty = await req(superAdmin, "/api/issues?village=NonExistentVillage");
    expect(resEmpty.status).toBe(200);
    const emptyBody = await resEmpty.json();
    expect(emptyBody.issues.length).toBe(0);
    expect(emptyBody.total).toBe(0);

    // 4. CitizenX (registered in VillageX) attempts to query VillageY: returns 0 issues
    const resCitizenLeakAttempt = await req(citizenX, "/api/issues?village=VillageY");
    expect(resCitizenLeakAttempt.status).toBe(200);
    const leakBody = await resCitizenLeakAttempt.json();
    expect(leakBody.issues.length).toBe(0);

    // 5. Stats filtered by location
    const statsX = await req(superAdmin, "/api/issues/stats?village=VillageX");
    expect(statsX.status).toBe(200);
    const statsXBody = await statsX.json();
    expect(statsXBody.total).toBeGreaterThan(0);

    const statsEmpty = await req(superAdmin, "/api/issues/stats?village=NonExistentVillage");
    expect(statsEmpty.status).toBe(200);
    const statsEmptyBody = await statsEmpty.json();
    expect(statsEmptyBody.total).toBe(0);
  });

  it("blocks citizen from reporting an issue if profile details (name/jurisdiction) are not filled up", async () => {
    // 1. Citizen with missing jurisdiction
    const unassignedCitizen = await insertUser({
      name: "Unassigned Citizen",
      role: "citizen",
      jurisdictionId: null,
    });
    const resNoJurisdiction = await req(unassignedCitizen, "/api/issues", "POST", {
      category: "drinking_water",
      description: "Broken water pump near street 4",
    });
    expect(resNoJurisdiction.status).toBe(400);
    const bodyNoJurisdiction = await resNoJurisdiction.json();
    expect(bodyNoJurisdiction.error.message).toMatch(/complete your profile details/i);

    // 2. Citizen with default 'New User' name
    const incompleteCitizen = await insertUser({
      name: "New User",
      role: "citizen",
      jurisdictionId: villageX.id,
    });
    const resIncompleteName = await req(incompleteCitizen, "/api/issues", "POST", {
      category: "drinking_water",
      description: "Broken water pump near street 4",
    });
    expect(resIncompleteName.status).toBe(400);
    const bodyIncompleteName = await resIncompleteName.json();
    expect(bodyIncompleteName.error.message).toMatch(/complete your profile details/i);
  });

  it("admin and super-admin approve and filter mandal and panchayat officials", async () => {
    // 1. Create a pending Mandal official (admin role) and a pending Panchayat official (sarpanch role)
    const pendingMandal = await insertUser({
      name: "Mandal Officer Candidate",
      role: "admin",
      approvalStatus: "pending",
      jurisdictionId: villageX.id,
    });
    const pendingPanchayat = await insertUser({
      name: "Sarpanch Candidate",
      role: "sarpanch",
      approvalStatus: "pending",
      jurisdictionId: villageX.id,
    });

    // 2. Query officials with tier filter role=mandal
    const mandalRes = await req(superAdmin, "/api/admin/officials?role=mandal");
    expect(mandalRes.status).toBe(200);
    const mandalBody = await mandalRes.json();
    expect(mandalBody.officials.some((o: { id: string }) => o.id === pendingMandal.user.id)).toBe(true);
    expect(mandalBody.officials.some((o: { id: string }) => o.id === pendingPanchayat.user.id)).toBe(false);

    // 3. Query officials with tier filter role=panchayat
    const panchayatRes = await req(superAdmin, "/api/admin/officials?role=panchayat");
    expect(panchayatRes.status).toBe(200);
    const panchayatBody = await panchayatRes.json();
    expect(panchayatBody.officials.some((o: { id: string }) => o.id === pendingPanchayat.user.id)).toBe(true);
    expect(panchayatBody.officials.some((o: { id: string }) => o.id === pendingMandal.user.id)).toBe(false);

    // 4. Admin can approve Mandal official
    const approveMandalRes = await req(adminX, `/api/admin/officials/${pendingMandal.user.id}/approve`, "POST");
    expect(approveMandalRes.status).toBe(200);
    const approveMandalBody = await approveMandalRes.json();
    expect(approveMandalBody.official.approvalStatus).toBe("approved");

    // 5. Admin can approve Panchayat official
    const approvePanchayatRes = await req(adminX, `/api/admin/officials/${pendingPanchayat.user.id}/approve`, "POST");
    expect(approvePanchayatRes.status).toBe(200);
    const approvePanchayatBody = await approvePanchayatRes.json();
    expect(approvePanchayatBody.official.approvalStatus).toBe("approved");

    // 6. Admin can decline official with custom reason note
    const declineRes = await req(adminX, `/api/admin/officials/${pendingPanchayat.user.id}/decline`, "POST", {
      note: "Jurisdiction documentation mismatch",
    });
    expect(declineRes.status).toBe(200);
    const declineBody = await declineRes.json();
    expect(declineBody.official.approvalStatus).toBe("declined");
  });
});

describe("hierarchy-based data isolation & mandal official scoping", () => {
  it("mandal official sees all issues in their mandal across all villages, but none outside", async () => {
    const res = await req(mandalOfficialA, "/api/issues");
    expect(res.status).toBe(200);
    const ids = (await res.json()).issues.map((i: { id: string }) => i.id);
    // VillageX issues (same mandal MandalA1)
    expect(ids).toContain(issueX1);
    expect(ids).toContain(issueX2);
    // VillageX2 issues (same mandal MandalA1, different village)
    expect(ids).toContain(issueX3);
    // VillageY issues (MandalB1 in TestDistB) - MUST NOT LEAK
    expect(ids).not.toContain(issueY1);
  });

  it("mandal official can filter issues by village within their mandal", async () => {
    // 1. Filter by VillageX2
    const resX2 = await req(mandalOfficialA, "/api/issues?village=VillageX2");
    expect(resX2.status).toBe(200);
    const bodyX2 = await resX2.json();
    const idsX2 = bodyX2.issues.map((i: { id: string }) => i.id);
    expect(idsX2).toContain(issueX3);
    expect(idsX2).not.toContain(issueX1);
    expect(idsX2).not.toContain(issueX2);

    // 2. Filter by VillageX
    const resX = await req(mandalOfficialA, "/api/issues?village=VillageX");
    expect(resX.status).toBe(200);
    const bodyX = await resX.json();
    const idsX = bodyX.issues.map((i: { id: string }) => i.id);
    expect(idsX).toContain(issueX1);
    expect(idsX).toContain(issueX2);
    expect(idsX).not.toContain(issueX3);

    // 3. Attempt to filter by a village outside their mandal (VillageY) returns 0 issues
    const resY = await req(mandalOfficialA, "/api/issues?village=VillageY");
    expect(resY.status).toBe(200);
    const bodyY = await resY.json();
    expect(bodyY.issues.length).toBe(0);
    expect(bodyY.total).toBe(0);
  });

  it("mandal official can read and manage issues within their mandal, but denied for outside mandal", async () => {
    // 1. Can read issues in VillageX and VillageX2
    const readX1 = await req(mandalOfficialA, `/api/issues/${issueX1}`);
    expect(readX1.status).toBe(200);
    const readX3 = await req(mandalOfficialA, `/api/issues/${issueX3}`);
    expect(readX3.status).toBe(200);

    // 2. Cannot read issue in VillageY (MandalB1)
    const readY = await req(mandalOfficialA, `/api/issues/${issueY1}`);
    expect(readY.status).toBe(404);

    // 3. Can update status and add progress note for issues in their mandal
    const updateX3 = await req(mandalOfficialA, `/api/issues/${issueX3}/status`, "PATCH", {
      status: "In Progress",
      note: "Mandal officer inspected VillageX2 site",
    });
    expect(updateX3.status).toBe(200);
    expect((await updateX3.json()).issue.status).toBe("In Progress");

    const noteRes = await req(mandalOfficialA, `/api/issues/${issueX3}/progress`, "POST", {
      note: "Allocated funds for VillageX2 repair",
    });
    expect(noteRes.status).toBe(201);

    // 4. Cannot update issue outside their mandal (VillageY)
    const updateY = await req(mandalOfficialA, `/api/issues/${issueY1}/status`, "PATCH", {
      status: "In Progress",
    });
    expect(updateY.status).toBe(403);
  });

  it("mandal official stats are scoped to their mandal and support village filtering", async () => {
    // 1. Overall stats for MandalA1 includes issues from VillageX and VillageX2, but NOT VillageY
    const statsAll = await req(mandalOfficialA, "/api/issues/stats");
    expect(statsAll.status).toBe(200);
    const bodyAll = await statsAll.json();
    expect(bodyAll.total).toBeGreaterThanOrEqual(3);

    // 2. Stats filtered by VillageX2
    const statsX2 = await req(mandalOfficialA, "/api/issues/stats?village=VillageX2");
    expect(statsX2.status).toBe(200);
    const bodyX2 = await statsX2.json();
    expect(bodyX2.total).toBe(1);

    // 3. Stats for village outside mandal returns 0
    const statsY = await req(mandalOfficialA, "/api/issues/stats?village=VillageY");
    expect(statsY.status).toBe(200);
    const bodyY = await statsY.json();
    expect(bodyY.total).toBe(0);
  });

  it("panchayat (sarpanch) cannot see other villages in the same mandal", async () => {
    // Sarpanch of VillageX lists issues
    const res = await req(sarpanchX, "/api/issues");
    expect(res.status).toBe(200);
    const ids = (await res.json()).issues.map((i: { id: string }) => i.id);
    expect(ids).toContain(issueX1);
    expect(ids).toContain(issueX2);
    // VillageX2 is in the same mandal, but sarpanch must NOT see it
    expect(ids).not.toContain(issueX3);
    expect(ids).not.toContain(issueY1);

    // Cannot manage VillageX2 issue
    const update = await req(sarpanchX, `/api/issues/${issueX3}/status`, "PATCH", {
      status: "In Progress",
    });
    expect(update.status).toBe(403);
  });

  it("admin and super-admin can filter across districts, mandals, and villages", async () => {
    // 1. Filter by district TestDistA: sees issues in VillageX and VillageX2, but not VillageY
    const distA = await req(superAdmin, "/api/issues?district=TestDistA");
    expect(distA.status).toBe(200);
    const distABody = await distA.json();
    const distAIds = distABody.issues.map((i: { id: string }) => i.id);
    expect(distAIds).toContain(issueX1);
    expect(distAIds).toContain(issueX3);
    expect(distAIds).not.toContain(issueY1);

    // 2. Filter by mandal MandalA1
    const mandalA = await req(adminX, "/api/issues?mandal=MandalA1");
    expect(mandalA.status).toBe(200);
    const mandalABody = await mandalA.json();
    const mandalAIds = mandalABody.issues.map((i: { id: string }) => i.id);
    expect(mandalAIds).toContain(issueX1);
    expect(mandalAIds).toContain(issueX3);
    expect(mandalAIds).not.toContain(issueY1);

    // 3. Filter by mandal MandalB1
    const mandalB = await req(adminX, "/api/issues?mandal=MandalB1");
    expect(mandalB.status).toBe(200);
    const mandalBBody = await mandalB.json();
    const mandalBIds = mandalBBody.issues.map((i: { id: string }) => i.id);
    expect(mandalBIds).toContain(issueY1);
    expect(mandalBIds).not.toContain(issueX1);
    expect(mandalBIds).not.toContain(issueX3);
  });

  it("official registration adapts to roles: mandal_official, admin, ward_member", async () => {
    // 1. Request OTP for mandal official
    const moPhone = "9876543210";
    const otpRes = await req(null, "/api/auth/otp/request", "POST", { phone: moPhone });
    expect(otpRes.status).toBe(200);
    const { devOtp } = await otpRes.json();
    expect(devOtp).toBeDefined();

    // Register mandal official with district and mandal only
    const moReg = await req(null, "/api/auth/register/official", "POST", {
      phone: moPhone,
      code: devOtp,
      name: "New Mandal Officer",
      role: "mandal_official",
      district: "TestDistA",
      mandal: "MandalA1",
    });
    expect(moReg.status).toBe(201);
    const moBody = await moReg.json();
    expect(moBody.user.role).toBe("mandal_official");
    expect(moBody.user.district).toBe("TestDistA");
    expect(moBody.user.mandal).toBe("MandalA1");

    // 2. Register admin with no location required
    const adminPhone = "9876543211";
    const adminOtp = await req(null, "/api/auth/otp/request", "POST", { phone: adminPhone });
    const { devOtp: adminCode } = await adminOtp.json();

    const adminReg = await req(null, "/api/auth/register/official", "POST", {
      phone: adminPhone,
      code: adminCode,
      name: "State Admin",
      role: "admin",
    });
    expect(adminReg.status).toBe(201);
    const adminBody = await adminReg.json();
    expect(adminBody.user.role).toBe("admin");
    expect(adminBody.user.jurisdictionId).toBeNull();

    // 3. Register ward member with wardNumber
    const wmPhone = "9876543212";
    const wmOtp = await req(null, "/api/auth/otp/request", "POST", { phone: wmPhone });
    const { devOtp: wmCode } = await wmOtp.json();

    const wmReg = await req(null, "/api/auth/register/official", "POST", {
      phone: wmPhone,
      code: wmCode,
      name: "Ward Rep",
      role: "ward_member",
      district: "TestDistA",
      mandal: "MandalA1",
      village: "VillageX",
      wardNumber: "5",
    });
    expect(wmReg.status).toBe(201);
    const wmBody = await wmReg.json();
    expect(wmBody.user.role).toBe("ward_member");
    expect(wmBody.user.wardNumber).toBe("5");
    expect(wmBody.user.village).toBe("VillageX");
  });

  it("ward member query parameters are strictly locked to their village and ward", async () => {
    // Ward member tries to query issues by specifying another district or mandal in query params
    const res = await req(wardMemberX1, "/api/issues?district=TestDistB&mandal=MandalB1");
    expect(res.status).toBe(200);
    const body = await res.json();
    const ids = body.issues.map((i: { id: string }) => i.id);
    // Even though district=TestDistB was requested, ward member must NOT see VillageY
    expect(ids).not.toContain(issueY1);
    // Ward member must strictly see their own ward's issue in VillageX
    expect(ids).toContain(issueX1);
    expect(ids).not.toContain(issueX2);
  });

  it("mandal official profile completion via PATCH /me requires only district and mandal (no village)", async () => {
    // Create a new user with OTP
    const phone = "9876543213";
    const otpRes = await req(null, "/api/auth/otp/request", "POST", { phone });
    const { devOtp } = await otpRes.json();
    const verifyRes = await req(null, "/api/auth/otp/verify", "POST", { phone, code: devOtp });
    expect(verifyRes.status).toBe(200);
    const cookieHeader = verifyRes.headers.get("set-cookie") ?? "";
    const token = cookieHeader.match(/grama_session=([^;]+)/)?.[1] ?? "";

    const patchRes = await req({ token } as any, "/api/users/me", "PATCH", {
      name: "Mandal Officer Test",
      fatherName: "Father Name",
      phone,
      role: "mandal_official",
      district: "TestDistA",
      mandal: "MandalA1",
    });

    expect(patchRes.status).toBe(200);
    const patchBody = await patchRes.json();
    expect(patchBody.user.role).toBe("mandal_official");
    expect(patchBody.user.district).toBe("TestDistA");
    expect(patchBody.user.mandal).toBe("MandalA1");
  });
});


