import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import { errorMiddleware } from "./middleware/error";
import { healthRoutes } from "./routes/health";

export function createApp() {
  const app = new Hono();

  app.use(secureHeaders());
  app.use(errorMiddleware);

  app.notFound((c) =>
    c.json({ error: { code: "NOT_FOUND", message: "Route not found" } }, 404)
  );

  const api = new Hono();
  api.route("/", healthRoutes);
  app.route("/api", api);

  return app;
}

export type App = ReturnType<typeof createApp>;
