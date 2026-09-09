import test, { beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { useWorkspaceStore, DEFAULT_STATUSES, getSpaceListIds, reconcileWorkspaces } from "./useWorkspaceStore.ts";

const api = () => useWorkspaceStore.getState();

let snapshot: {
  workspaces: ReturnType<typeof api>["workspaces"];
  tasks: ReturnType<typeof api>["tasks"];
  activeWorkspaceId: string;
  activeSpaceId: string;
  activeListId: string | null;
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

  const survivingSpace = api().workspaces[0].spaces.find((s) => s.id !== space.id);
  const survivingTask = api().createTask({
    listId: survivingSpace!.lists[0].id,
    title: "Surviving Task",
    description: "",
    statusId: "status-todo",
    priority: "normal",
    assignees: [],
    tags: [],
    subtasks: [],
    dependencies: [task1.id],
    orderIndex: 0,
  });

  assert.ok(api().tasks.some((t) => t.id === task1.id));
  assert.ok(api().tasks.some((t) => t.id === task2.id));
  assert.equal(api().activeSpaceId, space.id);

  api().setSelectedTaskId(task1.id);
  useWorkspaceStore.setState({ selectedTaskIds: [task1.id, survivingTask.id] });

  // Perform cascading space deletion
  api().deleteSpace(space.id);

  const currentWs = api().workspaces.find((w) => w.id === api().activeWorkspaceId);
  assert.equal(currentWs?.spaces.some((s) => s.id === space.id), false);

  // Tasks from both the direct list and the folder list must be purged
  assert.equal(api().tasks.some((t) => t.id === task1.id), false);
  assert.equal(api().tasks.some((t) => t.id === task2.id), false);

  // Selected task id and selection set must be sanitized
  assert.equal(api().selectedTaskId, null);
  assert.deepEqual(api().selectedTaskIds, [survivingTask.id]);

  // Dependent task in surviving space should have the purged task removed from its dependencies
  const updatedSurvivingTask = api().tasks.find((t) => t.id === survivingTask.id);
  assert.ok(updatedSurvivingTask);
  assert.equal(updatedSurvivingTask?.dependencies?.includes(task1.id), false);

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

test("setActiveSpace resets activeListId to null to represent entire space aggregate view", () => {
  const space = api().createSpace("Aggregate View Space", "Layers", "#3B82F6");
  const list2 = api().createList(space.id, "Backlog");
  api().setActiveList(list2.id);
  assert.equal(api().activeListId, list2.id);

  api().setActiveSpace(space.id);
  assert.equal(api().activeSpaceId, space.id);
  assert.equal(api().activeListId, null);
});

test("getSpaceListIds collects all direct and folder-nested list IDs", () => {
  const space = api().createSpace("Tree Space", "Layers", "#3B82F6");
  const directList1 = space.lists[0]; // General
  const directList2 = api().createList(space.id, "Direct List 2");
  const folder = api().createFolder(space.id, "Sprint Folder");
  const folderList = api().createList(space.id, "Folder List 1", folder.id);

  const currentSpace = api().workspaces
    .flatMap((w) => w.spaces)
    .find((s) => s.id === space.id);

  const listIds = getSpaceListIds(currentSpace);
  assert.equal(listIds.length, 3);
  assert.ok(listIds.includes(directList1.id));
  assert.ok(listIds.includes(directList2.id));
  assert.ok(listIds.includes(folderList.id));

  // Should handle null / undefined gracefully
  assert.deepEqual(getSpaceListIds(null), []);
  assert.deepEqual(getSpaceListIds(undefined), []);
});

test("space-level aggregation includes tasks across all lists in space and excludes other spaces", () => {
  const spaceA = api().createSpace("Space A", "Layers", "#3B82F6");
  const spaceAList2 = api().createList(spaceA.id, "List A2");
  const spaceAFolder = api().createFolder(spaceA.id, "Folder A");
  const spaceAList3 = api().createList(spaceA.id, "List A3", spaceAFolder.id);

  const spaceB = api().createSpace("Space B", "Target", "#EF4444");

  const taskA1 = api().createTask({
    listId: spaceA.lists[0].id,
    title: "Task in A1",
    description: "",
    statusId: "status-todo",
    priority: "normal",
    assignees: [],
    tags: [],
    subtasks: [],
    orderIndex: 0,
  });

  const taskA2 = api().createTask({
    listId: spaceAList2.id,
    title: "Task in A2",
    description: "",
    statusId: "status-todo",
    priority: "normal",
    assignees: [],
    tags: [],
    subtasks: [],
    orderIndex: 1,
  });

  const taskA3 = api().createTask({
    listId: spaceAList3.id,
    title: "Task in A3 (Folder)",
    description: "",
    statusId: "status-todo",
    priority: "normal",
    assignees: [],
    tags: [],
    subtasks: [],
    orderIndex: 2,
  });

  const taskB = api().createTask({
    listId: spaceB.lists[0].id,
    title: "Task in Space B",
    description: "",
    statusId: "status-todo",
    priority: "normal",
    assignees: [],
    tags: [],
    subtasks: [],
    orderIndex: 0,
  });

  // Switch to Space A aggregate view
  api().setActiveSpace(spaceA.id);
  assert.equal(api().activeListId, null);

  const currentSpace = api().workspaces
    .flatMap((w) => w.spaces)
    .find((s) => s.id === api().activeSpaceId);
  const spaceListIds = new Set(getSpaceListIds(currentSpace));

  // Filter tasks using view filter logic
  const aggregateTasks = api().tasks.filter((t) => {
    if (api().activeListId) {
      return t.listId === api().activeListId;
    }
    return spaceListIds.has(t.listId);
  });

  const aggregateTaskIds = aggregateTasks.map((t) => t.id);
  assert.ok(aggregateTaskIds.includes(taskA1.id));
  assert.ok(aggregateTaskIds.includes(taskA2.id));
  assert.ok(aggregateTaskIds.includes(taskA3.id));
  assert.equal(aggregateTaskIds.includes(taskB.id), false);

  // When filtering down to a specific list in Space A
  api().setActiveList(spaceAList2.id);
  const specificListTasks = api().tasks.filter((t) => {
    if (api().activeListId) {
      return t.listId === api().activeListId;
    }
    return spaceListIds.has(t.listId);
  });
  assert.equal(specificListTasks.length, 1);
  assert.equal(specificListTasks[0].id, taskA2.id);
});

test("createTask defaults listId to active space's first list when activeListId is null", () => {
  const space = api().createSpace("Auto List Space", "Zap", "#10B981");
  api().setActiveSpace(space.id);
  assert.equal(api().activeListId, null);

  // Create task without specifying listId
  const created = api().createTask({
    title: "Task created in space aggregate view",
    description: "",
    statusId: "status-todo",
    priority: "normal",
    assignees: [],
    tags: [],
    subtasks: [],
    orderIndex: 0,
  });

  assert.equal(created.listId, space.lists[0].id);
});

test("reconcileWorkspaces preserves client custom spaces and lists over static server seeds", () => {
  const clientWs = JSON.parse(JSON.stringify(api().workspaces));
  // Add a custom space and custom list to client
  const customSpace = {
    id: "space-custom-growth",
    workspaceId: clientWs[0].id,
    name: "Growth & Retention",
    icon: "Rocket",
    color: "#F59E0B",
    statuses: DEFAULT_STATUSES,
    folders: [
      {
        id: "folder-experiments",
        spaceId: "space-custom-growth",
        name: "Q4 Experiments",
        lists: [
          {
            id: "list-onboarding-ab",
            spaceId: "space-custom-growth",
            folderId: "folder-experiments",
            name: "Onboarding A/B Test",
          },
        ],
      },
    ],
    lists: [
      {
        id: "list-funnel-review",
        spaceId: "space-custom-growth",
        name: "Funnel Review",
      },
    ],
  };
  clientWs[0].spaces.push(customSpace);

  // Static server workspaces lacking the custom space
  const serverWs = [
    {
      id: clientWs[0].id,
      name: clientWs[0].name,
      members: clientWs[0].members,
      spaces: [
        {
          id: "space-eng",
          workspaceId: clientWs[0].id,
          name: "Engineering Core",
          icon: "Code2",
          color: "#0D9488",
          statuses: DEFAULT_STATUSES,
          folders: [],
          lists: [{ id: "list-sprint-tasks", spaceId: "space-eng", name: "Sprint Backlog" }],
        },
      ],
    },
  ];

  const result = reconcileWorkspaces(clientWs, serverWs);
  assert.equal(result.shouldSyncToServer, true);

  const reconciledWs = result.workspaces.find((w) => w.id === clientWs[0].id);
  assert.ok(reconciledWs);
  assert.ok(reconciledWs?.spaces.some((s) => s.id === "space-custom-growth"));

  const reconciledSpace = reconciledWs?.spaces.find((s) => s.id === "space-custom-growth");
  assert.equal(reconciledSpace?.lists[0].id, "list-funnel-review");
  assert.equal(reconciledSpace?.folders[0].lists[0].id, "list-onboarding-ab");
});
