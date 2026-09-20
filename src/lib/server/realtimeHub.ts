import { type User, type Task } from "@/types";

export interface PresenceEntry {
  user: User;
  lastSeen: number;
}

export type RealtimeEvent =
  | { type: "task:upsert"; data: Task; workspaceId?: string }
  | { type: "task:delete"; data: { taskId: string }; workspaceId?: string }
  | { type: "presence:sync"; data: Record<string, User[]>; workspaceId?: string };

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
 * Zero-dependency, channel-scoped in-memory pub/sub broker.
 * Replaces monolithic Node EventEmitter, eliminating arbitrary listener caps (setMaxListeners)
 * and memory leak warnings.
 */
export class InMemoryBroker implements RealtimeBroker {
  private channels = new Map<string, Set<RealtimeListener>>();

  public publish(channel: string, event: RealtimeEvent): void {
    // Deliver to direct channel subscribers
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

    // Also deliver to wildcard subscribers ("*") if this wasn't already the wildcard channel
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
  // workspaceId -> taskId -> userId -> PresenceEntry
  private workspacePresence = new Map<string, Map<string, Map<string, PresenceEntry>>>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private legacyListeners = new Map<RealtimeListener, () => void>();

  constructor(broker?: RealtimeBroker) {
    this.broker = broker ?? new InMemoryBroker();
    this.startCleanupTimer();
  }

  public static getWorkspaceChannel(workspaceId?: string): string {
    return workspaceId ? `workspace:${workspaceId}` : "*";
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
    // Don't keep the process alive in headless test runners
    if (typeof this.cleanupInterval.unref === "function") {
      this.cleanupInterval.unref();
    }
  }

  public purgeExpiredPresences(): void {
    const now = Date.now();

    for (const [workspaceId, tasksMap] of this.workspacePresence.entries()) {
      let workspaceChanged = false;

      for (const [taskId, users] of tasksMap.entries()) {
        for (const [userId, entry] of users.entries()) {
          if (now - entry.lastSeen > 25_000) {
            users.delete(userId);
            workspaceChanged = true;
          }
        }
        if (users.size === 0) {
          tasksMap.delete(taskId);
        }
      }

      if (tasksMap.size === 0) {
        this.workspacePresence.delete(workspaceId);
      }

      if (workspaceChanged) {
        const channel = RealtimeHub.getWorkspaceChannel(workspaceId);
        this.broker.publish(channel, {
          type: "presence:sync",
          workspaceId,
          data: this.getPresenceSnapshot(workspaceId),
        });
      }
    }
  }

  public getPresenceSnapshot(workspaceId: string = "default"): Record<string, User[]> {
    const tasksMap = this.workspacePresence.get(workspaceId);
    if (!tasksMap) return {};

    const snapshot: Record<string, User[]> = {};
    for (const [taskId, users] of tasksMap.entries()) {
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
    workspaceId: string = "default",
  ): void {
    let changed = false;
    const now = Date.now();

    let tasksMap = this.workspacePresence.get(workspaceId);
    if (!tasksMap) {
      tasksMap = new Map();
      this.workspacePresence.set(workspaceId, tasksMap);
    }

    // Remove user from any other task they were viewing in this workspace
    for (const [tId, users] of tasksMap.entries()) {
      if (tId !== taskId && users.has(userId)) {
        users.delete(userId);
        if (users.size === 0) tasksMap.delete(tId);
        changed = true;
      }
    }

    // Add or refresh user presence on active task
    if (taskId) {
      let users = tasksMap.get(taskId);
      if (!users) {
        users = new Map();
        tasksMap.set(taskId, users);
      }
      const existing = users.get(userId);
      if (!existing || existing.user.name !== user.name) {
        changed = true;
      }
      users.set(userId, { user, lastSeen: now });
    }

    if (changed) {
      const channel = RealtimeHub.getWorkspaceChannel(workspaceId);
      this.broker.publish(channel, {
        type: "presence:sync",
        workspaceId,
        data: this.getPresenceSnapshot(workspaceId),
      });
    }
  }

  public broadcastTaskUpsert(task: Task, workspaceId?: string): void {
    const event: RealtimeEvent = {
      type: "task:upsert",
      workspaceId,
      data: task,
    };
    const channel = RealtimeHub.getWorkspaceChannel(workspaceId);
    this.broker.publish(channel, event);
  }

  public broadcastTaskDelete(taskId: string, workspaceId?: string): void {
    // Purge presence on deleted task
    if (workspaceId) {
      const tasksMap = this.workspacePresence.get(workspaceId);
      if (tasksMap?.has(taskId)) {
        tasksMap.delete(taskId);
        this.broker.publish(RealtimeHub.getWorkspaceChannel(workspaceId), {
          type: "presence:sync",
          workspaceId,
          data: this.getPresenceSnapshot(workspaceId),
        });
      }
    } else {
      // Purge across all workspaces if workspaceId not specified
      for (const [wsId, tasksMap] of this.workspacePresence.entries()) {
        if (tasksMap.has(taskId)) {
          tasksMap.delete(taskId);
          this.broker.publish(RealtimeHub.getWorkspaceChannel(wsId), {
            type: "presence:sync",
            workspaceId: wsId,
            data: this.getPresenceSnapshot(wsId),
          });
        }
      }
    }

    const event: RealtimeEvent = {
      type: "task:delete",
      workspaceId,
      data: { taskId },
    };
    const channel = RealtimeHub.getWorkspaceChannel(workspaceId);
    this.broker.publish(channel, event);
  }

  /**
   * Subscribe to a specific workspace channel or wildcard ("*").
   * Returns a cleanup function that automatically unbinds the listener.
   */
  public subscribe(channel: string, listener: RealtimeListener): () => void {
    return this.broker.subscribe(channel, listener);
  }

  /**
   * Legacy EventEmitter compatibility layer (.on / .off / .emit)
   * Ensures 100% backward-compatibility with existing tests and scripts.
   */
  public on(eventOrChannel: string, listener: RealtimeListener): this {
    // If listening to "event", bind to wildcard "*"
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
    this.workspacePresence.clear();
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
