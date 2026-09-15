import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node strip-types requires explicit .ts extension
import {
  getEventChecklistTemplate,
  findMemberForPic,
  buildEventTaskPayload,
  buildEventDescription,
  mapEventStatusToTaskStatusId,
  mapTaskCategoryToEventStatus,
  formatEventDateRange,
  detectEventConflicts,
} from "./eventTaskSync.ts";
import type { User, Subtask, Status } from "@/types";

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

const mockStatuses: Status[] = [
  { id: "st-todo", name: "To Do", color: "#64748b", category: "open", order: 0 },
  { id: "st-progress", name: "In Progress", color: "#3b82f6", category: "in_progress", order: 1 },
  { id: "st-done", name: "Completed", color: "#10b981", category: "done", order: 2 },
  { id: "st-closed", name: "Cancelled / Closed", color: "#ef4444", category: "closed", order: 3 },
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

test("buildEventTaskPayload seamlessly handles FieldEventItem with startDate", () => {
  const payload = buildEventTaskPayload({
    event: {
      id: "fe-888",
      name: "Bandung Expo 2026",
      eventType: "Exhibition",
      branchName: "Bandung Dago",
      location: "Trans Studio Mall",
      startDate: "2026-11-15T09:00:00.000Z",
      picName: "Siti Rahma",
    },
    listId: "list-events",
    statusId: "status-in-progress",
    members: mockMembers,
    subtasks: [],
  });

  assert.equal(payload.title, "[Field Event] Bandung Expo 2026");
  assert.equal(payload.dueDate, "2026-11-15");
  assert.equal(payload.assignees[0].name, "Siti Rahma");
  assert.equal(payload.relatedMarcomId, "fe-888");
});

test("mapEventStatusToTaskStatusId accurately maps statuses bidirectionally", () => {
  assert.equal(mapEventStatusToTaskStatusId("UPCOMING", mockStatuses), "st-todo");
  assert.equal(mapEventStatusToTaskStatusId("ON_PROGRESS", mockStatuses), "st-progress");
  assert.equal(mapEventStatusToTaskStatusId("COMPLETED", mockStatuses), "st-done");
  assert.equal(mapEventStatusToTaskStatusId("CANCELLED", mockStatuses), "st-closed");

  // Reverse mapping
  assert.equal(mapTaskCategoryToEventStatus("open"), "UPCOMING");
  assert.equal(mapTaskCategoryToEventStatus("in_progress"), "ON_PROGRESS");
  assert.equal(mapTaskCategoryToEventStatus("review"), "ON_PROGRESS");
  assert.equal(mapTaskCategoryToEventStatus("done"), "COMPLETED");
  assert.equal(mapTaskCategoryToEventStatus("closed"), "COMPLETED");
});

test("formatEventDateRange handles single-day, multi-day, and TBD dates with accurate duration", () => {
  const singleDay = formatEventDateRange("2026-10-10", "2026-10-10");
  assert.equal(singleDay.durationDays, 1);
  assert.equal(singleDay.isMultiDay, false);

  const multiDay = formatEventDateRange("2026-10-10", "2026-10-15");
  assert.equal(multiDay.durationDays, 6);
  assert.equal(multiDay.isMultiDay, true);
  assert.ok(multiDay.formatted.includes("–"));

  const tbd = formatEventDateRange(null, null);
  assert.equal(tbd.formatted, "TBD");
  assert.equal(tbd.durationDays, 0);
  assert.equal(tbd.isMultiDay, false);
});

test("detectEventConflicts flags overlapping dates in the same branch and across branches", () => {
  const events = [
    {
      id: "ev-1",
      name: "Surabaya Mall Roadshow",
      branchName: "Surabaya West",
      date: "2026-10-10",
      endDate: "2026-10-14",
      status: "UPCOMING",
    },
    {
      id: "ev-2",
      name: "Surabaya Pop-up Booth",
      branchName: "Surabaya West", // same branch
      date: "2026-10-12", // overlapping!
      endDate: "2026-10-16",
      status: "UPCOMING",
    },
    {
      id: "ev-3",
      name: "Jakarta Store Launch",
      branchName: "Jakarta Central", // different branch
      date: "2026-10-12",
      endDate: "2026-10-14",
      status: "UPCOMING",
    },
    {
      id: "ev-4",
      name: "Surabaya Cancelled Roadshow",
      branchName: "Surabaya West",
      date: "2026-10-11",
      endDate: "2026-10-13",
      status: "CANCELLED", // cancelled should NOT cause conflict!
    },
  ];

  const conflicts = detectEventConflicts(events);

  // ev-1: same branch conflict with ev-2, cross-branch with ev-3
  assert.equal(conflicts.has("ev-1"), true);
  assert.equal(conflicts.get("ev-1")?.hasSameBranchConflict, true);
  assert.equal(conflicts.get("ev-1")?.hasCrossBranchConflict, true);
  assert.equal(conflicts.get("ev-1")?.sameBranchCount, 1);
  assert.equal(conflicts.get("ev-1")?.crossBranchCount, 1);

  // ev-2: same branch conflict with ev-1, cross-branch with ev-3
  assert.equal(conflicts.has("ev-2"), true);
  assert.equal(conflicts.get("ev-2")?.hasSameBranchConflict, true);
  assert.equal(conflicts.get("ev-2")?.hasCrossBranchConflict, true);

  // ev-3: cross-branch conflict with ev-1 and ev-2, but NO same-branch conflict
  assert.equal(conflicts.has("ev-3"), true);
  assert.equal(conflicts.get("ev-3")?.hasSameBranchConflict, false);
  assert.equal(conflicts.get("ev-3")?.hasCrossBranchConflict, true);
  assert.equal(conflicts.get("ev-3")?.crossBranchCount, 2);

  // Cancelled event ignored
  assert.equal(conflicts.has("ev-4"), false);

  assert.ok(conflicts.get("ev-1")?.conflictingEventIds.includes("ev-2"));
  assert.ok(conflicts.get("ev-2")?.conflictingEventIds.includes("ev-1"));
  assert.ok(conflicts.get("ev-3")?.conflictingEventIds.includes("ev-1"));
});

