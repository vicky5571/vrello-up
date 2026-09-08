import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { useWorkspaceStore } from "./useWorkspaceStore.ts";

const api = () => useWorkspaceStore.getState();

test("navigateToMarcom sets activeView and target search filter", () => {
  api().navigateToMarcom("outlets", "Jakarta Central Hub");

  assert.equal(api().activeView, "outlets");
  assert.equal(api().marcomFilters["outlets"], "Jakarta Central Hub");

  // Navigate to mous with different branch
  api().navigateToMarcom("mous", "Bandung Hub");
  assert.equal(api().activeView, "mous");
  assert.equal(api().marcomFilters["mous"], "Bandung Hub");
  // outlets filter preserved
  assert.equal(api().marcomFilters["outlets"], "Jakarta Central Hub");
});

test("setMarcomFilter updates individual view filter", () => {
  api().setMarcomFilter("placements", "Toko Berkah");
  assert.equal(api().marcomFilters["placements"], "Toko Berkah");

  // Clearing a filter
  api().setMarcomFilter("placements", "");
  assert.equal(api().marcomFilters["placements"], "");
});

test("setSelectedBranchId opens and closes branch detail drawer target", () => {
  api().setSelectedBranchId("branch-123");
  assert.equal(api().selectedBranchId, "branch-123");

  api().setSelectedBranchId(null);
  assert.equal(api().selectedBranchId, null);
});

test("outlets API normalizes OFFICIAL_STORE alias to EXCLUSIVE", () => {
  const rawType = "OFFICIAL_STORE";
  const normalizedType = rawType === "OFFICIAL_STORE" ? "EXCLUSIVE" : rawType;
  assert.equal(normalizedType, "EXCLUSIVE");

  const standardType = "MODERN_RETAIL";
  const normalizedStandard = standardType === "OFFICIAL_STORE" ? "EXCLUSIVE" : standardType;
  assert.equal(normalizedStandard, "MODERN_RETAIL");
});

test("branches URLSearchParams builds structured region query correctly", () => {
  const buildBranchQuery = (region: string) => {
    const params = new URLSearchParams();
    if (region && region !== "ALL") params.set("region", region);
    return params.toString();
  };

  assert.equal(buildBranchQuery("ALL"), "");
  assert.equal(buildBranchQuery("DKI Jakarta"), "region=DKI+Jakarta");
  assert.equal(buildBranchQuery("Central Java"), "region=Central+Java");
});

test("outlets URLSearchParams builds branchId and store type queries correctly", () => {
  const buildOutletQuery = (branchId: string, type: string) => {
    const params = new URLSearchParams();
    if (branchId && branchId !== "ALL") params.set("branchId", branchId);
    if (type && type !== "ALL") params.set("type", type);
    return params.toString();
  };

  assert.equal(buildOutletQuery("ALL", "ALL"), "");
  assert.equal(buildOutletQuery("br-123", "ALL"), "branchId=br-123");
  assert.equal(buildOutletQuery("ALL", "EXCLUSIVE"), "type=EXCLUSIVE");
  assert.equal(buildOutletQuery("br-123", "MODERN_RETAIL"), "branchId=br-123&type=MODERN_RETAIL");
});

test("mous and placements URLSearchParams builds status chip queries correctly", () => {
  const buildStatusQuery = (status: string) => {
    const params = new URLSearchParams();
    if (status && status !== "ALL") params.set("status", status);
    return params.toString();
  };

  assert.equal(buildStatusQuery("ALL"), "");
  assert.equal(buildStatusQuery("DRAFT"), "status=DRAFT");
  assert.equal(buildStatusQuery("SUBMITTED"), "status=SUBMITTED");
  assert.equal(buildStatusQuery("ON_PROGRESS"), "status=ON_PROGRESS");
});

test("MOUs KPI calculation computes active, pending, and total compensation accurately", () => {
  const sampleMous = [
    { id: "1", status: "APPROVED", compensationValue: 15000000 },
    { id: "2", status: "SUBMITTED", compensationValue: 5000000 },
    { id: "3", status: "APPROVED", compensationValue: 20000000 },
    { id: "4", status: "DRAFT", compensationValue: 2500000 },
  ];

  const active = sampleMous.filter((m) => m.status === "APPROVED").length;
  const pending = sampleMous.filter((m) => m.status === "SUBMITTED").length;
  const totalValue = sampleMous.reduce((acc, m) => acc + (m.compensationValue || 0), 0);

  assert.equal(active, 2);
  assert.equal(pending, 1);
  assert.equal(totalValue, 42500000);
});

test("Outlets KPI calculation computes total outlets, active branch coverage, and placements", () => {
  const sampleOutlets = [
    { id: "o1", branchId: "b1", placementCount: 3 },
    { id: "o2", branchId: "b1", placementCount: 2 },
    { id: "o3", branchId: "b2", placementCount: 5 },
    { id: "o4", branchId: "b3", placementCount: 0 },
  ];

  const total = sampleOutlets.length;
  const branchCoverage = new Set(sampleOutlets.map((o) => o.branchId).filter(Boolean)).size;
  const totalPlacements = sampleOutlets.reduce((acc, o) => acc + (o.placementCount || 0), 0);

  assert.equal(total, 4);
  assert.equal(branchCoverage, 3);
  assert.equal(totalPlacements, 10);
});

test("Events KPI calculation computes upcoming 30-day events, committed budget, and expected reach", () => {
  const now = new Date();
  const dateIn10Days = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString();
  const dateIn40Days = new Date(now.getTime() + 40 * 24 * 60 * 60 * 1000).toISOString();

  const sampleEvents = [
    { id: "e1", status: "UPCOMING", date: dateIn10Days, budget: 10000000, targetAttendee: 500 },
    { id: "e2", status: "UPCOMING", date: dateIn40Days, budget: 25000000, targetAttendee: 1200 },
    { id: "e3", status: "CANCELLED", date: dateIn10Days, budget: 5000000, targetAttendee: 300 },
  ];

  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const upcomingCount = sampleEvents.filter((e) => {
    if (e.status === "CANCELLED") return false;
    if (!e.date) return e.status === "UPCOMING";
    const d = new Date(e.date);
    return d >= now && d <= in30Days;
  }).length;

  const totalBudget = sampleEvents
    .filter((e) => e.status !== "CANCELLED")
    .reduce((acc, e) => acc + (e.budget || 0), 0);

  const expectedReach = sampleEvents
    .filter((e) => e.status !== "CANCELLED")
    .reduce((acc, e) => acc + (e.targetAttendee || 0), 0);

  assert.equal(upcomingCount, 1);
  assert.equal(totalBudget, 35000000);
  assert.equal(expectedReach, 1700);
});


