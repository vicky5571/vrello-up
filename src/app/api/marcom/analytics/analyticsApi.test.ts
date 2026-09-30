import test from "node:test";
import assert from "node:assert/strict";
import { buildMarcomAnalyticsDashboard } from "@/lib/marcom/analyticsEngine";

test("buildMarcomAnalyticsDashboard accepts activeOutletCount without requiring full outlet entities", () => {
  const dashboard = buildMarcomAnalyticsDashboard({
    mous: [],
    placements: [],
    contents: [],
    events: [],
    activeOutletCount: 42,
  });

  assert.ok(dashboard);
  assert.ok(dashboard.actionable);
  assert.equal(dashboard.actionable.costPerOutlet.totalActiveOutlets, 42);
});
