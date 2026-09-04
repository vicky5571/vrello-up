import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  type Workspace,
  type Space,
  type List,
  type Task,
  type Status,
  type ViewMode,
  type FilterOptions,
  type User,
  type Tag,
} from "@/types";

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

const INITIAL_WORKSPACE: Workspace = {
  id: "ws-main",
  name: "Acme Product Workspace",
  avatar: "🚀",
  spaces: INITIAL_SPACES,
  members: SEED_USERS,
};

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  activeSpaceId: string;
  activeListId: string;
  tasks: Task[];
  selectedTaskId: string | null;
  activeView: ViewMode;
  filters: FilterOptions;
  isSidebarOpen: boolean;

  // Actions
  setActiveWorkspace: (id: string) => void;
  setActiveSpace: (id: string) => void;
  setActiveList: (id: string) => void;
  setActiveView: (view: ViewMode) => void;
  setSelectedTaskId: (id: string | null) => void;
  toggleSidebar: () => void;
  setFilters: (filters: Partial<FilterOptions>) => void;
  resetFilters: () => void;

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

  // Dependency Actions
  addDependency: (taskId: string, dependsOnTaskId: string) => void;
  removeDependency: (taskId: string, dependsOnTaskId: string) => void;

  // Space & List Actions
  createSpace: (name: string, icon: string, color: string) => Space;
  createList: (spaceId: string, name: string, folderId?: string) => List;
  createFolder: (spaceId: string, name: string) => void;
  addStatusToSpace: (spaceId: string, name: string, color: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      workspaces: [INITIAL_WORKSPACE],
      activeWorkspaceId: "ws-main",
      activeSpaceId: "space-eng",
      activeListId: "list-sprint-tasks",
      tasks: INITIAL_TASKS,
      selectedTaskId: null,
      activeView: "board",
      isSidebarOpen: true,
      filters: {
        search: "",
        statusIds: [],
        priorities: [],
        assigneeIds: [],
        tagIds: [],
      },

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
          },
        }),

      createTask: (newTaskData) => {
        const id = `task-${Date.now()}`;
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
          id: `sub-${Date.now()}`,
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

      addDependency: (taskId, dependsOnTaskId) => {
        if (taskId === dependsOnTaskId) return;
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
        const id = `space-${Date.now()}`;
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
              id: `list-${Date.now()}`,
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

      createList: (spaceId, name, folderId) => {
        const newList: List = {
          id: `list-${Date.now()}`,
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

      createFolder: (spaceId, name) => {
        const newFolder = {
          id: `folder-${Date.now()}`,
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
                  id: `status-${Date.now()}`,
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
    }),
    {
      name: "vrelloup-workspace-storage",
      partialize: (state) => ({
        workspaces: state.workspaces,
        tasks: state.tasks,
        activeWorkspaceId: state.activeWorkspaceId,
        activeSpaceId: state.activeSpaceId,
        activeListId: state.activeListId,
        activeView: state.activeView,
      }),
    },
  ),
);
