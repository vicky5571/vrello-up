# Workspace Store Slices Composition (Phase 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the monolithic `src/lib/store/useWorkspaceStore.ts` (1,476 lines) into Zustand Slice Pattern under `src/lib/store/slices/`, reducing `useWorkspaceStore.ts` to ~160 lines while maintaining 100% backward compatibility and passing all 539 unit tests.

**Architecture:** Decompose the monolithic store into 6 dedicated slices (`createWorkspaceSlice`, `createSpaceSlice`, `createTaskSlice`, `createTrashSlice`, `createAutomationSlice`, `createUiSlice`) sharing the composite `WorkspaceStore` type via `StateCreator<WorkspaceStore, [], [], Slice>`. `useWorkspaceStore.ts` becomes a thin aggregator that composes slices with persistence, migration, rehydration, and re-exports existing public APIs.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5, Zustand 5, Node Native Test Runner (`node --test`).

**Spec:** Phase 2 of God File Strangler Pattern: Slice Pattern Composition for `useWorkspaceStore.ts`.

---

## Global Constraints

- Zero breaking changes to `useWorkspaceStore.getState()` or component hook selectors across all call sites.
- All core types MUST continue to be imported from `@/types` (`src/types/index.ts`). No duplicate inline interfaces.
- Dual-persistence discipline must be strictly preserved: mutations update client state immediately and mirror to API/localStorage.
- All existing exports from `useWorkspaceStore.ts` (`wouldCreateCycle`, `normalizeViewMode`, `findSpaceForListId`, `findWorkspaceForListId`, `reconcileWorkspaces`, `STORAGE_WARN_BYTES`, `quotaAwareStorage`, `TRASH_LIMIT`, `TRASH_RETENTION_MS`, `DEFAULT_VIEW_PREFERENCES`, `type TrashedTask`, `type WorkspaceState`) MUST remain exported.
- Every task must end with 100% green tests verified via `npm test -- <test-file>` and `npx tsc --noEmit`.

---

### Task 1: Create Slice Interfaces & Composite Type (`src/lib/store/slices/types.ts`)

**Files:**
- Create: `src/lib/store/slices/types.ts`
- Test: `test/register-alias.mjs`

**Interfaces:**
- Consumes: `@/types` (`Workspace`, `Space`, `Folder`, `List`, `Status`, `Task`, `TaskComment`, `TaskCommentAttachment`, `ActivityLog`, `ChannelMessage`, `AppMode`, `ViewMode`, `FilterOptions`, `ViewPreferences`, `User`, `Tag`, `AutomationTrigger`, `CustomAutomationRule`)
- Produces:
  - `WorkspaceSlice`
  - `SpaceSlice`
  - `TaskSlice`
  - `TrashSlice`
  - `AutomationSlice`
  - `UiSlice`
  - `WorkspaceStore`
  - `TrashedTask`

- [x] **Step 1: Create `src/lib/store/slices/types.ts`**
Define interfaces for each slice and the unified `WorkspaceStore` type representing their intersection:

```typescript
import type {
  Workspace,
  Space,
  Folder,
  List,
  Status,
  Task,
  TaskComment,
  TaskCommentAttachment,
  ActivityLog,
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
```

- [x] **Step 2: Type check types.ts**
Run: `npx tsc --noEmit`
Expected: 0 errors.

- [x] **Step 3: Commit**
```bash
git add src/lib/store/slices/types.ts
git commit -m "feat(store): define slice interfaces and composite WorkspaceStore type"
```

---

### Task 2: Implement `createWorkspaceSlice` (`src/lib/store/slices/createWorkspaceSlice.ts`)

**Files:**
- Create: `src/lib/store/slices/createWorkspaceSlice.ts`
- Test: `src/lib/store/workspaceCrud.test.ts`, `src/lib/store/workspaceSwitch.test.ts`

**Interfaces:**
- Consumes: `WorkspaceStore`, `WorkspaceSlice` from `./types`
- Produces: `createWorkspaceSlice: StateCreator<WorkspaceStore, [], [], WorkspaceSlice>`

- [x] **Step 1: Implement `createWorkspaceSlice.ts`**
Extract workspace CRUD, member operations, backup import, and server tasks synchronization.

- [x] **Step 2: Verify with targeted tests**
Run: `npm test -- src/lib/store/workspaceCrud.test.ts src/lib/store/workspaceSwitch.test.ts`
Expected: PASS.

- [x] **Step 3: Commit**
```bash
git add src/lib/store/slices/createWorkspaceSlice.ts
git commit -m "feat(store): implement createWorkspaceSlice"
```

---

### Task 3: Implement `createSpaceSlice` (`src/lib/store/slices/createSpaceSlice.ts`)

**Files:**
- Create: `src/lib/store/slices/createSpaceSlice.ts`
- Test: `src/lib/store/spaces.test.ts`

**Interfaces:**
- Consumes: `WorkspaceStore`, `SpaceSlice` from `./types`
- Produces: `createSpaceSlice: StateCreator<WorkspaceStore, [], [], SpaceSlice>`

- [x] **Step 1: Implement `createSpaceSlice.ts`**
Extract space, folder, list, and status management.

- [x] **Step 2: Verify with targeted tests**
Run: `npm test -- src/lib/store/spaces.test.ts`
Expected: PASS.

- [x] **Step 3: Commit**
```bash
git add src/lib/store/slices/createSpaceSlice.ts
git commit -m "feat(store): implement createSpaceSlice"
```

---

### Task 4: Implement `createTrashSlice` (`src/lib/store/slices/createTrashSlice.ts`)

**Files:**
- Create: `src/lib/store/slices/createTrashSlice.ts`
- Test: `src/lib/store/trash.test.ts`

**Interfaces:**
- Consumes: `WorkspaceStore`, `TrashSlice` from `./types`
- Produces: `createTrashSlice: StateCreator<WorkspaceStore, [], [], TrashSlice>`

- [x] **Step 1: Implement `createTrashSlice.ts`**
Extract `trash` array state, `restoreTasks`, `permanentlyDeleteTask`, `emptyTrash`, and `purgeExpiredTrash`.

- [x] **Step 2: Verify with targeted tests**
Run: `npm test -- src/lib/store/trash.test.ts`
Expected: PASS.

- [x] **Step 3: Commit**
```bash
git add src/lib/store/slices/createTrashSlice.ts
git commit -m "feat(store): implement createTrashSlice"
```

---

### Task 5: Implement `createAutomationSlice` (`src/lib/store/slices/createAutomationSlice.ts`)

**Files:**
- Create: `src/lib/store/slices/createAutomationSlice.ts`
- Test: `src/lib/store/automationRules.test.ts`, `src/lib/store/actorAttribution.test.ts`

**Interfaces:**
- Consumes: `WorkspaceStore`, `AutomationSlice` from `./types`
- Produces: `createAutomationSlice: StateCreator<WorkspaceStore, [], [], AutomationSlice>`

- [x] **Step 1: Implement `createAutomationSlice.ts`**
Extract comment, channel message, activity logging, and automation triggers/runs.

- [x] **Step 2: Verify with targeted tests**
Run: `npm test -- src/lib/store/automationRules.test.ts src/lib/store/actorAttribution.test.ts`
Expected: PASS.

- [x] **Step 3: Commit**
```bash
git add src/lib/store/slices/createAutomationSlice.ts
git commit -m "feat(store): implement createAutomationSlice"
```

---

### Task 6: Implement `createTaskSlice` (`src/lib/store/slices/createTaskSlice.ts`)

**Files:**
- Create: `src/lib/store/slices/createTaskSlice.ts`
- Test: `src/lib/store/taskCrud.test.ts`, `src/lib/store/dependencies.test.ts`

**Interfaces:**
- Consumes: `WorkspaceStore`, `TaskSlice` from `./types`
- Produces: `createTaskSlice: StateCreator<WorkspaceStore, [], [], TaskSlice>`

- [x] **Step 1: Implement `createTaskSlice.ts`**
Extract task CRUD, bulk updates, subtasks, task selection, tags, dependencies, status transitions with automations & marcom sync, and realtime presence.

- [x] **Step 2: Verify with targeted tests**
Run: `npm test -- src/lib/store/taskCrud.test.ts src/lib/store/dependencies.test.ts`
Expected: PASS.

- [x] **Step 3: Commit**
```bash
git add src/lib/store/slices/createTaskSlice.ts
git commit -m "feat(store): implement createTaskSlice"
```

---

### Task 7: Implement `createUiSlice` (`src/lib/store/slices/createUiSlice.ts`)

**Files:**
- Create: `src/lib/store/slices/createUiSlice.ts`
- Test: `src/lib/store/marcomViews.test.ts`, `src/lib/store/viewPreferences.test.ts`

**Interfaces:**
- Consumes: `WorkspaceStore`, `UiSlice` from `./types`
- Produces: `createUiSlice: StateCreator<WorkspaceStore, [], [], UiSlice>`

- [x] **Step 1: Implement `createUiSlice.ts`**
Extract view modes, app mode switching, modals and drawers, filter bar, view preferences, and marcom routing.

- [x] **Step 2: Verify with targeted tests**
Run: `npm test -- src/lib/store/marcomViews.test.ts src/lib/store/viewPreferences.test.ts`
Expected: PASS.

- [x] **Step 3: Commit**
```bash
git add src/lib/store/slices/createUiSlice.ts
git commit -m "feat(store): implement createUiSlice"
```

---

### Task 8: Assemble `useWorkspaceStore.ts` & Final Verification

**Files:**
- Modify: `src/lib/store/useWorkspaceStore.ts`
- Test: All tests (`npm test`), TypeScript verification (`npx tsc --noEmit`)

**Interfaces:**
- Consumes: All 6 slice creators from `src/lib/store/slices/`
- Produces: Lean `useWorkspaceStore` (~160 lines) with identical public API and type signature.

- [x] **Step 1: Refactor `useWorkspaceStore.ts` to aggregate slices**
Replace monolithic state & actions with:
```typescript
export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (...a) => ({
      ...createWorkspaceSlice(...a),
      ...createSpaceSlice(...a),
      ...createTaskSlice(...a),
      ...createTrashSlice(...a),
      ...createAutomationSlice(...a),
      ...createUiSlice(...a),
    }),
    {
      name: "vrelloup-workspace-storage",
      version: 1,
      storage: createJSONStorage(() => quotaAwareStorage),
      onRehydrateStorage: () => (state) => { ... },
      migrate: (persistedState: unknown, version: number) => { ... },
      partialize: (state) => ({ ... }),
    }
  )
);
```
Ensure all exports remain identical (`TRASH_LIMIT`, `TRASH_RETENTION_MS`, `wouldCreateCycle`, `normalizeViewMode`, `reconcileWorkspaces`, `getSpaceListIds`, `STORAGE_WARN_BYTES`, `quotaAwareStorage`, `findSpaceForListId`, `findWorkspaceForListId`, `DEFAULT_VIEW_PREFERENCES`, `type TrashedTask`, `type WorkspaceState`).

- [x] **Step 2: Verify line count reduction**
Run: `wc -l src/lib/store/useWorkspaceStore.ts`
Expected: <= 200 lines (down from 1,476 lines).

- [x] **Step 3: Run full test suite & TypeScript compiler**
Run: `npx tsc --noEmit && npm test`
Expected: 0 TypeScript errors and all 539 unit tests pass.

- [x] **Step 4: Commit**
```bash
git add src/lib/store/useWorkspaceStore.ts
git commit -m "refactor(store): aggregate modular slices into useWorkspaceStore"
```
