import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Workspace, Task, ViewMode } from "@/types";
import { DEFAULT_STATUSES, INITIAL_SPACES, INITIAL_TASKS, INITIAL_WORKSPACE, SEED_USERS } from "@/lib/constants/seeds";
import { quotaAwareStorage, STORAGE_WARN_BYTES } from "@/lib/store/storeStorage";
import { TRASH_LIMIT, TRASH_RETENTION_MS } from "@/lib/store/trashOperations";
import { DEFAULT_VIEW_PREFERENCES } from "@/lib/store/viewPreferencesOperations";
import { wouldCreateCycle } from "@/lib/store/dependencyOperations";
import { getSpaceListIds } from "@/lib/store/spacesOperations";
import {
  findSpaceForListId,
  findWorkspaceForListId,
  reconcileWorkspaces,
} from "@/lib/store/workspaceSync";
import type { WorkspaceStore, WorkspaceState, TrashedTask } from "./slices/types";
import { normalizeViewMode } from "./slices/createUiSlice";
import { createWorkspaceSlice } from "./slices/createWorkspaceSlice";
import { createSpaceSlice } from "./slices/createSpaceSlice";
import { createTaskSlice } from "./slices/createTaskSlice";
import { createTrashSlice } from "./slices/createTrashSlice";
import { createAutomationSlice } from "./slices/createAutomationSlice";
import { createUiSlice } from "./slices/createUiSlice";

// Re-export domain contracts and utilities for backward compatibility
export type { WorkspaceStore, WorkspaceState, TrashedTask };
export {
  DEFAULT_VIEW_PREFERENCES,
  wouldCreateCycle,
  getSpaceListIds,
  STORAGE_WARN_BYTES,
  quotaAwareStorage,
  TRASH_LIMIT,
  TRASH_RETENTION_MS,
  findSpaceForListId,
  findWorkspaceForListId,
  reconcileWorkspaces,
  normalizeViewMode,
};

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (...a) => ({
      ...createWorkspaceSlice(...a),
      ...createSpaceSlice(...a),
      ...createTaskSlice(...a),
      ...createTrashSlice(...a),
      ...createAutomationSlice(...a),
      ...createUiSlice(...a),
    }),
    {
      name: "vrelloup-workspace-storage",
      version: 1,
      storage: createJSONStorage(() => quotaAwareStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          if ((state.activeView as string) === "content") {
            state.activeView = "content-planner";
          }
          if ((state.activeView as string) === "table") {
            state.activeView = "list";
          }
          if ((state.lastMarcomView as string) === "content") {
            state.lastMarcomView = "content-planner";
          }
          if ((state.lastTaskView as string) === "table") {
            state.lastTaskView = "list";
          }

          if (Array.isArray(state.workspaces)) {
            state.workspaces = state.workspaces.map((w) => ({
              ...w,
              members: (w.members || []).map((m) => {
                if (m.id === "user-1" && !m.role) return { ...m, role: "admin" as const };
                if (m.id.startsWith("google-") && !m.role) return { ...m, role: "admin" as const };
                return m;
              }),
            }));

            const activeWs = state.workspaces.find((w) => w.id === state.activeWorkspaceId);
            if (activeWs && !activeWs.spaces.some((s) => s.id === state.activeSpaceId)) {
              state.activeSpaceId = activeWs.spaces[0]?.id || "";
              state.activeListId = null;
            }
          }
        }
      },
      migrate: (persistedState: unknown, version: number) => {
        const state = (persistedState || {}) as Record<string, unknown>;

        // Migration from unversioned (v0) to v1
        if (version === 0 || !version) {
          let rawWorkspaces = Array.isArray(state.workspaces) && state.workspaces.length > 0
            ? (state.workspaces as Workspace[]).map((w) => ({
                ...w,
                spaces: Array.isArray(w.spaces)
                  ? w.spaces.map((s) => ({
                      ...s,
                      statuses: Array.isArray(s.statuses) && s.statuses.length > 0 ? s.statuses : DEFAULT_STATUSES,
                      folders: Array.isArray(s.folders)
                        ? s.folders.map((f) => ({
                            ...f,
                            lists: Array.isArray(f.lists) ? f.lists : [],
                          }))
                        : [],
                      lists: Array.isArray(s.lists) ? s.lists : [],
                    }))
                  : INITIAL_SPACES,
                members: Array.isArray(w.members) ? w.members : SEED_USERS,
              }))
            : [INITIAL_WORKSPACE];

          let rawTasks = Array.isArray(state.tasks)
            ? (state.tasks as Task[]).map((t) => ({
                ...t,
                subtasks: Array.isArray(t.subtasks) ? t.subtasks : [],
                tags: Array.isArray(t.tags) ? t.tags : [],
                assignees: Array.isArray(t.assignees) ? t.assignees : [],
                comments: Array.isArray(t.comments) ? t.comments : [],
                activities: Array.isArray(t.activities) ? t.activities : [],
                dependencies: Array.isArray(t.dependencies) ? t.dependencies : [],
                orderIndex: typeof t.orderIndex === "number" ? t.orderIndex : 0,
              }))
            : INITIAL_TASKS;

          // Merge seeded posts if missing from persisted tasks
          const existingTaskIds = new Set(rawTasks.map((t) => t.id));
          const missingSeeds = INITIAL_TASKS.filter((t) => !existingTaskIds.has(t.id));
          if (missingSeeds.length > 0) {
            rawTasks = [...rawTasks, ...missingSeeds];
          }

          // Ensure space-eng and its lists from previous client localStorage are purged
          rawWorkspaces = rawWorkspaces.map((w) => ({
            ...w,
            spaces: (w.spaces || []).filter((s) => s.id !== "space-eng"),
          }));

          const engListIds = new Set(["list-sprint-tasks", "list-roadmap", "list-bugs"]);
          rawTasks = rawTasks.filter((t) => !engListIds.has(t.listId));

          const activeWs = rawWorkspaces[0];
          const activeSpace = activeWs?.spaces[0];
          const activeList =
            activeSpace?.lists[0]?.id ||
            activeSpace?.folders[0]?.lists[0]?.id ||
            "";

          return {
            workspaces: rawWorkspaces,
            tasks: rawTasks,
            activeWorkspaceId: (typeof state.activeWorkspaceId === "string" && state.activeWorkspaceId) || activeWs?.id || "ws-main",
            activeSpaceId: (typeof state.activeSpaceId === "string" && state.activeSpaceId !== "space-eng" && state.activeSpaceId) || activeSpace?.id || "space-product",
            activeListId: state.activeListId === null ? null : ((typeof state.activeListId === "string" && !engListIds.has(state.activeListId) && state.activeListId) || activeList || "list-design-system"),
            activeView: normalizeViewMode((state.activeView as ViewMode) || "list"),
          };
        }

        if (state) {
          if (state.activeView === "content") {
            state.activeView = "content-planner";
          }
          if (state.activeView === "table") {
            state.activeView = "list";
          }
          if (state.lastMarcomView === "content") {
            state.lastMarcomView = "content-planner";
          }
          if (state.lastTaskView === "table") {
            state.lastTaskView = "list";
          }
        }

        return state;
      },
      partialize: (state) => ({
        workspaces: state.workspaces,
        tasks: state.tasks,
        trash: state.trash ?? [],
        channelMessages: state.channelMessages,
        activeWorkspaceId: state.activeWorkspaceId,
        activeSpaceId: state.activeSpaceId,
        activeListId: state.activeListId,
        activeView: state.activeView,
        appMode: state.appMode,
        lastTaskView: state.lastTaskView,
        lastMarcomView: state.lastMarcomView,
        currentUserId: state.currentUserId,
        tags: state.tags,
        customAutomations: state.customAutomations,
        automationEnabled: state.automationEnabled,
        automationRuns: state.automationRuns,
        lastSeenNotificationsAt: state.lastSeenNotificationsAt,
      }),
    },
  ),
);
