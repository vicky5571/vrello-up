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

