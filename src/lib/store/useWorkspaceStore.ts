import { create } from "zustand";
import { persist } from "zustand/middleware";
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
    role: "Lead Architect",
  },
  {
    id: "user-2",
    name: "Sarah Chen",
    email: "sarah@vrelloup.dev",
    avatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80",
    role: "Senior Frontend Engineer",
  },
  {
    id: "user-3",
    name: "Marcus Vance",
    email: "marcus@vrelloup.dev",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    role: "Product Designer",
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
  activeListId: string;
  tasks: Task[];
  tags: Tag[];
  channelMessages: ChannelMessage[];
  selectedTaskId: string | null;
  activeView: ViewMode;
  currentUserId: string;
  filters: FilterOptions;
  viewPreferences: ViewPreferences;
  isSidebarOpen: boolean;
  isCommandPaletteOpen: boolean;
  isCreateTaskModalOpen: boolean;
  isAiDrawerOpen: boolean;
  isHelpDocsOpen: boolean;
  isFilterBarOpen: boolean;

  // Actions
  setCommandPaletteOpen: (open: boolean) => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  setAiDrawerOpen: (open: boolean) => void;
  setCreateTaskModalOpen: (open: boolean) => void;
  setHelpDocsOpen: (open: boolean) => void;
  setFilterBarOpen: (open: boolean) => void;
  setActiveWorkspace: (id: string) => void;
  setActiveSpace: (id: string) => void;
  setActiveList: (id: string) => void;
  setActiveView: (view: ViewMode) => void;
  setSelectedTaskId: (id: string | null) => void;
  setCurrentUserId: (id: string) => void;
  toggleSidebar: () => void;
  setFilters: (filters: Partial<FilterOptions>) => void;
  resetFilters: () => void;
  setViewPreferences: (prefs: {
    density?: ViewPreferences["density"];
    visibleFields?: Partial<ViewPreferences["visibleFields"]>;
  }) => void;
  resetViewPreferences: () => void;

  // Task Actions
  createTask: (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
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
  addWorkspaceMember: (name: string, email: string, role?: string) => User;
  removeWorkspaceMember: (userId: string) => void;

  // Backup Actions
  importBackup: (data: unknown) => boolean;

  // Automation Actions
  automationEnabled: Record<string, boolean>;
  automationRuns: Record<string, number>;
  setAutomationEnabled: (id: string, enabled: boolean) => void;
}

/**
 * Finds the space containing the given list (top-level or inside a folder).
 */
function findSpaceForListId(
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
      activeView: "list",
      currentUserId: "user-1",
      isSidebarOpen: true,
      isCommandPaletteOpen: false,
      isCreateTaskModalOpen: false,
      isAiDrawerOpen: false,
      isHelpDocsOpen: false,
      isFilterBarOpen: true,
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
      setHelpDocsOpen: (open) => set({ isHelpDocsOpen: open }),
      setFilterBarOpen: (open) => set({ isFilterBarOpen: open }),
      setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),
      setActiveSpace: (id) => {
        const space = get()
          .workspaces.flatMap((w) => w.spaces)
          .find((s) => s.id === id);
        const firstList =
          space?.lists[0]?.id || space?.folders[0]?.lists[0]?.id || "";
        set({ activeSpaceId: id, activeListId: firstList });
      },
      setActiveList: (id) => set({ activeListId: id }),
      setActiveView: (view) => set({ activeView: view }),
      setSelectedTaskId: (id) => set({ selectedTaskId: id }),
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

      createTask: (newTaskData) => {
        const id = generateId("task");
        const now = new Date().toISOString();
        const newTask: Task = {
          ...newTaskData,
          id,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ tasks: [newTask, ...state.tasks] }));
        return newTask;
      },

      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? { ...task, ...updates, updatedAt: new Date().toISOString() }
              : task,
          ),
        }));
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks
            .filter((t) => t.id !== id)
            .map((t) =>
              t.dependencies && t.dependencies.includes(id)
                ? {
                    ...t,
                    dependencies: t.dependencies.filter((depId) => depId !== id),
                    updatedAt: new Date().toISOString(),
                  }
                : t,
            ),
          selectedTaskId:
            state.selectedTaskId === id ? null : state.selectedTaskId,
        }));
      },

      moveTaskStatus: (taskId, newStatusId, newOrderIndex) => {
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
      },

      addComment: (taskId, content, user = SEED_USERS[0], attachments) => {
        if (!content.trim() && (!attachments || attachments.length === 0)) return;
        const now = new Date().toISOString();
        const newComment: TaskComment = {
          id: generateId("comment"),
          taskId,
          userId: user.id,
          user,
          content: content.trim(),
          createdAt: now,
          attachments,
        };

        const newActivity: ActivityLog = {
          id: generateId("act"),
          taskId,
          userId: user.id,
          userName: user.name,
          userAvatar: user.avatar,
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

      addChannelMessage: (channelId, content, user = SEED_USERS[0]) => {
        if (!content.trim()) return;
        const now = new Date().toISOString();
        const newMessage: ChannelMessage = {
          id: generateId("cmsg"),
          channelId,
          userId: user.id,
          user,
          content: content.trim(),
          createdAt: now,
        };
        set((state) => ({
          channelMessages: [...(state.channelMessages || []), newMessage],
        }));
      },

      logActivity: (taskId, action, user = SEED_USERS[0]) => {
        const newActivity: ActivityLog = {
          id: generateId("act"),
          taskId,
          userId: user.id,
          userName: user.name,
          userAvatar: user.avatar,
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
        if (folderListIds.has(state.activeListId)) {
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
      addWorkspaceMember: (name, email, role = "Member") => {
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
          };
        });
        return true;
      },
    }),
    {
      name: "vrelloup-workspace-storage",
      version: 1,
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

          const rawTasks = Array.isArray(state.tasks)
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
            activeListId: (typeof state.activeListId === "string" && state.activeListId) || activeList || "list-sprint-tasks",
            activeView: (state.activeView as ViewMode) || "list",
          };
        }

        return state;
      },
      partialize: (state) => ({
        workspaces: state.workspaces,
        tasks: state.tasks,
        channelMessages: state.channelMessages,
        activeWorkspaceId: state.activeWorkspaceId,
        activeSpaceId: state.activeSpaceId,
        activeListId: state.activeListId,
        activeView: state.activeView,
        currentUserId: state.currentUserId,
        tags: state.tags,
      }),
    },
  ),
);
