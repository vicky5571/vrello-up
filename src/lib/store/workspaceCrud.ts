import { type Workspace, type Space, type Task, type User, type Status } from "@/types";
import { generateId } from "@/lib/utils";
import { extractSpaceListIds } from "@/lib/store/workspaceSwitch";

export interface WorkspaceCreationOptions {
  name: string;
  avatar?: string;
  defaultStatuses?: Status[];
  members?: User[];
}

export interface WorkspaceDeletionResult {
  remainingWorkspaces: Workspace[];
  remainingTasks: Task[];
  deletedTaskIds: string[];
  success: boolean;
}

/**
 * Builds a valid initial Workspace instance with an initial default space,
 * standard statuses, and an initial task list.
 */
export function buildInitialWorkspace(
  options: WorkspaceCreationOptions,
): Workspace {
  const wsId = generateId("ws");
  const spaceId = generateId("space");
  const listId = generateId("list");

  const defaultStatuses: Status[] =
    options.defaultStatuses && options.defaultStatuses.length > 0
      ? options.defaultStatuses
      : [
          { id: "status-todo", name: "TO DO", color: "#64748B", category: "open", order: 0 },
          { id: "status-in-progress", name: "IN PROGRESS", color: "#0D9488", category: "in_progress", order: 1 },
          { id: "status-review", name: "IN REVIEW", color: "#EA580C", category: "review", order: 2 },
          { id: "status-done", name: "COMPLETE", color: "#16A34A", category: "done", order: 3 },
        ];

  const defaultSpace: Space = {
    id: spaceId,
    workspaceId: wsId,
    name: "General",
    icon: "Folder",
    color: "#0D9488",
    statuses: defaultStatuses,
    folders: [],
    lists: [
      {
        id: listId,
        spaceId: spaceId,
        name: "General Tasks",
        icon: "List",
        color: "#0D9488",
      },
    ],
  };

  return {
    id: wsId,
    name: options.name.trim(),
    avatar: options.avatar || options.name.trim().charAt(0).toUpperCase(),
    spaces: [defaultSpace],
    members: options.members || [],
  };
}

/**
 * Removes a workspace and purges all tasks and dependencies associated with it.
 * Refuses deletion if the workspace is the last remaining one.
 */
export function removeWorkspaceAndCascadeTasks(
  workspaces: Workspace[],
  tasks: Task[],
  workspaceId: string,
): WorkspaceDeletionResult {
  // Prevent deleting if it's the only remaining workspace
  if (workspaces.length <= 1) {
    return {
      remainingWorkspaces: workspaces,
      remainingTasks: tasks,
      deletedTaskIds: [],
      success: false,
    };
  }

  const wsToDelete = workspaces.find((w) => w.id === workspaceId);
  if (!wsToDelete) {
    return {
      remainingWorkspaces: workspaces,
      remainingTasks: tasks,
      deletedTaskIds: [],
      success: false,
    };
  }

  // Collect all list IDs belonging to this workspace
  const listIdsToDelete = new Set<string>();
  for (const space of wsToDelete.spaces || []) {
    for (const listId of extractSpaceListIds(space)) {
      listIdsToDelete.add(listId);
    }
  }

  const tasksToDelete = tasks.filter((t) => listIdsToDelete.has(t.listId));
  const deletedTaskIds = new Set(tasksToDelete.map((t) => t.id));

  const remainingTasks = tasks
    .filter((t) => !listIdsToDelete.has(t.listId))
    .map((t) =>
      t.dependencies && t.dependencies.some((depId) => deletedTaskIds.has(depId))
        ? {
            ...t,
            dependencies: t.dependencies.filter((depId) => !deletedTaskIds.has(depId)),
          }
        : t,
    );

  const remainingWorkspaces = workspaces.filter((w) => w.id !== workspaceId);

  return {
    remainingWorkspaces,
    remainingTasks,
    deletedTaskIds: [...deletedTaskIds],
    success: true,
  };
}
