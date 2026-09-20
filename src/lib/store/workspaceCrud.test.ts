import test from "node:test";
import assert from "node:assert/strict";
import { type Workspace, type Task } from "@/types";
// @ts-expect-error Node's strip-types runner requires explicit TypeScript extension
import { buildInitialWorkspace, removeWorkspaceAndCascadeTasks } from "./workspaceCrud.ts";
// @ts-expect-error Node's strip-types runner requires explicit TypeScript extension
import { useWorkspaceStore, DEFAULT_STATUSES } from "./useWorkspaceStore.ts";

test("buildInitialWorkspace creates a complete valid workspace with a default space and task list", () => {
  const ws = buildInitialWorkspace({
    name: "Engineering Corp",
    avatar: "EC",
  });

  assert.ok(ws.id.startsWith("ws-"));
  assert.equal(ws.name, "Engineering Corp");
  assert.equal(ws.avatar, "EC");
  assert.equal(ws.spaces.length, 1);

  const space = ws.spaces[0];
  assert.equal(space.name, "General");
  assert.equal(space.workspaceId, ws.id);
  assert.equal(space.lists.length, 1);
  assert.equal(space.lists[0].name, "General Tasks");
  assert.equal(space.statuses.length, DEFAULT_STATUSES.length);
});

test("removeWorkspaceAndCascadeTasks prevents deletion when only one workspace exists", () => {
  const ws: Workspace = {
    id: "ws-single",
    name: "Single WS",
    spaces: [],
    members: [],
  };

  const result = removeWorkspaceAndCascadeTasks([ws], [], "ws-single");
  assert.equal(result.success, false);
  assert.equal(result.remainingWorkspaces.length, 1);
});

test("removeWorkspaceAndCascadeTasks purges associated tasks and removes task dependencies", () => {
  const ws1: Workspace = {
    id: "ws-1",
    name: "WS 1",
    members: [],
    spaces: [
      {
        id: "sp-1",
        workspaceId: "ws-1",
        name: "Space 1",
        icon: "folder",
        color: "#000",
        statuses: [],
        folders: [],
        lists: [{ id: "list-1", spaceId: "sp-1", name: "List 1" }],
      },
    ],
  };

  const ws2: Workspace = {
    id: "ws-2",
    name: "WS 2",
    members: [],
    spaces: [
      {
        id: "sp-2",
        workspaceId: "ws-2",
        name: "Space 2",
        icon: "folder",
        color: "#000",
        statuses: [],
        folders: [],
        lists: [{ id: "list-2", spaceId: "sp-2", name: "List 2" }],
      },
    ],
  };

  const tasks: Task[] = [
    {
      id: "task-ws1",
      listId: "list-1",
      title: "Task in WS1",
      description: "",
      subtasks: [],
      statusId: "status-todo",
      priority: "normal",
      assignees: [],
      tags: [],
      orderIndex: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "task-ws2",
      listId: "list-2",
      title: "Task in WS2",
      description: "",
      subtasks: [],
      statusId: "status-todo",
      priority: "normal",
      assignees: [],
      tags: [],
      dependencies: ["task-ws1"],
      orderIndex: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const result = removeWorkspaceAndCascadeTasks([ws1, ws2], tasks, "ws-1");
  assert.equal(result.success, true);
  assert.equal(result.remainingWorkspaces.length, 1);
  assert.equal(result.remainingWorkspaces[0].id, "ws-2");
  assert.equal(result.remainingTasks.length, 1);
  assert.equal(result.remainingTasks[0].id, "task-ws2");
  assert.deepEqual(result.remainingTasks[0].dependencies, []);
  assert.deepEqual(result.deletedTaskIds, ["task-ws1"]);
});

test("useWorkspaceStore workspace CRUD lifecycle (create, update, delete)", () => {
  const api = useWorkspaceStore.getState();
  const originalState = {
    workspaces: api.workspaces,
    activeWorkspaceId: api.activeWorkspaceId,
    activeSpaceId: api.activeSpaceId,
    activeListId: api.activeListId,
    tasks: api.tasks,
  };

  try {
    // 1. Create Workspace
    const newWs = useWorkspaceStore.getState().createWorkspace("Next Gen Studio", "NG");
    assert.ok(newWs.id);
    assert.equal(newWs.name, "Next Gen Studio");

    const stateAfterCreate = useWorkspaceStore.getState();
    assert.equal(stateAfterCreate.activeWorkspaceId, newWs.id);
    assert.equal(stateAfterCreate.activeSpaceId, newWs.spaces[0].id);
    assert.equal(stateAfterCreate.activeListId, null);
    assert.ok(stateAfterCreate.workspaces.some((w) => w.id === newWs.id));

    // 2. Update Workspace
    useWorkspaceStore.getState().updateWorkspace(newWs.id, { name: "Next Gen Studio Pro" });
    const stateAfterUpdate = useWorkspaceStore.getState();
    const updatedWs = stateAfterUpdate.workspaces.find((w) => w.id === newWs.id);
    assert.equal(updatedWs?.name, "Next Gen Studio Pro");

    // 3. Delete Workspace
    const deleted = useWorkspaceStore.getState().deleteWorkspace(newWs.id);
    assert.equal(deleted, true);

    const stateAfterDelete = useWorkspaceStore.getState();
    assert.ok(!stateAfterDelete.workspaces.some((w) => w.id === newWs.id));
    assert.notEqual(stateAfterDelete.activeWorkspaceId, newWs.id);
    assert.ok(stateAfterDelete.activeSpaceId.length > 0);
  } finally {
    useWorkspaceStore.setState(originalState);
  }
});
