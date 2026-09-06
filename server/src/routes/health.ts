import { Hono } from "hono";

export const healthRoutes = new Hono()
  .get("/health", (c) =>
    c.json({
      status: "ok",
      service: "gramaseva-api",
      time: new Date().toISOString(),
    })
  );
