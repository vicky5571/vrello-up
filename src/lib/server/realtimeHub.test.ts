import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { realtimeHub, type RealtimeEvent } from "./realtimeHub.ts";
import type { Task, User } from "@/types";

test("RealtimeHub in-memory event bus and presence tracker", async (t) => {
  const dummyUser: User = {
    id: "user-presence-1",
    name: "Presence User",
    avatar: "/avatars/test.jpg",
    email: "presence@test.com",
    role: "staff",
  };

  const dummyTask: Task = {
    id: "task-realtime-1",
    listId: "list-1",
    title: "Realtime Broadcast Task",
    description: "Broadcast description",
    statusId: "status-todo",
    priority: "urgent",
    assignees: [dummyUser],
    subtasks: [],
    tags: [],
    attachments: [],
    comments: [],
    dependencies: [],
    orderIndex: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await t.test("emits task:upsert when broadcastTaskUpsert is called", () => {
    const received: { event?: Extract<RealtimeEvent, { type: "task:upsert" }> } = {};
    const listener = (event: RealtimeEvent) => {
      if (event.type === "task:upsert") {
        received.event = event;
      }
    };

    realtimeHub.on("event", listener);
    try {
      realtimeHub.broadcastTaskUpsert(dummyTask);
      assert.ok(received.event, "Expected task:upsert event to be received");
      assert.equal(received.event.data.id, dummyTask.id);
      assert.equal(received.event.data.title, dummyTask.title);
    } finally {
      realtimeHub.off("event", listener);
    }
  });

  await t.test("tracks presence and emits presence:sync on updatePresence", () => {
    const sync: { event?: Extract<RealtimeEvent, { type: "presence:sync" }> } = {};
    const listener = (event: RealtimeEvent) => {
      if (event.type === "presence:sync") {
        sync.event = event;
      }
    };

    realtimeHub.on("event", listener);
    try {
      // User opens task
      realtimeHub.updatePresence(dummyUser.id, dummyUser, dummyTask.id);
      assert.ok(sync.event, "Expected presence:sync event");
      const snapshot = realtimeHub.getPresenceSnapshot();
      assert.ok(snapshot[dummyTask.id]);
      assert.equal(snapshot[dummyTask.id][0].id, dummyUser.id);

      // User leaves task
      sync.event = undefined;
      realtimeHub.updatePresence(dummyUser.id, dummyUser, null);
      assert.ok(sync.event, "Expected presence:sync when user leaves task");
      const afterLeave = realtimeHub.getPresenceSnapshot();
      assert.equal(afterLeave[dummyTask.id], undefined);
    } finally {
      realtimeHub.off("event", listener);
    }
  });

  await t.test("emits task:delete and purges task presence when broadcastTaskDelete is called", () => {
    // Set presence first
    realtimeHub.updatePresence(dummyUser.id, dummyUser, dummyTask.id);

    const receivedEvents: RealtimeEvent[] = [];
    const listener = (event: RealtimeEvent) => {
      receivedEvents.push(event);
    };

    realtimeHub.on("event", listener);
    try {
      realtimeHub.broadcastTaskDelete(dummyTask.id);
      const deleteEvent = receivedEvents.find((e): e is Extract<RealtimeEvent, { type: "task:delete" }> => e.type === "task:delete");
      assert.ok(deleteEvent, "Expected task:delete event");
      assert.equal(deleteEvent.data.taskId, dummyTask.id);

      // Verify presence was purged
      const snapshot = realtimeHub.getPresenceSnapshot();
      assert.equal(snapshot[dummyTask.id], undefined);
    } finally {
      realtimeHub.off("event", listener);
    }
  });
});
