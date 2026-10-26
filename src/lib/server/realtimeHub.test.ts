import test from "node:test";
import assert from "node:assert/strict";
import {
  RealtimeHub,
  realtimeHub,
  InMemoryBroker,
  type RealtimeBroker,
  type RealtimeEvent,
} from "@/lib/server/realtimeHub";
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

  await t.test("isolates events by custom channel", () => {
    const broker = new InMemoryBroker();
    const chan1Events: RealtimeEvent[] = [];
    const chan2Events: RealtimeEvent[] = [];

    const unsubChan1 = broker.subscribe("channel:alpha", (e) => chan1Events.push(e));
    const unsubChan2 = broker.subscribe("channel:beta", (e) => chan2Events.push(e));

    try {
      broker.publish("channel:alpha", {
        type: "task:upsert",
        data: dummyTask,
      });

      assert.equal(chan1Events.length, 1, "alpha subscriber should receive event");
      assert.equal(chan2Events.length, 0, "beta subscriber must NOT receive alpha event");

      broker.publish("channel:beta", {
        type: "task:delete",
        data: { taskId: "task-deleted" },
      });

      assert.equal(chan1Events.length, 1, "alpha subscriber must not receive beta delete");
      assert.equal(chan2Events.length, 1, "beta subscriber should receive delete");
    } finally {
      unsubChan1();
      unsubChan2();
    }
  });

  await t.test("handles >150 concurrent subscribers with zero listener warnings and reclaims memory on unsubscribe", () => {
    const broker = new InMemoryBroker();
    const channel = "channel:load-test";
    const unsubs: Array<() => void> = [];
    let receivedCount = 0;

    // Connect 200 concurrent subscribers (exceeds old setMaxListeners(100) limit)
    for (let i = 0; i < 200; i++) {
      const unsub = broker.subscribe(channel, () => {
        receivedCount++;
      });
      unsubs.push(unsub);
    }

    assert.equal(broker.getSubscriberCount(channel), 200);

    // Publish event
    broker.publish(channel, {
      type: "task:delete",
      data: { taskId: "task-1" },
    });

    assert.equal(receivedCount, 200, "All 200 subscribers should receive event");

    // Unsubscribe all
    for (const unsub of unsubs) {
      unsub();
    }

    assert.equal(broker.getSubscriberCount(channel), 0, "Channel subscriber set should be empty");
    assert.equal(broker.getSubscriberCount(), 0, "Broker channels map should be completely purged");
  });

  await t.test("tracks presence across multiple tasks concurrently", () => {
    const hub = new RealtimeHub();
    try {
      const userAlpha: User = { ...dummyUser, id: "user-alpha", name: "User Alpha" };
      const userBeta: User = { ...dummyUser, id: "user-beta", name: "User Beta" };

      hub.updatePresence(userAlpha.id, userAlpha, "task-100");
      hub.updatePresence(userBeta.id, userBeta, "task-200");

      const snapshot = hub.getPresenceSnapshot();

      assert.equal(snapshot["task-100"]?.length, 1);
      assert.equal(snapshot["task-100"]?.[0].id, "user-alpha");

      assert.equal(snapshot["task-200"]?.length, 1);
      assert.equal(snapshot["task-200"]?.[0].id, "user-beta");
    } finally {
      hub.destroy();
    }
  });

  await t.test("supports pluggable custom RealtimeBroker adapters", () => {
    const customBrokerCalls: { channel: string; event: RealtimeEvent }[] = [];
    const customBroker: RealtimeBroker = {
      publish(channel, event) {
        customBrokerCalls.push({ channel, event });
      },
      subscribe() {
        return () => {};
      },
    };

    const hub = new RealtimeHub(customBroker);
    try {
      hub.broadcastTaskUpsert(dummyTask);
      assert.equal(customBrokerCalls.length, 1);
      assert.equal(customBrokerCalls[0].channel, "*");
      assert.equal(customBrokerCalls[0].event.type, "task:upsert");
    } finally {
      hub.destroy();
    }
  });
});
