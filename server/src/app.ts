import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import { onError } from "./middleware/error";
import { healthRoutes } from "./routes/health";
import { authRoutes } from "./routes/auth";
import { userRoutes } from "./routes/users";
import { adminRoutes } from "./routes/admin";
import { issuesRoutes, filesRoutes } from "./routes/issues";

export function createApp() {
  const app = new Hono();

  app.use(secureHeaders());
  app.onError(onError);

  app.notFound((c) =>
    c.json({ error: { code: "NOT_FOUND", message: "Route not found" } }, 404)
  );

  const api = new Hono();
  // Session and user data must never come from a cache — a stale
  // /api/users/me response after profile updates sends users in circles.
  api.use("*", async (c, next) => {
    await next();
    c.header("Cache-Control", "no-store");
  });
  api.route("/", healthRoutes);
  api.route("/auth", authRoutes);
  api.route("/users", userRoutes);
  api.route("/admin", adminRoutes);
  api.route("/issues", issuesRoutes);
  api.route("/files", filesRoutes);
  app.route("/api", api);

  return app;
}

export type App = ReturnType<typeof createApp>;
