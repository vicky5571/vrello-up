import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { calculatePlacementKPIs } from "./placementAnalytics.ts";

test("calculatePlacementKPIs handles empty and non-array dataset", () => {
  const result = calculatePlacementKPIs([]);
  assert.deepEqual(result, {
    totalCount: 0,
    totalCost: 0,
    doneCount: 0,
    inProgressCount: 0,
    issueCount: 0,
    notStartedCount: 0,
    pendingCount: 0,
    completionRate: 0,
    im3Count: 0,
    triCount: 0,
  });
});

test("calculatePlacementKPIs accurately aggregates financial cost and status counts", () => {
  const dataset = [
    { status: "DONE", brand: "IM3", cost: 500000 },
    { status: "DONE", brand: "3", cost: 300000 },
    { status: "ON_PROGRESS", brand: "IM3", cost: 200000 },
    { status: "NOT_STARTED", brand: "TRI", cost: 150000 },
    { status: "NOT_STARTED", brand: "IM3", cost: 0 },
  ];

  const result = calculatePlacementKPIs(dataset);
  assert.equal(result.totalCount, 5);
  assert.equal(result.totalCost, 1150000);
  assert.equal(result.doneCount, 2);
  assert.equal(result.inProgressCount, 1);
  assert.equal(result.issueCount, 0);
  assert.equal(result.notStartedCount, 2);
  assert.equal(result.pendingCount, 3);
  // 2 out of 5 done = 40%
  assert.equal(result.completionRate, 40);
  // 3 IM3 vs 2 Tri (3 + TRI)
  assert.equal(result.im3Count, 3);
  assert.equal(result.triCount, 2);
});

test("calculatePlacementKPIs correctly separates ISSUE from notStartedCount", () => {
  const dataset = [
    { status: "DONE", brand: "IM3", cost: 500000 },
    { status: "ISSUE", brand: "3", cost: 250000 },
    { status: "ON_PROGRESS", brand: "IM3", cost: 100000 },
    { status: "NOT_STARTED", brand: "TRI", cost: 50000 },
  ];

  const result = calculatePlacementKPIs(dataset);
  assert.equal(result.totalCount, 4);
  assert.equal(result.issueCount, 1, "ISSUE status must be tracked in issueCount");
  assert.equal(result.notStartedCount, 1, "notStartedCount must not include ISSUE");
  assert.equal(result.pendingCount, 2, "pendingCount should reflect notStarted + inProgress");
  assert.equal(result.completionRate, 25);
});

test("calculatePlacementKPIs handles missing cost or unexpected status gracefully", () => {
  const dataset = [
    { status: "DONE", brand: undefined, cost: undefined },
    { status: "UNKNOWN_CUSTOM", brand: "3", cost: -500 }, // Negative cost ignored
  ];

  const result = calculatePlacementKPIs(dataset);
  assert.equal(result.totalCount, 2);
  assert.equal(result.totalCost, 0);
  assert.equal(result.doneCount, 1);
  assert.equal(result.issueCount, 0);
  assert.equal(result.notStartedCount, 1);
  assert.equal(result.completionRate, 50);
  assert.equal(result.im3Count, 1); // Defaults undefined brand to IM3
  assert.equal(result.triCount, 1);
});
