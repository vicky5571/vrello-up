import type { StateCreator } from "zustand";
import type { WorkspaceStore, TrashSlice } from "./types";
import {
  applyRestoreTasksFromTrash,
  applyPermanentlyDeleteTask,
  applyEmptyTrash,
  applyPurgeExpiredTrash,
} from "@/lib/store/trashOperations";
import { syncCreateTask } from "./syncHelpers";

export const createTrashSlice: StateCreator<
  WorkspaceStore,
  [],
  [],
  TrashSlice
> = (set, get) => ({
  trash: [],

  restoreTasks: (ids) => {
    const result = applyRestoreTasksFromTrash(get().tasks, get().trash, ids);
    if (result.revivedCount === 0) return 0;
    set((state) => ({
      ...state,
      tasks: result.nextState.tasks,
      trash: result.nextState.trash,
    }));
    // Re-persist revived tasks; the earlier soft-delete removed them.
    for (const entry of result.revivedTasks) syncCreateTask(entry);
    return result.revivedCount;
  },

  permanentlyDeleteTask: (id) =>
    set((state) => ({
      trash: applyPermanentlyDeleteTask(state.trash, id),
    })),

  emptyTrash: () => set({ trash: applyEmptyTrash() }),

  purgeExpiredTrash: () => {
    set((state) => ({
      trash: applyPurgeExpiredTrash(state.trash),
    }));
  },
});
