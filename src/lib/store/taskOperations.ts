import { type Task } from "@/types";
import { generateId } from "@/lib/utils";
import { isPlacementTask } from "@/lib/tasks/placementTaskSync";

/**
 * Pure function to construct a new Task and prepend to tasks list.
 */
export function applyCreateTask(
  tasks: Task[],
  newTaskData: Omit<Task, "id" | "createdAt" | "updatedAt" | "listId"> & {
    listId?: string | null;
  },
  defaultListId: string,
  nowIso: string = new Date().toISOString(),
): { nextTasks: Task[]; newTask: Task } {
  const id = generateId("task");
  const targetListId = newTaskData.listId || defaultListId;
  const newTask: Task = {
    ...newTaskData,
    listId: targetListId,
    id,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  return {
    nextTasks: [newTask, ...tasks],
    newTask,
  };
}

/**
 * Pure function to update task fields, enforcing title immutability for placement tasks.
 */
export function applyUpdateTask(
  tasks: Task[],
  id: string,
  updates: Partial<Task>,
  nowIso: string = new Date().toISOString(),
): {
  nextTasks: Task[];
  prevTask?: Task;
  effectiveUpdates: Partial<Task>;
  escalatesToUrgent: boolean;
} {
  const prev = tasks.find((t) => t.id === id);
  const effectiveUpdates =
    updates.title && prev && isPlacementTask(prev)
      ? { ...updates, title: prev.title }
      : updates;
  const escalatesToUrgent =
    !!prev &&
    effectiveUpdates.priority === "urgent" &&
    prev.priority !== "urgent";

  const nextTasks = tasks.map((task) =>
    task.id === id
      ? { ...task, ...effectiveUpdates, updatedAt: nowIso }
      : task,
  );

  return { nextTasks, prevTask: prev, effectiveUpdates, escalatesToUrgent };
}

/**
 * Pure function to bulk update multiple tasks by id.
 */
export function applyBulkUpdateTasks(
  tasks: Task[],
  ids: string[],
  updates: Partial<Task>,
  nowIso: string = new Date().toISOString(),
): { nextTasks: Task[]; effectiveUpdatesMap: Map<string, Partial<Task>> } {
  const targets = new Set(ids);
  const effectiveUpdatesMap = new Map<string, Partial<Task>>();

  const nextTasks = tasks.map((task) => {
    if (!targets.has(task.id)) return task;
    const effective =
      updates.title && isPlacementTask(task)
        ? { ...updates, title: task.title }
        : updates;
    effectiveUpdatesMap.set(task.id, effective);
    return { ...task, ...effective, updatedAt: nowIso };
  });

  return { nextTasks, effectiveUpdatesMap };
}

/**
 * Pure function to move a task's status and optionally set orderIndex.
 */
export function applyMoveTaskStatus(
  tasks: Task[],
  taskId: string,
  newStatusId: string,
  newOrderIndex?: number,
  nowIso: string = new Date().toISOString(),
): { nextTasks: Task[]; prevTask?: Task; isMoved: boolean } {
  const prev = tasks.find((t) => t.id === taskId);
  if (!prev) return { nextTasks: tasks, isMoved: false };

  const nextTasks = tasks.map((t) => {
    if (t.id === taskId) {
      return {
        ...t,
        statusId: newStatusId,
        orderIndex: newOrderIndex !== undefined ? newOrderIndex : t.orderIndex,
        updatedAt: nowIso,
      };
    }
    return t;
  });

  return { nextTasks, prevTask: prev, isMoved: true };
}

/**
 * Pure function to reorder tasks within a specific status.
 */
export function applyReorderTasksInStatus(
  tasks: Task[],
  statusId: string,
  orderedTaskIds: string[],
): { nextTasks: Task[] } {
  const idToIndex = new Map(orderedTaskIds.map((id, index) => [id, index]));
  const nextTasks = tasks.map((task) => {
    if (task.statusId === statusId && idToIndex.has(task.id)) {
      return { ...task, orderIndex: idToIndex.get(task.id)! };
    }
    return task;
  });
  return { nextTasks };
}

/**
 * Pure function to add a subtask to a task.
 */
export function applyAddSubtask(
  tasks: Task[],
  taskId: string,
  title: string,
  nowIso: string = new Date().toISOString(),
): { nextTasks: Task[]; updatedTask?: Task } {
  const newSubtask = {
    id: generateId("sub"),
    title,
    completed: false,
    createdAt: nowIso,
  };
  let updatedTask: Task | undefined;
  const nextTasks = tasks.map((t) => {
    if (t.id === taskId) {
      updatedTask = {
        ...t,
        subtasks: [...t.subtasks, newSubtask],
        updatedAt: nowIso,
      };
      return updatedTask;
    }
    return t;
  });
  return { nextTasks, updatedTask };
}

/**
 * Pure function to toggle a subtask's completion status.
 */
export function applyToggleSubtask(
  tasks: Task[],
  taskId: string,
  subtaskId: string,
  nowIso: string = new Date().toISOString(),
): { nextTasks: Task[]; completesAll: boolean; updatedTask?: Task } {
  const task = tasks.find((t) => t.id === taskId);
  const target = task?.subtasks.find((st) => st.id === subtaskId);
  const completesAll =
    !!task &&
    !!target &&
    !target.completed &&
    task.subtasks.length > 0 &&
    task.subtasks.every((st) => st.id === subtaskId || st.completed);

  let updatedTask: Task | undefined;
  const nextTasks = tasks.map((t) => {
    if (t.id === taskId) {
      updatedTask = {
        ...t,
        subtasks: t.subtasks.map((st) =>
          st.id === subtaskId ? { ...st, completed: !st.completed } : st,
        ),
        updatedAt: nowIso,
      };
      return updatedTask;
    }
    return t;
  });

  return { nextTasks, completesAll, updatedTask };
}

/**
 * Pure function to delete a subtask from a task.
 */
export function applyDeleteSubtask(
  tasks: Task[],
  taskId: string,
  subtaskId: string,
  nowIso: string = new Date().toISOString(),
): { nextTasks: Task[]; updatedTask?: Task } {
  let updatedTask: Task | undefined;
  const nextTasks = tasks.map((t) => {
    if (t.id === taskId) {
      updatedTask = {
        ...t,
        subtasks: t.subtasks.filter((st) => st.id !== subtaskId),
        updatedAt: nowIso,
      };
      return updatedTask;
    }
    return t;
  });
  return { nextTasks, updatedTask };
}

/**
 * Pure function to toggle selection of a task id.
 */
export function applyToggleTaskSelection(
  selectedTaskIds: string[],
  id: string,
): { nextSelectedIds: string[] } {
  const nextSelectedIds = selectedTaskIds.includes(id)
    ? selectedTaskIds.filter((t) => t !== id)
    : [...selectedTaskIds, id];
  return { nextSelectedIds };
}
