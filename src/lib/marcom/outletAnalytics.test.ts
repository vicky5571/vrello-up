import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { calculateEnhancedOutletKPIs, resolveOutletCoordinates, getOutletMarkerMeta, type OutletSummaryInfo } from "./outletAnalytics.ts";

test("calculateEnhancedOutletKPIs handles empty outlets list", () => {
  const kpis = calculateEnhancedOutletKPIs([]);
  assert.equal(kpis.totalOutlets, 0);
  assert.equal(kpis.activeCount, 0);
  assert.equal(kpis.activePercentage, 0);
  assert.equal(kpis.branchCoverage, 0);
});

test("calculateEnhancedOutletKPIs calculates correct totals, brand ratios, and tiers", () => {
  const outlets: OutletSummaryInfo[] = [
    { id: "o1", code: "OUT-1", name: "Outlet 1", type: "TRADITIONAL", tier: "TIER_1", brand: "IM3", active: true, branchId: "b1", mouCount: 1, placementCount: 2 },
    { id: "o2", code: "OUT-2", name: "Outlet 2", type: "MODERN_RETAIL", tier: "TIER_2", brand: "3", active: true, branchId: "b1", mouCount: 0, placementCount: 1 },
    { id: "o3", code: "OUT-3", name: "Outlet 3", type: "EXCLUSIVE", tier: "TIER_1", brand: "TRI", active: false, branchId: "b2", mouCount: 1, placementCount: 0 },
    { id: "o4", code: "OUT-4", name: "Outlet 4", type: "CAMPUS_OUTLET", tier: "TIER_3", brand: "IM3", active: true, branchId: "b3", mouCount: 0, placementCount: 0 },
  ];

  const kpis = calculateEnhancedOutletKPIs(outlets);
  assert.equal(kpis.totalOutlets, 4);
  assert.equal(kpis.activeCount, 3);
  assert.equal(kpis.activePercentage, 75);
  assert.equal(kpis.branchCoverage, 3);
  assert.equal(kpis.im3Count, 2);
  assert.equal(kpis.triCount, 2);
  assert.equal(kpis.tier1Count, 2);
  assert.equal(kpis.tier2Count, 1);
  assert.equal(kpis.tier3Count, 1);
  assert.equal(kpis.withMouCount, 2);
  assert.equal(kpis.withPlacementCount, 2);
});

test("resolveOutletCoordinates prioritizes direct coordinates over fallback", () => {
  const direct = resolveOutletCoordinates(
    { latitude: -6.2, longitude: 106.8 },
    { latitude: -6.9, longitude: 107.6 },
  );
  assert.equal(direct.latitude, -6.2);
  assert.equal(direct.longitude, 106.8);
  assert.equal(direct.isInherited, false);
});

test("resolveOutletCoordinates falls back to latest placement when outlet coords are missing", () => {
  const fallback = resolveOutletCoordinates(
    { latitude: null, longitude: null },
    { latitude: -6.9, longitude: 107.6 },
  );
  assert.equal(fallback.latitude, -6.9);
  assert.equal(fallback.longitude, 107.6);
  assert.equal(fallback.isInherited, true);
});

test("resolveOutletCoordinates returns nulls when neither has coords", () => {
  const none = resolveOutletCoordinates({ latitude: null, longitude: null }, null);
  assert.equal(none.latitude, null);
  assert.equal(none.longitude, null);
  assert.equal(none.isInherited, false);
});

test("getOutletMarkerMeta formats brand and styling accurately", () => {
  const im3 = getOutletMarkerMeta({ brand: "IM3", tier: "TIER_1", type: "MODERN_RETAIL" });
  assert.equal(im3.brandLabel, "IM3");
  assert.equal(im3.brandColor, "#EAB308");
  assert.equal(im3.tierLabel, "Tier 1");
  assert.equal(im3.typeLabel, "MODERN RETAIL");

  const tri = getOutletMarkerMeta({ brand: "3", tier: "TIER_2", type: "CAMPUS_OUTLET" });
  assert.equal(tri.brandLabel, "3 (Tri)");
  assert.equal(tri.brandColor, "#EC4899");
  assert.equal(tri.tierLabel, "Tier 2");
  assert.equal(tri.typeLabel, "CAMPUS OUTLET");
});
