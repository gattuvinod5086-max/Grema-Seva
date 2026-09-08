import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { randomUUID } from "node:crypto";
import { requireAuth, getAuth } from "../middleware/auth";
import { realtimeHub, type RealtimeSubscriber } from "../services/realtime";
import type { RealtimeEvent } from "../../../shared/types";

export const realtimeRoutes = new Hono()
  .use("*", requireAuth)
  .get("/", async (c) => {
    const { user, jurisdiction } = getAuth(c);
    const subId = randomUUID();

    return streamSSE(c, async (stream) => {
      // 1. Initial connection acknowledgement
      await stream.writeSSE({
        event: "connected",
        data: JSON.stringify({
          userId: user.id,
          role: user.role,
          jurisdiction: jurisdiction ? { id: jurisdiction.id, village: jurisdiction.village } : null,
          connectedAt: new Date().toISOString(),
        }),
      });

      // 2. Heartbeat to prevent proxies from timing out
      const heartbeatInterval = setInterval(async () => {
        try {
          await stream.writeSSE({
            event: "ping",
            data: "heartbeat",
          });
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 25000);

      // 3. Register subscriber with realtimeHub
      const subscriber: RealtimeSubscriber = {
        id: subId,
        user,
        jurisdiction,
        send: async (event: RealtimeEvent) => {
          await stream.writeSSE({
            event: "change",
            data: JSON.stringify(event),
          });
        },
      };

      const unsubscribe = realtimeHub.subscribe(subscriber);

      // 4. Clean up when client disconnects
      await new Promise<void>((resolve) => {
        stream.onAbort(() => {
          clearInterval(heartbeatInterval);
          unsubscribe();
          resolve();
        });
      });
    });
  });
