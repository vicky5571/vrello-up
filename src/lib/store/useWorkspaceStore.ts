import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import { toast } from "sonner";
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
  type ViewMode,
  type FilterOptions,
  type ViewPreferences,
  type User,
  type Tag,
  type AutomationTrigger,
  type CustomAutomationRule,
} from "@/types";
import { generateId } from "@/lib/utils";

// Default Seed Users
export const SEED_USERS: User[] = [
  {
    id: "user-1",
    name: "Alex Rivera",
    email: "alex@vrelloup.dev",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    role: "admin",
  },
  {
    id: "user-2",
    name: "Sarah Chen",
    email: "sarah@vrelloup.dev",
    avatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80",
    role: "staff",
  },
  {
    id: "user-3",
    name: "Marcus Vance",
    email: "marcus@vrelloup.dev",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    role: "staff",
  },
];

// Default Statuses
export const DEFAULT_STATUSES: Status[] = [
  {
    id: "status-todo",
    name: "TO DO",
    color: "#64748B",
    category: "open",
    order: 0,
  },
  {
    id: "status-in-progress",
    name: "IN PROGRESS",
    color: "#0D9488",
    category: "in_progress",
    order: 1,
  },
  {
    id: "status-review",
    name: "IN REVIEW",
    color: "#EA580C",
    category: "review",
    order: 2,
  },
  {
    id: "status-done",
    name: "COMPLETE",
    color: "#16A34A",
    category: "done",
    order: 3,
  },
];

export const SEED_TAGS: Tag[] = [
  { id: "tag-frontend", name: "Frontend", color: "#0D9488" },
  { id: "tag-ui-ux", name: "UI/UX", color: "#8B5CF6" },
  { id: "tag-perf", name: "Performance", color: "#F59E0B" },
  { id: "tag-security", name: "Security", color: "#EF4444" },
];

export const DEFAULT_VIEW_PREFERENCES: ViewPreferences = {
  density: "standard",
  visibleFields: {
    assignees: true,
    priority: true,
    dueDate: true,
    tags: true,
    subtasks: true,
  },
};

const INITIAL_SPACES: Space[] = [
  {
    id: "space-eng",
    workspaceId: "ws-main",
    name: "Engineering Core",
    icon: "Code2",
    color: "#0D9488",
    statuses: DEFAULT_STATUSES,
    folders: [
      {
        id: "folder-sprint",
        spaceId: "space-eng",
        name: "Sprint 42",
        lists: [
          {
            id: "list-sprint-tasks",
            spaceId: "space-eng",
            folderId: "folder-sprint",
            name: "Sprint Backlog",
            icon: "ListTodo",
          },
        ],
      },
    ],
    lists: [
      {
        id: "list-roadmap",
        spaceId: "space-eng",
        name: "Architecture Roadmap",
        icon: "Milestone",
      },
      {
        id: "list-bugs",
        spaceId: "space-eng",
        name: "Bug Tracker",
        icon: "Bug",
      },
    ],
  },
  {
    id: "space-product",
    workspaceId: "ws-main",
    name: "Design & Product",
    icon: "Palette",
    color: "#8B5CF6",
    statuses: DEFAULT_STATUSES,
    folders: [],
    lists: [
      {
        id: "list-design-system",
        spaceId: "space-product",
        name: "Design Tokens & UI Specs",
        icon: "Layers",
      },
      {
        id: "list-user-research",
        spaceId: "space-product",
        name: "Customer Interviews",
        icon: "Users",
      },
    ],
  },
  {
    id: "space-marcom",
    workspaceId: "ws-main",
    name: "Marketing & Campaigns",
    icon: "Sparkles",
    color: "#EC4899",
    statuses: DEFAULT_STATUSES,
    folders: [],
    lists: [
      {
        id: "list-content-planner",
        spaceId: "space-marcom",
        name: "Social & Content Calendar",
        icon: "Calendar",
      },
      {
        id: "list-field-ops",
        spaceId: "space-marcom",
        name: "Field Operations & Setup",
        icon: "Layers",
      },
    ],
  },
];


const INITIAL_TASKS: Task[] = [
  {
    id: "task-1",
    listId: "list-sprint-tasks",
    title: "Implement Framer Motion view transition animations",
    description:
      "<h3>Overview</h3><p>Integrate <code>layoutId</code> morphing for view indicator tabs and spring physics for the task slide-over drawer.</p><ul><li>Fluid spring curves</li><li>Accessible reduced-motion fallback</li><li>Hardware accelerated transforms</li></ul>",
    statusId: "status-in-progress",
    priority: "urgent",
    assignees: [SEED_USERS[0], SEED_USERS[1]],
    dueDate: "2026-09-02",
    startDate: "2026-08-28",
    estimatedHours: 12,
    tags: [SEED_TAGS[0], SEED_TAGS[1]],
    subtasks: [
      {
        id: "sub-1",
        title: "Add layoutId active tab indicator",
        completed: true,
        createdAt: "2026-08-28",
      },
      {
        id: "sub-2",
        title: "Add TaskDrawer slide-over spring animation",
        completed: true,
        createdAt: "2026-08-28",
      },
      {
        id: "sub-3",
        title: "Verify with prefers-reduced-motion",
        completed: false,
        createdAt: "2026-08-28",
      },
    ],
    orderIndex: 0,
    createdAt: "2026-08-28T00:00:00.000Z",
    updatedAt: "2026-08-28T00:00:00.000Z",
  },
  {
    id: "task-2",
    listId: "list-sprint-tasks",
    title: "Build ClickUp-style interactive Table View with TanStack Table",
    description:
      "<p>Implement column sorting, status selector badges, inline title editing, and priority dropdown directly inside the tabular row grid.</p>",
    statusId: "status-todo",
    priority: "high",
    assignees: [SEED_USERS[1]],
    dueDate: "2026-09-05",
    tags: [SEED_TAGS[0]],
    subtasks: [
      {
        id: "sub-4",
        title: "Configure TanStack Table column definitions",
        completed: false,
        createdAt: "2026-08-28",
      },
      {
        id: "sub-5",
        title: "Add inline cell editing",
        completed: false,
        createdAt: "2026-08-28",
      },
    ],
    orderIndex: 0,
    createdAt: "2026-08-28T00:00:00.000Z",
    updatedAt: "2026-08-28T00:00:00.000Z",
  },
  {
    id: "task-3",
    listId: "list-sprint-tasks",
    title: "Configure Security rules and environment secret boundaries",
    description:
      "<p>Enforce <code>SECURITY.md</code> rules: strict separation of public keys vs server-only secrets, DOMPurify HTML sanitization for Tiptap editor, and RLS checks.</p>",
    statusId: "status-done",
    priority: "urgent",
    assignees: [SEED_USERS[0]],
    dueDate: "2026-08-29",
    tags: [SEED_TAGS[3]],
    subtasks: [
      {
        id: "sub-6",
        title: "Write SECURITY.md",
        completed: true,
        createdAt: "2026-08-28",
      },
      {
        id: "sub-7",
        title: "Add DOMPurify HTML sanitizer",
        completed: true,
        createdAt: "2026-08-28",
      },
    ],
    orderIndex: 0,
    createdAt: "2026-08-28T00:00:00.000Z",
    updatedAt: "2026-08-28T00:00:00.000Z",
  },
  {
    id: "task-4",
    listId: "list-sprint-tasks",
    title: "Review UI/UX Pro Max Dark Mode & Contrast Tokens",
    description:
      "<p>Ensure all text surfaces meet WCAG 2.2 AA >= 4.5:1 contrast standards, especially on deep OLED slate dark mode.</p>",
    statusId: "status-review",
    priority: "normal",
    assignees: [SEED_USERS[2]],
    dueDate: "2026-09-01",
    tags: [SEED_TAGS[1]],
    subtasks: [],
    orderIndex: 0,
    createdAt: "2026-08-28T00:00:00.000Z",
    updatedAt: "2026-08-28T00:00:00.000Z",
  },
  {
    id: "post-1",
    listId: "list-sprint-tasks",
    title: "Launch Teaser Reel: VrelloUp 2.0 Feature Drop",
    description:
      "<p>Highlight fluid animations, ClickUp/Trello hybrid views, and real-time sprint blocker analytics. #Productivity #TechLaunch</p>",
    statusId: "status-in-progress",
    priority: "high",
    assignees: [SEED_USERS[1]],
    dueDate: "2026-09-10",
    startDate: "2026-09-08",
    postPlatform: "instagram",
    postFormat: "reel",
    mediaUrl:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
    tags: [SEED_TAGS[1]],
    subtasks: [
      {
        id: "sp-1",
        title: "Record 4K 60fps screen recording",
        completed: true,
        createdAt: "2026-09-07",
      },
      {
        id: "sp-2",
        title: "Add motion captions and sound design",
        completed: true,
        createdAt: "2026-09-07",
      },
      {
        id: "sp-3",
        title: "Schedule post on Meta Business Suite",
        completed: false,
        createdAt: "2026-09-07",
      },
    ],
    orderIndex: 0,
    createdAt: "2026-09-07T00:00:00.000Z",
    updatedAt: "2026-09-07T00:00:00.000Z",
  },
  {
    id: "post-2",
    listId: "list-sprint-tasks",
    title: "TikTok Behind-the-Scenes: Field Officer Solo Roadshow",
    description:
      "<p>Day in the life of field marketing officers inspecting outlet branding signboards in Solo Central Java. #FieldOps #BehindTheScenes</p>",
    statusId: "status-todo",
    priority: "normal",
    assignees: [SEED_USERS[2]],
    dueDate: "2026-09-14",
    postPlatform: "tiktok",
    postFormat: "reel",
    mediaUrl:
      "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=80",
    tags: [SEED_TAGS[0]],
    subtasks: [
      {
        id: "sp-4",
        title: "Curate event footage clips",
        completed: false,
        createdAt: "2026-09-07",
      },
      {
        id: "sp-5",
        title: "Draft TikTok hook & trending audio",
        completed: false,
        createdAt: "2026-09-07",
      },
    ],
    orderIndex: 1,
    createdAt: "2026-09-07T00:00:00.000Z",
    updatedAt: "2026-09-07T00:00:00.000Z",
  },
  {
    id: "post-3",
    listId: "list-sprint-tasks",
    title: "YouTube Deep Dive: ClickUp & Trello Hybrid Workflow",
    description:
      "<p>Walkthrough comparing multi-view capabilities (List, Board, Calendar, Gantt, Table) in VrelloUp. #Tutorial #Productivity</p>",
    statusId: "status-review",
    priority: "urgent",
    assignees: [SEED_USERS[0]],
    dueDate: "2026-09-08",
    postPlatform: "youtube",
    postFormat: "carousel",
    mediaUrl:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80",
    tags: [SEED_TAGS[1]],
    subtasks: [
      {
        id: "sp-6",
        title: "Rough cut video edit",
        completed: true,
        createdAt: "2026-09-07",
      },
      {
        id: "sp-7",
        title: "Chapter timestamps & thumbnail",
        completed: false,
        createdAt: "2026-09-07",
      },
    ],
    orderIndex: 2,
    createdAt: "2026-09-07T00:00:00.000Z",
    updatedAt: "2026-09-07T00:00:00.000Z",
  },
  {
    id: "post-4",
    listId: "list-sprint-tasks",
    title: "LinkedIn Product Update: VrelloUp Q3 Release Notes",
    description:
      "<p>Official announcement detailing sprint planning, task dependencies, and marketing integration. #SaaS #ProductUpdate</p>",
    statusId: "status-done",
    priority: "normal",
    assignees: [SEED_USERS[0], SEED_USERS[1]],
    dueDate: "2026-09-04",
    postPlatform: "linkedin",
    postFormat: "article",
    mediaUrl:
      "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format&fit=crop&q=80",
    tags: [SEED_TAGS[2]],
    subtasks: [
      {
        id: "sp-8",
        title: "Copy proofreading",
        completed: true,
        createdAt: "2026-09-07",
      },
      {
        id: "sp-9",
        title: "Publish to company page",
        completed: true,
        createdAt: "2026-09-07",
      },
    ],
    orderIndex: 3,
    createdAt: "2026-09-07T00:00:00.000Z",
    updatedAt: "2026-09-07T00:00:00.000Z",
  },
];

const INITIAL_CHANNEL_MESSAGES: ChannelMessage[] = [
  {
    id: "msg-1",
    channelId: "list-sprint-tasks",
    userId: "user-1",
    user: SEED_USERS[0],
    content:
      "🚀 Sprint 42 kickoff is underway! We're prioritizing Framer Motion animations and Table View interactive cells.",
    createdAt: "2026-08-28T09:00:00.000Z",
  },
  {
    id: "msg-2",
    channelId: "list-sprint-tasks",
    userId: "user-2",
    user: SEED_USERS[1],
    content:
      "I've linked the TanStack table column schemas. Testing inline cell editing now.",
    createdAt: "2026-08-28T10:15:00.000Z",
  },
  {
    id: "msg-3",
    channelId: "list-sprint-tasks",
    userId: "user-3",
    user: SEED_USERS[2],
    content:
      "Checked the dark mode palette contrast against WCAG 2.2 AA. All OLED tokens are verified! 👍",
    createdAt: "2026-08-28T11:30:00.000Z",
  },
];

const INITIAL_WORKSPACE: Workspace = {
  id: "ws-main",
  name: "Acme Product Workspace",
  avatar: "V",
  spaces: INITIAL_SPACES,
  members: SEED_USERS,
};

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

  // Actions
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
  }) => void;
  resetViewPreferences: () => void;
  fetchServerTasks: () => Promise<void>;

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
function resolveActor(state: WorkspaceState, provided?: User): User {
  if (provided) return provided;
  const workspace = state.workspaces.find((w) => w.id === state.activeWorkspaceId);
  return (
    workspace?.members.find((m) => m.id === state.currentUserId) ?? SEED_USERS[0]
  );
}
/**
 * Finds the space containing the given list (top-level or inside a folder).
 */
export function findSpaceForListId(
  workspaces: Workspace[],
  listId: string,
): Space | undefined {
  if (!listId) return undefined;
  for (const w of workspaces) {
    for (const s of w.spaces) {
      if (s.lists.some((l) => l.id === listId)) return s;
      if (s.folders.some((f) => f.lists.some((l) => l.id === listId)))
        return s;
    }
  }
  return undefined;
}

/**
 * Finds the workspace containing the given list.
 */
export function findWorkspaceForListId(
  workspaces: Workspace[],
  listId: string,
): Workspace | undefined {
  if (!listId) return undefined;
  return workspaces.find((w) =>
    w.spaces.some(
      (s) =>
        s.lists.some((l) => l.id === listId) ||
        s.folders.some((f) => f.lists.some((l) => l.id === listId)),
    ),
  );
}

/**
 * Returns all list IDs contained in a space (both top-level and inside folders).
 */
export function getSpaceListIds(space?: Space | null): string[] {
  if (!space) return [];
  const listIds: string[] = [];
  if (Array.isArray(space.lists)) {
    for (const l of space.lists) listIds.push(l.id);
  }
  if (Array.isArray(space.folders)) {
    for (const f of space.folders) {
      if (Array.isArray(f.lists)) {
        for (const l of f.lists) listIds.push(l.id);
      }
    }
  }
  return listIds;
}

/**
 * Bumps the execution counter for an automation rule.
 */
function countAutomationRun(id: string) {
  useWorkspaceStore.setState((s) => ({
    automationRuns: {
      ...s.automationRuns,
      [id]: (s.automationRuns[id] || 0) + 1,
    },
  }));
}
/**
 * Checks if making `taskId` depend on `dependsOnTaskId` would introduce a dependency cycle.
 */
export function wouldCreateCycle(
  taskId: string,
  dependsOnTaskId: string,
  tasks: Task[],
): boolean {
  if (taskId === dependsOnTaskId) return true;

  const taskMap = new Map<string, Task>(tasks.map((t) => [t.id, t]));
  const visited = new Set<string>();
  const queue: string[] = [dependsOnTaskId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (currentId === taskId) {
      return true; // Cycle detected: dependsOnTaskId already reaches taskId
    }
    if (!visited.has(currentId)) {
      visited.add(currentId);
      const currentTask = taskMap.get(currentId);
      if (currentTask?.dependencies) {
        for (const depId of currentTask.dependencies) {
          if (!visited.has(depId)) {
            queue.push(depId);
          }
        }
      }
    }
  }

  return false;
}

/**
 * Warns before this size so users can export a backup before writes fail.
 * localStorage quotas are typically ~5MB; serialized workspace JSON included.
 */
export const STORAGE_WARN_BYTES = 4 * 1024 * 1024;

let storageWarned = false;

function getBrowserStorage(): Storage | undefined {
  try {
    const ls = (globalThis as { localStorage?: Storage }).localStorage;
    return typeof ls === "undefined" ? undefined : ls;
  } catch {
    return undefined;
  }
}

function notifyStorage(message: string, level: "error" | "warning") {
  console.warn(`[vrello-up storage] ${message}`);
  try {
    if (typeof document !== "undefined") toast[level](message);
  } catch {
    // Headless environment (tests/SSR) — the console warning suffices.
  }
}

/**
 * localStorage wrapper: quota failures no longer throw out of persist,
 * and payloads near the ~5MB browser limit trigger a one-time warning.
 */
export const quotaAwareStorage: StateStorage = {
  getItem: (name) => getBrowserStorage()?.getItem(name) ?? null,
  setItem: (name, value) => {
    const storage = getBrowserStorage();
    if (!storage) return;
    try {
      storage.setItem(name, value);
    } catch {
      notifyStorage(
        "Workspace is too large to save — export a JSON backup, then delete old tasks.",
        "error",
      );
      return;
    }
    if (value.length > STORAGE_WARN_BYTES && !storageWarned) {
      storageWarned = true;
      notifyStorage(
        "Workspace is approaching the browser storage limit — export a backup soon.",
        "warning",
      );
    }
  },
  removeItem: (name) => {
    try {
      getBrowserStorage()?.removeItem(name);
    } catch {
      // Ignore cleanup failures; worst case a stale key remains.
    }
  },
};

function syncCreateTask(task: Task) {
  if (typeof window === "undefined") return;
  fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(task),
  }).catch((err) => console.warn("[vrello sync] failed to persist task creation:", err));
}

function syncUpdateTask(id: string, updates: Partial<Task>) {
  if (typeof window === "undefined") return;
  fetch(`/api/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  }).catch((err) => console.warn("[vrello sync] failed to persist task update:", err));
}

function syncDeleteTask(id: string) {
  if (typeof window === "undefined") return;
  fetch(`/api/tasks/${id}`, {
    method: "DELETE",
  }).catch((err) => console.warn("[vrello sync] failed to persist task deletion:", err));
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
export const TRASH_LIMIT = 50;

/** Soft-deleted tasks older than this are auto-purged when trash is touched. */
export const TRASH_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      workspaces: [INITIAL_WORKSPACE],
      activeWorkspaceId: "ws-main",
      activeSpaceId: "space-eng",
      activeListId: "list-sprint-tasks",
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
        const id = generateId("rule");
        const newRule: CustomAutomationRule = {
          ...ruleData,
          id,
          runCount: 0,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          customAutomations: [...state.customAutomations, newRule],
        }));
        return newRule;
      },
      removeCustomAutomation: (id) =>
        set((state) => ({
          customAutomations: state.customAutomations.filter((r) => r.id !== id),
        })),
      toggleCustomAutomation: (id, enabled) =>
        set((state) => ({
          customAutomations: state.customAutomations.map((r) =>
            r.id === id ? { ...r, enabled: enabled ?? !r.enabled } : r,
          ),
        })),
      runAutomationsForTrigger: async (trigger, payload = {}) => {
        const state = get();
        const activeRules = state.customAutomations.filter(
          (r) => r.enabled && r.trigger === trigger,
        );
        if (activeRules.length === 0) return 0;

        let executedCount = 0;
        const currentWorkspace =
          state.workspaces.find((w) => w.id === state.activeWorkspaceId) ||
          state.workspaces[0];
        const defaultSpace = currentWorkspace?.spaces[0];
        const defaultListId =
          defaultSpace?.lists[0]?.id || state.activeListId || "list-sprint-tasks";
        const defaultStatusId = defaultSpace?.statuses[0]?.id || "status-todo";
        const actor = resolveActor(state);

        for (const rule of activeRules) {
          switch (rule.action) {
            case "create_field_ops_task": {
              const partner = (payload.partnerName as string) || "Partner";
              const mouId = (payload.mouId as string) || "";
              const taskTitle = `Setup & Execution: MOU ${partner}`;
              const newTask = state.createTask({
                listId: defaultListId,
                title: taskTitle,
                description: `Automated setup task generated from approved MOU #${mouId || "N/A"}. Automatically assigned to Field Operations PIC.`,
                statusId: defaultStatusId,
                priority: "high",
                orderIndex: 0,
                relatedMarcomId: mouId || undefined,
                assignees: [actor],
                subtasks: [
                  {
                    id: generateId("st"),
                    title: "Branch outreach & venue confirmation",
                    completed: false,
                    createdAt: new Date().toISOString(),
                  },
                  {
                    id: generateId("st"),
                    title: "Field operations equipment verification",
                    completed: false,
                    createdAt: new Date().toISOString(),
                  },
                ],
                tags: [{ id: "tag-ops", name: "Operations", color: "#059669" }],
              });
              state.logActivity(
                newTask.id,
                "Automation created setup task in Field Operations assigned to branch PIC",
              );
              executedCount++;
              break;
            }

            case "notify_marcom_lead_high": {
              const taskId = payload.taskId as string | undefined;
              const eventTitle =
                (payload.eventTitle as string) ||
                (payload.title as string) ||
                "Upcoming Event";
              if (taskId) {
                state.updateTask(taskId, { priority: "urgent" });
                state.logActivity(
                  taskId,
                  "Automation notified Marcom Lead & flagged priority to High",
                );
              } else {
                const alertTask = state.createTask({
                  listId: defaultListId,
                  title: `URGENT: Event in 3 Days - ${eventTitle}`,
                  description: `Automated notice: Event date is within 3 days. Marcom Lead notified and flagged to High/Urgent priority.`,
                  statusId: defaultStatusId,
                  priority: "urgent",
                  orderIndex: 0,
                  assignees: [actor],
                  subtasks: [],
                  tags: [
                    { id: "tag-alert", name: "Urgent Alert", color: "#DC2626" },
                  ],
                });
                state.logActivity(
                  alertTask.id,
                  "Automation notified Marcom Lead & flagged priority to High",
                );
              }
              executedCount++;
              break;
            }

            case "assign_lead_architect_today": {
              const taskId = payload.taskId as string | undefined;
              if (taskId) {
                const today = new Date().toISOString().slice(0, 10);
                state.updateTask(taskId, {
                  assignees: [actor],
                  dueDate: today,
                });
                state.logActivity(
                  taskId,
                  "Automation assigned Lead Architect & set due date to today",
                );
                executedCount++;
              }
              break;
            }

            case "advance_status_review": {
              const taskId = payload.taskId as string | undefined;
              if (taskId) {
                const targetTask = state.tasks.find((t) => t.id === taskId);
                const space = targetTask
                  ? findSpaceForListId(state.workspaces, targetTask.listId)
                  : defaultSpace;
                const reviewStatus =
                  space?.statuses.find(
                    (s) =>
                      s.category === "review" ||
                      s.name.toLowerCase().includes("review"),
                  ) || space?.statuses[0];
                if (reviewStatus) {
                  state.updateTask(taskId, { statusId: reviewStatus.id });
                  state.logActivity(
                    taskId,
                    `Automation advanced status to ${reviewStatus.name}`,
                  );
                  executedCount++;
                }
              }
              break;
            }
          }

          // Bump rule execution count
          set((s) => ({
            customAutomations: s.customAutomations.map((r) =>
              r.id === rule.id ? { ...r, runCount: (r.runCount || 0) + 1 } : r,
            ),
          }));
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
      setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),
      setActiveSpace: (id) => {
        set({ activeSpaceId: id, activeListId: null });
      },
      setActiveList: (id) => set({ activeListId: id }),
      setActiveView: (view) => set({ activeView: view }),
      setSelectedTaskId: (id) =>
        set((state) => ({
          selectedTaskId: id,
          lastSelectedTaskId: id ?? state.lastSelectedTaskId,
        })),
      setSelectedBranchId: (id) => set({ selectedBranchId: id }),
      setMarcomFilter: (view, query) =>
        set((state) => ({
          marcomFilters: { ...state.marcomFilters, [view]: query },
        })),
      navigateToMarcom: (view, search) =>
        set((state) => ({
          activeView: view,
          marcomFilters:
            search !== undefined
              ? { ...state.marcomFilters, [view]: search }
              : state.marcomFilters,
        })),
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
          viewPreferences: {
            ...state.viewPreferences,
            ...prefs,
            visibleFields: {
              ...state.viewPreferences.visibleFields,
              ...prefs.visibleFields,
            },
          },
        })),
      resetViewPreferences: () =>
        set({ viewPreferences: DEFAULT_VIEW_PREFERENCES }),

      fetchServerTasks: async () => {
        if (typeof window === "undefined") return;
        try {
          const res = await fetch("/api/tasks");
          if (!res.ok) return;
          const data = await res.json();
          if (Array.isArray(data.tasks) && data.tasks.length > 0) {
            set((state) => ({
              tasks: data.tasks,
              workspaces:
                Array.isArray(data.workspaces) && data.workspaces.length > 0
                  ? data.workspaces
                  : state.workspaces,
            }));
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
        const id = generateId("task");
        const now = new Date().toISOString();
        const state = get();
        let targetListId = newTaskData.listId;
        if (!targetListId) {
          const currentSpace = state.workspaces
            .flatMap((w) => w.spaces)
            .find((s) => s.id === state.activeSpaceId);
          targetListId =
            state.activeListId ||
            currentSpace?.lists[0]?.id ||
            currentSpace?.folders[0]?.lists[0]?.id ||
            "list-sprint-tasks";
        }
        const newTask: Task = {
          ...newTaskData,
          listId: targetListId,
          id,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ tasks: [newTask, ...s.tasks] }));
        syncCreateTask(newTask);
        return newTask;
      },

      updateTask: (id, updates) => {
        const prev = get().tasks.find((t) => t.id === id);
        const escalatesToUrgent =
          !!prev && updates.priority === "urgent" && prev.priority !== "urgent";
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? { ...task, ...updates, updatedAt: new Date().toISOString() }
              : task,
          ),
        }));
        syncUpdateTask(id, updates);
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
        const doomed = get().tasks.find((t) => t.id === id);
        const now = new Date().toISOString();
        set((state) => ({
          tasks: state.tasks
            .filter((t) => t.id !== id)
            .map((t) =>
              t.dependencies && t.dependencies.includes(id)
                ? {
                    ...t,
                    dependencies: t.dependencies.filter((depId) => depId !== id),
                    updatedAt: now,
                  }
                : t,
            ),
          // Soft-delete: keep a snapshot in trash for restore/undo.
          // Dependency links into the deleted task are pruned and are
          // not re-attached on restore (restore only revives the task).
          trash: doomed
            ? [{ task: doomed, deletedAt: now }, ...(state.trash ?? [])].slice(
                0,
                TRASH_LIMIT,
              )
            : (state.trash ?? []),
          selectedTaskId:
            state.selectedTaskId === id ? null : state.selectedTaskId,
          lastSelectedTaskId:
            state.lastSelectedTaskId === id ? null : state.lastSelectedTaskId,
          selectedTaskIds: state.selectedTaskIds.filter((t) => t !== id),
        }));
        // The server mirrors live tasks only; trash itself stays local.
        syncDeleteTask(id);
      },

      restoreTasks: (ids) => {
        if (ids.length === 0) return 0;
        const targets = new Set(ids);
        const entries = (get().trash ?? []).filter((e) => targets.has(e.task.id));
        if (entries.length === 0) return 0;
        const revivedIds = new Set(entries.map((e) => e.task.id));
        const now = new Date().toISOString();
        set((state) => ({
          trash: (state.trash ?? []).filter((e) => !revivedIds.has(e.task.id)),
          tasks: [
            ...entries.map((e) => ({ ...e.task, updatedAt: now })),
            ...state.tasks,
          ],
        }));
        // Re-persist revived tasks; the earlier soft-delete removed them.
        for (const entry of entries) syncCreateTask({ ...entry.task, updatedAt: now });
        return entries.length;
      },

      permanentlyDeleteTask: (id) =>
        set((state) => ({
          trash: (state.trash ?? []).filter((e) => e.task.id !== id),
        })),

      emptyTrash: () => set({ trash: [] }),

      purgeExpiredTrash: () => {
        const cutoff = Date.now() - TRASH_RETENTION_MS;
        set((state) => ({
          trash: (state.trash ?? []).filter(
            (e) => new Date(e.deletedAt).getTime() >= cutoff,
          ),
        }));
      },

      bulkUpdateTasks: (ids, updates) => {
        if (ids.length === 0) return;
        const targets = new Set(ids);
        const now = new Date().toISOString();
        set((state) => ({
          tasks: state.tasks.map((task) =>
            targets.has(task.id) ? { ...task, ...updates, updatedAt: now } : task,
          ),
        }));
        for (const id of targets) syncUpdateTask(id, updates);
      },

      toggleTaskSelection: (id) =>
        set((state) => ({
          selectedTaskIds: state.selectedTaskIds.includes(id)
            ? state.selectedTaskIds.filter((t) => t !== id)
            : [...state.selectedTaskIds, id],
        })),
      setTaskSelection: (ids) => set({ selectedTaskIds: [...new Set(ids)] }),
      clearTaskSelection: () => set({ selectedTaskIds: [] }),

      moveTaskStatus: (taskId, newStatusId, newOrderIndex) => {
        const prev = get().tasks.find((t) => t.id === taskId);
        set((state) => {
          const task = state.tasks.find((t) => t.id === taskId);
          if (!task) return state;

          const updatedTasks = state.tasks.map((t) => {
            if (t.id === taskId) {
              return {
                ...t,
                statusId: newStatusId,
                orderIndex:
                  newOrderIndex !== undefined ? newOrderIndex : t.orderIndex,
                updatedAt: new Date().toISOString(),
              };
            }
            return t;
          });

          return { tasks: updatedTasks };
        });
        syncUpdateTask(taskId, {
          statusId: newStatusId,
          orderIndex: newOrderIndex,
        });
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
        set((state) => {
          const idToIndex = new Map(
            orderedTaskIds.map((id, index) => [id, index]),
          );
          const updatedTasks = state.tasks.map((task) => {
            if (task.statusId === statusId && idToIndex.has(task.id)) {
              return { ...task, orderIndex: idToIndex.get(task.id)! };
            }
            return task;
          });
          return { tasks: updatedTasks };
        });
      },

      addSubtask: (taskId, title) => {
        const newSubtask = {
          id: generateId("sub"),
          title,
          completed: false,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  subtasks: [...t.subtasks, newSubtask],
                  updatedAt: new Date().toISOString(),
                }
              : t,
          ),
        }));
        const t = get().tasks.find((task) => task.id === taskId);
        if (t) syncUpdateTask(taskId, { subtasks: t.subtasks });
      },

      toggleSubtask: (taskId, subtaskId) => {
        const task = get().tasks.find((t) => t.id === taskId);
        const target = task?.subtasks.find((st) => st.id === subtaskId);
        const completesAll =
          !!task &&
          !!target &&
          !target.completed &&
          task.subtasks.length > 0 &&
          task.subtasks.every(
            (st) => st.id === subtaskId || st.completed,
          );
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  subtasks: t.subtasks.map((st) =>
                    st.id === subtaskId
                      ? { ...st, completed: !st.completed }
                      : st,
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : t,
          ),
        }));
        const tAfter = get().tasks.find((task) => task.id === taskId);
        if (tAfter) syncUpdateTask(taskId, { subtasks: tAfter.subtasks });
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
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  subtasks: t.subtasks.filter((st) => st.id !== subtaskId),
                  updatedAt: new Date().toISOString(),
                }
              : t,
          ),
        }));
        const t = get().tasks.find((task) => task.id === taskId);
        if (t) syncUpdateTask(taskId, { subtasks: t.subtasks });
      },

      addComment: (taskId, content, user, attachments) => {
        if (!content.trim() && (!attachments || attachments.length === 0)) return;
        const actor = resolveActor(get(), user);
        const now = new Date().toISOString();
        const newComment: TaskComment = {
          id: generateId("comment"),
          taskId,
          userId: actor.id,
          user: actor,
          content: content.trim(),
          createdAt: now,
          attachments,
        };

        const newActivity: ActivityLog = {
          id: generateId("act"),
          taskId,
          userId: actor.id,
          userName: actor.name,
          userAvatar: actor.avatar,
          action: "commented on this task",
          createdAt: now,
        };

        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  comments: [...(task.comments || []), newComment],
                  activities: [newActivity, ...(task.activities || [])],
                  updatedAt: now,
                }
              : task
          ),
        }));
        syncAddComment(taskId, newComment);
      },

      deleteComment: (taskId, commentId) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  comments: (task.comments || []).filter((c) => c.id !== commentId),
                  updatedAt: new Date().toISOString(),
                }
              : task
          ),
        }));
      },

      addChannelMessage: (channelId, content, user) => {
        if (!content.trim()) return;
        const actor = resolveActor(get(), user);
        const now = new Date().toISOString();
        const newMessage: ChannelMessage = {
          id: generateId("cmsg"),
          channelId,
          userId: actor.id,
          user: actor,
          content: content.trim(),
          createdAt: now,
        };
        set((state) => ({
          channelMessages: [...(state.channelMessages || []), newMessage],
        }));
      },

      logActivity: (taskId, action, user) => {
        const actor = resolveActor(get(), user);
        const newActivity: ActivityLog = {
          id: generateId("act"),
          taskId,
          userId: actor.id,
          userName: actor.name,
          userAvatar: actor.avatar,
          action,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  activities: [newActivity, ...(task.activities || [])],
                  updatedAt: new Date().toISOString(),
                }
              : task
          ),
        }));
      },

      addDependency: (taskId, dependsOnTaskId) => {
        if (taskId === dependsOnTaskId) return false;

        const { tasks } = get();
        if (wouldCreateCycle(taskId, dependsOnTaskId, tasks)) {
          return false;
        }

        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id === taskId) {
              const currentDeps = t.dependencies || [];
              if (!currentDeps.includes(dependsOnTaskId)) {
                return {
                  ...t,
                  dependencies: [...currentDeps, dependsOnTaskId],
                  updatedAt: new Date().toISOString(),
                };
              }
            }
            return t;
          }),
        }));
        return true;
      },

      removeDependency: (taskId, dependsOnTaskId) => {
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id === taskId && t.dependencies) {
              return {
                ...t,
                dependencies: t.dependencies.filter(
                  (d) => d !== dependsOnTaskId,
                ),
                updatedAt: new Date().toISOString(),
              };
            }
            return t;
          }),
        }));
      },

      createSpace: (name, icon, color) => {
        const id = generateId("space");
        const newSpace: Space = {
          id,
          workspaceId: get().activeWorkspaceId,
          name,
          icon,
          color,
          statuses: DEFAULT_STATUSES,
          folders: [],
          lists: [
            {
              id: generateId("list"),
              spaceId: id,
              name: "General",
              icon: "List",
            },
          ],
        };

        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === state.activeWorkspaceId
              ? { ...w, spaces: [...w.spaces, newSpace] }
              : w,
          ),
          activeSpaceId: id,
          activeListId: newSpace.lists[0].id,
        }));
        return newSpace;
      },

      updateSpace: (spaceId, updates) => {
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === state.activeWorkspaceId
              ? {
                  ...w,
                  spaces: w.spaces.map((s) =>
                    s.id === spaceId ? { ...s, ...updates } : s,
                  ),
                }
              : w,
          ),
        }));
      },

      deleteSpace: (spaceId) => {
        const state = get();
        const activeWs = state.workspaces.find(
          (w) => w.id === state.activeWorkspaceId,
        );
        const spaceToDelete = activeWs?.spaces.find((s) => s.id === spaceId);
        if (!spaceToDelete) return;

        const listIdsToDelete = new Set<string>([
          ...spaceToDelete.lists.map((l) => l.id),
          ...spaceToDelete.folders.flatMap((f) => f.lists.map((l) => l.id)),
        ]);

        const remainingSpaces =
          activeWs?.spaces.filter((s) => s.id !== spaceId) || [];
        const nextSpace = remainingSpaces[0];
        const nextListId =
          nextSpace?.lists[0]?.id ||
          nextSpace?.folders[0]?.lists[0]?.id ||
          "";

        set((prev) => ({
          workspaces: prev.workspaces.map((w) =>
            w.id === prev.activeWorkspaceId
              ? { ...w, spaces: w.spaces.filter((s) => s.id !== spaceId) }
              : w,
          ),
          tasks: prev.tasks.filter((t) => !listIdsToDelete.has(t.listId)),
          activeSpaceId:
            prev.activeSpaceId === spaceId
              ? (nextSpace?.id || "")
              : prev.activeSpaceId,
          activeListId:
            prev.activeSpaceId === spaceId ? nextListId : prev.activeListId,
        }));
      },

      createFolder: (spaceId, name) => {
        const newFolder: Folder = {
          id: generateId("folder"),
          spaceId,
          name,
          lists: [],
        };

        set((state) => ({
          workspaces: state.workspaces.map((w) => {
            if (w.id !== state.activeWorkspaceId) return w;
            return {
              ...w,
              spaces: w.spaces.map((s) =>
                s.id === spaceId
                  ? { ...s, folders: [...s.folders, newFolder] }
                  : s,
              ),
            };
          }),
        }));
        return newFolder;
      },

      updateFolder: (spaceId, folderId, name) => {
        set((state) => ({
          workspaces: state.workspaces.map((w) => {
            if (w.id !== state.activeWorkspaceId) return w;
            return {
              ...w,
              spaces: w.spaces.map((s) => {
                if (s.id !== spaceId) return s;
                return {
                  ...s,
                  folders: s.folders.map((f) =>
                    f.id === folderId ? { ...f, name } : f,
                  ),
                };
              }),
            };
          }),
        }));
      },

      deleteFolder: (spaceId, folderId) => {
        const state = get();
        const activeWs = state.workspaces.find(
          (w) => w.id === state.activeWorkspaceId,
        );
        const currentSpace = activeWs?.spaces.find((s) => s.id === spaceId);
        const folderToDelete = currentSpace?.folders.find(
          (f) => f.id === folderId,
        );
        if (!folderToDelete) return;

        const folderListIds = new Set(folderToDelete.lists.map((l) => l.id));

        let nextListId = state.activeListId;
        if (state.activeListId && folderListIds.has(state.activeListId)) {
          nextListId =
            currentSpace?.lists[0]?.id ||
            currentSpace?.folders.find((f) => f.id !== folderId)?.lists[0]
              ?.id ||
            "";
        }

        set((prev) => ({
          workspaces: prev.workspaces.map((w) => {
            if (w.id !== prev.activeWorkspaceId) return w;
            return {
              ...w,
              spaces: w.spaces.map((s) => {
                if (s.id !== spaceId) return s;
                return {
                  ...s,
                  folders: s.folders.filter((f) => f.id !== folderId),
                };
              }),
            };
          }),
          tasks: prev.tasks.filter((t) => !folderListIds.has(t.listId)),
          activeListId: nextListId,
        }));
      },

      createList: (spaceId, name, folderId) => {
        const newList: List = {
          id: generateId("list"),
          spaceId,
          folderId,
          name,
          icon: "ListTodo",
        };

        set((state) => ({
          workspaces: state.workspaces.map((w) => {
            if (w.id !== state.activeWorkspaceId) return w;
            return {
              ...w,
              spaces: w.spaces.map((s) => {
                if (s.id !== spaceId) return s;
                if (folderId) {
                  return {
                    ...s,
                    folders: s.folders.map((f) =>
                      f.id === folderId
                        ? { ...f, lists: [...f.lists, newList] }
                        : f,
                    ),
                  };
                }
                return { ...s, lists: [...s.lists, newList] };
              }),
            };
          }),
          activeListId: newList.id,
        }));
        return newList;
      },

      updateList: (spaceId, listId, updates, folderId) => {
        set((state) => ({
          workspaces: state.workspaces.map((w) => {
            if (w.id !== state.activeWorkspaceId) return w;
            return {
              ...w,
              spaces: w.spaces.map((s) => {
                if (s.id !== spaceId) return s;
                if (folderId) {
                  return {
                    ...s,
                    folders: s.folders.map((f) =>
                      f.id === folderId
                        ? {
                            ...f,
                            lists: f.lists.map((l) =>
                              l.id === listId ? { ...l, ...updates } : l,
                            ),
                          }
                        : f,
                    ),
                  };
                }
                return {
                  ...s,
                  lists: s.lists.map((l) =>
                    l.id === listId ? { ...l, ...updates } : l,
                  ),
                };
              }),
            };
          }),
        }));
      },

      deleteList: (spaceId, listId, folderId) => {
        const state = get();
        const activeWs = state.workspaces.find(
          (w) => w.id === state.activeWorkspaceId,
        );
        const currentSpace = activeWs?.spaces.find((s) => s.id === spaceId);

        let nextListId = state.activeListId;
        if (state.activeListId === listId) {
          const otherDirectLists =
            currentSpace?.lists.filter((l) => l.id !== listId) || [];
          const otherFolderLists =
            currentSpace?.folders
              .flatMap((f) => f.lists)
              .filter((l) => l.id !== listId) || [];
          nextListId = otherDirectLists[0]?.id || otherFolderLists[0]?.id || "";
        }

        set((prev) => ({
          workspaces: prev.workspaces.map((w) => {
            if (w.id !== prev.activeWorkspaceId) return w;
            return {
              ...w,
              spaces: w.spaces.map((s) => {
                if (s.id !== spaceId) return s;
                if (folderId) {
                  return {
                    ...s,
                    folders: s.folders.map((f) =>
                      f.id === folderId
                        ? {
                            ...f,
                            lists: f.lists.filter((l) => l.id !== listId),
                          }
                        : f,
                    ),
                  };
                }
                return {
                  ...s,
                  lists: s.lists.filter((l) => l.id !== listId),
                };
              }),
            };
          }),
          tasks: prev.tasks.filter((t) => t.listId !== listId),
          activeListId: nextListId,
        }));
      },

      addStatusToSpace: (spaceId, name, color) => {
        set((state) => ({
          workspaces: state.workspaces.map((w) => {
            if (w.id !== state.activeWorkspaceId) return w;
            return {
              ...w,
              spaces: w.spaces.map((s) => {
                if (s.id !== spaceId) return s;
                const newStatus: Status = {
                  id: generateId("status"),
                  name: name.toUpperCase(),
                  color,
                  category: "in_progress",
                  order: s.statuses.length,
                };
                return { ...s, statuses: [...s.statuses, newStatus] };
              }),
            };
          }),
        }));
      },

      updateStatus: (spaceId, statusId, updates) => {
        set((state) => ({
          workspaces: state.workspaces.map((w) => {
            if (w.id !== state.activeWorkspaceId) return w;
            return {
              ...w,
              spaces: w.spaces.map((s) => {
                if (s.id !== spaceId) return s;
                return {
                  ...s,
                  statuses: s.statuses.map((st) =>
                    st.id === statusId ? { ...st, ...updates } : st,
                  ),
                };
              }),
            };
          }),
        }));
      },

      deleteStatus: (spaceId, statusId, fallbackStatusId) => {
        const state = get();
        const activeWs = state.workspaces.find(
          (w) => w.id === state.activeWorkspaceId,
        );
        const currentSpace = activeWs?.spaces.find((s) => s.id === spaceId);
        const remainingStatuses =
          currentSpace?.statuses.filter((st) => st.id !== statusId) || [];
        const fallback =
          fallbackStatusId || remainingStatuses[0]?.id || "status-todo";

        set((prev) => ({
          workspaces: prev.workspaces.map((w) => {
            if (w.id !== prev.activeWorkspaceId) return w;
            return {
              ...w,
              spaces: w.spaces.map((s) => {
                if (s.id !== spaceId) return s;
                return {
                  ...s,
                  statuses: s.statuses.filter((st) => st.id !== statusId),
                };
              }),
            };
          }),
          tasks: prev.tasks.map((t) =>
            t.statusId === statusId ? { ...t, statusId: fallback } : t,
          ),
        }));
      },

      createTag: (name, color) => {
        const tag: Tag = { id: generateId("tag"), name: name.trim(), color };
        set((state) => ({ tags: [...state.tags, tag] }));
        return tag;
      },
      renameTag: (id, name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set((state) => ({
          tags: state.tags.map((t) => (t.id === id ? { ...t, name: trimmed } : t)),
          tasks: state.tasks.map((t) => ({
            ...t,
            tags: t.tags.map((tt) => (tt.id === id ? { ...tt, name: trimmed } : tt)),
          })),
        }));
      },
      deleteTag: (id) => {
        set((state) => ({
          tags: state.tags.filter((t) => t.id !== id),
          tasks: state.tasks.map((t) => ({
            ...t,
            tags: t.tags.filter((tt) => tt.id !== id),
          })),
        }));
      },
      toggleTaskTag: (taskId, tagId) => {
        const tag = get().tags.find((t) => t.id === tagId);
        if (!tag) return;
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id !== taskId) return t;
            const has = t.tags.some((tt) => tt.id === tagId);
            return {
              ...t,
              tags: has ? t.tags.filter((tt) => tt.id !== tagId) : [...t.tags, tag],
            };
          }),
        }));
      },
      addWorkspaceMember: (name, email, role = "staff") => {
        const id = generateId("user");
        const newMember: User = {
          id,
          name: name.trim(),
          email: email.trim(),
          role,
          avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80`,
        };
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === state.activeWorkspaceId
              ? { ...w, members: [...w.members, newMember] }
              : w,
          ),
        }));
        return newMember;
      },
      removeWorkspaceMember: (userId) => {
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === state.activeWorkspaceId
              ? { ...w, members: w.members.filter((m) => m.id !== userId) }
              : w,
          ),
        }));
      },
      importBackup: (data) => {
        if (!data || typeof data !== "object") return false;
        const backup = data as {
          workspace?: Workspace;
          tasks?: Task[];
          tags?: Tag[];
        };
        const workspace = backup.workspace;
        if (
          !workspace ||
          typeof workspace.id !== "string" ||
          !Array.isArray(workspace.spaces)
        ) {
          return false;
        }
        const tasks = Array.isArray(backup.tasks) ? backup.tasks : [];
        const tags = Array.isArray(backup.tags) ? backup.tags : [];
        const normalized: Workspace = {
          ...workspace,
          members: Array.isArray(workspace.members)
            ? workspace.members
            : SEED_USERS,
        };
        set((state) => {
          const exists = state.workspaces.some((w) => w.id === normalized.id);
          const space = normalized.spaces[0];
          return {
            workspaces: exists
              ? state.workspaces.map((w) =>
                  w.id === normalized.id ? normalized : w,
                )
              : [...state.workspaces, normalized],
            tasks,
            tags,
            activeWorkspaceId: normalized.id,
            activeSpaceId: space?.id || "",
            activeListId:
              space?.lists[0]?.id || space?.folders[0]?.lists[0]?.id || "",
            selectedTaskId: null,
            lastSelectedTaskId: null,
          };
        });
        return true;
      },
    }),
    {
      name: "vrelloup-workspace-storage",
      version: 1,
      storage: createJSONStorage(() => quotaAwareStorage),
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.workspaces)) {
          state.workspaces = state.workspaces.map((w) => ({
            ...w,
            members: (w.members || []).map((m) => {
              if (m.id === "user-1" && !m.role) return { ...m, role: "admin" as const };
              if (m.id.startsWith("google-") && !m.role) return { ...m, role: "admin" as const };
              return m;
            }),
          }));
        }
      },
      migrate: (persistedState: unknown, version: number) => {
        const state = (persistedState || {}) as Record<string, unknown>;

        // Migration from unversioned (v0) to v1
        if (version === 0 || !version) {
          const rawWorkspaces = Array.isArray(state.workspaces) && state.workspaces.length > 0
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
            activeSpaceId: (typeof state.activeSpaceId === "string" && state.activeSpaceId) || activeSpace?.id || "space-eng",
            activeListId: state.activeListId === null ? null : ((typeof state.activeListId === "string" && state.activeListId) || activeList || "list-sprint-tasks"),
            activeView: (state.activeView as ViewMode) || "list",
          };
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
