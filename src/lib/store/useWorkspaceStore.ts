import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { quotaAwareStorage, STORAGE_WARN_BYTES } from "@/lib/store/storeStorage";
import type { WorkspaceStore, WorkspaceState, TrashedTask } from "./slices/types";
import { normalizeViewMode, DEFAULT_VIEW_PREFERENCES } from "./slices/createUiSlice";
import { createDataSlice } from "./slices/createDataSlice";
import { createUiSlice } from "./slices/createUiSlice";

export type { WorkspaceStore, WorkspaceState, TrashedTask };
export {
  DEFAULT_VIEW_PREFERENCES,
  STORAGE_WARN_BYTES,
  quotaAwareStorage,
  normalizeViewMode,
};

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (...a) => ({
      ...createDataSlice(...a),
      ...createUiSlice(...a),
      // Fallback stubs for legacy task/space calls during transition
      spaces: [],
      tasks: [],
      tags: [],
      trash: [],
      channelMessages: [],
      activeSpaceId: "",
      activeListId: null,
      selectedTaskId: null,
      lastSelectedTaskId: null,
      selectedTaskIds: [],
      presenceByTaskId: {},
      automationEnabled: {},
      automationRuns: {},
      customAutomations: [],
      setActiveSpace: () => {},
      setActiveList: () => {},
      createSpace: () => ({ id: "", name: "", icon: "", color: "", statuses: [], folders: [], lists: [] }),
      updateSpace: () => {},
      deleteSpace: () => {},
      reorderSpaces: () => {},
      moveSpace: () => {},
      createFolder: () => ({ id: "", spaceId: "", name: "", lists: [] }),
      updateFolder: () => {},
      deleteFolder: () => {},
      createList: () => ({ id: "", spaceId: "", name: "" }),
      updateList: () => {},
      deleteList: () => {},
      addStatusToSpace: () => {},
      updateStatus: () => {},
      deleteStatus: () => {},
      setSelectedTaskId: () => {},
      toggleTaskSelection: () => {},
      setTaskSelection: () => {},
      clearTaskSelection: () => {},
      setPresenceByTaskId: () => {},
      applyRemoteTaskUpsert: () => {},
      applyRemoteTaskDelete: () => {},
      // @ts-expect-error: stub for legacy task caller
      createTask: () => ({ id: "" }),
      updateTask: () => {},
      deleteTask: () => {},
      bulkUpdateTasks: () => {},
      moveTaskStatus: () => {},
      reorderTasksInStatus: () => {},
      addSubtask: () => {},
      toggleSubtask: () => {},
      deleteSubtask: () => {},
      addDependency: () => false,
      removeDependency: () => {},
      createTag: () => ({ id: "", name: "", color: "" }),
      renameTag: () => {},
      deleteTag: () => {},
      toggleTaskTag: () => {},
      restoreTasks: () => 0,
      permanentlyDeleteTask: () => {},
      emptyTrash: () => {},
      purgeExpiredTrash: () => {},
      addComment: () => {},
      deleteComment: () => {},
      logActivity: () => {},
      addChannelMessage: () => {},
      setAutomationEnabled: () => {},
      // @ts-expect-error: stub for legacy automation caller
      addCustomAutomation: () => ({ id: "" }),
      removeCustomAutomation: () => {},
      toggleCustomAutomation: () => {},
      runAutomationsForTrigger: async () => 0,
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
          if ((state.activeView as string) === "table" || (state.activeView as string) === "gantt") {
            state.activeView = "list";
          }
          if ((state.lastMarcomView as string) === "content") {
            state.lastMarcomView = "content-planner";
          }
          if ((state.lastMarcomView as string) === "profile" || (state.lastMarcomView as string) === "users") {
            state.lastMarcomView = "events";
          }
          if ((state.lastTaskView as string) === "table" || (state.lastTaskView as string) === "gantt") {
            state.lastTaskView = "list";
          }
          if ((state.lastTaskView as string) === "profile" || (state.lastTaskView as string) === "users") {
            state.lastTaskView = "board";
          }
        }
      },
      partialize: (state) => ({
        activeView: state.activeView,
        appMode: state.appMode,
        lastTaskView: state.lastTaskView,
        lastMarcomView: state.lastMarcomView,
        currentUserId: state.currentUserId,
        lastSeenNotificationsAt: state.lastSeenNotificationsAt,
      }),
    },
  ),
);
