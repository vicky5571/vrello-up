import test from "node:test";
import assert from "node:assert/strict";
import type { Space, Task } from "@/types";
import {
  mapTaskCategoryToPlacementStatus,
  mapPlacementStatusToTaskStatusId,
  isPlacementTask,
  buildPlacementTaskPayload,
} from "@/lib/tasks/placementTaskSync";

const SAMPLE_SPACE: Space = {
  id: "space-marcom",
  workspaceId: "ws-main",
  name: "Marketing & Communication",
  icon: "Megaphone",
  color: "#EC4899",
  statuses: [
    { id: "st-todo", name: "TO DO", color: "#64748B", category: "open", order: 0 },
    { id: "st-prog", name: "IN PROGRESS", color: "#0D9488", category: "in_progress", order: 1 },
    { id: "st-rev", name: "IN REVIEW", color: "#EA580C", category: "review", order: 2 },
    { id: "st-done", name: "COMPLETE", color: "#16A34A", category: "done", order: 3 },
  ],
  folders: [],
  lists: [
    {
      id: "list-field-ops",
      spaceId: "space-marcom",
      name: "Field Operations & Setup",
    },
  ],
};

test("mapTaskCategoryToPlacementStatus maps Kanban categories to 3 Placement statuses", () => {
  // Open / Todo category -> NOT_STARTED (To Do)
  assert.equal(mapTaskCategoryToPlacementStatus("open", "TO DO"), "NOT_STARTED");
  assert.equal(mapTaskCategoryToPlacementStatus("open", "Backlog"), "NOT_STARTED");

  // In progress / Review category -> ON_PROGRESS (In Progress)
  assert.equal(mapTaskCategoryToPlacementStatus("in_progress", "IN PROGRESS"), "ON_PROGRESS");
  assert.equal(mapTaskCategoryToPlacementStatus("review", "IN REVIEW"), "ON_PROGRESS");
  assert.equal(mapTaskCategoryToPlacementStatus(undefined, "Doing Work"), "ON_PROGRESS");

  // Done / Closed category -> DONE (Done)
  assert.equal(mapTaskCategoryToPlacementStatus("done", "COMPLETE"), "DONE");
  assert.equal(mapTaskCategoryToPlacementStatus("closed", "Closed"), "DONE");
  assert.equal(mapTaskCategoryToPlacementStatus(undefined, "Sudah Selesai"), "DONE");

  // Default fallback
  assert.equal(mapTaskCategoryToPlacementStatus(undefined, undefined), "NOT_STARTED");
});

test("mapPlacementStatusToTaskStatusId finds the matching status in space", () => {
  // NOT_STARTED -> open category status
  assert.equal(mapPlacementStatusToTaskStatusId("NOT_STARTED", SAMPLE_SPACE), "st-todo");

  // ON_PROGRESS -> in_progress category status
  assert.equal(mapPlacementStatusToTaskStatusId("ON_PROGRESS", SAMPLE_SPACE), "st-prog");

  // DONE -> done category status
  assert.equal(mapPlacementStatusToTaskStatusId("DONE", SAMPLE_SPACE), "st-done");

  // Fallback when space is undefined
  assert.equal(mapPlacementStatusToTaskStatusId("NOT_STARTED", undefined), "status-todo");
  assert.equal(mapPlacementStatusToTaskStatusId("ON_PROGRESS", undefined), "status-in-progress");
  assert.equal(mapPlacementStatusToTaskStatusId("DONE", undefined), "status-done");
});

test("isPlacementTask correctly identifies linked placement tasks", () => {
  const validTask = {
    id: "task-1",
    title: "[Placement] Banner - Toko Berkah Cell",
    relatedMarcomId: "placement-123",
  } as Task;

  assert.equal(isPlacementTask(validTask), true);

  const nonPlacementTask = {
    id: "task-2",
    title: "[Field Event] Campus Activation",
    relatedMarcomId: "event-456",
  } as Task;

  assert.equal(isPlacementTask(nonPlacementTask), false);

  const missingMarcomId = {
    id: "task-3",
    title: "[Placement] Poster",
  } as Task;

  assert.equal(isPlacementTask(missingMarcomId), false);
});

test("buildPlacementTaskPayload constructs status-aligned task payload", () => {
  const placementData = {
    id: "placement-999",
    materialName: "Shopblind",
    outletName: "Mitra Ponsel",
    dimensions: "3x1m",
    picName: "Budi Santoso",
    notes: "Pasang di kanopi depan",
    photoUrl: "https://example.com/photo.jpg",
  };

  // 1. When placement is NOT_STARTED -> Task starts at status-todo
  const todoPayload = buildPlacementTaskPayload({
    ...placementData,
    status: "NOT_STARTED",
  }, SAMPLE_SPACE);

  assert.equal(todoPayload.statusId, "st-todo");
  assert.equal(todoPayload.relatedMarcomId, "placement-999");
  assert.equal(todoPayload.title, "[Placement] Shopblind - Mitra Ponsel");

  // 2. When placement is ON_PROGRESS -> Task starts at status-in-progress
  const inProgPayload = buildPlacementTaskPayload({
    ...placementData,
    status: "ON_PROGRESS",
  }, SAMPLE_SPACE);

  assert.equal(inProgPayload.statusId, "st-prog");

  // 3. When placement is DONE -> Task starts at status-done
  const donePayload = buildPlacementTaskPayload({
    ...placementData,
    status: "DONE",
  }, SAMPLE_SPACE);

  assert.equal(donePayload.statusId, "st-done");
});
