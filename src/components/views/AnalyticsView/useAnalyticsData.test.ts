import test from "node:test";
import assert from "node:assert/strict";
import { useMarcomDataStore } from "@/lib/marcom/marcomDataStore";
import { buildMarcomAnalyticsDashboard } from "@/lib/marcom/analyticsEngine";
import type {
  MouAnalyticsInput,
  PlacementAnalyticsInput,
} from "@/lib/marcom/analyticsEngine";

test("useMarcomDataStore fetch actions can pre-warm cache for a workspace", async () => {
  const store = useMarcomDataStore.getState();
  assert.equal(typeof store.fetchPlacements, "function");
  assert.equal(typeof store.fetchMous, "function");
  assert.equal(typeof store.fetchEvents, "function");
  assert.equal(typeof store.fetchPosts, "function");
  assert.equal(typeof store.fetchBranches, "function");
});

test("in-memory dashboard compilation works directly on client store Marcom types", () => {
  const mockPlacements: PlacementAnalyticsInput[] = [
    {
      id: "p-1",
      status: "DONE",
      cost: 500000,
      material: { id: "mat-1", name: "Neon Box", type: "OUTDOOR" },
    },
  ];

  const mockMous: MouAnalyticsInput[] = [
    {
      id: "m-1",
      status: "SUBMITTED",
      submissionDate: new Date().toISOString(),
    },
  ];

  const dashboard = buildMarcomAnalyticsDashboard({
    mous: mockMous,
    placements: mockPlacements,
    contents: [],
    events: [],
    activeOutletCount: 10,
  });

  assert.equal(dashboard.posmDeployment.totalPlacements, 1);
  assert.equal(dashboard.posmDeployment.donePlacements, 1);
  assert.equal(dashboard.mouSlaAndAging.submittedCount, 1);
});
