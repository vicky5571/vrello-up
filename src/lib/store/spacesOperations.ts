import {
  type Workspace,
  type Space,
  type Folder,
  type List,
  type Status,
  type Task,
} from "@/types";
import { generateId } from "@/lib/utils";
import { reorderSpacesList, moveSpaceDirection } from "@/lib/spaces/spaceOrder";

/**
 * Returns all list IDs contained in a space (both top-level and inside folders).
 */
export function getSpaceListIds(space?: Space | null): string[] {
  if (!space) return [];
  const listIds: string[] = [];
  if (Array.isArray(space.lists)) {
    for (const l of space.lists) listIds.push(l.id);
  }
  if (Array.isArray(space.folders)) {
    for (const f of space.folders) {
      if (Array.isArray(f.lists)) {
        for (const l of f.lists) listIds.push(l.id);
      }
    }
  }
  return listIds;
}

/**
 * Creates a new space with a default General list and returns the updated workspaces.
 */
export function applyCreateSpace(
  workspaces: Workspace[],
  activeWorkspaceId: string,
  name: string,
  icon: string,
  color: string,
  defaultStatuses: Status[],
): {
  workspaces: Workspace[];
  activeSpaceId: string;
  activeListId: string;
  newSpace: Space;
} {
  const id = generateId("space");
  const newSpace: Space = {
    id,
    workspaceId: activeWorkspaceId,
    name,
    icon,
    color,
    statuses: defaultStatuses,
    folders: [],
    lists: [
      {
        id: generateId("list"),
        spaceId: id,
        name: "General",
        icon: "List",
      },
    ],
  };

  const nextWorkspaces = workspaces.map((w) =>
    w.id === activeWorkspaceId
      ? { ...w, spaces: [...w.spaces, newSpace] }
      : w,
  );

  return {
    workspaces: nextWorkspaces,
    activeSpaceId: id,
    activeListId: newSpace.lists[0].id,
    newSpace,
  };
}

/**
 * Updates metadata on an existing space in the active workspace.
 */
export function applyUpdateSpace(
  workspaces: Workspace[],
  activeWorkspaceId: string,
  spaceId: string,
  updates: Partial<Space>,
): Workspace[] {
  return workspaces.map((w) =>
    w.id === activeWorkspaceId
      ? {
          ...w,
          spaces: w.spaces.map((s) => (s.id === spaceId ? { ...s, ...updates } : s)),
        }
      : w,
  );
}

/**
 * Deletes a space and performs cascading task & list cleanups.
 */
export function applyDeleteSpace(
  workspaces: Workspace[],
  activeWorkspaceId: string,
  tasks: Task[],
  activeSpaceId: string,
  activeListId: string | null,
  selectedTaskId: string | null,
  lastSelectedTaskId: string | null,
  selectedTaskIds: string[],
  spaceId: string,
): {
  workspaces: Workspace[];
  tasks: Task[];
  activeSpaceId: string;
  activeListId: string | null;
  selectedTaskId: string | null;
  lastSelectedTaskId: string | null;
  selectedTaskIds: string[];
  tasksToDelete: Task[];
} {
  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId);
  const spaceToDelete = activeWs?.spaces.find((s) => s.id === spaceId);
  if (!spaceToDelete) {
    return {
      workspaces,
      tasks,
      activeSpaceId,
      activeListId,
      selectedTaskId,
      lastSelectedTaskId,
      selectedTaskIds,
      tasksToDelete: [],
    };
  }

  const listIdsToDelete = new Set<string>(getSpaceListIds(spaceToDelete));
  const remainingSpaces = activeWs?.spaces.filter((s) => s.id !== spaceId) || [];
  const nextSpace = remainingSpaces[0];
  const nextListId =
    nextSpace?.lists[0]?.id ||
    nextSpace?.folders[0]?.lists[0]?.id ||
    null;

  const tasksToDelete = tasks.filter((t) => listIdsToDelete.has(t.listId));
  const deletedTaskIds = new Set(tasksToDelete.map((t) => t.id));

  return {
    workspaces: workspaces.map((w) =>
      w.id === activeWorkspaceId
        ? { ...w, spaces: w.spaces.filter((s) => s.id !== spaceId) }
        : w,
    ),
    tasks: tasks
      .filter((t) => !listIdsToDelete.has(t.listId))
      .map((t) =>
        t.dependencies && t.dependencies.some((depId) => deletedTaskIds.has(depId))
          ? {
              ...t,
              dependencies: t.dependencies.filter((depId) => !deletedTaskIds.has(depId)),
            }
          : t,
      ),
    selectedTaskId:
      selectedTaskId && deletedTaskIds.has(selectedTaskId) ? null : selectedTaskId,
    lastSelectedTaskId:
      lastSelectedTaskId && deletedTaskIds.has(lastSelectedTaskId) ? null : lastSelectedTaskId,
    selectedTaskIds: selectedTaskIds.filter((id) => !deletedTaskIds.has(id)),
    activeSpaceId: activeSpaceId === spaceId ? (nextSpace?.id || "") : activeSpaceId,
    activeListId: activeSpaceId === spaceId ? nextListId : activeListId,
    tasksToDelete,
  };
}

/**
 * Reorders spaces within the active workspace.
 */
export function applyReorderSpaces(
  workspaces: Workspace[],
  activeWorkspaceId: string,
  orderedSpaceIds: string[],
): Workspace[] {
  return workspaces.map((w) =>
    w.id === activeWorkspaceId
      ? { ...w, spaces: reorderSpacesList(w.spaces, orderedSpaceIds) }
      : w,
  );
}

/**
 * Moves a space up or down within the active workspace.
 */
export function applyMoveSpace(
  workspaces: Workspace[],
  activeWorkspaceId: string,
  spaceId: string,
  direction: "up" | "down",
): Workspace[] {
  return workspaces.map((w) =>
    w.id === activeWorkspaceId
      ? { ...w, spaces: moveSpaceDirection(w.spaces, spaceId, direction) }
      : w,
  );
}

/**
 * Creates a folder inside a space.
 */
export function applyCreateFolder(
  workspaces: Workspace[],
  activeWorkspaceId: string,
  spaceId: string,
  name: string,
): {
  workspaces: Workspace[];
  newFolder: Folder;
} {
  const newFolder: Folder = {
    id: generateId("folder"),
    spaceId,
    name,
    lists: [],
  };

  const nextWorkspaces = workspaces.map((w) => {
    if (w.id !== activeWorkspaceId) return w;
    return {
      ...w,
      spaces: w.spaces.map((s) =>
        s.id === spaceId ? { ...s, folders: [...s.folders, newFolder] } : s,
      ),
    };
  });

  return { workspaces: nextWorkspaces, newFolder };
}

/**
 * Updates a folder name in the active workspace.
 */
export function applyUpdateFolder(
  workspaces: Workspace[],
  activeWorkspaceId: string,
  spaceId: string,
  folderId: string,
  name: string,
): Workspace[] {
  return workspaces.map((w) => {
    if (w.id !== activeWorkspaceId) return w;
    return {
      ...w,
      spaces: w.spaces.map((s) => {
        if (s.id !== spaceId) return s;
        return {
          ...s,
          folders: s.folders.map((f) => (f.id === folderId ? { ...f, name } : f)),
        };
      }),
    };
  });
}

/**
 * Deletes a folder and cascades deletion to nested lists and tasks.
 */
export function applyDeleteFolder(
  workspaces: Workspace[],
  activeWorkspaceId: string,
  tasks: Task[],
  activeListId: string | null,
  selectedTaskId: string | null,
  lastSelectedTaskId: string | null,
  selectedTaskIds: string[],
  spaceId: string,
  folderId: string,
): {
  workspaces: Workspace[];
  tasks: Task[];
  activeListId: string | null;
  selectedTaskId: string | null;
  lastSelectedTaskId: string | null;
  selectedTaskIds: string[];
  tasksToDelete: Task[];
} {
  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId);
  const currentSpace = activeWs?.spaces.find((s) => s.id === spaceId);
  const folderToDelete = currentSpace?.folders.find((f) => f.id === folderId);
  if (!folderToDelete) {
    return {
      workspaces,
      tasks,
      activeListId,
      selectedTaskId,
      lastSelectedTaskId,
      selectedTaskIds,
      tasksToDelete: [],
    };
  }

  const folderListIds = new Set(folderToDelete.lists.map((l) => l.id));

  let nextListId = activeListId;
  if (activeListId && folderListIds.has(activeListId)) {
    nextListId =
      currentSpace?.lists[0]?.id ||
      currentSpace?.folders.find((f) => f.id !== folderId)?.lists[0]?.id ||
      null;
  }

  const tasksToDelete = tasks.filter((t) => folderListIds.has(t.listId));
  const deletedTaskIds = new Set(tasksToDelete.map((t) => t.id));

  return {
    workspaces: workspaces.map((w) => {
      if (w.id !== activeWorkspaceId) return w;
      return {
        ...w,
        spaces: w.spaces.map((s) => {
          if (s.id !== spaceId) return s;
          return {
            ...s,
            folders: s.folders.filter((f) => f.id !== folderId),
          };
        }),
      };
    }),
    tasks: tasks
      .filter((t) => !folderListIds.has(t.listId))
      .map((t) =>
        t.dependencies && t.dependencies.some((depId) => deletedTaskIds.has(depId))
          ? {
              ...t,
              dependencies: t.dependencies.filter((depId) => !deletedTaskIds.has(depId)),
            }
          : t,
      ),
    selectedTaskId:
      selectedTaskId && deletedTaskIds.has(selectedTaskId) ? null : selectedTaskId,
    lastSelectedTaskId:
      lastSelectedTaskId && deletedTaskIds.has(lastSelectedTaskId) ? null : lastSelectedTaskId,
    selectedTaskIds: selectedTaskIds.filter((id) => !deletedTaskIds.has(id)),
    activeListId: nextListId,
    tasksToDelete,
  };
}

/**
 * Creates a list either top-level in space or nested inside a folder.
 */
export function applyCreateList(
  workspaces: Workspace[],
  activeWorkspaceId: string,
  spaceId: string,
  name: string,
  folderId?: string | null,
): {
  workspaces: Workspace[];
  activeListId: string;
  newList: List;
} {
  const newList: List = {
    id: generateId("list"),
    spaceId,
    folderId: folderId || undefined,
    name,
    icon: "ListTodo",
  };

  const nextWorkspaces = workspaces.map((w) => {
    if (w.id !== activeWorkspaceId) return w;
    return {
      ...w,
      spaces: w.spaces.map((s) => {
        if (s.id !== spaceId) return s;
        if (folderId) {
          return {
            ...s,
            folders: s.folders.map((f) =>
              f.id === folderId ? { ...f, lists: [...f.lists, newList] } : f,
            ),
          };
        }
        return { ...s, lists: [...s.lists, newList] };
      }),
    };
  });

  return {
    workspaces: nextWorkspaces,
    activeListId: newList.id,
    newList,
  };
}

/**
 * Updates a list metadata.
 */
export function applyUpdateList(
  workspaces: Workspace[],
  activeWorkspaceId: string,
  spaceId: string,
  listId: string,
  updates: Partial<List>,
  folderId?: string | null,
): Workspace[] {
  return workspaces.map((w) => {
    if (w.id !== activeWorkspaceId) return w;
    return {
      ...w,
      spaces: w.spaces.map((s) => {
        if (s.id !== spaceId) return s;
        if (folderId) {
          return {
            ...s,
            folders: s.folders.map((f) =>
              f.id === folderId
                ? {
                    ...f,
                    lists: f.lists.map((l) => (l.id === listId ? { ...l, ...updates } : l)),
                  }
                : f,
            ),
          };
        }
        return {
          ...s,
          lists: s.lists.map((l) => (l.id === listId ? { ...l, ...updates } : l)),
        };
      }),
    };
  });
}

/**
 * Deletes a list and cleans up tasks contained within it.
 */
export function applyDeleteList(
  workspaces: Workspace[],
  activeWorkspaceId: string,
  tasks: Task[],
  activeListId: string | null,
  selectedTaskId: string | null,
  lastSelectedTaskId: string | null,
  selectedTaskIds: string[],
  spaceId: string,
  listId: string,
  folderId?: string | null,
): {
  workspaces: Workspace[];
  tasks: Task[];
  activeListId: string | null;
  selectedTaskId: string | null;
  lastSelectedTaskId: string | null;
  selectedTaskIds: string[];
  tasksToDelete: Task[];
} {
  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId);
  const currentSpace = activeWs?.spaces.find((s) => s.id === spaceId);

  let nextListId = activeListId;
  if (activeListId === listId) {
    const otherDirectLists = currentSpace?.lists.filter((l) => l.id !== listId) || [];
    const otherFolderLists =
      currentSpace?.folders
        .flatMap((f) => f.lists)
        .filter((l) => l.id !== listId) || [];
    nextListId = otherDirectLists[0]?.id || otherFolderLists[0]?.id || null;
  }

  const tasksToDelete = tasks.filter((t) => t.listId === listId);
  const deletedTaskIds = new Set(tasksToDelete.map((t) => t.id));

  return {
    workspaces: workspaces.map((w) => {
      if (w.id !== activeWorkspaceId) return w;
      return {
        ...w,
        spaces: w.spaces.map((s) => {
          if (s.id !== spaceId) return s;
          if (folderId) {
            return {
              ...s,
              folders: s.folders.map((f) =>
                f.id === folderId
                  ? { ...f, lists: f.lists.filter((l) => l.id !== listId) }
                  : f,
              ),
            };
          }
          return {
            ...s,
            lists: s.lists.filter((l) => l.id !== listId),
          };
        }),
      };
    }),
    tasks: tasks
      .filter((t) => !deletedTaskIds.has(t.id))
      .map((t) =>
        t.dependencies && t.dependencies.some((depId) => deletedTaskIds.has(depId))
          ? {
              ...t,
              dependencies: t.dependencies.filter((depId) => !deletedTaskIds.has(depId)),
            }
          : t,
      ),
    selectedTaskId:
      selectedTaskId && deletedTaskIds.has(selectedTaskId) ? null : selectedTaskId,
    lastSelectedTaskId:
      lastSelectedTaskId && deletedTaskIds.has(lastSelectedTaskId) ? null : lastSelectedTaskId,
    selectedTaskIds: selectedTaskIds.filter((id) => !deletedTaskIds.has(id)),
    activeListId: nextListId,
    tasksToDelete,
  };
}

/**
 * Adds a new status column to a space.
 */
export function applyAddStatusToSpace(
  workspaces: Workspace[],
  activeWorkspaceId: string,
  spaceId: string,
  name: string,
  color: string,
): Workspace[] {
  return workspaces.map((w) => {
    if (w.id !== activeWorkspaceId) return w;
    return {
      ...w,
      spaces: w.spaces.map((s) => {
        if (s.id !== spaceId) return s;
        const newStatus: Status = {
          id: generateId("status"),
          name: name.toUpperCase(),
          color,
          category: "in_progress",
          order: s.statuses.length,
        };
        return { ...s, statuses: [...s.statuses, newStatus] };
      }),
    };
  });
}

/**
 * Updates a status in a space.
 */
export function applyUpdateSpaceStatus(
  workspaces: Workspace[],
  activeWorkspaceId: string,
  spaceId: string,
  statusId: string,
  updates: Partial<Status>,
): Workspace[] {
  return workspaces.map((w) => {
    if (w.id !== activeWorkspaceId) return w;
    return {
      ...w,
      spaces: w.spaces.map((s) => {
        if (s.id !== spaceId) return s;
        return {
          ...s,
          statuses: s.statuses.map((st) =>
            st.id === statusId ? { ...st, ...updates } : st,
          ),
        };
      }),
    };
  });
}

/**
 * Deletes a status from a space and reassigns orphan tasks to a fallback status.
 */
export function applyDeleteSpaceStatus(
  workspaces: Workspace[],
  activeWorkspaceId: string,
  tasks: Task[],
  spaceId: string,
  statusId: string,
  fallbackStatusId?: string,
): {
  workspaces: Workspace[];
  tasks: Task[];
} {
  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId);
  const currentSpace = activeWs?.spaces.find((s) => s.id === spaceId);
  const remainingStatuses = currentSpace?.statuses.filter((st) => st.id !== statusId) || [];
  const fallback = fallbackStatusId || remainingStatuses[0]?.id || "status-todo";

  return {
    workspaces: workspaces.map((w) => {
      if (w.id !== activeWorkspaceId) return w;
      return {
        ...w,
        spaces: w.spaces.map((s) => {
          if (s.id !== spaceId) return s;
          return {
            ...s,
            statuses: s.statuses.filter((st) => st.id !== statusId),
          };
        }),
      };
    }),
    tasks: tasks.map((t) => (t.statusId === statusId ? { ...t, statusId: fallback } : t)),
  };
}

