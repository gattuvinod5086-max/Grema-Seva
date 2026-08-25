import type { Hono } from "hono";
import type { News, User } from "@/shared/types";
import { CreateNewsSchema, UpdateNewsSchema } from "@/shared/types";
import { requireAuth } from "./governance";
import {
  canPublishNews,
  canApproveNews,
  NEWS_REQUIRES_APPROVAL,
} from "@/shared/constants/news";
import { newsMatchesUserLocation } from "@/shared/services/newsVisibility";
import { getTelanganaNews } from "./services/newsProvider";

type HonoEnv = { Bindings: Env };

function withImageUrl(news: News): News {
  return {
    ...news,
    image_url: news.image_key ? `/api/files/${news.image_key}` : undefined,
  };
}

function canManageNews(user: User, article: { author_id: string }): boolean {
  if (canApproveNews(user.role)) return true;
  if (canPublishNews(user.role) && article.author_id === user.id) return true;
  return false;
}

export function registerNewsRoutes(app: Hono<HonoEnv>) {
  app.get("/api/news/categories", (c) => {
    return c.json({
      categories: [
        "Village Announcement",
        "Government Announcement",
        "Welfare",
        "Agriculture",
        "Education",
        "Health",
        "Employment",
        "Infrastructure",
        "Emergency",
        "General",
      ],
    });
  });

  app.get("/api/news/live", async (c) => {
    const result = await getTelanganaNews({
      NEWS_RSS_URL: c.env.NEWS_RSS_URL,
      NEWS_API_KEY: c.env.NEWS_API_KEY,
      NEWS_API_URL: c.env.NEWS_API_URL,
    });
    return c.json(result);
  });

  app.get("/api/news", async (c) => {
    const url = new URL(c.req.url);
    const category = url.searchParams.get("category");
    const district = url.searchParams.get("district");
    const mandal = url.searchParams.get("mandal");
    const village = url.searchParams.get("village");
    const q = url.searchParams.get("q");
    const status = url.searchParams.get("status") ?? "PUBLISHED";
    const manage = url.searchParams.get("manage") === "1";

    let query = "SELECT * FROM news WHERE 1=1";
    const bindings: (string | number)[] = [];

    if (!manage) {
      query += " AND status = 'PUBLISHED' AND approval_status = 'APPROVED'";
      query += " AND (expires_at IS NULL OR expires_at > datetime('now'))";
    } else {
      query += " AND status = ?";
      bindings.push(status === "all" ? "PUBLISHED" : status);
    }

    if (category) {
      query += " AND category = ?";
      bindings.push(category);
    }
    if (district) {
      query += " AND (district = ? OR visibility_scope = 'STATE')";
      bindings.push(district);
    }
    if (mandal) {
      query += " AND (mandal = ? OR visibility_scope IN ('STATE', 'DISTRICT'))";
      bindings.push(mandal);
    }
    if (village) {
      query += " AND (village = ? OR visibility_scope IN ('STATE', 'DISTRICT', 'MANDAL'))";
      bindings.push(village);
    }
    if (q) {
      query += " AND (title_en LIKE ? OR short_description_en LIKE ?)";
      bindings.push(`%${q}%`, `%${q}%`);
    }

    query += " ORDER BY CASE priority WHEN 'URGENT' THEN 0 WHEN 'IMPORTANT' THEN 1 WHEN 'NORMAL' THEN 2 ELSE 3 END, published_at DESC";

    const { results } = await c.env.DB.prepare(query).bind(...bindings).all<News>();

    let filtered = results;
    if (!manage && (district || mandal || village)) {
      filtered = results.filter((n) =>
        newsMatchesUserLocation(n, { district, mandal, village })
      );
    }

    return c.json(filtered.map(withImageUrl));
  });

  app.get("/api/news/village/:village", async (c) => {
    const village = c.req.param("village");
    const { results } = await c.env.DB.prepare(
      `SELECT * FROM news WHERE status = 'PUBLISHED' AND approval_status = 'APPROVED'
       AND (village = ? OR visibility_scope = 'STATE')
       ORDER BY published_at DESC LIMIT 50`
    ).bind(village).all<News>();
    return c.json(results.filter((n) => newsMatchesUserLocation(n, { village })).map(withImageUrl));
  });

  app.get("/api/news/district/:district", async (c) => {
    const district = c.req.param("district");
    const { results } = await c.env.DB.prepare(
      `SELECT * FROM news WHERE status = 'PUBLISHED' AND approval_status = 'APPROVED'
       AND (district = ? OR visibility_scope = 'STATE')
       ORDER BY published_at DESC LIMIT 50`
    ).bind(district).all<News>();
    return c.json(results.filter((n) => newsMatchesUserLocation(n, { district })).map(withImageUrl));
  });

  app.get("/api/news/analytics/summary", requireAuth(), async (c) => {
    const user = c.get("gramaUser");
    if (!canPublishNews(user.role)) return c.json({ error: "Unauthorized" }, 403);

    const { results } = await c.env.DB.prepare("SELECT status, category, view_count, village FROM news").all<News>();
    const byStatus: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    let totalViews = 0;
    for (const n of results) {
      byStatus[n.status] = (byStatus[n.status] ?? 0) + 1;
      byCategory[n.category] = (byCategory[n.category] ?? 0) + 1;
      totalViews += n.view_count ?? 0;
    }
    const topViewed = [...results].sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0)).slice(0, 5);

    return c.json({
      total: results.length,
      byStatus,
      byCategory,
      totalViews,
      topViewed: topViewed.map(withImageUrl),
    });
  });

  app.get("/api/news/:id", async (c) => {
    const id = parseInt(c.req.param("id"));
    const article = await c.env.DB.prepare("SELECT * FROM news WHERE id = ?").bind(id).first<News>();
    if (!article) return c.json({ error: "Not found" }, 404);

    await c.env.DB.prepare("UPDATE news SET view_count = COALESCE(view_count, 0) + 1 WHERE id = ?").bind(id).run();

    const related = await c.env.DB.prepare(
      "SELECT * FROM news WHERE category = ? AND id != ? AND status = 'PUBLISHED' LIMIT 4"
    ).bind(article.category, id).all<News>();

    return c.json({
      article: withImageUrl({ ...article, view_count: (article.view_count ?? 0) + 1 }),
      related: (related.results ?? []).map(withImageUrl),
    });
  });

  app.post("/api/news", requireAuth(), async (c) => {
    const user = c.get("gramaUser");
    if (!canPublishNews(user.role)) {
      return c.json({ error: "Unauthorized — citizens cannot publish news" }, 403);
    }

    const body = CreateNewsSchema.parse(await c.req.json());
    const approvalStatus = NEWS_REQUIRES_APPROVAL && user.role === "ward_member" ? "PENDING" : "APPROVED";
    const status = body.status ?? "DRAFT";

    const { success, meta } = await c.env.DB.prepare(
      `INSERT INTO news (title_en, title_te, short_description_en, short_description_te, content_en, content_te,
        category, district, mandal, village, visibility_scope, priority, status, approval_status,
        author_id, author_name, scheduled_at, expires_at, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
         CASE WHEN ? = 'PUBLISHED' AND ? = 'APPROVED' THEN datetime('now') ELSE NULL END)`
    ).bind(
      body.title_en,
      body.title_te ?? null,
      body.short_description_en,
      body.short_description_te ?? null,
      body.content_en,
      body.content_te ?? null,
      body.category,
      body.district ?? user.district ?? null,
      body.mandal ?? user.mandal ?? null,
      body.village ?? user.village ?? null,
      body.visibility_scope,
      body.priority ?? "NORMAL",
      status,
      approvalStatus,
      user.id,
      user.name ?? null,
      body.scheduled_at ?? null,
      body.expires_at ?? null,
      status,
      approvalStatus
    ).run();

    if (!success) return c.json({ error: "Failed to create news" }, 500);
    return c.json({ success: true, id: meta?.last_row_id ?? 0 }, 201);
  });

  app.patch("/api/news/:id", requireAuth(), async (c) => {
    const user = c.get("gramaUser");
    const id = parseInt(c.req.param("id"));
    const existing = await c.env.DB.prepare("SELECT * FROM news WHERE id = ?").bind(id).first<News>();
    if (!existing) return c.json({ error: "Not found" }, 404);
    if (!canManageNews(user, existing)) return c.json({ error: "Unauthorized" }, 403);

    const body = UpdateNewsSchema.parse(await c.req.json());
    await c.env.DB.prepare(
      `UPDATE news SET
        title_en = COALESCE(?, title_en),
        title_te = COALESCE(?, title_te),
        short_description_en = COALESCE(?, short_description_en),
        short_description_te = COALESCE(?, short_description_te),
        content_en = COALESCE(?, content_en),
        content_te = COALESCE(?, content_te),
        category = COALESCE(?, category),
        district = COALESCE(?, district),
        mandal = COALESCE(?, mandal),
        village = COALESCE(?, village),
        visibility_scope = COALESCE(?, visibility_scope),
        priority = COALESCE(?, priority),
        status = COALESCE(?, status),
        scheduled_at = COALESCE(?, scheduled_at),
        expires_at = COALESCE(?, expires_at),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).bind(
      body.title_en ?? null,
      body.title_te ?? null,
      body.short_description_en ?? null,
      body.short_description_te ?? null,
      body.content_en ?? null,
      body.content_te ?? null,
      body.category ?? null,
      body.district ?? null,
      body.mandal ?? null,
      body.village ?? null,
      body.visibility_scope ?? null,
      body.priority ?? null,
      body.status ?? null,
      body.scheduled_at ?? null,
      body.expires_at ?? null,
      id
    ).run();

    return c.json({ success: true });
  });

  app.delete("/api/news/:id", requireAuth(), async (c) => {
    const user = c.get("gramaUser");
    const id = parseInt(c.req.param("id"));
    const existing = await c.env.DB.prepare("SELECT * FROM news WHERE id = ?").bind(id).first<News>();
    if (!existing) return c.json({ error: "Not found" }, 404);
    if (!canManageNews(user, existing)) return c.json({ error: "Unauthorized" }, 403);

    await c.env.DB.prepare("DELETE FROM news WHERE id = ?").bind(id).run();
    return c.json({ success: true });
  });

  app.post("/api/news/:id/publish", requireAuth(), async (c) => {
    const user = c.get("gramaUser");
    const id = parseInt(c.req.param("id"));
    const existing = await c.env.DB.prepare("SELECT * FROM news WHERE id = ?").bind(id).first<News>();
    if (!existing) return c.json({ error: "Not found" }, 404);
    if (!canManageNews(user, existing)) return c.json({ error: "Unauthorized" }, 403);
    if (existing.approval_status === "PENDING" && !canApproveNews(user.role)) {
      return c.json({ error: "Awaiting approval" }, 400);
    }

    await c.env.DB.prepare(
      "UPDATE news SET status = 'PUBLISHED', published_at = datetime('now'), updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(id).run();
    return c.json({ success: true });
  });

  app.post("/api/news/:id/approve", requireAuth(), async (c) => {
    const user = c.get("gramaUser");
    if (!canApproveNews(user.role)) return c.json({ error: "Unauthorized" }, 403);
    const id = parseInt(c.req.param("id"));
    const body = (await c.req.json()) as { approved: boolean };
    await c.env.DB.prepare(
      "UPDATE news SET approval_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(body.approved ? "APPROVED" : "REJECTED", id).run();
    return c.json({ success: true });
  });

  app.post("/api/news/:id/image", requireAuth(), async (c) => {
    const user = c.get("gramaUser");
    const id = parseInt(c.req.param("id"));
    const existing = await c.env.DB.prepare("SELECT * FROM news WHERE id = ?").bind(id).first<News>();
    if (!existing || !canManageNews(user, existing)) return c.json({ error: "Unauthorized" }, 403);

    const formData = await c.req.formData();
    const file = formData.get("photo") as File;
    if (!file) return c.json({ error: "No image" }, 400);

    const ext = file.name.split(".").pop() || "jpg";
    const key = `news/${id}/${Date.now()}.${ext}`;
    await c.env.R2_BUCKET.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type },
    });
    await c.env.DB.prepare("UPDATE news SET image_key = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(key, id).run();
    return c.json({ success: true, image_key: key });
  });
}
