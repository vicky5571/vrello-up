import type { StateCreator } from "zustand";
import type { WorkspaceStore, SpaceSlice } from "./types";
import {
  applyCreateSpace,
  applyUpdateSpace,
  applyDeleteSpace,
  applyReorderSpaces,
  applyMoveSpace,
  applyCreateFolder,
  applyUpdateFolder,
  applyDeleteFolder,
  applyCreateList,
  applyUpdateList,
  applyDeleteList,
  applyAddStatusToSpace,
  applyUpdateSpaceStatus,
  applyDeleteSpaceStatus,
} from "@/lib/store/spacesOperations";
import { DEFAULT_STATUSES } from "@/lib/constants/seeds";
import {
  PRODUCT_SPACE_ID,
  DESIGN_SYSTEM_LIST_ID,
} from "@/lib/marcom/marcomIds";
import { syncWorkspaces, syncDeleteTask } from "./syncHelpers";

export const createSpaceSlice: StateCreator<
  WorkspaceStore,
  [],
  [],
  SpaceSlice
> = (set, get) => ({
  activeSpaceId: PRODUCT_SPACE_ID,
  activeListId: DESIGN_SYSTEM_LIST_ID,

  setActiveSpace: (id) => {
    set({ activeSpaceId: id, activeListId: null });
  },

  setActiveList: (id) => set({ activeListId: id }),

  createSpace: (name, icon, color) => {
    const { workspaces, activeSpaceId, activeListId, newSpace } = applyCreateSpace(
      get().workspaces,
      get().activeWorkspaceId,
      name,
      icon,
      color,
      DEFAULT_STATUSES,
    );
    set({ workspaces, activeSpaceId, activeListId });
    syncWorkspaces(get().workspaces);
    return newSpace;
  },

  updateSpace: (spaceId, updates) => {
    set((state) => ({
      workspaces: applyUpdateSpace(
        state.workspaces,
        state.activeWorkspaceId,
        spaceId,
        updates,
      ),
    }));
    syncWorkspaces(get().workspaces);
  },

  deleteSpace: (spaceId) => {
    const state = get();
    const res = applyDeleteSpace(
      state.workspaces,
      state.activeWorkspaceId,
      state.tasks,
      state.activeSpaceId,
      state.activeListId,
      state.selectedTaskId,
      state.lastSelectedTaskId,
      state.selectedTaskIds,
      spaceId,
    );
    set({
      workspaces: res.workspaces,
      tasks: res.tasks,
      activeSpaceId: res.activeSpaceId,
      activeListId: res.activeListId,
      selectedTaskId: res.selectedTaskId,
      lastSelectedTaskId: res.lastSelectedTaskId,
      selectedTaskIds: res.selectedTaskIds,
    });
    res.tasksToDelete.forEach((t) => syncDeleteTask(t.id));
    syncWorkspaces(get().workspaces);
  },

  reorderSpaces: (orderedSpaceIds) => {
    set((state) => ({
      workspaces: applyReorderSpaces(
        state.workspaces,
        state.activeWorkspaceId,
        orderedSpaceIds,
      ),
    }));
    syncWorkspaces(get().workspaces);
  },

  moveSpace: (spaceId, direction) => {
    set((state) => ({
      workspaces: applyMoveSpace(
        state.workspaces,
        state.activeWorkspaceId,
        spaceId,
        direction,
      ),
    }));
    syncWorkspaces(get().workspaces);
  },

  createFolder: (spaceId, name) => {
    const { workspaces, newFolder } = applyCreateFolder(
      get().workspaces,
      get().activeWorkspaceId,
      spaceId,
      name,
    );
    set({ workspaces });
    syncWorkspaces(get().workspaces);
    return newFolder;
  },

  updateFolder: (spaceId, folderId, name) => {
    set((state) => ({
      workspaces: applyUpdateFolder(
        state.workspaces,
        state.activeWorkspaceId,
        spaceId,
        folderId,
        name,
      ),
    }));
    syncWorkspaces(get().workspaces);
  },

  deleteFolder: (spaceId, folderId) => {
    const state = get();
    const res = applyDeleteFolder(
      state.workspaces,
      state.activeWorkspaceId,
      state.tasks,
      state.activeListId,
      state.selectedTaskId,
      state.lastSelectedTaskId,
      state.selectedTaskIds,
      spaceId,
      folderId,
    );
    set({
      workspaces: res.workspaces,
      tasks: res.tasks,
      activeListId: res.activeListId,
      selectedTaskId: res.selectedTaskId,
      lastSelectedTaskId: res.lastSelectedTaskId,
      selectedTaskIds: res.selectedTaskIds,
    });
    res.tasksToDelete.forEach((t) => syncDeleteTask(t.id));
    syncWorkspaces(get().workspaces);
  },

  createList: (spaceId, name, folderId) => {
    const { workspaces, activeListId, newList } = applyCreateList(
      get().workspaces,
      get().activeWorkspaceId,
      spaceId,
      name,
      folderId,
    );
    set({ workspaces, activeListId });
    syncWorkspaces(get().workspaces);
    return newList;
  },

  updateList: (spaceId, listId, updates, folderId) => {
    set((state) => ({
      workspaces: applyUpdateList(
        state.workspaces,
        state.activeWorkspaceId,
        spaceId,
        listId,
        updates,
        folderId,
      ),
    }));
    syncWorkspaces(get().workspaces);
  },

  deleteList: (spaceId, listId, folderId) => {
    const state = get();
    const res = applyDeleteList(
      state.workspaces,
      state.activeWorkspaceId,
      state.tasks,
      state.activeListId,
      state.selectedTaskId,
      state.lastSelectedTaskId,
      state.selectedTaskIds,
      spaceId,
      listId,
      folderId,
    );
    set({
      workspaces: res.workspaces,
      tasks: res.tasks,
      activeListId: res.activeListId,
      selectedTaskId: res.selectedTaskId,
      lastSelectedTaskId: res.lastSelectedTaskId,
      selectedTaskIds: res.selectedTaskIds,
    });
    res.tasksToDelete.forEach((t) => syncDeleteTask(t.id));
    syncWorkspaces(get().workspaces);
  },

  addStatusToSpace: (spaceId, name, color) => {
    set((state) => ({
      workspaces: applyAddStatusToSpace(
        state.workspaces,
        state.activeWorkspaceId,
        spaceId,
        name,
        color,
      ),
    }));
    syncWorkspaces(get().workspaces);
  },

  updateStatus: (spaceId, statusId, updates) => {
    set((state) => ({
      workspaces: applyUpdateSpaceStatus(
        state.workspaces,
        state.activeWorkspaceId,
        spaceId,
        statusId,
        updates,
      ),
    }));
    syncWorkspaces(get().workspaces);
  },

  deleteStatus: (spaceId, statusId, fallbackStatusId) => {
    const state = get();
    const res = applyDeleteSpaceStatus(
      state.workspaces,
      state.activeWorkspaceId,
      state.tasks,
      spaceId,
      statusId,
      fallbackStatusId,
    );
    set({
      workspaces: res.workspaces,
      tasks: res.tasks,
    });
    syncWorkspaces(get().workspaces);
  },
});
