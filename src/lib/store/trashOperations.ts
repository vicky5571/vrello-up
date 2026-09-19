import { type Task } from "@/types";

/** Trash keeps at most this many soft-deleted tasks (newest first). */
export const TRASH_LIMIT = 50;

/** Soft-deleted tasks older than this are auto-purged when trash is touched (30 days). */
export const TRASH_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

export interface TrashEntry {
  task: Task;
  deletedAt: string;
}

export interface TrashStateSlice {
  tasks: Task[];
  trash?: TrashEntry[];
  selectedTaskId: string | null;
  lastSelectedTaskId: string | null;
  selectedTaskIds: string[];
}

export interface RestoreTasksResult {
  nextState: {
    tasks: Task[];
    trash: TrashEntry[];
  };
  revivedCount: number;
  revivedTasks: Task[];
}

/**
 * Pure function to soft-delete a task into trash and clean up dependency links.
 */
export function applyDeleteTaskWithTrash<T extends TrashStateSlice>(
  state: T,
  id: string,
  nowIso: string = new Date().toISOString(),
): T {
  const doomed = state.tasks.find((t) => t.id === id);

  return {
    ...state,
    tasks: state.tasks
      .filter((t) => t.id !== id)
      .map((t) =>
        t.dependencies && t.dependencies.includes(id)
          ? {
              ...t,
              dependencies: t.dependencies.filter((depId) => depId !== id),
              updatedAt: nowIso,
            }
          : t,
      ),
    trash: doomed
      ? [{ task: doomed, deletedAt: nowIso }, ...(state.trash ?? [])].slice(
          0,
          TRASH_LIMIT,
        )
      : (state.trash ?? []),
    selectedTaskId: state.selectedTaskId === id ? null : state.selectedTaskId,
    lastSelectedTaskId: state.lastSelectedTaskId === id ? null : state.lastSelectedTaskId,
    selectedTaskIds: state.selectedTaskIds.filter((t) => t !== id),
  };
}

/**
 * Pure function to revive soft-deleted tasks from trash.
 */
export function applyRestoreTasksFromTrash(
  tasks: Task[],
  trash: TrashEntry[] = [],
  ids: string[],
  nowIso: string = new Date().toISOString(),
): RestoreTasksResult {
  if (!ids || ids.length === 0) {
    return {
      nextState: { tasks, trash },
      revivedCount: 0,
      revivedTasks: [],
    };
  }

  const targets = new Set(ids);
  const entries = trash.filter((e) => targets.has(e.task.id));

  if (entries.length === 0) {
    return {
      nextState: { tasks, trash },
      revivedCount: 0,
      revivedTasks: [],
    };
  }

  const revivedIds = new Set(entries.map((e) => e.task.id));
  const revivedTasks: Task[] = entries.map((e) => ({ ...e.task, updatedAt: nowIso }));

  return {
    nextState: {
      trash: trash.filter((e) => !revivedIds.has(e.task.id)),
      tasks: [...revivedTasks, ...tasks],
    },
    revivedCount: entries.length,
    revivedTasks,
  };
}

/**
 * Pure function to permanently delete a task from trash.
 */
export function applyPermanentlyDeleteTask(
  trash: TrashEntry[] = [],
  id: string,
): TrashEntry[] {
  return trash.filter((e) => e.task.id !== id);
}

/**
 * Pure function to empty all trash entries.
 */
export function applyEmptyTrash(): TrashEntry[] {
  return [];
}

/**
 * Pure function to purge expired trash entries based on retention window.
 */
export function applyPurgeExpiredTrash(
  trash: TrashEntry[] = [],
  cutoffMs: number = Date.now() - TRASH_RETENTION_MS,
): TrashEntry[] {
  return trash.filter((e) => new Date(e.deletedAt).getTime() >= cutoffMs);
}

