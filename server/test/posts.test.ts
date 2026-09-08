import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID, createHash } from "node:crypto";
import { testSql } from "./setup";
import { eq } from "drizzle-orm";
import { db, schema } from "../src/db/client";
import type { User } from "../src/db/schema";
import { createApp } from "../src/app";

interface Actor {
  user: User;
  token: string;
}

let superAdmin: Actor;
let sarpanchX: Actor;
let citizenX: Actor;
let citizenY: Actor;
let villageX: { id: string };
let villageY: { id: string };

const app = createApp();

async function insertUser(opts: {
  name: string;
  role: User["role"];
  jurisdictionId?: string | null;
  approvalStatus?: User["approvalStatus"];
}): Promise<Actor> {
  const [user] = await db
    .insert(schema.users)
    .values({
      name: opts.name,
      phone: `+919${Math.floor(100000000 + Math.random() * 899999999)}`,
      role: opts.role,
      approvalStatus: opts.approvalStatus ?? "approved",
      jurisdictionId: opts.jurisdictionId ?? null,
    })
    .returning();

  const token = randomUUID() + randomUUID();
  await db.insert(schema.sessions).values({
    userId: user.id,
    tokenHash: createHash("sha256").update(token).digest("hex"),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
  return { user, token };
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

describe("Notices and News System", () => {
  beforeAll(async () => {
    await db.delete(schema.posts);
    await db.delete(schema.sessions);
    await db.delete(schema.users);
    await db.delete(schema.jurisdictions);

    const suffix = randomUUID().slice(0, 6);
    [villageX, villageY] = await db
      .insert(schema.jurisdictions)
      .values([
        { district: `DistX_${suffix}`, mandal: `MandalX_${suffix}`, village: `VillageX_${suffix}` },
        { district: `DistY_${suffix}`, mandal: `MandalY_${suffix}`, village: `VillageY_${suffix}` },
      ])
      .returning();

    superAdmin = await insertUser({ name: "Post Admin", role: "super_admin" });
    sarpanchX = await insertUser({
      name: "Sarpanch PostX",
      role: "sarpanch",
      jurisdictionId: villageX.id,
      approvalStatus: "approved",
    });
    citizenX = await insertUser({
      name: "Citizen PostX",
      role: "citizen",
      jurisdictionId: villageX.id,
    });
    citizenY = await insertUser({
      name: "Citizen PostY",
      role: "citizen",
      jurisdictionId: villageY.id,
    });
  });

  afterAll(async () => {
    await db.delete(schema.posts);
    await db.delete(schema.sessions);
    await db.delete(schema.users);
    await db.delete(schema.jurisdictions);
    await db.$client.end();
    await testSql.end();
  });

  it("allows citizens to publish news, but forbids citizens from publishing official notices", async () => {
    // 1. Citizen attempts to publish official notice -> 403 Forbidden
    const noticeRes = await req(citizenX, "/api/posts", "POST", {
      type: "notice",
      title: "Citizen Fake Notice",
      content: "This should fail because citizens cannot post notices",
      category: "Gram Panchayat Announcement",
    });
    expect(noticeRes.status).toBe(403);
    const errBody = await noticeRes.json();
    expect(errBody.error.message).toContain("Only authorized public officials");

    // 2. Citizen publishes community news -> 201 Created
    const newsRes = await req(citizenX, "/api/posts", "POST", {
      type: "news",
      title: "Village Cricket Tournament This Sunday",
      content: "All youth are invited to the village playground for friendly cricket tournament.",
      category: "Sports & Culture",
      priority: "NORMAL",
    });
    expect(newsRes.status).toBe(201);
    const newsBody = await newsRes.json();
    expect(newsBody.post.id).toBeDefined();
    expect(newsBody.post.type).toBe("news");
    expect(newsBody.post.authorName).toBe("Citizen PostX");
  });

  it("allows approved sarpanch to publish official notice associated to their village", async () => {
    const noticeRes = await req(sarpanchX, "/api/posts", "POST", {
      type: "notice",
      title: "Water Supply Shutdown Notice",
      content: "Pipeline maintenance will take place between 10 AM and 2 PM on Wednesday.",
      category: "Water & Sanitation",
      priority: "IMPORTANT",
      pinned: true,
    });
    expect(noticeRes.status).toBe(201);
    const body = await noticeRes.json();
    expect(body.post.type).toBe("notice");
    expect(body.post.priority).toBe("IMPORTANT");
    expect(body.post.jurisdictionId).toBe(villageX.id);
    expect(body.post.pinned).toBe(true);
  });

  it("scopes village notices strictly to the associated village and statewide", async () => {
    // CitizenX in VillageX should see SarpanchX's notice
    const listX = await req(citizenX, "/api/posts?type=notice");
    expect(listX.status).toBe(200);
    const bodyX = await listX.json();
    expect(bodyX.posts.length).toBeGreaterThan(0);
    expect(bodyX.posts.some((p: { title: string }) => p.title.includes("Water Supply Shutdown"))).toBe(true);

    // CitizenY in VillageY querying notices should NOT see VillageX's notice
    const listY = await req(citizenY, "/api/posts?type=notice");
    expect(listY.status).toBe(200);
    const bodyY = await listY.json();
    expect(bodyY.posts.some((p: { title: string }) => p.title.includes("Water Supply Shutdown"))).toBe(false);

    // Super Admin filtering by PostVillageX sees the notice
    const [jx] = await db.select().from(schema.jurisdictions).where(eq(schema.jurisdictions.id, villageX.id));
    const filterX = await req(superAdmin, `/api/posts?type=notice&village=${jx.village}`);
    expect(filterX.status).toBe(200);
    const filterXBody = await filterX.json();
    expect(filterXBody.posts.some((p: { title: string }) => p.title.includes("Water Supply Shutdown"))).toBe(true);

    // Super Admin filtering by PostVillageY does NOT see VillageX's notice
    const [jy] = await db.select().from(schema.jurisdictions).where(eq(schema.jurisdictions.id, villageY.id));
    const filterY = await req(superAdmin, `/api/posts?type=notice&village=${jy.village}`);
    expect(filterY.status).toBe(200);
    const filterYBody = await filterY.json();
    expect(filterYBody.posts.some((p: { title: string }) => p.title.includes("Water Supply Shutdown"))).toBe(false);
  });

  it("strictly scopes community news so citizen only sees news from their own village", async () => {
    // 1. CitizenX publishes community news for village X
    const newsXRes = await req(citizenX, "/api/posts", "POST", {
      type: "news",
      title: "Village X Annual Festivities",
      content: "Celebration at the village main square this Saturday.",
      category: "Sports & Culture",
    });
    expect(newsXRes.status).toBe(201);
    const newsX = (await newsXRes.json()).post;
    expect(newsX.jurisdictionId).toBe(villageX.id);

    // 2. CitizenX lists news -> sees Village X news
    const listX = await req(citizenX, "/api/posts?type=news");
    expect(listX.status).toBe(200);
    const bodyX = await listX.json();
    expect(bodyX.posts.some((p: { id: string }) => p.id === newsX.id)).toBe(true);

    // 3. CitizenY (village Y) lists news -> does NOT see Village X news!
    const listY = await req(citizenY, "/api/posts?type=news");
    expect(listY.status).toBe(200);
    const bodyY = await listY.json();
    expect(bodyY.posts.some((p: { id: string }) => p.id === newsX.id)).toBe(false);

    // 4. CitizenY attempts to filter by VillageX -> still cannot see Village X news
    const [jx] = await db.select().from(schema.jurisdictions).where(eq(schema.jurisdictions.id, villageX.id));
    const listYLeak = await req(citizenY, `/api/posts?type=news&village=${jx.village}`);
    expect(listYLeak.status).toBe(200);
    const bodyYLeak = await listYLeak.json();
    expect(bodyYLeak.posts.some((p: { id: string }) => p.id === newsX.id)).toBe(false);
  });

  it("allows authors and super admin to delete posts", async () => {
    // 1. Create a news post by CitizenX
    const createRes = await req(citizenX, "/api/posts", "POST", {
      type: "news",
      title: "Temporary Notice To Delete",
      content: "Content to be deleted.",
      category: "General",
    });
    const postId = (await createRes.json()).post.id;

    // 2. CitizenY attempts to delete CitizenX's post -> 403
    const badDel = await req(citizenY, `/api/posts/${postId}`, "DELETE");
    expect(badDel.status).toBe(403);

    // 3. CitizenX deletes own post -> 200
    const goodDel = await req(citizenX, `/api/posts/${postId}`, "DELETE");
    expect(goodDel.status).toBe(200);
    expect((await goodDel.json()).ok).toBe(true);
  });

  it("supports attaching an image to an official notice and serving it", async () => {
    // 1. Upload an image file via multipart form data
    const formData = new FormData();
    const fakeImageBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13]); // PNG header
    const file = new File([fakeImageBytes], "official_circular.png", { type: "image/png" });
    formData.append("file", file);

    const uploadRes = await app.request("/api/posts/upload", {
      method: "POST",
      headers: {
        Cookie: `grama_session=${sarpanchX.token}`,
      },
      body: formData,
    });
    expect(uploadRes.status).toBe(201);
    const uploadBody = await uploadRes.json();
    expect(uploadBody.url).toBeDefined();
    expect(uploadBody.key).toBeDefined();

    // 2. Create notice with imageUrl
    const noticeRes = await req(sarpanchX, "/api/posts", "POST", {
      type: "notice",
      title: "Panchayat Order With Attached Circular",
      content: "Please see the attached circular image for detailed instructions.",
      category: "Gram Panchayat Order",
      priority: "IMPORTANT",
      imageUrl: uploadBody.url,
    });
    expect(noticeRes.status).toBe(201);
    const noticeBody = await noticeRes.json();
    expect(noticeBody.post.imageUrl).toBe(uploadBody.url);

    // 3. Fetch notice in feed
    const listRes = await req(citizenX, "/api/posts?type=notice");
    const listBody = await listRes.json();
    const foundNotice = listBody.posts.find((p: { id: string }) => p.id === noticeBody.post.id);
    expect(foundNotice).toBeDefined();
    expect(foundNotice.imageUrl).toBe(uploadBody.url);

    // 4. Download / view image via /api/files/:key
    const fileRes = await app.request(`/api/files/${uploadBody.key}`, {
      method: "GET",
      headers: {
        Cookie: `grama_session=${citizenX.token}`,
      },
    });
    expect(fileRes.status).toBe(200);
    expect(fileRes.headers.get("content-type")).toContain("image/png");
    const downloadedBytes = new Uint8Array(await fileRes.arrayBuffer());
    expect(downloadedBytes.length).toBe(fakeImageBytes.length);
  });

  it("allows creating posts with optional image and optional content without validation errors", async () => {
    // 1. Create notice without image and without content (both optional)
    const resNoImgNoContent = await req(sarpanchX, "/api/posts", "POST", {
      type: "notice",
      title: "Village Meeting Announcement",
      category: "Gram Sabha",
    });
    expect(resNoImgNoContent.status).toBe(201);
    const body1 = await resNoImgNoContent.json();
    expect(body1.post.title).toBe("Village Meeting Announcement");
    expect(body1.post.imageUrl).toBeNull();
    expect(body1.post.content).toBe("");

    // 2. Create post with short content (< 5 characters) and no image
    const resShortContent = await req(citizenX, "/api/posts", "POST", {
      type: "news",
      title: "Short News Update",
      content: "Hi!",
      category: "General",
    });
    expect(resShortContent.status).toBe(201);
    const body2 = await resShortContent.json();
    expect(body2.post.content).toBe("Hi!");
  });
});
