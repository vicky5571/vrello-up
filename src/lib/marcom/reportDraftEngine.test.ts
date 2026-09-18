import test from "node:test";
import assert from "node:assert/strict";
import {
  generateReportDraft,
  getMonthDateRange,
  type PlacementItemInput,
  type MouItemInput,
  type ContentPostItemInput,
  type FieldEventItemInput,
} from "@/lib/marcom/reportDraftEngine";

test("getMonthDateRange computes accurate UTC boundaries for given month and year", () => {
  const { start, end } = getMonthDateRange("September", 2026);
  assert.equal(start.getUTCFullYear(), 2026);
  assert.equal(start.getUTCMonth(), 8); // September is 8
  assert.equal(start.getUTCDate(), 1);

  assert.equal(end.getUTCFullYear(), 2026);
  assert.equal(end.getUTCMonth(), 8);
  assert.equal(end.getUTCDate(), 30);
});

test("generateReportDraft produces accurate summary metrics and draft narratives", () => {
  const mockPlacements: PlacementItemInput[] = [
    { id: "p1", status: "DONE", cost: 1500000, outlet: { name: "Toko Abadi" }, material: { name: "Neon Box" } },
    { id: "p2", status: "DONE", cost: 500000, outlet: { name: "Berkah Cell" }, material: { name: "Poster" } },
    { id: "p3", status: "ISSUE", cost: 0, outlet: { name: "Jaya Phone" }, material: { name: "Banner" } },
    { id: "p4", status: "NOT_STARTED", cost: 0 },
  ];

  const mockMous: MouItemInput[] = [
    { id: "m1", partnerName: "Mitra Global", status: "APPROVED", compensationValue: 5000000 },
    { id: "m2", partnerName: "Kantin Kampus", status: "DRAFT", compensationValue: 2000000 },
  ];

  const mockContents: ContentPostItemInput[] = [
    { id: "c1", title: "Promo Merdeka", status: "PUBLISHED", platform: "Instagram" },
    { id: "c2", title: "Tips Hemat Kuota", status: "DRAFT", platform: "TikTok" },
  ];

  const mockEvents: FieldEventItemInput[] = [
    { id: "e1", name: "Festival Musik", status: "COMPLETED", attendeeCount: 1200, budget: 15000000 },
    { id: "e2", name: "Campus Visit", status: "CANCELLED", attendeeCount: 0, budget: 5000000 },
  ];

  const draft = generateReportDraft({
    month: "September",
    year: 2026,
    placements: mockPlacements,
    mous: mockMous,
    contents: mockContents,
    events: mockEvents,
  });

  // Check totals
  // Total activities = 4 placements + 2 mous + 2 contents + 2 events = 10
  assert.equal(draft.summary.totalActivities, 10);

  // Completed activities = 2 DONE placements + 1 APPROVED mou + 1 PUBLISHED content + 1 COMPLETED event = 5
  assert.equal(draft.summary.completedActivities, 5);
  assert.equal(draft.summary.completionRate, 50);

  // Placements breakdown
  assert.equal(draft.summary.placementsTotal, 4);
  assert.equal(draft.summary.placementsDone, 2);
  assert.equal(draft.summary.placementTotalCost, 2000000);

  // MOUs breakdown
  assert.equal(draft.summary.mousTotal, 2);
  assert.equal(draft.summary.mousApproved, 1);
  assert.equal(draft.summary.mouTotalCompensation, 5000000);

  // Contents breakdown
  assert.equal(draft.summary.contentTotal, 2);
  assert.equal(draft.summary.contentPublished, 1);

  // Events breakdown
  assert.equal(draft.summary.eventsTotal, 2);
  assert.equal(draft.summary.eventsCompleted, 1);
  assert.equal(draft.summary.eventsTotalAttendees, 1200);

  // Check activities array
  assert.equal(draft.activities.length, 10);
  assert.equal(draft.activities[0].type, "PLACEMENT");

  // Check draft achievements
  assert.ok(draft.achievements.length >= 4);
  assert.ok(draft.achievements.some((a) => a.includes("POSM") && a.includes("2 dari 4")));
  assert.ok(draft.achievements.some((a) => a.includes("1.200 pengunjung")));

  // Check issue detection
  assert.ok(draft.keyIssues.some((k) => k.includes("ISSUE")));
  assert.ok(draft.keyIssues.some((k) => k.includes("CANCELLED")));

  // Check action plans
  assert.ok(draft.actionPlans.some((ap) => ap.includes("bermasalah")));
});

test("generateReportDraft handles empty period data gracefully without NaN", () => {
  const draft = generateReportDraft({
    month: "October",
    year: 2026,
    placements: [],
    mous: [],
    contents: [],
    events: [],
  });

  assert.equal(draft.summary.totalActivities, 0);
  assert.equal(draft.summary.completedActivities, 0);
  assert.equal(draft.summary.completionRate, 0);
  assert.equal(draft.activities.length, 0);
  assert.equal(draft.achievements.length, 1);
  assert.equal(draft.keyIssues.length, 1);
  assert.ok(draft.actionPlans.length > 0);
});
