import type { StateCreator } from "zustand";
import type { WorkspaceStore, UiSlice } from "./types";
import type { AppMode, ViewMode } from "@/types";
import {
  DEFAULT_VIEW_PREFERENCES,
  applyViewPreferences,
} from "@/lib/store/viewPreferencesOperations";

export const MARCOM_VIEW_SET = new Set<ViewMode>([
  "pipeline",
  "events",
  "content",
  "content-planner",
  "placements",
  "mous",
  "branches",
  "outlets",
  "documents",
  "reports",
  "analytics",
]);

/**
 * Normalizes legacy view aliases to canonical view names.
 * e.g., "content" -> "content-planner", "table" -> "list" (consolidated)
 */
export function normalizeViewMode(view: ViewMode | string): ViewMode {
  if (view === "content") return "content-planner";
  if (view === "table") return "list";
  return view as ViewMode;
}

export const createUiSlice: StateCreator<
  WorkspaceStore,
  [],
  [],
  UiSlice
> = (set) => ({
  activeView: "list",
  appMode: "tasks",
  lastTaskView: "list",
  lastMarcomView: "events",
  navigatedFromMarcom: null,
  currentUserId: "user-1",
  isSidebarOpen: true,
  isCommandPaletteOpen: false,
  isCreateTaskModalOpen: false,
  isCreatePostModalOpen: false,
  isAiDrawerOpen: false,
  isHelpDocsOpen: false,
  isFilterBarOpen: true,
  isExportCenterOpen: false,
  isTrashOpen: false,
  lastSeenNotificationsAt: null,
  marcomFilters: {},
  selectedBranchId: null,

  filters: {
    search: "",
    statusIds: [],
    priorities: [],
    assigneeIds: [],
    tagIds: [],
    showClosed: true,
    groupBy: "status",
  },
  viewPreferences: DEFAULT_VIEW_PREFERENCES,

  setNavigatedFromMarcom: (context) => set({ navigatedFromMarcom: context }),

  setAppMode: (mode) =>
    set((state) => {
      if (state.appMode === mode) return {};
      const targetView = mode === "tasks" ? state.lastTaskView : state.lastMarcomView;
      return {
        appMode: mode,
        activeView: targetView,
      };
    }),

  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
  openCommandPalette: () => set({ isCommandPaletteOpen: true }),
  closeCommandPalette: () => set({ isCommandPaletteOpen: false }),
  setAiDrawerOpen: (open) => set({ isAiDrawerOpen: open }),
  setCreateTaskModalOpen: (open) => set({ isCreateTaskModalOpen: open }),
  setCreatePostModalOpen: (open) => set({ isCreatePostModalOpen: open }),
  setHelpDocsOpen: (open) => set({ isHelpDocsOpen: open }),
  setFilterBarOpen: (open) => set({ isFilterBarOpen: open }),
  setExportCenterOpen: (open) => set({ isExportCenterOpen: open }),
  setTrashOpen: (open) => set({ isTrashOpen: open }),
  setLastSeenNotificationsAt: (iso) =>
    set({ lastSeenNotificationsAt: iso }),

  setActiveView: (view) =>
    set((state) => {
      const canonicalView = normalizeViewMode(view);
      const isMarcom = MARCOM_VIEW_SET.has(canonicalView);
      const newMode: AppMode = isMarcom ? "marcom" : "tasks";
      return {
        activeView: canonicalView,
        appMode: newMode,
        lastTaskView: !isMarcom ? canonicalView : state.lastTaskView,
        lastMarcomView: isMarcom ? canonicalView : state.lastMarcomView,
      };
    }),

  setSelectedBranchId: (id) => set({ selectedBranchId: id }),

  setMarcomFilter: (view, query) =>
    set((state) => {
      const canonicalKey = view === "content" ? "content-planner" : view;
      return {
        marcomFilters: { ...state.marcomFilters, [canonicalKey]: query },
      };
    }),

  navigateToMarcom: (view, search) =>
    set((state) => {
      const canonicalView = normalizeViewMode(view);
      return {
        appMode: "marcom",
        activeView: canonicalView,
        lastMarcomView: canonicalView,
        marcomFilters:
          search !== undefined
            ? { ...state.marcomFilters, [canonicalView]: search }
            : state.marcomFilters,
      };
    }),

  setCurrentUserId: (id) => set({ currentUserId: id }),

  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  setFilters: (newFilters) =>
    set((state) => ({ filters: { ...state.filters, ...newFilters } })),

  resetFilters: () =>
    set({
      filters: {
        search: "",
        statusIds: [],
        priorities: [],
        assigneeIds: [],
        tagIds: [],
        showClosed: true,
        groupBy: "status",
      },
    }),

  setViewPreferences: (prefs) =>
    set((state) => ({
      viewPreferences: applyViewPreferences(state.viewPreferences, prefs),
    })),

  resetViewPreferences: () =>
    set({ viewPreferences: DEFAULT_VIEW_PREFERENCES }),
});
