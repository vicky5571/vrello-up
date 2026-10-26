import type { StateCreator } from "zustand";
import type { WorkspaceStore, DataSlice } from "./types";
import {
  validateAndParseBackup,
  applyImportBackup,
} from "@/lib/store/backupOperations";
import { reconcileSpaces } from "@/lib/store/spaceSync";
import { reconcileTasks } from "@/lib/tasks/taskSync";
import { INITIAL_SPACES, SEED_USERS } from "@/lib/constants/seeds";
import { syncUpdateTask } from "./syncHelpers";

export const createDataSlice: StateCreator<
  WorkspaceStore,
  [],
  [],
  DataSlice
> = (set, get) => ({
  spaces: INITIAL_SPACES,
  users: SEED_USERS,

  addUser: (name, email, role) => {
    const newUser = {
      id: `user-${Date.now()}`,
      name,
      email,
      role,
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80`,
    };
    set((state) => ({ users: [...state.users, newUser] }));
    return newUser;
  },

  removeUser: (userId) => {
    set((state) => ({ users: state.users.filter((u) => u.id !== userId) }));
  },

  importBackup: (data) => {
    const parsed = validateAndParseBackup(data);
    if (!parsed.isValid) return false;
    const nextState = applyImportBackup(get().spaces, parsed);
    if (!nextState) return false;
    set(nextState);
    return true;
  },

  fetchServerData: async () => {
    if (typeof window === "undefined") return;
    try {
      const res = await fetch("/api/tasks");
      if (!res.ok) return;
      const data = await res.json();
      const currentSpaces = get().spaces;
      const serverSpaces = data.spaces || [];
      const { spaces: reconciled } = reconcileSpaces(currentSpaces, serverSpaces);

      set((state) => {
        if (!Array.isArray(data.tasks)) {
          return { spaces: reconciled };
        }

        const targetListIds = new Set(
          reconciled.flatMap((s) => [
            ...s.lists.map((l) => l.id),
            ...s.folders.flatMap((f) => f.lists.map((l) => l.id)),
          ]),
        );

        const { tasks: mergedTasks, tasksToPushToServer } = reconcileTasks(
          state.tasks,
          data.tasks,
          targetListIds,
        );

        if (tasksToPushToServer.length > 0) {
          for (const t of tasksToPushToServer) {
            syncUpdateTask(t.id, t);
          }
        }

        return {
          tasks: mergedTasks,
          spaces: reconciled,
        };
      });
    } catch (err) {
      console.warn("[vrello sync] failed to fetch data from server:", err);
    }
  },

  fetchServerTasks: async () => {
    return get().fetchServerData();
  },
});
