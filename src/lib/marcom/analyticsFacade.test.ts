import test from "node:test";
import assert from "node:assert/strict";
import {
  safeDiv,
  calculateCostPerOutlet,
  calculatePlacementProgress,
  calculateMouFunnel,
  calculateContentAging,
  calculateEventEfficiencySafe,
  calculateActionableMarcomMetrics,
} from "@/lib/marcom/analyticsFacade";

test("safeDiv guards against zero, negative, NaN, and infinity denominators", () => {
  assert.equal(safeDiv(100, 2), 50);
  assert.equal(safeDiv(100, 0), 0);
  assert.equal(safeDiv(100, -5), 0);
  assert.equal(safeDiv(100, Number.NaN), 0);
  assert.equal(safeDiv(Number.NaN, 5), 0);
  assert.equal(safeDiv(100, Number.POSITIVE_INFINITY), 0);
  assert.equal(safeDiv(10, 3, 2), 3.33);
});

test("calculateActionableMarcomMetrics handles completely empty inputs safely", () => {
  const metrics = calculateActionableMarcomMetrics({});

  assert.deepEqual(metrics.costPerOutlet, {
    totalActiveOutlets: 0,
    totalPlacementCost: 0,
    totalMouInvestment: 0,
    totalCost: 0,
    avgCostPerOutlet: 0,
    avgPlacementCostPerOutlet: 0,
    avgMouInvestmentPerOutlet: 0,
  });

  assert.deepEqual(metrics.placementProgress, {
    total: 0,
    done: 0,
    inProgress: 0,
    issue: 0,
    notStarted: 0,
    pendingCount: 0,
    donePercentage: 0,
    issuePercentage: 0,
    totalCost: 0,
  });

  assert.deepEqual(metrics.mouFunnel, {
    total: 0,
    draft: 0,
    submitted: 0,
    approved: 0,
    done: 0,
    rejected: 0,
    conversionRate: 0,
    approvalRate: 0,
    dropoffStage: "NONE",
  });

  assert.deepEqual(metrics.contentAging, {
    totalInReview: 0,
    avgDaysInReview: 0,
    maxDaysInReview: 0,
    criticalAgingCount: 0,
  });

  assert.deepEqual(metrics.eventEfficiency, {
    totalEvents: 0,
    totalBudget: 0,
    totalAttendees: 0,
    totalTargetAttendees: 0,
    costPerAttendee: 0,
    attendanceRate: 0,
  });
});

test("calculateCostPerOutlet correctly combines placement and MoU financials across active outlets", () => {
  const outlets = [
    { id: "o1", active: true },
    { id: "o2", active: true },
    { id: "o3", active: false }, // Inactive outlet excluded from denominator
  ];
  const placements = [
    { cost: 1_000_000 },
    { cost: 500_000 },
    { cost: -200_000 }, // Invalid negative cost ignored
  ];
  const mous = [
    { compensationValue: 4_500_000 },
    { compensationValue: null },
  ];

  const result = calculateCostPerOutlet(outlets, placements, mous);
  assert.equal(result.totalActiveOutlets, 2);
  assert.equal(result.totalPlacementCost, 1_500_000);
  assert.equal(result.totalMouInvestment, 4_500_000);
  assert.equal(result.totalCost, 6_000_000);
  assert.equal(result.avgCostPerOutlet, 3_000_000); // 6M / 2
  assert.equal(result.avgPlacementCostPerOutlet, 750_000);
  assert.equal(result.avgMouInvestmentPerOutlet, 2_250_000);
});

test("calculatePlacementProgress isolates ISSUE from notStarted and calculates rates", () => {
  const placements = [
    { status: "DONE", cost: 1_000_000 },
    { status: "DONE", cost: 500_000 },
    { status: "ON_PROGRESS", cost: 300_000 },
    { status: "ISSUE", cost: 200_000 },
    { status: "NOT_STARTED", cost: 100_000 },
  ];

  const result = calculatePlacementProgress(placements);
  assert.equal(result.total, 5);
  assert.equal(result.done, 2);
  assert.equal(result.inProgress, 1);
  assert.equal(result.issue, 1, "ISSUE status must be tracked separately");
  assert.equal(result.notStarted, 1, "notStarted must not include ISSUE");
  assert.equal(result.donePercentage, 40); // 2/5 = 40%
  assert.equal(result.issuePercentage, 20); // 1/5 = 20%
  assert.equal(result.totalCost, 2_100_000);
});

test("calculateMouFunnel computes conversion rates and detects bottleneck dropoff stage", () => {
  const mous = [
    { status: "DRAFT" },
    { status: "SUBMITTED" },
    { status: "SUBMITTED" },
    { status: "SUBMITTED" },
    { status: "APPROVED" },
    { status: "DONE" },
  ];

  const result = calculateMouFunnel(mous);
  assert.equal(result.total, 6);
  assert.equal(result.draft, 1);
  assert.equal(result.submitted, 3);
  assert.equal(result.approved, 1);
  assert.equal(result.done, 1);
  // 1 done out of 6 total = 17%
  assert.equal(result.conversionRate, 17);
  // 2 approved/done out of 5 submitted/approved/done = 40%
  assert.equal(result.approvalRate, 40);
  // Dropoff is at SUBMITTED (3 submitted vs 2 approved+done)
  assert.equal(result.dropoffStage, "SUBMITTED");
});

test("calculateContentAging measures average review days and flags critical over-SLA (>2d) items", () => {
  const now = new Date("2026-09-19T10:00:00Z");
  const contents = [
    { status: "PUBLISHED", createdAt: "2026-09-01T10:00:00Z" }, // Published ignored
    { status: "IN_REVIEW", createdAt: "2026-09-18T10:00:00Z" }, // 1 day ago (safe)
    { status: "IN_REVIEW", createdAt: "2026-09-15T10:00:00Z" }, // 4 days ago (critical > 2)
    { status: "REVISION", createdAt: "2026-09-16T10:00:00Z" },  // 3 days ago (critical > 2)
  ];

  const result = calculateContentAging(contents, now);
  assert.equal(result.totalInReview, 3);
  // Days: 1, 4, 3 -> sum = 8, avg = 8/3 = 2.7
  assert.equal(result.avgDaysInReview, 2.7);
  assert.equal(result.maxDaysInReview, 4);
  assert.equal(result.criticalAgingCount, 2);
});

test("calculateEventEfficiencySafe guards division by zero when attendee count is 0 or missing", () => {
  const events = [
    { budget: 10_000_000, attendeeCount: 0, targetAttendee: 100 },
    { budget: 5_000_000, attendeeCount: null, targetAttendee: null },
  ];

  const result = calculateEventEfficiencySafe(events);
  assert.equal(result.totalEvents, 2);
  assert.equal(result.totalBudget, 15_000_000);
  assert.equal(result.totalAttendees, 0);
  // Must return 0 instead of NaN or Infinity!
  assert.equal(result.costPerAttendee, 0);
  assert.equal(result.attendanceRate, 0);
});

test("calculateEventEfficiencySafe computes realistic unit economics when attendees are present", () => {
  const events = [
    { budget: 10_000_000, attendeeCount: 500, targetAttendee: 400 },
    { budget: 5_000_000, attendeeCount: 250, targetAttendee: 300 },
  ];

  const result = calculateEventEfficiencySafe(events);
  assert.equal(result.totalEvents, 2);
  assert.equal(result.totalBudget, 15_000_000);
  assert.equal(result.totalAttendees, 750);
  assert.equal(result.totalTargetAttendees, 700);
  // 15,000,000 / 750 = 20,000 per attendee
  assert.equal(result.costPerAttendee, 20_000);
  // 750 / 700 * 100 = 107%
  assert.equal(result.attendanceRate, 107);
});
