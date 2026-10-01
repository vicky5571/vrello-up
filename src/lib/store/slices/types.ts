import type {
  Workspace,
  Space,
  Folder,
  List,
  Status,
  Task,
  TaskCommentAttachment,
  ChannelMessage,
  AppMode,
  ViewMode,
  FilterOptions,
  ViewPreferences,
  User,
  Tag,
  AutomationTrigger,
  CustomAutomationRule,
} from "@/types";

export interface TrashedTask {
  task: Task;
  deletedAt: string;
}

export interface WorkspaceSlice {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  setActiveWorkspace: (id: string) => void;
  createWorkspace: (name: string, avatar?: string) => Workspace;
  updateWorkspace: (
    id: string,
    updates: Partial<Pick<Workspace, "name" | "avatar">>,
  ) => void;
  deleteWorkspace: (id: string) => boolean;
  addWorkspaceMember: (name: string, email: string, role?: User["role"]) => User;
  removeWorkspaceMember: (userId: string) => void;
  importBackup: (data: unknown) => boolean;
  fetchServerTasks: (workspaceId?: string) => Promise<void>;
}

export interface SpaceSlice {
  activeSpaceId: string;
  activeListId: string | null;
  setActiveSpace: (id: string) => void;
  setActiveList: (id: string | null) => void;
  createSpace: (name: string, icon: string, color: string) => Space;
  updateSpace: (
    spaceId: string,
    updates: Partial<Pick<Space, "name" | "icon" | "color">>,
  ) => void;
  deleteSpace: (spaceId: string) => void;
  reorderSpaces: (orderedSpaceIds: string[]) => void;
  moveSpace: (spaceId: string, direction: "up" | "down") => void;
  createFolder: (spaceId: string, name: string) => Folder;
  updateFolder: (spaceId: string, folderId: string, name: string) => void;
  deleteFolder: (spaceId: string, folderId: string) => void;
  createList: (spaceId: string, name: string, folderId?: string) => List;
  updateList: (
    spaceId: string,
    listId: string,
    updates: Partial<Pick<List, "name" | "icon" | "color">>,
    folderId?: string,
  ) => void;
  deleteList: (spaceId: string, listId: string, folderId?: string) => void;
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
}

export interface TaskSlice {
  tasks: Task[];
  tags: Tag[];
  selectedTaskId: string | null;
  lastSelectedTaskId: string | null;
  selectedTaskIds: string[];
  presenceByTaskId: Record<string, User[]>;
  setSelectedTaskId: (id: string | null) => void;
  toggleTaskSelection: (id: string) => void;
  setTaskSelection: (ids: string[]) => void;
  clearTaskSelection: () => void;
  setPresenceByTaskId: (presence: Record<string, User[]>) => void;
  applyRemoteTaskUpsert: (task: Task) => void;
  applyRemoteTaskDelete: (taskId: string) => void;
  createTask: (
    task: Omit<Task, "id" | "createdAt" | "updatedAt" | "listId"> & {
      listId?: string | null;
    },
  ) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  bulkUpdateTasks: (ids: string[], updates: Partial<Task>) => void;
  moveTaskStatus: (
    taskId: string,
    newStatusId: string,
    newOrderIndex?: number,
  ) => void;
  reorderTasksInStatus: (statusId: string, orderedTaskIds: string[]) => void;
  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;
  addDependency: (taskId: string, dependsOnTaskId: string) => boolean;
  removeDependency: (taskId: string, dependsOnTaskId: string) => void;
  createTag: (name: string, color: string) => Tag;
  renameTag: (id: string, name: string) => void;
  deleteTag: (id: string) => void;
  toggleTaskTag: (taskId: string, tagId: string) => void;
}

export interface TrashSlice {
  trash: TrashedTask[];
  restoreTasks: (ids: string[]) => number;
  permanentlyDeleteTask: (id: string) => void;
  emptyTrash: () => void;
  purgeExpiredTrash: () => void;
}

export interface AutomationSlice {
  channelMessages: ChannelMessage[];
  automationEnabled: Record<string, boolean>;
  automationRuns: Record<string, number>;
  customAutomations: CustomAutomationRule[];
  addComment: (
    taskId: string,
    content: string,
    user?: User,
    attachments?: TaskCommentAttachment[],
  ) => void;
  deleteComment: (taskId: string, commentId: string) => void;
  logActivity: (taskId: string, action: string, user?: User) => void;
  addChannelMessage: (channelId: string, content: string, user?: User) => void;
  setAutomationEnabled: (id: string, enabled: boolean) => void;
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

export interface UiSlice {
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
  setActiveView: (view: ViewMode) => void;
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
}

export type WorkspaceStore = WorkspaceSlice &
  SpaceSlice &
  TaskSlice &
  TrashSlice &
  AutomationSlice &
  UiSlice;

export type WorkspaceState = WorkspaceStore;
