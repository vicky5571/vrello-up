import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Task, Space, ViewMode } from "@/types";
import { DEFAULT_STATUSES, INITIAL_SPACES, INITIAL_TASKS } from "@/lib/constants/seeds";
import { quotaAwareStorage, STORAGE_WARN_BYTES } from "@/lib/store/storeStorage";
import {
  PRODUCT_SPACE_ID,
  DESIGN_SYSTEM_LIST_ID,
} from "@/lib/marcom/marcomIds";
import { TRASH_LIMIT, TRASH_RETENTION_MS } from "@/lib/store/trashOperations";
import { DEFAULT_VIEW_PREFERENCES } from "@/lib/store/viewPreferencesOperations";
import { wouldCreateCycle } from "@/lib/store/dependencyOperations";
import { getSpaceListIds } from "@/lib/store/spacesOperations";
import {
  findSpaceForListId,
  reconcileSpaces,
} from "@/lib/store/spaceSync";
import type { WorkspaceStore, WorkspaceState, TrashedTask } from "./slices/types";
import { normalizeViewMode } from "./slices/createUiSlice";
import { createDataSlice } from "./slices/createDataSlice";
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
  reconcileSpaces,
  normalizeViewMode,
};

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (...a) => ({
      ...createDataSlice(...a),
      ...createSpaceSlice(...a),
      ...createTaskSlice(...a),
      ...createTrashSlice(...a),
      ...createAutomationSlice(...a),
      ...createUiSlice(...a),
    }),
    {
      name: "vrelloup-workspace-storage",
      version: 2,
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

          if (Array.isArray(state.spaces)) {
            if (!state.spaces.some((s) => s.id === state.activeSpaceId)) {
              state.activeSpaceId = state.spaces[0]?.id || PRODUCT_SPACE_ID;
              state.activeListId = null;
            }
          }
        }
      },
      migrate: (persistedState: unknown, version: number) => {
        const state = (persistedState || {}) as Record<string, unknown>;

        // Migration from multi-workspace (v0 or v1) to single-tenant (v2)
        if (version < 2) {
          let rawSpaces: Space[] = INITIAL_SPACES;

          if (Array.isArray(state.spaces) && state.spaces.length > 0) {
            rawSpaces = state.spaces as Space[];
          } else if (Array.isArray(state.workspaces) && state.workspaces.length > 0) {
            const firstWs = state.workspaces[0] as { spaces?: Space[] };
            if (Array.isArray(firstWs.spaces) && firstWs.spaces.length > 0) {
              rawSpaces = firstWs.spaces;
            }
          }

          rawSpaces = rawSpaces.map((s) => ({
            ...s,
            statuses: Array.isArray(s.statuses) && s.statuses.length > 0 ? s.statuses : DEFAULT_STATUSES,
            folders: Array.isArray(s.folders)
              ? s.folders.map((f) => ({
                  ...f,
                  lists: Array.isArray(f.lists) ? f.lists : [],
                }))
              : [],
            lists: Array.isArray(s.lists) ? s.lists : [],
          }));

          // Purge legacy space-eng if present
          rawSpaces = rawSpaces.filter((s) => s.id !== "space-eng");

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

          // Merge seeded tasks if missing
          const existingTaskIds = new Set(rawTasks.map((t) => t.id));
          const missingSeeds = INITIAL_TASKS.filter((t) => !existingTaskIds.has(t.id));
          if (missingSeeds.length > 0) {
            rawTasks = [...rawTasks, ...missingSeeds];
          }

          const engListIds = new Set(["list-sprint-tasks", "list-roadmap", "list-bugs"]);
          rawTasks = rawTasks.filter((t) => !engListIds.has(t.listId));

          const activeSpace = rawSpaces[0];
          const activeList =
            activeSpace?.lists[0]?.id ||
            activeSpace?.folders[0]?.lists[0]?.id ||
            "";

          return {
            spaces: rawSpaces,
            tasks: rawTasks,
            activeSpaceId:
              (typeof state.activeSpaceId === "string" && state.activeSpaceId !== "space-eng" && state.activeSpaceId) ||
              activeSpace?.id ||
              PRODUCT_SPACE_ID,
            activeListId:
              state.activeListId === null
                ? null
                : (typeof state.activeListId === "string" && !engListIds.has(state.activeListId) && state.activeListId) ||
                  activeList ||
                  DESIGN_SYSTEM_LIST_ID,
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
        spaces: state.spaces,
        tasks: state.tasks,
        trash: state.trash ?? [],
        channelMessages: state.channelMessages,
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
