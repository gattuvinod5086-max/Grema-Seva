import type { User, Jurisdiction } from "../db/schema";
import type { RealtimeEvent } from "../../../shared/types";

export type RealtimeSubscriber = {
  id: string;
  user: User;
  jurisdiction: Jurisdiction | null;
  send: (event: RealtimeEvent) => void | Promise<void>;
};

class RealtimeHub {
  private subscribers = new Map<string, RealtimeSubscriber>();

  subscribe(sub: RealtimeSubscriber) {
    this.subscribers.set(sub.id, sub);
    return () => {
      this.subscribers.delete(sub.id);
    };
  }

  getSubscriberCount(): number {
    return this.subscribers.size;
  }

  publish(eventPayload: Omit<RealtimeEvent, "timestamp">) {
    const event: RealtimeEvent = {
      ...eventPayload,
      timestamp: new Date().toISOString(),
    };

    for (const sub of this.subscribers.values()) {
      if (this.shouldReceive(sub, event)) {
        try {
          const res = sub.send(event);
          if (res instanceof Promise) {
            res.catch((err) => {
              console.error(`[realtime] send error for ${sub.id}:`, err);
            });
          }
        } catch (err) {
          console.error(`[realtime] sync send error for ${sub.id}:`, err);
        }
      }
    }
  }

  private shouldReceive(sub: RealtimeSubscriber, event: RealtimeEvent): boolean {
    const { user, jurisdiction } = sub;

    // Super Admin & Admin monitor all events statewide
    if (user.role === "super_admin" || user.role === "admin") {
      return true;
    }

    // Community News is public to all authenticated users
    if (event.type === "news") {
      return true;
    }

    // Direct reporter always receives events regarding their issue
    if (event.type === "issue" && event.reporterId && event.reporterId === user.id) {
      return true;
    }

    // Statewide notices (jurisdictionId is null) reach everyone
    if (event.type === "notice" && !event.jurisdictionId) {
      return true;
    }

    // Village/Jurisdiction-scoped notices and issues:
    // Only reach users matching the jurisdiction
    if (event.jurisdictionId) {
      return jurisdiction?.id === event.jurisdictionId;
    }

    return false;
  }
}

export const realtimeHub = new RealtimeHub();
