import { describe, it, expect, beforeAll } from "vitest";
import { randomUUID, createHash } from "node:crypto";
import { db, schema } from "../src/db/client";
import type { User } from "../src/db/schema";
import { createApp } from "../src/app";

interface Actor {
  user: User;
  token: string;
}

let superAdmin: Actor;
let citizen: Actor;

const app = createApp();

async function insertUser(opts: {
  name: string;
  role: User["role"];
}): Promise<Actor> {
  const [user] = await db
    .insert(schema.users)
    .values({
      name: opts.name,
      phone: `+919${Math.floor(100000000 + Math.random() * 899999999)}`,
      role: opts.role,
      approvalStatus: "approved",
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

describe("Place Images & Landmark Identity Management", () => {
  beforeAll(async () => {
    superAdmin = await insertUser({ name: "Super Admin", role: "super_admin" });
    citizen = await insertUser({ name: "Regular Citizen", role: "citizen" });
  });

  it("citizens cannot configure place images (forbidden)", async () => {
    const res = await req(citizen, "/api/places/image", "PUT", {
      level: "district",
      district: "Hyderabad",
      imageUrl: "https://example.com/charminar.jpg",
    });
    expect(res.status).toBe(403);
  });

  it("admin can configure a district image and Google Drive link is auto-converted to direct CDN", async () => {
    const googleDriveLink =
      "https://drive.google.com/file/d/1B7x9_abcXYZ12345/view?usp=sharing";

    const res = await req(superAdmin, "/api/places/image", "PUT", {
      level: "district",
      district: "Hyderabad",
      imageUrl: googleDriveLink,
      caption: "Charminar Monument",
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.placeImage.district).toBe("Hyderabad");
    expect(body.placeImage.caption).toBe("Charminar Monument");
    // Assert automatic conversion to Google direct CDN
    expect(body.placeImage.imageUrl).toBe("https://lh3.googleusercontent.com/d/1B7x9_abcXYZ12345");
  });

  it("admin can configure a village image (e.g. Aliabad)", async () => {
    const res = await req(superAdmin, "/api/places/image", "PUT", {
      level: "village",
      district: "Hyderabad",
      mandal: "Charminar",
      village: "Aliabad",
      imageUrl: "https://images.unsplash.com/photo-aliabad-landmark.jpg",
      caption: "Historic Aliabad Gateway",
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.placeImage.village).toBe("Aliabad");
    expect(body.placeImage.caption).toBe("Historic Aliabad Gateway");
  });

  it("lists configured place images publicly", async () => {
    const res = await req(null, "/api/places/images?district=Hyderabad");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.images).toBeInstanceOf(Array);
    const hyd = body.images.find((img: any) => img.level === "district" && img.district === "Hyderabad");
    expect(hyd).toBeDefined();
    expect(hyd.caption).toBe("Charminar Monument");

    const aliabad = body.images.find((img: any) => img.level === "village" && img.village === "Aliabad");
    expect(aliabad).toBeDefined();
    expect(aliabad.caption).toBe("Historic Aliabad Gateway");
  });

  it("admin can upload an image file directly", async () => {
    const formData = new FormData();
    const fakeImage = new Blob(["fake-image-bytes"], { type: "image/jpeg" });
    formData.append("file", fakeImage, "place.jpg");

    const res = await app.request("/api/places/upload", {
      method: "POST",
      headers: {
        Cookie: `grama_session=${superAdmin.token}`,
      },
      body: formData,
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.url).toMatch(/^\/api\/files\//);
    expect(body.key).toBeDefined();
  });
});
