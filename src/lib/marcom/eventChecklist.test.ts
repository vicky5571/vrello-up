import test from "node:test";
import assert from "node:assert/strict";
import {
  getEventChecklistTemplate,
  findMemberForPic,
  formatEventDateRange,
  detectEventConflicts,
  calculateFieldEventsKPI,
  calculateTimelineBarMetrics,
} from "./eventChecklist";
import type { User } from "@/types";

const mockMembers: User[] = [
  { id: "user-1", name: "Budi Hartono", email: "budi@vrello.com", avatar: "" },
  { id: "user-2", name: "Siti Rahma", email: "siti@vrello.com", avatar: "" },
];

test("getEventChecklistTemplate returns contextual subtasks for event types", () => {
  const roadshowTasks = getEventChecklistTemplate("Roadshow");
  assert.ok(roadshowTasks.length > 0);
  assert.match(roadshowTasks[0], /Van|Route|Flyering/i);

  const launchTasks = getEventChecklistTemplate("Launch");
  assert.match(launchTasks[0], /Press release|Product unveil/i);

  const unknownTasks = getEventChecklistTemplate("CustomEvent");
  assert.equal(unknownTasks.length, 6); // default list
});

test("findMemberForPic finds user by ID, exact name, or partial match", () => {
  const byId = findMemberForPic(mockMembers, "user-1");
  assert.equal(byId?.name, "Budi Hartono");

  const byName = findMemberForPic(mockMembers, "Budi Hartono");
  assert.equal(byName?.id, "user-1");

  const caseInsensitive = findMemberForPic(mockMembers, "siti rahma");
  assert.equal(caseInsensitive?.id, "user-2");

  const byEmail = findMemberForPic(mockMembers, "siti@vrello.com");
  assert.equal(byEmail?.id, "user-2");

  const notFound = findMemberForPic(mockMembers, "NonExistent User");
  assert.equal(notFound, undefined);
});

test("formatEventDateRange handles single-day, multi-day, and TBD dates with accurate duration", () => {
  const singleDay = formatEventDateRange("2026-10-10", "2026-10-10");
  assert.equal(singleDay.durationDays, 1);
  assert.equal(singleDay.isMultiDay, false);

  const multiDay = formatEventDateRange("2026-10-10", "2026-10-15");
  assert.equal(multiDay.durationDays, 6);
  assert.equal(multiDay.isMultiDay, true);

  const tbd = formatEventDateRange(null, null);
  assert.equal(tbd.formatted, "TBD");
  assert.equal(tbd.durationDays, 0);
});

test("detectEventConflicts flags overlapping dates in the same branch and across branches", () => {
  const events = [
    {
      id: "ev-1",
      name: "Roadshow Central",
      branchName: "Semarang",
      startDate: "2026-10-10",
      endDate: "2026-10-12",
      status: "UPCOMING",
    },
    {
      id: "ev-2",
      name: "Promo Booth",
      branchName: "Semarang",
      startDate: "2026-10-11",
      endDate: "2026-10-13",
      status: "UPCOMING",
    },
    {
      id: "ev-3",
      name: "Solo Activation",
      branchName: "Solo",
      startDate: "2026-10-10",
      endDate: "2026-10-10",
      status: "UPCOMING",
    },
  ];

  const conflicts = detectEventConflicts(events);
  assert.ok(conflicts.has("ev-1"));
  assert.equal(conflicts.get("ev-1")?.hasSameBranchConflict, true);
  assert.equal(conflicts.get("ev-1")?.sameBranchCount, 1);
});

test("calculateFieldEventsKPI strictly excludes CANCELLED events from committed budget and target footfall", () => {
  const events = [
    { status: "COMPLETED", budget: 1000000, targetAttendee: 100, attendeeCount: 120 },
    { status: "UPCOMING", budget: 2000000, targetAttendee: 200, attendeeCount: 0 },
    { status: "CANCELLED", budget: 5000000, targetAttendee: 500, attendeeCount: 0 },
  ];

  const kpis = calculateFieldEventsKPI(events, 2);
  assert.equal(kpis.totalActivations, 3);
  assert.equal(kpis.completedCount, 1);
  assert.equal(kpis.activeCount, 1);
  assert.equal(kpis.cancelledCount, 1);
  assert.equal(kpis.totalCommittedBudget, 3000000);
  assert.equal(kpis.cancelledBudget, 5000000);
  assert.equal(kpis.totalTargetAttendees, 300);
  assert.equal(kpis.totalActualAttendees, 120);
});

test("calculateTimelineBarMetrics accurately clamps events", () => {
  const windowStart = new Date("2026-10-01T00:00:00");
  const windowEnd = new Date("2026-10-31T00:00:00");

  const metrics = calculateTimelineBarMetrics({
    startDate: "2026-10-10",
    endDate: "2026-10-15",
    windowStart,
    windowEnd,
    colWidth: 40,
  });

  assert.equal(metrics.isVisible, true);
  assert.equal(metrics.totalDurationDays, 6);
  assert.equal(metrics.visibleDays, 6);
});

