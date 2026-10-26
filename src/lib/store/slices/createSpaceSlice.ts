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
import { syncDeleteTasks } from "./syncHelpers";

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
    const { spaces, activeSpaceId, activeListId, newSpace } = applyCreateSpace(
      get().spaces,
      name,
      icon,
      color,
      DEFAULT_STATUSES,
    );
    set({ spaces, activeSpaceId, activeListId });
    return newSpace;
  },

  updateSpace: (spaceId, updates) => {
    set((state) => ({
      spaces: applyUpdateSpace(state.spaces, spaceId, updates),
    }));
  },

  deleteSpace: (spaceId) => {
    const state = get();
    const res = applyDeleteSpace(
      state.spaces,
      state.tasks,
      state.activeSpaceId,
      state.activeListId,
      state.selectedTaskId,
      state.lastSelectedTaskId,
      state.selectedTaskIds,
      spaceId,
    );
    set({
      spaces: res.spaces,
      tasks: res.tasks,
      activeSpaceId: res.activeSpaceId,
      activeListId: res.activeListId,
      selectedTaskId: res.selectedTaskId,
      lastSelectedTaskId: res.lastSelectedTaskId,
      selectedTaskIds: res.selectedTaskIds,
    });
    syncDeleteTasks(res.tasksToDelete.map((t) => t.id));
  },

  reorderSpaces: (orderedSpaceIds) => {
    set((state) => ({
      spaces: applyReorderSpaces(state.spaces, orderedSpaceIds),
    }));
  },

  moveSpace: (spaceId, direction) => {
    set((state) => ({
      spaces: applyMoveSpace(state.spaces, spaceId, direction),
    }));
  },

  createFolder: (spaceId, name) => {
    const { spaces, newFolder } = applyCreateFolder(
      get().spaces,
      spaceId,
      name,
    );
    set({ spaces });
    return newFolder;
  },

  updateFolder: (spaceId, folderId, name) => {
    set((state) => ({
      spaces: applyUpdateFolder(
        state.spaces,
        spaceId,
        folderId,
        name,
      ),
    }));
  },

  deleteFolder: (spaceId, folderId) => {
    const state = get();
    const res = applyDeleteFolder(
      state.spaces,
      state.tasks,
      state.activeListId,
      state.selectedTaskId,
      state.lastSelectedTaskId,
      state.selectedTaskIds,
      spaceId,
      folderId,
    );
    set({
      spaces: res.spaces,
      tasks: res.tasks,
      activeListId: res.activeListId,
      selectedTaskId: res.selectedTaskId,
      lastSelectedTaskId: res.lastSelectedTaskId,
      selectedTaskIds: res.selectedTaskIds,
    });
    syncDeleteTasks(res.tasksToDelete.map((t) => t.id));
  },

  createList: (spaceId, name, folderId) => {
    const { spaces, activeListId, newList } = applyCreateList(
      get().spaces,
      spaceId,
      name,
      folderId,
    );
    set({ spaces, activeListId });
    return newList;
  },

  updateList: (spaceId, listId, updates, folderId) => {
    set((state) => ({
      spaces: applyUpdateList(
        state.spaces,
        spaceId,
        listId,
        updates,
        folderId,
      ),
    }));
  },

  deleteList: (spaceId, listId, folderId) => {
    const state = get();
    const res = applyDeleteList(
      state.spaces,
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
      spaces: res.spaces,
      tasks: res.tasks,
      activeListId: res.activeListId,
      selectedTaskId: res.selectedTaskId,
      lastSelectedTaskId: res.lastSelectedTaskId,
      selectedTaskIds: res.selectedTaskIds,
    });
    syncDeleteTasks(res.tasksToDelete.map((t) => t.id));
  },

  addStatusToSpace: (spaceId, name, color) => {
    set((state) => ({
      spaces: applyAddStatusToSpace(
        state.spaces,
        spaceId,
        name,
        color,
      ),
    }));
  },

  updateStatus: (spaceId, statusId, updates) => {
    set((state) => ({
      spaces: applyUpdateSpaceStatus(
        state.spaces,
        spaceId,
        statusId,
        updates,
      ),
    }));
  },

  deleteStatus: (spaceId, statusId, fallbackStatusId) => {
    const state = get();
    const res = applyDeleteSpaceStatus(
      state.spaces,
      state.tasks,
      spaceId,
      statusId,
      fallbackStatusId,
    );
    set({
      spaces: res.spaces,
      tasks: res.tasks,
    });
  },
});
