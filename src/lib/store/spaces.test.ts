import test, { beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { useWorkspaceStore, DEFAULT_STATUSES } from "./useWorkspaceStore.ts";

const api = () => useWorkspaceStore.getState();

let snapshot: {
  workspaces: ReturnType<typeof api>["workspaces"];
  tasks: ReturnType<typeof api>["tasks"];
  activeWorkspaceId: string;
  activeSpaceId: string;
  activeListId: string;
};

beforeEach(() => {
  const current = api();
  snapshot = {
    workspaces: JSON.parse(JSON.stringify(current.workspaces)),
    tasks: JSON.parse(JSON.stringify(current.tasks)),
    activeWorkspaceId: current.activeWorkspaceId,
    activeSpaceId: current.activeSpaceId,
    activeListId: current.activeListId,
  };
});

afterEach(() => {
  useWorkspaceStore.setState({
    workspaces: snapshot.workspaces,
    tasks: snapshot.tasks,
    activeWorkspaceId: snapshot.activeWorkspaceId,
    activeSpaceId: snapshot.activeSpaceId,
    activeListId: snapshot.activeListId,
  });
});

test("createSpace creates a new space with general list, default statuses and sets active ids", () => {
  const newSpace = api().createSpace("Alpha Space", "Rocket", "#10B981");

  assert.ok(newSpace.id);
  assert.equal(newSpace.name, "Alpha Space");
  assert.equal(newSpace.icon, "Rocket");
  assert.equal(newSpace.color, "#10B981");
  assert.equal(newSpace.folders.length, 0);
  assert.equal(newSpace.lists.length, 1);
  assert.equal(newSpace.lists[0].name, "General");
  assert.equal(newSpace.statuses.length, DEFAULT_STATUSES.length);

  const currentWs = api().workspaces.find((w) => w.id === api().activeWorkspaceId);
  assert.ok(currentWs?.spaces.some((s) => s.id === newSpace.id));

  // Active space and list should point to the new space
  assert.equal(api().activeSpaceId, newSpace.id);
  assert.equal(api().activeListId, newSpace.lists[0].id);
});

test("updateSpace patches space metadata without disturbing child lists or statuses", () => {
  const space = api().createSpace("Original Space", "Folder", "#3B82F6");
  api().updateSpace(space.id, {
    name: "Updated Space",
    color: "#EF4444",
    icon: "Target",
  });

  const currentWs = api().workspaces.find((w) => w.id === api().activeWorkspaceId);
  const updated = currentWs?.spaces.find((s) => s.id === space.id);

  assert.equal(updated?.name, "Updated Space");
  assert.equal(updated?.color, "#EF4444");
  assert.equal(updated?.icon, "Target");
  assert.equal(updated?.lists.length, 1);
  assert.equal(updated?.statuses.length, DEFAULT_STATUSES.length);
});

test("createFolder and updateFolder manage folder lifecycle inside a space", () => {
  const space = api().createSpace("Folder Space", "Layers", "#6366F1");
  const folder = api().createFolder(space.id, "Sprint Planning");

  assert.ok(folder.id);
  assert.equal(folder.name, "Sprint Planning");
  assert.equal(folder.spaceId, space.id);
  assert.deepEqual(folder.lists, []);

  let currentWs = api().workspaces.find((w) => w.id === api().activeWorkspaceId);
  let currentSpace = currentWs?.spaces.find((s) => s.id === space.id);
  assert.equal(currentSpace?.folders.length, 1);
  assert.equal(currentSpace?.folders[0].name, "Sprint Planning");

  api().updateFolder(space.id, folder.id, "Sprint 101");
  currentWs = api().workspaces.find((w) => w.id === api().activeWorkspaceId);
  currentSpace = currentWs?.spaces.find((s) => s.id === space.id);
  assert.equal(currentSpace?.folders[0].name, "Sprint 101");
});

test("createList adds direct space lists and folder-nested lists, switching activeListId", () => {
  const space = api().createSpace("Lists Space", "Zap", "#F59E0B");
  const folder = api().createFolder(space.id, "Q3 Goals");

  const directList = api().createList(space.id, "Direct Backlog");
  assert.equal(api().activeListId, directList.id);

  const folderList = api().createList(space.id, "Nested Deliverables", folder.id);
  assert.equal(api().activeListId, folderList.id);

  const currentWs = api().workspaces.find((w) => w.id === api().activeWorkspaceId);
  const currentSpace = currentWs?.spaces.find((s) => s.id === space.id);

  assert.ok(currentSpace?.lists.some((l) => l.id === directList.id));
  const updatedFolder = currentSpace?.folders.find((f) => f.id === folder.id);
  assert.ok(updatedFolder?.lists.some((l) => l.id === folderList.id));
});

test("deleteFolder removes folder and purges tasks belonging to folder lists", () => {
  const space = api().createSpace("Folder Deletion Space", "Folder", "#0D9488");
  const folder = api().createFolder(space.id, "Temporary Folder");
  const folderList = api().createList(space.id, "Temp List", folder.id);

  const taskInFolder = api().createTask({
    listId: folderList.id,
    title: "Task in folder list",
    description: "",
    statusId: "status-todo",
    priority: "normal",
    assignees: [],
    tags: [],
    subtasks: [],
    orderIndex: 0,
  });

  assert.ok(api().tasks.some((t) => t.id === taskInFolder.id));
  assert.equal(api().activeListId, folderList.id);

  api().deleteFolder(space.id, folder.id);

  const currentWs = api().workspaces.find((w) => w.id === api().activeWorkspaceId);
  const currentSpace = currentWs?.spaces.find((s) => s.id === space.id);
  assert.equal(currentSpace?.folders.some((f) => f.id === folder.id), false);

  // Cascading task deletion
  assert.equal(api().tasks.some((t) => t.id === taskInFolder.id), false);

  // activeListId should fall back away from the deleted list
  assert.notEqual(api().activeListId, folderList.id);
});

test("cascading list and task cleanup on deleteSpace purges top-level and folder tasks", () => {
  const space = api().createSpace("Ephemeral Space", "Rocket", "#EC4899");
  const topList = space.lists[0];

  const folder = api().createFolder(space.id, "Internal Folder");
  const folderList = api().createList(space.id, "Internal List", folder.id);

  const task1 = api().createTask({
    listId: topList.id,
    title: "Task in top list",
    description: "",
    statusId: "status-todo",
    priority: "urgent",
    assignees: [],
    tags: [],
    subtasks: [],
    orderIndex: 0,
  });

  const task2 = api().createTask({
    listId: folderList.id,
    title: "Task in folder list",
    description: "",
    statusId: "status-in-progress",
    priority: "high",
    assignees: [],
    tags: [],
    subtasks: [],
    orderIndex: 1,
  });

  assert.ok(api().tasks.some((t) => t.id === task1.id));
  assert.ok(api().tasks.some((t) => t.id === task2.id));
  assert.equal(api().activeSpaceId, space.id);

  // Perform cascading space deletion
  api().deleteSpace(space.id);

  const currentWs = api().workspaces.find((w) => w.id === api().activeWorkspaceId);
  assert.equal(currentWs?.spaces.some((s) => s.id === space.id), false);

  // Tasks from both the direct list and the folder list must be purged
  assert.equal(api().tasks.some((t) => t.id === task1.id), false);
  assert.equal(api().tasks.some((t) => t.id === task2.id), false);

  // activeSpaceId and activeListId should fall back to another existing space
  assert.notEqual(api().activeSpaceId, space.id);
  assert.ok(api().activeSpaceId.length > 0);
  assert.notEqual(api().activeListId, topList.id);
  assert.notEqual(api().activeListId, folderList.id);
});

test("addStatusToSpace appends uppercase status with category in_progress and sequential order", () => {
  const space = api().createSpace("Status Test Space", "Palette", "#8B5CF6");
  const initialStatusCount = space.statuses.length;

  api().addStatusToSpace(space.id, "qa review", "#F59E0B");

  const currentWs = api().workspaces.find((w) => w.id === api().activeWorkspaceId);
  const currentSpace = currentWs?.spaces.find((s) => s.id === space.id);
  const addedStatus = currentSpace?.statuses.find((s) => s.name === "QA REVIEW");

  assert.ok(addedStatus);
  assert.equal(addedStatus?.color, "#F59E0B");
  assert.equal(addedStatus?.category, "in_progress");
  assert.equal(addedStatus?.order, initialStatusCount);
});
