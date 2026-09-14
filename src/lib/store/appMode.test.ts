import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { useWorkspaceStore } from "./useWorkspaceStore.ts";

const api = () => useWorkspaceStore.getState();

test("appMode defaults to tasks or marcom based on activeView", () => {
  api().setAppMode("tasks");
  assert.equal(api().appMode, "tasks");
});

test("setAppMode switches mode and updates activeView to last domain view", () => {
  // Set to tasks and pick board
  api().setAppMode("tasks");
  api().setActiveView("board");
  assert.equal(api().appMode, "tasks");
  assert.equal(api().activeView, "board");

  // Switch to marcom
  api().setAppMode("marcom");
  assert.equal(api().appMode, "marcom");
  // Default or last marcom view
  assert.ok(
    ["events", "placements", "mous", "branches", "outlets", "documents", "reports", "analytics"].includes(
      api().activeView,
    ),
  );

  // Change marcom view to branches
  api().setActiveView("branches");
  assert.equal(api().activeView, "branches");

  // Switch back to tasks -> restores board
  api().setAppMode("tasks");
  assert.equal(api().appMode, "tasks");
  assert.equal(api().activeView, "board");

  // Switch back to marcom -> restores branches
  api().setAppMode("marcom");
  assert.equal(api().appMode, "marcom");
  assert.equal(api().activeView, "branches");
});

test("setActiveView auto-syncs appMode when selecting views from either domain", () => {
  api().setActiveView("calendar");
  assert.equal(api().appMode, "tasks");

  api().setActiveView("outlets");
  assert.equal(api().appMode, "marcom");

  api().setActiveView("list");
  assert.equal(api().appMode, "tasks");
});

test("navigateToMarcom switches appMode to marcom", () => {
  api().setAppMode("tasks");
  api().navigateToMarcom("mous", "Search Term");
  assert.equal(api().appMode, "marcom");
  assert.equal(api().activeView, "mous");
  assert.equal(api().marcomFilters["mous"], "Search Term");
});
