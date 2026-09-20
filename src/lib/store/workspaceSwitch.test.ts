import test from "node:test";
import assert from "node:assert/strict";
import { type Workspace } from "@/types";
// @ts-expect-error Node's strip-types runner requires explicit TypeScript extension
import { switchWorkspace } from "./workspaceSwitch.ts";
// @ts-expect-error Node's strip-types runner requires explicit TypeScript extension
import { useWorkspaceStore, DEFAULT_STATUSES } from "./useWorkspaceStore.ts";

const MOCK_WORKSPACES: Workspace[] = [
  {
    id: "ws-1",
    name: "Workspace One",
    members: [],
    spaces: [
      {
        id: "space-1a",
        workspaceId: "ws-1",
        name: "Space 1A",
        icon: "folder",
        color: "#64748B",
        statuses: DEFAULT_STATUSES,
        folders: [],
        lists: [
          { id: "list-1a-1", spaceId: "space-1a", name: "List 1A-1" },
          { id: "list-1a-2", spaceId: "space-1a", name: "List 1A-2" },
        ],
      },
      {
        id: "space-1b",
        workspaceId: "ws-1",
        name: "Space 1B",
        icon: "folder",
        color: "#64748B",
        statuses: DEFAULT_STATUSES,
        folders: [],
        lists: [{ id: "list-1b-1", spaceId: "space-1b", name: "List 1B-1" }],
      },
    ],
  },
  {
    id: "ws-2",
    name: "Workspace Two",
    members: [],
    spaces: [
      {
        id: "space-2a",
        workspaceId: "ws-2",
        name: "Space 2A",
        icon: "sparkles",
        color: "#EC4899",
        statuses: DEFAULT_STATUSES,
        folders: [
          {
            id: "folder-2a-1",
            spaceId: "space-2a",
            name: "Folder 2A-1",
            lists: [{ id: "list-2a-nested", spaceId: "space-2a", folderId: "folder-2a-1", name: "Nested List" }],
          },
        ],
        lists: [{ id: "list-2a-direct", spaceId: "space-2a", name: "Direct List" }],
      },
    ],
  },
  {
    id: "ws-empty",
    name: "Workspace Empty",
    members: [],
    spaces: [],
  },
];

test("switchWorkspace pure function switches to target workspace and falls back to first space and null list", () => {
  const result = switchWorkspace(MOCK_WORKSPACES, "ws-2", {
    activeWorkspaceId: "ws-1",
    activeSpaceId: "space-1a",
    activeListId: "list-1a-1",
    selectedTaskId: "task-999",
    selectedTaskIds: ["task-999"],
  });

  assert.equal(result.activeWorkspaceId, "ws-2");
  assert.equal(result.activeSpaceId, "space-2a");
  assert.equal(result.activeListId, null);
  assert.equal(result.selectedTaskId, null);
  assert.deepEqual(result.selectedTaskIds, []);
});

test("switchWorkspace preserves activeSpaceId if target workspace contains that space", () => {
  const result = switchWorkspace(MOCK_WORKSPACES, "ws-1", {
    activeWorkspaceId: "ws-1",
    activeSpaceId: "space-1b",
    activeListId: "list-1b-1",
    selectedTaskId: "task-1",
    selectedTaskIds: ["task-1"],
  });

  assert.equal(result.activeWorkspaceId, "ws-1");
  assert.equal(result.activeSpaceId, "space-1b");
  assert.equal(result.activeListId, "list-1b-1");
  assert.equal(result.selectedTaskId, "task-1");
  assert.deepEqual(result.selectedTaskIds, ["task-1"]);
});

test("switchWorkspace gracefully handles target workspace with empty spaces", () => {
  const result = switchWorkspace(MOCK_WORKSPACES, "ws-empty", {
    activeWorkspaceId: "ws-1",
    activeSpaceId: "space-1a",
    activeListId: "list-1a-1",
  });

  assert.equal(result.activeWorkspaceId, "ws-empty");
  assert.equal(result.activeSpaceId, "");
  assert.equal(result.activeListId, null);
});

test("switchWorkspace gracefully ignores unknown target workspace ID", () => {
  const result = switchWorkspace(MOCK_WORKSPACES, "ws-nonexistent", {
    activeWorkspaceId: "ws-1",
    activeSpaceId: "space-1a",
    activeListId: "list-1a-1",
  });

  assert.equal(result.activeWorkspaceId, "ws-1");
  assert.equal(result.activeSpaceId, "space-1a");
  assert.equal(result.activeListId, "list-1a-1");
});

test("useWorkspaceStore.setActiveWorkspace updates activeSpaceId and resets activeListId to prevent desynchronized UI", () => {
  const api = useWorkspaceStore.getState();
  const originalState = {
    workspaces: api.workspaces,
    activeWorkspaceId: api.activeWorkspaceId,
    activeSpaceId: api.activeSpaceId,
    activeListId: api.activeListId,
    selectedTaskId: api.selectedTaskId,
    selectedTaskIds: api.selectedTaskIds,
  };

  try {
    // Seed store with mock workspaces
    useWorkspaceStore.setState({
      workspaces: MOCK_WORKSPACES,
      activeWorkspaceId: "ws-1",
      activeSpaceId: "space-1a",
      activeListId: "list-1a-1",
      selectedTaskId: "task-sample",
      selectedTaskIds: ["task-sample"],
    });

    // Switch to Workspace Two
    useWorkspaceStore.getState().setActiveWorkspace("ws-2");

    const updated = useWorkspaceStore.getState();
    assert.equal(updated.activeWorkspaceId, "ws-2");
    assert.equal(updated.activeSpaceId, "space-2a");
    assert.equal(updated.activeListId, null);
    assert.equal(updated.selectedTaskId, null);
    assert.deepEqual(updated.selectedTaskIds, []);
  } finally {
    useWorkspaceStore.setState(originalState);
  }
});
