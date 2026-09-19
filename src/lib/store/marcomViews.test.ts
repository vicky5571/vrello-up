import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires explicit ts extension.
import { useWorkspaceStore, normalizeViewMode } from "./useWorkspaceStore.ts";

test("content-planner view mode auto-syncs appMode to marcom", () => {
  const store = useWorkspaceStore.getState();

  // Switch to tasks first
  store.setActiveView("board");
  assert.equal(useWorkspaceStore.getState().appMode, "tasks");

  // Switch to content-planner
  store.setActiveView("content-planner");
  const state = useWorkspaceStore.getState();
  assert.equal(state.appMode, "marcom");
  assert.equal(state.activeView, "content-planner");
  assert.equal(state.lastMarcomView, "content-planner");
});

test("legacy 'content' alias automatically normalizes to 'content-planner'", () => {
  const store = useWorkspaceStore.getState();

  // Switch to tasks first
  store.setActiveView("board");
  assert.equal(useWorkspaceStore.getState().appMode, "tasks");

  // Set legacy "content" alias
  store.setActiveView("content");
  const state = useWorkspaceStore.getState();
  assert.equal(state.appMode, "marcom");
  assert.equal(state.activeView, "content-planner");
  assert.equal(state.lastMarcomView, "content-planner");

  // Test navigateToMarcom with legacy "content"
  store.navigateToMarcom("content", "ramadan special");
  const navState = useWorkspaceStore.getState();
  assert.equal(navState.activeView, "content-planner");
  assert.equal(navState.lastMarcomView, "content-planner");
  assert.equal(navState.marcomFilters["content-planner"], "ramadan special");

  // Test setMarcomFilter with legacy "content"
  store.setMarcomFilter("content", "updated query");
  assert.equal(useWorkspaceStore.getState().marcomFilters["content-planner"], "updated query");

  // Test normalizeViewMode pure function
  assert.equal(normalizeViewMode("content"), "content-planner");
  assert.equal(normalizeViewMode("content-planner"), "content-planner");
  assert.equal(normalizeViewMode("events"), "events");
});

test("events view mode auto-syncs appMode to marcom and records lastMarcomView", () => {
  const store = useWorkspaceStore.getState();

  store.setActiveView("events");
  const state = useWorkspaceStore.getState();
  assert.equal(state.appMode, "marcom");
  assert.equal(state.activeView, "events");
  assert.equal(state.lastMarcomView, "events");
});

test("navigateToMarcom navigates to content-planner with search query", () => {
  const store = useWorkspaceStore.getState();

  store.navigateToMarcom("content-planner", "reel promo");
  const state = useWorkspaceStore.getState();
  assert.equal(state.appMode, "marcom");
  assert.equal(state.activeView, "content-planner");
  assert.equal(state.marcomFilters["content-planner"], "reel promo");
});
