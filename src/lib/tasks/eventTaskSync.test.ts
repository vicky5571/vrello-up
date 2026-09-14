import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node strip-types requires explicit .ts extension
import { getEventChecklistTemplate, findMemberForPic, buildEventTaskPayload, buildEventDescription } from "./eventTaskSync.ts";
import type { User, Subtask } from "@/types";

const mockMembers: User[] = [
  {
    id: "user-1",
    name: "Budi Hartono",
    email: "budi@vrello.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=budi",
  },
  {
    id: "user-2",
    name: "Siti Rahma",
    email: "siti@vrello.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=siti",
  },
];

test("getEventChecklistTemplate returns contextual subtasks for event types", () => {
  const roadshowTasks = getEventChecklistTemplate("Roadshow");
  assert.ok(roadshowTasks.length >= 4);
  assert.ok(roadshowTasks.some((t) => t.toLowerCase().includes("sound system")));

  const launchTasks = getEventChecklistTemplate("Launch");
  assert.ok(launchTasks.some((t) => t.toLowerCase().includes("media") || t.toLowerCase().includes("vip")));

  const unknownTasks = getEventChecklistTemplate("CustomEvent");
  assert.ok(unknownTasks.length >= 3);
});

test("findMemberForPic finds user by ID, exact name, or partial match", () => {
  const byId = findMemberForPic(mockMembers, "user-1");
  assert.equal(byId?.id, "user-1");

  const byName = findMemberForPic(mockMembers, "Budi Hartono");
  assert.equal(byName?.id, "user-1");

  const caseInsensitive = findMemberForPic(mockMembers, "siti rahma");
  assert.equal(caseInsensitive?.id, "user-2");

  const byEmail = findMemberForPic(mockMembers, "siti@vrello.com");
  assert.equal(byEmail?.id, "user-2");

  const notFound = findMemberForPic(mockMembers, "NonExistent User");
  assert.equal(notFound, undefined);
});

test("buildEventDescription formats rich details including budget and target attendees", () => {
  const desc = buildEventDescription({
    location: "Mall Kota Kasablanka",
    branchName: "Jakarta South",
    eventType: "Roadshow",
    budget: 15000000,
    targetAttendee: 500,
    notes: "Need 4 wireless mics and 5500W electricity",
  });

  assert.ok(desc.includes("Mall Kota Kasablanka"));
  assert.ok(desc.includes("Jakarta South"));
  assert.ok(desc.includes("Roadshow"));
  assert.ok(desc.includes("500"));
  assert.ok(desc.includes("5500W electricity"));
});

test("buildEventTaskPayload correctly constructs Task creation payload with PIC assignee and subtasks", () => {
  const subtasks: Subtask[] = [
    {
      id: "sub-1",
      title: "Sewa sound system",
      completed: false,
      createdAt: "2026-09-14T00:00:00.000Z",
    },
    {
      id: "sub-2",
      title: "Cetak backdrop 6x3m",
      completed: true,
      createdAt: "2026-09-14T00:00:00.000Z",
    },
  ];

  const payload = buildEventTaskPayload({
    event: {
      id: "event-123",
      name: "Grand Launching Flagship Store",
      eventType: "Launch",
      branchName: "Surabaya Central",
      location: "Tunjungan Plaza 6",
      date: "2026-10-01",
      endDate: "2026-10-03",
      picName: "Budi Hartono",
      status: "UPCOMING",
      budget: 25000000,
      targetAttendee: 300,
      attendeeCount: 0,
      notes: "VIP guests confirm via RSVP",
    },
    listId: "list-field-ops",
    statusId: "status-todo",
    members: mockMembers,
    picIdOrName: "user-1",
    subtasks,
  });

  assert.equal(payload.title, "[Field Event] Grand Launching Flagship Store");
  assert.equal(payload.listId, "list-field-ops");
  assert.equal(payload.statusId, "status-todo");
  assert.equal(payload.relatedMarcomId, "event-123");
  assert.equal(payload.priority, "high");
  assert.equal(payload.dueDate, "2026-10-01");
  assert.equal(payload.assignees.length, 1);
  assert.equal(payload.assignees[0].id, "user-1");
  assert.equal(payload.subtasks.length, 2);
  assert.equal(payload.subtasks[0].title, "Sewa sound system");
});
