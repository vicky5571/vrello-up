import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { countUnread, deriveMouNotifications, deriveTaskNotifications } from "./notifications.ts";
import type { Task } from "../../types/index.ts";

const NOW = new Date("2026-09-07T12:00:00.000Z");

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: "t1",
    listId: "l1",
    title: "Fix login",
    description: "",
    statusId: "status-todo",
    priority: "high",
    assignees: [{ id: "user-1", name: "Alex", email: "a@x.dev", avatar: "" }],
    tags: [],
    subtasks: [],
    orderIndex: 0,
    createdAt: "2026-09-06T00:00:00.000Z",
    updatedAt: "2026-09-06T10:00:00.000Z",
    ...overrides,
  };
}

test("derives overdue, assignment, and status-transition notifications", () => {
  const notifs = deriveTaskNotifications(
    [
      task({
        id: "overdue-1",
        title: "Late task",
        dueDate: "2026-09-01",
        activities: [],
      }),
      task({
        id: "moved-1",
        title: "Moved task",
        dueDate: "2026-09-20",
        activities: [
          {
            id: "act-1",
            taskId: "moved-1",
            userId: "user-1",
            userName: "Alex",
            action: "moved task to IN REVIEW",
            createdAt: "2026-09-06T11:00:00.000Z",
          },
        ],
      }),
    ],
    { currentUserId: "user-1", now: NOW },
  );
  const kinds = notifs.map((n) => n.kind).sort();
  assert.ok(kinds.includes("overdue"));
  assert.ok(kinds.includes("assignment"));
  assert.ok(kinds.includes("status"));
});

test("closed statuses suppress overdue and assignment signals", () => {
  const notifs = deriveTaskNotifications(
    [task({ dueDate: "2026-09-01", statusId: "status-done" })],
    { currentUserId: "user-1", doneStatusIds: ["status-done"], now: NOW },
  );
  assert.deepEqual(notifs, []);
});

test("MOU approvals surface only SUBMITTED rows", () => {
  const notifs = deriveMouNotifications([
    { id: "m1", partnerName: "Acme", status: "SUBMITTED" },
    { id: "m2", partnerName: "Globex", status: "APPROVED" },
  ]);
  assert.equal(notifs.length, 1);
  assert.equal(notifs[0].kind, "mou_approval");
  assert.match(notifs[0].title, /Acme/);
});

test("countUnread respects the last-seen timestamp", () => {
  const notifs = deriveMouNotifications([
    { id: "m1", partnerName: "Acme", status: "SUBMITTED" },
  ]);
  assert.equal(countUnread(notifs, null), notifs.length);
  assert.equal(countUnread(notifs, new Date().toISOString()), 0);
});

test("MOU expiry watchdog triggers for expiring (<30d) and expired MOUs", () => {
  const now = new Date("2026-09-19T00:00:00Z");
  const notifs = deriveMouNotifications(
    [
      { id: "m1", partnerName: "Acme", status: "APPROVED", endDate: "2026-09-29T00:00:00Z" },
      { id: "m2", partnerName: "Old Corp", status: "APPROVED", endDate: "2026-08-01T00:00:00Z" },
      { id: "m3", partnerName: "Far Corp", status: "APPROVED", endDate: "2026-12-31T00:00:00Z" },
      { id: "m4", partnerName: "Draft Corp", status: "DRAFT", endDate: "2026-09-25T00:00:00Z" },
    ],
    now,
  );

  assert.equal(notifs.length, 2);
  const expiring = notifs.find((n) => n.id === "mou-exp-m1");
  const expired = notifs.find((n) => n.id === "mou-exp-m2");

  assert.ok(expiring);
  assert.equal(expiring.kind, "mou_expiry");
  assert.match(expiring.title, /Expiring Soon/);

  assert.ok(expired);
  assert.equal(expired.kind, "mou_expiry");
  assert.match(expired.title, /Expired/);
});

