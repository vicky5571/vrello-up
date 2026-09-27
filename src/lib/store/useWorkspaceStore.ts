import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import {
  type Workspace,
  type Space,
  type Folder,
  type List,
  type Task,
  type TaskComment,
  type TaskCommentAttachment,
  type ActivityLog,
  type ChannelMessage,
  type Status,
  type AppMode,
  type ViewMode,
  type FilterOptions,
  type ViewPreferences,
  type User,
  type Tag,
  type AutomationTrigger,
  type CustomAutomationRule,
} from "@/types";
import { generateId } from "@/lib/utils";
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
import { switchWorkspace, extractSpaceListIds } from "@/lib/store/workspaceSwitch";
import {
  buildInitialWorkspace,
  removeWorkspaceAndCascadeTasks,
  applyAddWorkspaceMember,
  applyRemoveWorkspaceMember,
} from "@/lib/store/workspaceCrud";
import {
  applyDeleteTaskWithTrash,
  applyRestoreTasksFromTrash,
  applyPermanentlyDeleteTask,
  applyEmptyTrash,
  applyPurgeExpiredTrash,
} from "@/lib/store/trashOperations";
import {
  DEFAULT_VIEW_PREFERENCES,
  applyViewPreferences,
} from "@/lib/store/viewPreferencesOperations";
import { syncFieldEventOnTaskStatusChange } from "@/lib/tasks/eventTaskSync";
import { syncPlacementOnTaskStatusChange, isPlacementTask } from "@/lib/tasks/placementTaskSync";
import {
  reconcileTasks,
  syncCreateTaskApi,
  syncUpdateTaskApi,
  syncDeleteTaskApi,
} from "@/lib/tasks/taskSync";
import {
  wouldCreateCycle,
  applyAddDependency,
  applyRemoveDependency,
} from "@/lib/store/dependencyOperations";
import {
  resolveActor,
  applyAddComment,
  applyDeleteComment,
  applyAddChannelMessage,
  applyLogActivity,
} from "@/lib/store/commentOperations";
import {
  applyAddCustomAutomation,
  applyRemoveCustomAutomation,
  applyToggleCustomAutomation,
  applyIncrementAutomationRun,
  executeAutomationsForTrigger,
} from "@/lib/store/automationOperations";
import {
  validateAndParseBackup,
  applyImportBackup,
} from "@/lib/store/backupOperations";
import {
  applyCreateTag,
  applyRenameTag,
  applyDeleteTag,
  applyToggleTaskTag,
} from "@/lib/store/tagOperations";
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

export { DEFAULT_VIEW_PREFERENCES } from "@/lib/store/viewPreferencesOperations";
export { wouldCreateCycle } from "@/lib/store/dependencyOperations";
export { getSpaceListIds } from "@/lib/store/spacesOperations";
export { STORAGE_WARN_BYTES, quotaAwareStorage } from "@/lib/store/storeStorage";
export {
  findSpaceForListId,
  findWorkspaceForListId,
  reconcileWorkspaces,
} from "@/lib/store/workspaceSync";
import { STORAGE_WARN_BYTES, quotaAwareStorage } from "@/lib/store/storeStorage";
import {
  findSpaceForListId,
  findWorkspaceForListId,
  reconcileWorkspaces,
} from "@/lib/store/workspaceSync";
import {
  SEED_USERS,
  DEFAULT_STATUSES,
  SEED_TAGS,
  INITIAL_SPACES,
  INITIAL_TASKS,
  INITIAL_CHANNEL_MESSAGES,
  INITIAL_WORKSPACE,
} from "@/lib/constants/seeds";

const MARCOM_VIEW_SET = new Set<ViewMode>([
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

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  activeSpaceId: string;
  activeListId: string | null;
  tasks: Task[];
  tags: Tag[];
  channelMessages: ChannelMessage[];
  selectedTaskId: string | null;
  lastSelectedTaskId: string | null;
  selectedTaskIds: string[];
  trash: TrashedTask[];
  activeView: ViewMode;
  appMode: AppMode;
  lastTaskView: ViewMode;
  lastMarcomView: ViewMode;
  currentUserId: string;
  filters: FilterOptions;
  viewPreferences: ViewPreferences;
  isSidebarOpen: boolean;
  isCommandPaletteOpen: boolean;
  isCreateTaskModalOpen: boolean;
  isCreatePostModalOpen: boolean;
  isAiDrawerOpen: boolean;
  isHelpDocsOpen: boolean;
  isFilterBarOpen: boolean;
  isExportCenterOpen: boolean;
  isTrashOpen: boolean;
  lastSeenNotificationsAt: string | null;
  marcomFilters: Record<string, string>;
  selectedBranchId: string | null;
  navigatedFromMarcom: { view: ViewMode | string; label: string } | null;

  // Actions
  setNavigatedFromMarcom: (context: { view: ViewMode | string; label: string } | null) => void;
  setAppMode: (mode: AppMode) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  setAiDrawerOpen: (open: boolean) => void;
  setCreateTaskModalOpen: (open: boolean) => void;
  setCreatePostModalOpen: (open: boolean) => void;
  setHelpDocsOpen: (open: boolean) => void;
  setFilterBarOpen: (open: boolean) => void;
  setExportCenterOpen: (open: boolean) => void;
  setTrashOpen: (open: boolean) => void;
  setLastSeenNotificationsAt: (iso: string) => void;
  setActiveWorkspace: (id: string) => void;
  createWorkspace: (name: string, avatar?: string) => Workspace;
  updateWorkspace: (
    id: string,
    updates: Partial<Pick<Workspace, "name" | "avatar">>,
  ) => void;
  deleteWorkspace: (id: string) => boolean;
  setActiveSpace: (id: string) => void;
  setActiveList: (id: string | null) => void;
  setActiveView: (view: ViewMode) => void;
  setSelectedTaskId: (id: string | null) => void;
  setSelectedBranchId: (id: string | null) => void;
  setMarcomFilter: (view: string, query: string) => void;
  navigateToMarcom: (view: ViewMode, search?: string) => void;
  setCurrentUserId: (id: string) => void;
  toggleSidebar: () => void;
  setFilters: (filters: Partial<FilterOptions>) => void;
  resetFilters: () => void;
  setViewPreferences: (prefs: {
    density?: ViewPreferences["density"];
    visibleFields?: Partial<ViewPreferences["visibleFields"]>;
    taskSortField?: ViewPreferences["taskSortField"];
    taskSortDirection?: ViewPreferences["taskSortDirection"];
  }) => void;
  resetViewPreferences: () => void;
  fetchServerTasks: (workspaceId?: string) => Promise<void>;

  // Realtime Presence & Remote Sync
  presenceByTaskId: Record<string, User[]>;
  setPresenceByTaskId: (presence: Record<string, User[]>) => void;
  applyRemoteTaskUpsert: (task: Task) => void;
  applyRemoteTaskDelete: (taskId: string) => void;

  // Task Actions
  createTask: (
    task: Omit<Task, "id" | "createdAt" | "updatedAt" | "listId"> & {
      listId?: string | null;
    }
  ) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  bulkUpdateTasks: (ids: string[], updates: Partial<Task>) => void;
  toggleTaskSelection: (id: string) => void;
  setTaskSelection: (ids: string[]) => void;
  clearTaskSelection: () => void;

  // Trash Actions (soft-delete with restore)
  restoreTasks: (ids: string[]) => number;
  permanentlyDeleteTask: (id: string) => void;
  emptyTrash: () => void;
  purgeExpiredTrash: () => void;
  moveTaskStatus: (
    taskId: string,
    newStatusId: string,
    newOrderIndex?: number,
  ) => void;
  reorderTasksInStatus: (statusId: string, orderedTaskIds: string[]) => void;

  // Subtask Actions
  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;

  // Comment & Activity Actions
  addComment: (
    taskId: string,
    content: string,
    user?: User,
    attachments?: TaskCommentAttachment[],
  ) => void;
  deleteComment: (taskId: string, commentId: string) => void;
  logActivity: (taskId: string, action: string, user?: User) => void;

  // Channel Actions
  addChannelMessage: (channelId: string, content: string, user?: User) => void;

  // Dependency Actions
  addDependency: (taskId: string, dependsOnTaskId: string) => boolean;
  removeDependency: (taskId: string, dependsOnTaskId: string) => void;

  // Space Actions
  createSpace: (name: string, icon: string, color: string) => Space;
  updateSpace: (
    spaceId: string,
    updates: Partial<Pick<Space, "name" | "icon" | "color">>,
  ) => void;
  deleteSpace: (spaceId: string) => void;
  reorderSpaces: (orderedSpaceIds: string[]) => void;
  moveSpace: (spaceId: string, direction: "up" | "down") => void;

  // Folder Actions
  createFolder: (spaceId: string, name: string) => Folder;
  updateFolder: (spaceId: string, folderId: string, name: string) => void;
  deleteFolder: (spaceId: string, folderId: string) => void;

  // List Actions
  createList: (spaceId: string, name: string, folderId?: string) => List;
  updateList: (
    spaceId: string,
    listId: string,
    updates: Partial<Pick<List, "name" | "icon" | "color">>,
    folderId?: string,
  ) => void;
  deleteList: (spaceId: string, listId: string, folderId?: string) => void;

  // Status Actions
  addStatusToSpace: (spaceId: string, name: string, color: string) => void;
  updateStatus: (
    spaceId: string,
    statusId: string,
    updates: Partial<Pick<Status, "name" | "color" | "category">>,
  ) => void;
  deleteStatus: (
    spaceId: string,
    statusId: string,
    fallbackStatusId?: string,
  ) => void;

  // Tag Actions
  createTag: (name: string, color: string) => Tag;
  renameTag: (id: string, name: string) => void;
  deleteTag: (id: string) => void;
  toggleTaskTag: (taskId: string, tagId: string) => void;

  // Member Actions
  addWorkspaceMember: (name: string, email: string, role?: User["role"]) => User;
  removeWorkspaceMember: (userId: string) => void;

  // Backup Actions
  importBackup: (data: unknown) => boolean;

  // Automation Actions
  automationEnabled: Record<string, boolean>;
  automationRuns: Record<string, number>;
  setAutomationEnabled: (id: string, enabled: boolean) => void;
  customAutomations: CustomAutomationRule[];
  addCustomAutomation: (
    rule: Omit<CustomAutomationRule, "id" | "runCount" | "createdAt">,
  ) => CustomAutomationRule;
  removeCustomAutomation: (id: string) => void;
  toggleCustomAutomation: (id: string, enabled?: boolean) => void;
  runAutomationsForTrigger: (
    trigger: AutomationTrigger,
    payload?: Record<string, unknown>,
  ) => Promise<number>;
}

/**
 * Resolves the acting user: explicit argument wins, otherwise the active
 * workspace member matching currentUserId, falling back to the seed user.
 */
function getActor(state: WorkspaceState, provided?: User): User {
  return resolveActor(
    state.workspaces,
    state.activeWorkspaceId,
    state.currentUserId,
    SEED_USERS,
    provided,
  );
}

/**
 * Bumps the execution counter for an automation rule.
 */
function countAutomationRun(id: string) {
  useWorkspaceStore.setState((s) => ({
    automationRuns: applyIncrementAutomationRun(s.automationRuns, id),
  }));
}

function syncCreateTask(task: Task, spaceId?: string, listName?: string) {
  if (typeof window === "undefined") return;
  syncCreateTaskApi(task, spaceId, listName);
}

function syncWorkspaces(workspaces: Workspace[]) {
  if (typeof window === "undefined") return;
  fetch("/api/workspaces", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workspaces }),
  }).catch((err) =>
    console.warn("[vrello sync] failed to persist workspaces:", err),
  );
}

function syncDeleteWorkspace(id: string) {
  if (typeof window === "undefined") return;
  fetch(`/api/workspaces?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  }).catch((err) =>
    console.warn("[vrello sync] failed to persist workspace deletion:", err),
  );
}

function syncUpdateTask(id: string, updates: Partial<Task>) {
  if (typeof window === "undefined") return;
  syncUpdateTaskApi(id, updates);
}

function syncDeleteTask(id: string) {
  if (typeof window === "undefined") return;
  syncDeleteTaskApi(id);
}

function syncAddComment(taskId: string, comment: TaskComment) {
  if (typeof window === "undefined") return;
  fetch(`/api/tasks/${taskId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(comment),
  }).catch((err) => console.warn("[vrello sync] failed to persist comment:", err));
}

export interface TrashedTask {
  task: Task;
  deletedAt: string;
}

/** Trash keeps at most this many soft-deleted tasks (newest first). */
export { TRASH_LIMIT, TRASH_RETENTION_MS } from "@/lib/store/trashOperations";

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      workspaces: [INITIAL_WORKSPACE],
      activeWorkspaceId: "ws-main",
      activeSpaceId: "space-product",
      activeListId: "list-design-system",
      tasks: INITIAL_TASKS,
      tags: SEED_TAGS,
      channelMessages: INITIAL_CHANNEL_MESSAGES,
      selectedTaskId: null,
      lastSelectedTaskId: null,
      selectedTaskIds: [],
      trash: [],
      activeView: "list",
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
      presenceByTaskId: {},
      automationEnabled: {
        "rule-1": true,
        "rule-2": true,
        "rule-3": true,
        "rule-4": false,
      },
      automationRuns: {},
      setAutomationEnabled: (id, enabled) =>
        set((state) => ({
          automationEnabled: { ...state.automationEnabled, [id]: enabled },
        })),
      customAutomations: [],
      addCustomAutomation: (ruleData) => {
        const { nextRules, newRule } = applyAddCustomAutomation(
          get().customAutomations,
          ruleData,
        );
        set({ customAutomations: nextRules });
        return newRule;
      },
      removeCustomAutomation: (id) =>
        set((state) => ({
          customAutomations: applyRemoveCustomAutomation(
            state.customAutomations,
            id,
          ).nextRules,
        })),
      toggleCustomAutomation: (id, enabled) =>
        set((state) => ({
          customAutomations: applyToggleCustomAutomation(
            state.customAutomations,
            id,
            enabled,
          ).nextRules,
        })),
      runAutomationsForTrigger: async (trigger, payload = {}) => {
        const state = get();
        const { executedCount, nextAutomations } =
          await executeAutomationsForTrigger(
            state.customAutomations,
            trigger,
            payload,
            {
              createTask: state.createTask,
              updateTask: state.updateTask,
              logActivity: state.logActivity,
              tasks: state.tasks,
              workspaces: state.workspaces,
              activeWorkspaceId: state.activeWorkspaceId,
              activeListId: state.activeListId,
              actor: getActor(state),
              findSpaceForListId,
            },
          );
        if (executedCount > 0) {
          set({ customAutomations: nextAutomations });
        }
        return executedCount;
      },
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
      appMode: "tasks",
      lastTaskView: "list",
      lastMarcomView: "events",
      navigatedFromMarcom: null,

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
      setActiveSpace: (id) => {
        set({ activeSpaceId: id, activeListId: null });
      },
      setActiveList: (id) => set({ activeListId: id }),
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
      setSelectedTaskId: (id) =>
        set((state) => ({
          selectedTaskId: id,
          lastSelectedTaskId: id ?? state.lastSelectedTaskId,
        })),
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
                  syncUpdateTaskApi(t.id, t);
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
          if (!prev.relatedMarcomType || prev.relatedMarcomType === "FIELD_EVENT") {
            syncFieldEventOnTaskStatusChange(prev, updates.statusId, spaces);
          }
          if (!prev.relatedMarcomType || prev.relatedMarcomType === "PLACEMENT") {
            syncPlacementOnTaskStatusChange(prev, updates.statusId, spaces);
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
        countAutomationRun("rule-1");
      },

      deleteTask: (id) => {
        set((state) => applyDeleteTaskWithTrash(state, id));
        // The server mirrors live tasks only; trash itself stays local.
        syncDeleteTask(id);
      },

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

      toggleTaskSelection: (id) =>
        set((state) => ({
          selectedTaskIds: applyToggleTaskSelection(state.selectedTaskIds, id)
            .nextSelectedIds,
        })),
      setTaskSelection: (ids) => set({ selectedTaskIds: [...new Set(ids)] }),
      clearTaskSelection: () => set({ selectedTaskIds: [] }),

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
          if (!prev.relatedMarcomType || prev.relatedMarcomType === "FIELD_EVENT") {
            syncFieldEventOnTaskStatusChange(prev, newStatusId, spaces);
          }
          if (!prev.relatedMarcomType || prev.relatedMarcomType === "PLACEMENT") {
            syncPlacementOnTaskStatusChange(prev, newStatusId, spaces);
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
        countAutomationRun("rule-2");
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

      addComment: (taskId, content, user, attachments) => {
        const actor = getActor(get(), user);
        const { nextTasks, newComment } = applyAddComment(
          get().tasks,
          taskId,
          content,
          actor,
          attachments,
        );
        if (!newComment) return;
        set({ tasks: nextTasks });
        syncAddComment(taskId, newComment);
      },

      deleteComment: (taskId, commentId) => {
        const { nextTasks } = applyDeleteComment(get().tasks, taskId, commentId);
        set({ tasks: nextTasks });
      },

      addChannelMessage: (channelId, content, user) => {
        const actor = getActor(get(), user);
        const { nextMessages, newMessage } = applyAddChannelMessage(
          get().channelMessages,
          channelId,
          content,
          actor,
        );
        if (!newMessage) return;
        set({ channelMessages: nextMessages });
      },

      logActivity: (taskId, action, user) => {
        const actor = getActor(get(), user);
        const { nextTasks } = applyLogActivity(get().tasks, taskId, action, actor);
        set({ tasks: nextTasks });
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
          workspaces: applyUpdateSpace(state.workspaces, state.activeWorkspaceId, spaceId, updates),
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
          workspaces: applyReorderSpaces(state.workspaces, state.activeWorkspaceId, orderedSpaceIds),
        }));
        syncWorkspaces(get().workspaces);
      },

      moveSpace: (spaceId, direction) => {
        set((state) => ({
          workspaces: applyMoveSpace(state.workspaces, state.activeWorkspaceId, spaceId, direction),
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
