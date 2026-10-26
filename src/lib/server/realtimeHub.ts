import { type User, type Task } from "@/types";

export interface PresenceEntry {
  user: User;
  lastSeen: number;
}

export type RealtimeEvent =
  | { type: "task:upsert"; data: Task }
  | { type: "task:delete"; data: { taskId: string } }
  | { type: "presence:sync"; data: Record<string, User[]> };

export type RealtimeListener = (event: RealtimeEvent) => void;

/**
 * Pluggable Broker interface.
 * Defaults to InMemoryBroker, but allows external adapters
 * (e.g. Redis Pub/Sub or Postgres LISTEN/NOTIFY) for multi-pod deployments.
 */
export interface RealtimeBroker {
  publish(channel: string, event: RealtimeEvent): Promise<void> | void;
  subscribe(channel: string, listener: RealtimeListener): () => void;
  disconnect?(): Promise<void> | void;
}

/**
 * Zero-dependency channel-scoped in-memory pub/sub broker.
 */
export class InMemoryBroker implements RealtimeBroker {
  private channels = new Map<string, Set<RealtimeListener>>();

  public publish(channel: string, event: RealtimeEvent): void {
    const directSubs = this.channels.get(channel);
    if (directSubs) {
      for (const listener of directSubs) {
        try {
          listener(event);
        } catch (err) {
          console.error(`[RealtimeBroker] Error delivering event on channel "${channel}":`, err);
        }
      }
    }

    if (channel !== "*") {
      const wildcardSubs = this.channels.get("*");
      if (wildcardSubs) {
        for (const listener of wildcardSubs) {
          try {
            listener(event);
          } catch (err) {
            console.error("[RealtimeBroker] Error delivering event on wildcard channel:", err);
          }
        }
      }
    }
  }

  public subscribe(channel: string, listener: RealtimeListener): () => void {
    let subs = this.channels.get(channel);
    if (!subs) {
      subs = new Set();
      this.channels.set(channel, subs);
    }
    subs.add(listener);

    return () => {
      const current = this.channels.get(channel);
      if (current) {
        current.delete(listener);
        if (current.size === 0) {
          this.channels.delete(channel);
        }
      }
    };
  }

  public getSubscriberCount(channel?: string): number {
    if (channel) {
      return this.channels.get(channel)?.size ?? 0;
    }
    let total = 0;
    for (const subs of this.channels.values()) {
      total += subs.size;
    }
    return total;
  }

  public clear(): void {
    this.channels.clear();
  }
}

export class RealtimeHub {
  private broker: RealtimeBroker;
  // taskId -> userId -> PresenceEntry
  private presence = new Map<string, Map<string, PresenceEntry>>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private legacyListeners = new Map<RealtimeListener, () => void>();

  constructor(broker?: RealtimeBroker) {
    this.broker = broker ?? new InMemoryBroker();
    this.startCleanupTimer();
  }


  public setBroker(broker: RealtimeBroker): void {
    this.broker = broker;
  }

  public getBroker(): RealtimeBroker {
    return this.broker;
  }

  private startCleanupTimer() {
    if (this.cleanupInterval) return;
    this.cleanupInterval = setInterval(() => {
      this.purgeExpiredPresences();
    }, 10_000);
    if (typeof this.cleanupInterval.unref === "function") {
      this.cleanupInterval.unref();
    }
  }

  public purgeExpiredPresences(): void {
    const now = Date.now();
    let changed = false;

    for (const [taskId, users] of this.presence.entries()) {
      for (const [userId, entry] of users.entries()) {
        if (now - entry.lastSeen > 25_000) {
          users.delete(userId);
          changed = true;
        }
      }
      if (users.size === 0) {
        this.presence.delete(taskId);
      }
    }

    if (changed) {
      this.broker.publish("*", {
        type: "presence:sync",
        data: this.getPresenceSnapshot(),
      });
    }
  }

  public getPresenceSnapshot(): Record<string, User[]> {
    const snapshot: Record<string, User[]> = {};
    for (const [taskId, users] of this.presence.entries()) {
      if (users.size > 0) {
        snapshot[taskId] = Array.from(users.values()).map((e) => e.user);
      }
    }
    return snapshot;
  }

  public updatePresence(
    userId: string,
    user: User,
    taskId: string | null,
  ): void {
    let changed = false;
    const now = Date.now();

    // Remove user from any other task they were viewing
    for (const [tId, users] of this.presence.entries()) {
      if (tId !== taskId && users.has(userId)) {
        users.delete(userId);
        if (users.size === 0) this.presence.delete(tId);
        changed = true;
      }
    }

    // Add or refresh user presence on active task
    if (taskId) {
      let users = this.presence.get(taskId);
      if (!users) {
        users = new Map();
        this.presence.set(taskId, users);
      }
      const existing = users.get(userId);
      if (!existing || existing.user.name !== user.name) {
        changed = true;
      }
      users.set(userId, { user, lastSeen: now });
    }

    if (changed) {
      this.broker.publish("*", {
        type: "presence:sync",
        data: this.getPresenceSnapshot(),
      });
    }
  }

  public broadcastTaskUpsert(task: Task): void {
    const event: RealtimeEvent = {
      type: "task:upsert",
      data: task,
    };
    this.broker.publish("*", event);
  }

  public broadcastTaskDelete(taskId: string): void {
    if (this.presence.has(taskId)) {
      this.presence.delete(taskId);
      this.broker.publish("*", {
        type: "presence:sync",
        data: this.getPresenceSnapshot(),
      });
    }

    const event: RealtimeEvent = {
      type: "task:delete",
      data: { taskId },
    };
    this.broker.publish("*", event);
  }

  public subscribe(channel: string, listener: RealtimeListener): () => void {
    return this.broker.subscribe(channel, listener);
  }

  public on(eventOrChannel: string, listener: RealtimeListener): this {
    const channel = eventOrChannel === "event" ? "*" : eventOrChannel;
    const unsub = this.broker.subscribe(channel, listener);
    this.legacyListeners.set(listener, unsub);
    return this;
  }

  public off(_eventOrChannel: string, listener: RealtimeListener): this {
    const unsub = this.legacyListeners.get(listener);
    if (unsub) {
      unsub();
      this.legacyListeners.delete(listener);
    }
    return this;
  }

  public emit(eventOrChannel: string, event: RealtimeEvent): boolean {
    const channel = eventOrChannel === "event" ? "*" : eventOrChannel;
    this.broker.publish(channel, event);
    return true;
  }

  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.presence.clear();
    this.legacyListeners.clear();
    if (this.broker.disconnect) {
      this.broker.disconnect();
    }
  }
}

// Preserve hub singleton in Next.js development hot-reloading
const globalForHub = globalThis as unknown as { realtimeHub?: RealtimeHub };
export const realtimeHub = globalForHub.realtimeHub ?? new RealtimeHub();
if (process.env.NODE_ENV !== "production") {
  globalForHub.realtimeHub = realtimeHub;
}
