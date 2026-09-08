import { Hono } from "hono";
import { requireAuth, getAuth } from "../middleware/auth";
import { badRequest } from "../middleware/error";
import { createPost, listPosts, deletePost } from "../services/posts";
import { CreatePostSchema } from "../../../shared/types";
import { getStorage, MAX_UPLOAD_BYTES } from "../providers/storage";
import { realtimeHub } from "../services/realtime";

export const postsRoutes = new Hono()
  .use("*", requireAuth)
  /* Upload an image attachment for a post/notice */
  .post("/upload", async (c) => {
    getAuth(c);
    const body = await c.req.parseBody();
    const file = body["file"];

    if (!(file instanceof File)) throw badRequest("Missing 'file' field");
    if (file.size > MAX_UPLOAD_BYTES) throw badRequest("File too large (max 10 MB)");
    const mime = file.type || "application/octet-stream";
    const ALLOWED_IMAGE_MIMES = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/gif",
    ];
    if (!ALLOWED_IMAGE_MIMES.includes(mime)) {
      throw badRequest(`Unsupported file type: ${mime}. Please upload an image.`);
    }

    const stored = await getStorage().save(Buffer.from(await file.arrayBuffer()), mime);
    return c.json({ url: `/api/files/${stored.key}`, key: stored.key }, 201);
  })
  /* List notices and/or news */
  .get("/", async (c) => {
    const { user, jurisdiction } = getAuth(c);
    const type = c.req.query("type");
    if (type && type !== "notice" && type !== "news") {
      throw badRequest("type must be 'notice' or 'news'");
    }

    const page = Math.max(1, Number(c.req.query("page") ?? "1") || 1);
    const limit = Math.min(100, Math.max(1, Number(c.req.query("limit") ?? "20") || 20));
    const category = c.req.query("category")?.trim() || undefined;
    const district = c.req.query("district")?.trim() || undefined;
    const mandal = c.req.query("mandal")?.trim() || undefined;
    const village = c.req.query("village")?.trim() || undefined;

    const result = await listPosts(user, jurisdiction, {
      type: type as "notice" | "news" | undefined,
      category,
      district,
      mandal,
      village,
      page,
      limit,
    });

    return c.json(result);
  })
  /* Publish a new notice or news */
  .post("/", async (c) => {
    const { user, jurisdiction } = getAuth(c);
    const body = await c.req.json().catch(() => null);
    const parsed = CreatePostSchema.parse(body);

    const post = await createPost(user, jurisdiction, parsed);

    realtimeHub.publish({
      type: post.type,
      action: "created",
      jurisdictionId: post.jurisdictionId,
      district: parsed.district ?? jurisdiction?.district ?? undefined,
      mandal: parsed.mandal ?? jurisdiction?.mandal ?? undefined,
      village: parsed.village ?? jurisdiction?.village ?? undefined,
      data: {
        id: post.id,
        type: post.type,
        title: post.title,
        category: post.category,
        priority: post.priority,
        authorName: post.authorName,
        authorRole: post.authorRole,
        village: parsed.village ?? jurisdiction?.village ?? null,
        imageUrl: post.imageUrl ?? null,
        pinned: post.pinned,
      },
    });

    return c.json({ ok: true, post }, 201);
  })
  /* Delete a notice or news */
  .delete("/:id", async (c) => {
    const { user } = getAuth(c);
    const postId = c.req.param("id") ?? "";
    const result = await deletePost(user, postId);

    if (result.post) {
      realtimeHub.publish({
        type: result.post.type,
        action: "deleted",
        jurisdictionId: result.post.jurisdictionId,
        data: {
          id: postId,
          type: result.post.type,
          title: result.post.title,
        },
      });
    }

    return c.json({ ok: true });
  });
