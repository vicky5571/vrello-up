import type { StateCreator } from "zustand";
import type { WorkspaceStore, WorkspaceSlice } from "./types";
import { switchWorkspace, extractSpaceListIds } from "@/lib/store/workspaceSwitch";
import {
  buildInitialWorkspace,
  removeWorkspaceAndCascadeTasks,
  applyAddWorkspaceMember,
  applyRemoveWorkspaceMember,
} from "@/lib/store/workspaceCrud";
import {
  validateAndParseBackup,
  applyImportBackup,
} from "@/lib/store/backupOperations";
import { reconcileWorkspaces } from "@/lib/store/workspaceSync";
import { reconcileTasks } from "@/lib/tasks/taskSync";
import {
  SEED_USERS,
  DEFAULT_STATUSES,
  INITIAL_WORKSPACE,
} from "@/lib/constants/seeds";
import {
  syncWorkspaces,
  syncDeleteWorkspace,
  syncUpdateTask,
} from "./syncHelpers";

export const createWorkspaceSlice: StateCreator<
  WorkspaceStore,
  [],
  [],
  WorkspaceSlice
> = (set, get) => ({
  workspaces: [INITIAL_WORKSPACE],
  activeWorkspaceId: "ws-main",

  setActiveWorkspace: (id) => {
    set((state) =>
      switchWorkspace(state.workspaces, id, {
        activeWorkspaceId: state.activeWorkspaceId,
        activeSpaceId: state.activeSpaceId,
        activeListId: state.activeListId,
        selectedTaskId: state.selectedTaskId,
        selectedTaskIds: state.selectedTaskIds,
      }),
    );
    get().fetchServerTasks(id);
  },

  createWorkspace: (name, avatar) => {
    const state = get();
    const currentMember = state.workspaces
      .flatMap((w) => w.members || [])
      .find((m) => m.id === state.currentUserId);
    const members = currentMember ? [currentMember] : SEED_USERS;

    const newWs = buildInitialWorkspace({
      name,
      avatar,
      defaultStatuses: DEFAULT_STATUSES,
      members,
    });

    const nextWorkspaces = [...state.workspaces, newWs];
    const switchResult = switchWorkspace(nextWorkspaces, newWs.id, {
      activeWorkspaceId: state.activeWorkspaceId,
      activeSpaceId: state.activeSpaceId,
      activeListId: state.activeListId,
      selectedTaskId: state.selectedTaskId,
      selectedTaskIds: state.selectedTaskIds,
    });

    set({
      workspaces: nextWorkspaces,
      ...switchResult,
    });

    syncWorkspaces(nextWorkspaces);
    return newWs;
  },

  updateWorkspace: (id, updates) => {
    set((state) => ({
      workspaces: state.workspaces.map((w) =>
        w.id === id ? { ...w, ...updates } : w,
      ),
    }));
    syncWorkspaces(get().workspaces);
  },

  deleteWorkspace: (id) => {
    const state = get();
    const result = removeWorkspaceAndCascadeTasks(
      state.workspaces,
      state.tasks,
      id,
    );
    if (!result.success) {
      return false;
    }

    const nextActiveWsId =
      state.activeWorkspaceId === id
        ? result.remainingWorkspaces[0]?.id || ""
        : state.activeWorkspaceId;

    const switchResult = switchWorkspace(
      result.remainingWorkspaces,
      nextActiveWsId,
      {
        activeWorkspaceId: state.activeWorkspaceId,
        activeSpaceId: state.activeSpaceId,
        activeListId: state.activeListId,
        selectedTaskId: state.selectedTaskId,
        selectedTaskIds: state.selectedTaskIds,
      },
    );

    set({
      workspaces: result.remainingWorkspaces,
      tasks: result.remainingTasks,
      ...switchResult,
    });

    syncDeleteWorkspace(id);
    syncWorkspaces(result.remainingWorkspaces);
    return true;
  },

  addWorkspaceMember: (name, email, role = "staff") => {
    const { nextWorkspaces, newMember } = applyAddWorkspaceMember(
      get().workspaces,
      get().activeWorkspaceId,
      name,
      email,
      role,
    );
    set({ workspaces: nextWorkspaces });
    return newMember;
  },

  removeWorkspaceMember: (userId) => {
    const { nextWorkspaces } = applyRemoveWorkspaceMember(
      get().workspaces,
      get().activeWorkspaceId,
      userId,
    );
    set({ workspaces: nextWorkspaces });
  },

  importBackup: (data) => {
    const parsed = validateAndParseBackup(data, SEED_USERS);
    if (!parsed.isValid) return false;
    const nextState = applyImportBackup(get().workspaces, parsed);
    if (!nextState) return false;
    set(nextState);
    return true;
  },

  fetchServerTasks: async (workspaceId?: string) => {
    if (typeof window === "undefined") return;
    try {
      const targetWsId = workspaceId || get().activeWorkspaceId;
      const url = targetWsId
        ? `/api/tasks?workspaceId=${encodeURIComponent(targetWsId)}`
        : "/api/tasks";
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      const currentWorkspaces = get().workspaces;
      const { workspaces: reconciled, shouldSyncToServer } =
        reconcileWorkspaces(currentWorkspaces, data.workspaces);

      set((state) => {
        if (!Array.isArray(data.tasks)) {
          return { workspaces: reconciled };
        }

        if (targetWsId) {
          const targetWs = (reconciled || state.workspaces).find(
            (w) => w.id === targetWsId,
          );
          const targetListIds = new Set(
            (targetWs?.spaces || []).flatMap((s) => extractSpaceListIds(s)),
          );

          const { tasks: mergedTasks, tasksToPushToServer } =
            reconcileTasks(state.tasks, data.tasks, targetListIds);

          if (tasksToPushToServer.length > 0) {
            for (const t of tasksToPushToServer) {
              syncUpdateTask(t.id, t);
            }
          }

          return {
            tasks: mergedTasks,
            workspaces: reconciled,
          };
        }

        return {
          tasks: data.tasks,
          workspaces: reconciled,
        };
      });

      if (shouldSyncToServer) {
        syncWorkspaces(reconciled);
      }
    } catch (err) {
      console.warn("[vrello sync] failed to fetch tasks from server:", err);
    }
  },
});
