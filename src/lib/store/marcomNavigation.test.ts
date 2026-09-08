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
