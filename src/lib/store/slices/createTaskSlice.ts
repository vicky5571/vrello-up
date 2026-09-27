import type { StateCreator } from "zustand";
import type { WorkspaceStore, TaskSlice } from "./types";
import {
  applyCreateTask,
  applyUpdateTask,
  applyBulkUpdateTasks,
  applyMoveTaskStatus,
  applyReorderTasksInStatus,
  applyAddSubtask,
  applyToggleSubtask,
  applyDeleteSubtask,
  applyToggleTaskSelection,
} from "@/lib/store/taskOperations";
import { applyDeleteTaskWithTrash } from "@/lib/store/trashOperations";
import {
  applyAddDependency,
  applyRemoveDependency,
} from "@/lib/store/dependencyOperations";
import {
  applyCreateTag,
  applyRenameTag,
  applyDeleteTag,
  applyToggleTaskTag,
} from "@/lib/store/tagOperations";
import { applyIncrementAutomationRun } from "@/lib/store/automationOperations";
import { findSpaceForListId, findWorkspaceForListId } from "@/lib/store/workspaceSync";
import { syncFieldEventOnTaskStatusChange } from "@/lib/tasks/eventTaskSync";
import {
  syncPlacementOnTaskStatusChange,
  type MarcomSyncResult,
} from "@/lib/tasks/placementTaskSync";
import { toast } from "sonner";
import { SEED_USERS, SEED_TAGS, INITIAL_TASKS } from "@/lib/constants/seeds";
import {
  syncCreateTask,
  syncUpdateTask,
  syncDeleteTask,
} from "./syncHelpers";

export const createTaskSlice: StateCreator<
  WorkspaceStore,
  [],
  [],
  TaskSlice
> = (set, get) => ({
  tasks: INITIAL_TASKS,
  tags: SEED_TAGS,
  selectedTaskId: null,
  lastSelectedTaskId: null,
  selectedTaskIds: [],
  presenceByTaskId: {},

  setSelectedTaskId: (id) =>
    set((state) => ({
      selectedTaskId: id,
      lastSelectedTaskId: id ?? state.lastSelectedTaskId,
    })),

  toggleTaskSelection: (id) =>
    set((state) => ({
      selectedTaskIds: applyToggleTaskSelection(state.selectedTaskIds, id)
        .nextSelectedIds,
    })),

  setTaskSelection: (ids) => set({ selectedTaskIds: [...new Set(ids)] }),
  clearTaskSelection: () => set({ selectedTaskIds: [] }),

  setPresenceByTaskId: (presenceByTaskId) => set({ presenceByTaskId }),

  applyRemoteTaskUpsert: (incomingTask) =>
    set((state) => {
      const exists = state.tasks.some((t) => t.id === incomingTask.id);
      if (exists) {
        return {
          tasks: state.tasks.map((t) =>
            t.id === incomingTask.id ? incomingTask : t,
          ),
        };
      }
      return { tasks: [incomingTask, ...state.tasks] };
    }),

  applyRemoteTaskDelete: (taskId) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== taskId),
      selectedTaskId:
        state.selectedTaskId === taskId ? null : state.selectedTaskId,
    })),

  createTask: (newTaskData) => {
    const state = get();
    const currentSpace = state.workspaces
      .flatMap((w) => w.spaces)
      .find((s) => s.id === state.activeSpaceId);
    const defaultListId =
      state.activeListId ||
      currentSpace?.lists[0]?.id ||
      currentSpace?.folders[0]?.lists[0]?.id ||
      "list-design-system";
    const { nextTasks, newTask } = applyCreateTask(
      state.tasks,
      newTaskData,
      defaultListId,
    );
    set({ tasks: nextTasks });
    syncCreateTask(newTask, state.activeSpaceId);
    return newTask;
  },

  updateTask: (id, updates) => {
    const { nextTasks, prevTask: prev, effectiveUpdates, escalatesToUrgent } =
      applyUpdateTask(get().tasks, id, updates);
    set({ tasks: nextTasks });
    syncUpdateTask(id, effectiveUpdates);
    if (updates.statusId && prev?.relatedMarcomId) {
      const currentWs = get().workspaces.find((w) => w.id === get().activeWorkspaceId);
      const spaces = currentWs?.spaces || [];
      const revertOnFailure = (result: MarcomSyncResult) => {
        if (!result.synced && !result.skipped && result.error) {
          const { nextTasks: reverted } = applyUpdateTask(
            get().tasks,
            id,
            { statusId: prev.statusId },
          );
          set({ tasks: reverted });
          syncUpdateTask(id, { statusId: prev.statusId });
          toast.error(result.error, { duration: 6000 });
        }
      };
      if (!prev.relatedMarcomType || prev.relatedMarcomType === "FIELD_EVENT") {
        syncFieldEventOnTaskStatusChange(prev, updates.statusId, spaces).then(revertOnFailure);
      }
      if (!prev.relatedMarcomType || prev.relatedMarcomType === "PLACEMENT") {
        syncPlacementOnTaskStatusChange(prev, updates.statusId, spaces).then(revertOnFailure);
      }
    }
    // rule-1 "Auto-assign Urgent Tasks": assign the lead and ensure a
    // due date of today. Nested updateTask can't refire (no priority key).
    if (!escalatesToUrgent || !get().automationEnabled["rule-1"]) return;
    const state = get();
    const task = state.tasks.find((t) => t.id === id);
    if (!task) return;
    const workspace = findWorkspaceForListId(state.workspaces, task.listId);
    const members =
      workspace && workspace.members.length > 0
        ? workspace.members
        : SEED_USERS;
    const lead =
      members.find((m) => m.role === "admin") ?? members[0];
    if (!lead) return;
    state.updateTask(id, {
      assignees: task.assignees.some((a) => a.id === lead.id)
        ? task.assignees
        : [...task.assignees, lead],
      dueDate: task.dueDate ?? new Date().toISOString().slice(0, 10),
    });
    state.logActivity(
      id,
      `Automation assigned ${lead.name} and set due date to today (priority → Urgent)`,
    );
    set((s) => ({
      automationRuns: applyIncrementAutomationRun(s.automationRuns, "rule-1"),
    }));
  },

  deleteTask: (id) => {
    set((state) => applyDeleteTaskWithTrash(state, id));
    // The server mirrors live tasks only; trash itself stays local.
    syncDeleteTask(id);
  },

  bulkUpdateTasks: (ids, updates) => {
    if (ids.length === 0) return;
    const { nextTasks, effectiveUpdatesMap } = applyBulkUpdateTasks(
      get().tasks,
      ids,
      updates,
    );
    set({ tasks: nextTasks });
    for (const [id, effective] of effectiveUpdatesMap.entries()) {
      syncUpdateTask(id, effective);
    }
  },

  moveTaskStatus: (taskId, newStatusId, newOrderIndex) => {
    const { nextTasks, prevTask: prev, isMoved } = applyMoveTaskStatus(
      get().tasks,
      taskId,
      newStatusId,
      newOrderIndex,
    );
    if (!isMoved) return;
    set({ tasks: nextTasks });

    syncUpdateTask(taskId, {
      statusId: newStatusId,
      orderIndex: newOrderIndex,
    });
    if (prev?.relatedMarcomId) {
      const currentWs = get().workspaces.find((w) => w.id === get().activeWorkspaceId);
      const spaces = currentWs?.spaces || [];
      const revertOnFailure = (result: MarcomSyncResult) => {
        if (!result.synced && !result.skipped && result.error) {
          const { nextTasks: reverted } = applyMoveTaskStatus(
            get().tasks,
            taskId,
            prev.statusId,
            prev.orderIndex,
          );
          set({ tasks: reverted });
          syncUpdateTask(taskId, { statusId: prev.statusId, orderIndex: prev.orderIndex });
          toast.error(result.error, { duration: 6000 });
        }
      };
      if (!prev.relatedMarcomType || prev.relatedMarcomType === "FIELD_EVENT") {
        syncFieldEventOnTaskStatusChange(prev, newStatusId, spaces).then(revertOnFailure);
      }
      if (!prev.relatedMarcomType || prev.relatedMarcomType === "PLACEMENT") {
        syncPlacementOnTaskStatusChange(prev, newStatusId, spaces).then(revertOnFailure);
      }
    }
    // rule-2 "Completion Notification": log completion with assignee count.
    if (!prev || prev.statusId === newStatusId) return;
    const state = get();
    if (!state.automationEnabled["rule-2"]) return;
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return;
    const space = findSpaceForListId(state.workspaces, task.listId);
    const oldCategory = space?.statuses.find(
      (s) => s.id === prev.statusId,
    )?.category;
    const next = space?.statuses.find((s) => s.id === newStatusId);
    const completed =
      (next?.category === "done" || next?.category === "closed") &&
      oldCategory !== "done" &&
      oldCategory !== "closed";
    if (!completed || !next) return;
    const count = task.assignees.length;
    state.logActivity(
      taskId,
      `Automation logged completion in ${next.name} — notified ${count} assignee${count === 1 ? "" : "s"}`,
    );
    set((s) => ({
      automationRuns: applyIncrementAutomationRun(s.automationRuns, "rule-2"),
    }));
  },

  reorderTasksInStatus: (statusId, orderedTaskIds) => {
    const { nextTasks } = applyReorderTasksInStatus(
      get().tasks,
      statusId,
      orderedTaskIds,
    );
    set({ tasks: nextTasks });
  },

  addSubtask: (taskId, title) => {
    const { nextTasks, updatedTask } = applyAddSubtask(
      get().tasks,
      taskId,
      title,
    );
    set({ tasks: nextTasks });
    if (updatedTask) syncUpdateTask(taskId, { subtasks: updatedTask.subtasks });
  },

  toggleSubtask: (taskId, subtaskId) => {
    const { nextTasks, completesAll, updatedTask } = applyToggleSubtask(
      get().tasks,
      taskId,
      subtaskId,
    );
    set({ tasks: nextTasks });
    if (updatedTask) syncUpdateTask(taskId, { subtasks: updatedTask.subtasks });

    // rule-3 "Subtask Progress Sync": all subtasks done on an
    // in-progress task advances it to the space's review status.
    if (!completesAll) return;
    const state = get();
    if (!state.automationEnabled["rule-3"]) return;
    const updated = state.tasks.find((t) => t.id === taskId);
    if (!updated) return;
    const space = findSpaceForListId(state.workspaces, updated.listId);
    const current = space?.statuses.find((s) => s.id === updated.statusId);
    if (!current || current.category !== "in_progress") return;
    const review = space!.statuses.find((s) => s.category === "review");
    if (!review || review.id === updated.statusId) return;
    state.moveTaskStatus(taskId, review.id);
    state.logActivity(
      taskId,
      `Automation moved task to ${review.name} — all subtasks completed`,
    );
    set((s) => ({
      automationRuns: {
        ...s.automationRuns,
        "rule-3": (s.automationRuns["rule-3"] || 0) + 1,
      },
    }));
  },

  deleteSubtask: (taskId, subtaskId) => {
    const { nextTasks, updatedTask } = applyDeleteSubtask(
      get().tasks,
      taskId,
      subtaskId,
    );
    set({ tasks: nextTasks });
    if (updatedTask) syncUpdateTask(taskId, { subtasks: updatedTask.subtasks });
  },

  addDependency: (taskId, dependsOnTaskId) => {
    const { tasks } = get();
    const { nextTasks, success } = applyAddDependency(tasks, taskId, dependsOnTaskId);
    if (!success) return false;
    set({ tasks: nextTasks });
    return true;
  },

  removeDependency: (taskId, dependsOnTaskId) => {
    const { tasks } = get();
    const { nextTasks } = applyRemoveDependency(tasks, taskId, dependsOnTaskId);
    set({ tasks: nextTasks });
  },

  createTag: (name, color) => {
    const { nextTags, newTag } = applyCreateTag(get().tags, name, color);
    set({ tags: nextTags });
    return newTag;
  },

  renameTag: (id, name) => {
    const { nextTags, nextTasks } = applyRenameTag(
      get().tags,
      get().tasks,
      id,
      name,
    );
    set({ tags: nextTags, tasks: nextTasks });
  },

  deleteTag: (id) => {
    const { nextTags, nextTasks } = applyDeleteTag(
      get().tags,
      get().tasks,
      id,
    );
    set({ tags: nextTags, tasks: nextTasks });
  },

  toggleTaskTag: (taskId, tagId) => {
    const { nextTasks } = applyToggleTaskTag(
      get().tasks,
      get().tags,
      taskId,
      tagId,
    );
    set({ tasks: nextTasks });
  },
});
