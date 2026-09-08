import { describe, it, expect, beforeAll } from "vitest";
import { randomUUID, createHash } from "node:crypto";
import { db, schema } from "../src/db/client";
import type { User } from "../src/db/schema";
import { createApp } from "../src/app";
import { realtimeHub } from "../src/services/realtime";
import type { RealtimeEvent } from "../../shared/types";

interface Actor {
  user: User;
  token: string;
}

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

describe("Real-time SSE and Event Distribution", () => {
  beforeAll(async () => {
    await db.delete(schema.posts);
    await db.delete(schema.sessions);
    await db.delete(schema.users);
    await db.delete(schema.jurisdictions);

    const suffix = randomUUID().slice(0, 6);
    [villageX, villageY] = await db
      .insert(schema.jurisdictions)
      .values([
        { state: "Telangana", district: "Nirmal", mandal: "Dilawarpur", village: `RealtimeVillageX_${suffix}` },
        { state: "Telangana", district: "Nirmal", mandal: "Dilawarpur", village: `RealtimeVillageY_${suffix}` },
      ])
      .returning();

    sarpanchX = await insertUser({
      name: "Sarpanch X",
      role: "sarpanch",
      jurisdictionId: villageX.id,
    });

    citizenX = await insertUser({
      name: "Citizen X",
      role: "citizen",
      jurisdictionId: villageX.id,
    });

    citizenY = await insertUser({
      name: "Citizen Y",
      role: "citizen",
      jurisdictionId: villageY.id,
    });
  });

  it("rejects unauthenticated requests to /api/realtime with 401", async () => {
    const res = await app.request("/api/realtime", { method: "GET" });
    expect(res.status).toBe(401);
  });

  it("allows authenticated user to establish SSE stream and receives connected event", async () => {
    const res = await app.request("/api/realtime", {
      method: "GET",
      headers: {
        Cookie: `grama_session=${citizenX.token}`,
      },
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");

    const reader = res.body?.getReader();
    expect(reader).toBeDefined();

    const chunk = await reader!.read();
    const text = new TextDecoder().decode(chunk.value);
    expect(text).toContain("event: connected");
    expect(text).toContain(citizenX.user.id);

    await reader!.cancel();
  });

  it("correctly scopes realtime events to matching jurisdictions and broadcasts news to all", () => {
    const receivedEventsX: RealtimeEvent[] = [];
    const receivedEventsY: RealtimeEvent[] = [];

    const unsubX = realtimeHub.subscribe({
      id: "sub-x",
      user: citizenX.user,
      jurisdiction: { id: villageX.id, state: "Telangana", district: "Nirmal", mandal: "Dilawarpur", village: "X" },
      send: (evt) => {
        receivedEventsX.push(evt);
      },
    });

    const unsubY = realtimeHub.subscribe({
      id: "sub-y",
      user: citizenY.user,
      jurisdiction: { id: villageY.id, state: "Telangana", district: "Nirmal", mandal: "Dilawarpur", village: "Y" },
      send: (evt) => {
        receivedEventsY.push(evt);
      },
    });

    // 1. Notice published in Village X
    realtimeHub.publish({
      type: "notice",
      action: "created",
      jurisdictionId: villageX.id,
      data: { title: "Village X Notice" },
    });

    expect(receivedEventsX.length).toBe(1);
    expect(receivedEventsX[0].data.title).toBe("Village X Notice");
    expect(receivedEventsY.length).toBe(0); // Village Y did not receive it!

    // 2. Issue created in Village X
    realtimeHub.publish({
      type: "issue",
      action: "created",
      jurisdictionId: villageX.id,
      reporterId: citizenX.user.id,
      data: { code: "GS-001" },
    });

    expect(receivedEventsX.length).toBe(2);
    expect(receivedEventsY.length).toBe(0);

    // 3. Community News published
    realtimeHub.publish({
      type: "news",
      action: "created",
      jurisdictionId: villageX.id,
      data: { title: "Telangana Festival Announcement" },
    });

    // Both should receive news
    expect(receivedEventsX.length).toBe(3);
    expect(receivedEventsY.length).toBe(1);
    expect(receivedEventsY[0].data.title).toBe("Telangana Festival Announcement");

    unsubX();
    unsubY();
  });
});
