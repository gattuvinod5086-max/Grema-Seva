import "dotenv/config";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { readFileSync, existsSync } from "node:fs";
import { createApp } from "./app";
import { env } from "./env";
import { client } from "./db/client";

async function main() {
  // Fail fast if the database is unreachable.
  await client`SELECT 1`;
  console.log("[db] connected");

  const app = createApp();

  // Serve the built web app in production (single deploy, no CORS).
  if (existsSync("dist/web/index.html")) {
    const indexHtml = readFileSync("dist/web/index.html", "utf8");
    app.use("*", serveStatic({ root: "dist/web" }));
    // SPA fallback for client-side routes, but never swallow /api.
    app.get("*", (c) => {
      if (c.req.path.startsWith("/api/")) {
        return c.json(
          { error: { code: "NOT_FOUND", message: "Route not found" } },
          404
        );
      }
      return c.html(indexHtml);
    });
  }

  const server = serve({ fetch: app.fetch, port: env.PORT }, (info) => {
    console.log(`[api] listening on http://localhost:${info.port}`);
  });

  const shutdown = async () => {
    console.log("\n[api] shutting down…");
    server.close();
    await client.end();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("[api] failed to start:", err);
  process.exit(1);
});
