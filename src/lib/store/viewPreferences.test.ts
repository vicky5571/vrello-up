import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { useWorkspaceStore, DEFAULT_VIEW_PREFERENCES } from "./useWorkspaceStore.ts";

const api = () => useWorkspaceStore.getState();

test("setViewPreferences merges density and partial visibleFields", () => {
  api().setViewPreferences({ density: "compact" });
  assert.equal(api().viewPreferences.density, "compact");
  assert.equal(api().viewPreferences.visibleFields.tags, true);

  api().setViewPreferences({ visibleFields: { tags: false } });
  assert.equal(api().viewPreferences.visibleFields.tags, false);
  assert.equal(api().viewPreferences.visibleFields.assignees, true);
  assert.equal(api().viewPreferences.density, "compact");

  api().resetViewPreferences();
  assert.deepEqual(api().viewPreferences, DEFAULT_VIEW_PREFERENCES);
});
