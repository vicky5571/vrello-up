import { EventEmitter } from "node:events";
import { type User, type Task } from "@/types";

export interface PresenceEntry {
  user: User;
  lastSeen: number;
}

export type RealtimeEvent =
  | { type: "task:upsert"; data: Task }
  | { type: "task:delete"; data: { taskId: string } }
  | { type: "presence:sync"; data: Record<string, User[]> };

class RealtimeHub extends EventEmitter {
  // Map of taskId -> Map of userId -> PresenceEntry
  private presenceMap = new Map<string, Map<string, PresenceEntry>>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.setMaxListeners(100);
    this.startCleanupTimer();
  }

  private startCleanupTimer() {
    if (this.cleanupInterval) return;
    this.cleanupInterval = setInterval(() => {
      this.purgeExpiredPresences();
    }, 10_000);
    // Don't keep the process alive in headless test runners
    if (typeof this.cleanupInterval.unref === "function") {
      this.cleanupInterval.unref();
    }
  }

  private purgeExpiredPresences() {
    const now = Date.now();
    let changed = false;

    for (const [taskId, users] of this.presenceMap.entries()) {
      for (const [userId, entry] of users.entries()) {
        if (now - entry.lastSeen > 25_000) {
          users.delete(userId);
          changed = true;
        }
      }
      if (users.size === 0) {
        this.presenceMap.delete(taskId);
      }
    }

    if (changed) {
      this.emit("event", {
        type: "presence:sync",
        data: this.getPresenceSnapshot(),
      } satisfies RealtimeEvent);
    }
  }

  public getPresenceSnapshot(): Record<string, User[]> {
    const snapshot: Record<string, User[]> = {};
    for (const [taskId, users] of this.presenceMap.entries()) {
      if (users.size > 0) {
        snapshot[taskId] = Array.from(users.values()).map((e) => e.user);
      }
    }
    return snapshot;
  }

  public updatePresence(userId: string, user: User, taskId: string | null) {
    let changed = false;
    const now = Date.now();

    // Remove user from any other task they were viewing
    for (const [tId, users] of this.presenceMap.entries()) {
      if (tId !== taskId && users.has(userId)) {
        users.delete(userId);
        if (users.size === 0) this.presenceMap.delete(tId);
        changed = true;
      }
    }

    // Add or refresh user presence on the active task
    if (taskId) {
      let users = this.presenceMap.get(taskId);
      if (!users) {
        users = new Map();
        this.presenceMap.set(taskId, users);
      }
      const existing = users.get(userId);
      if (!existing || existing.user.name !== user.name) {
        changed = true;
      }
      users.set(userId, { user, lastSeen: now });
    }

    if (changed) {
      this.emit("event", {
        type: "presence:sync",
        data: this.getPresenceSnapshot(),
      } satisfies RealtimeEvent);
    }
  }

  public broadcastTaskUpsert(task: Task) {
    this.emit("event", {
      type: "task:upsert",
      data: task,
    } satisfies RealtimeEvent);
  }

  public broadcastTaskDelete(taskId: string) {
    // Also remove presence on this task
    if (this.presenceMap.has(taskId)) {
      this.presenceMap.delete(taskId);
      this.emit("event", {
        type: "presence:sync",
        data: this.getPresenceSnapshot(),
      } satisfies RealtimeEvent);
    }

    this.emit("event", {
      type: "task:delete",
      data: { taskId },
    } satisfies RealtimeEvent);
  }
}

// Preserve hub singleton in Next.js development hot-reloading
const globalForHub = globalThis as unknown as { realtimeHub?: RealtimeHub };
export const realtimeHub = globalForHub.realtimeHub ?? new RealtimeHub();
if (process.env.NODE_ENV !== "production") {
  globalForHub.realtimeHub = realtimeHub;
}

