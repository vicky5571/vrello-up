# God-Files Strangler Phase 1: Sub-Slice Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Shrink [`src/lib/store/useWorkspaceStore.ts`](file:///Users/mac/Web%20Development/vrello-up/src/lib/store/useWorkspaceStore.ts) by ~600–800 lines by extracting pure domain operation modules (`trashOperations.ts`, `viewPreferencesOperations.ts`, `spacesOperations.ts`) with zero breaking changes and 100% test coverage.

**Architecture:** Pure Domain Reducer Pattern. State transitions are extracted into pure functions that take current state slices and return next immutable states. `useWorkspaceStore.ts` acts solely as a thin coordinator dispatching to pure helpers and executing persistence side-effects (`syncWorkspaces`, `syncDeleteTask`, `syncCreateTask`).

**Tech Stack:** TypeScript 5, Zustand 5, Next.js 15 App Router, Node.js Native Test Runner (`node --test`).

**Spec:** [`docs/superpowers/specs/2026-09-19-god-files-strangler-phase-1-design.md`](file:///Users/mac/Web%20Development/vrello-up/docs/superpowers/specs/2026-09-19-god-files-strangler-phase-1-design.md)

## Global Constraints
- Preserve exact public method signatures and properties of `useWorkspaceStore`.
- No modifications to UI components (`.tsx` files) in this phase.
- All 264 existing unit tests must remain green (`npm test`).
- Zero TypeScript compiler errors (`npm run typecheck`).
- Adhere to `AGENTS.md` Single Source of Truth types in `@/types`.

---

### Task 1: Extract Trash Operations Module

**Files:**
- Create: `src/lib/store/trashOperations.ts`
- Modify: `src/lib/store/useWorkspaceStore.ts:972-976,1454-1521`
- Test: `src/lib/store/trash.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export const TRASH_LIMIT = 50;
  export const TRASH_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
  export interface TrashEntry {
    task: Task;
    deletedAt: string;
  }
  export function applyDeleteTaskWithTrash(state: { tasks: Task[]; trash?: TrashEntry[]; selectedTaskId: string | null; lastSelectedTaskId: string | null; selectedTaskIds: string[] }, id: string, nowIso?: string): { tasks: Task[]; trash: TrashEntry[]; selectedTaskId: string | null; lastSelectedTaskId: string | null; selectedTaskIds: string[] };
  export function applyRestoreTasksFromTrash(state: { tasks: Task[]; trash?: TrashEntry[] }, ids: string[], nowIso?: string): { nextState: { tasks: Task[]; trash: TrashEntry[] }; revivedCount: number; revivedTasks: Task[] };
  export function applyPermanentlyDeleteTask(state: { trash?: TrashEntry[] }, id: string): { trash: TrashEntry[] };
  export function applyEmptyTrash(): { trash: TrashEntry[] };
  export function applyPurgeExpiredTrash(state: { trash?: TrashEntry[] }, nowMs?: number): { trash: TrashEntry[] };
  ```

- [ ] **Step 1: Write `src/lib/store/trashOperations.ts`**
Create pure helper functions for task soft-delete, dependency cleanup, restore, auto-purge, and permanent deletion.

- [ ] **Step 2: Update `useWorkspaceStore.ts` to delegate to `trashOperations.ts`**
Import `applyDeleteTaskWithTrash`, `applyRestoreTasksFromTrash`, `applyPermanentlyDeleteTask`, `applyEmptyTrash`, `applyPurgeExpiredTrash`, `TRASH_LIMIT`, and `TRASH_RETENTION_MS`. Re-export constants for backward compatibility with existing tests. Replace inline implementations in store actions.

- [ ] **Step 3: Run trash unit tests to verify**
Run: `npm test -- src/lib/store/trash.test.ts`
Expected: PASS (all 6 tests passing).

- [ ] **Step 4: Commit Task 1**
```bash
git add src/lib/store/trashOperations.ts src/lib/store/useWorkspaceStore.ts
git commit -m "refactor(store): extract trash operations to pure helper module"
```

---

### Task 2: Extract View Preferences Operations Module

**Files:**
- Create: `src/lib/store/viewPreferencesOperations.ts`
- Modify: `src/lib/store/useWorkspaceStore.ts:490-505,1295-1310`
- Test: `src/lib/store/viewPreferences.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface ViewPreferences {
    density: "compact" | "comfortable";
    visibleFields: {
      assignee: boolean;
      dueDate: boolean;
      priority: boolean;
      tags: boolean;
      channel: boolean;
    };
  }
  export const DEFAULT_VIEW_PREFERENCES: ViewPreferences;
  export function applyViewPreferences(current: ViewPreferences, updates: Partial<ViewPreferences>): ViewPreferences;
  ```

- [ ] **Step 1: Write `src/lib/store/viewPreferencesOperations.ts`**
Define `DEFAULT_VIEW_PREFERENCES` and pure deep-merging helper function `applyViewPreferences`.

- [ ] **Step 2: Update `useWorkspaceStore.ts` to delegate to `viewPreferencesOperations.ts`**
Import `DEFAULT_VIEW_PREFERENCES` and `applyViewPreferences`. Re-export `DEFAULT_VIEW_PREFERENCES` for backward compatibility with `viewPreferences.test.ts`. Replace store method bodies.

- [ ] **Step 3: Run viewPreferences unit tests to verify**
Run: `npm test -- src/lib/store/viewPreferences.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit Task 2**
```bash
git add src/lib/store/viewPreferencesOperations.ts src/lib/store/useWorkspaceStore.ts
git commit -m "refactor(store): extract viewPreferences operations to pure helper module"
```

---

### Task 3: Extract Space, Folder, List, & Status Operations Module

**Files:**
- Create: `src/lib/store/spacesOperations.ts`
- Modify: `src/lib/store/useWorkspaceStore.ts:1922-2260`
- Test: `src/lib/store/spaces.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export function getSpaceListIds(space?: Space | null): string[];
  export function applyCreateSpace(state: { workspaces: Workspace[]; activeWorkspaceId: string }, params: { name: string; icon: string; color: string; defaultStatuses: Status[] }): { workspaces: Workspace[]; activeSpaceId: string; activeListId: string; newSpace: Space };
  export function applyUpdateSpace(state: { workspaces: Workspace[]; activeWorkspaceId: string }, spaceId: string, updates: Partial<Space>): { workspaces: Workspace[] };
  export function applyDeleteSpace(state: { workspaces: Workspace[]; activeWorkspaceId: string; tasks: Task[]; activeSpaceId: string; activeListId: string | null; selectedTaskId: string | null; lastSelectedTaskId: string | null; selectedTaskIds: string[] }, spaceId: string): { workspaces: Workspace[]; tasks: Task[]; activeSpaceId: string; activeListId: string | null; selectedTaskId: string | null; lastSelectedTaskId: string | null; selectedTaskIds: string[] };
  export function applyReorderSpaces(state: { workspaces: Workspace[]; activeWorkspaceId: string }, orderedSpaceIds: string[]): { workspaces: Workspace[] };
  export function applyMoveSpace(state: { workspaces: Workspace[]; activeWorkspaceId: string }, spaceId: string, direction: "up" | "down"): { workspaces: Workspace[] };
  // Folders & Lists:
  export function applyCreateFolder(state: { workspaces: Workspace[]; activeWorkspaceId: string }, spaceId: string, name: string, icon: string): { workspaces: Workspace[]; newFolder: Folder };
  export function applyUpdateFolder(state: { workspaces: Workspace[]; activeWorkspaceId: string }, folderId: string, updates: Partial<Folder>): { workspaces: Workspace[] };
  export function applyDeleteFolder(state: { workspaces: Workspace[]; activeWorkspaceId: string; tasks: Task[] }, folderId: string): { workspaces: Workspace[]; tasks: Task[] };
  export function applyCreateList(state: { workspaces: Workspace[]; activeWorkspaceId: string }, spaceId: string, folderId: string | null, name: string, icon: string): { workspaces: Workspace[]; activeListId: string; newList: List };
  export function applyUpdateList(state: { workspaces: Workspace[]; activeWorkspaceId: string }, listId: string, updates: Partial<List>): { workspaces: Workspace[] };
  export function applyDeleteList(state: { workspaces: Workspace[]; activeWorkspaceId: string; tasks: Task[]; activeListId: string | null }, listId: string): { workspaces: Workspace[]; tasks: Task[]; activeListId: string | null };
  // Statuses:
  export function applyAddStatusToSpace(state: { workspaces: Workspace[]; activeWorkspaceId: string }, spaceId: string, name: string, color: string, category: Status["category"]): { workspaces: Workspace[]; newStatus: Status };
  export function applyUpdateSpaceStatus(state: { workspaces: Workspace[]; activeWorkspaceId: string }, spaceId: string, statusId: string, updates: Partial<Status>): { workspaces: Workspace[] };
  export function applyDeleteSpaceStatus(state: { workspaces: Workspace[]; activeWorkspaceId: string; tasks: Task[] }, spaceId: string, statusId: string): { workspaces: Workspace[]; tasks: Task[] };
  export function applyReorderSpaceStatuses(state: { workspaces: Workspace[]; activeWorkspaceId: string }, spaceId: string, orderedStatusIds: string[]): { workspaces: Workspace[] };
  ```

- [ ] **Step 1: Write `src/lib/store/spacesOperations.ts`**
Implement pure space, folder, list, and status management with cascading cleanup logic for lists and tasks.

- [ ] **Step 2: Update `useWorkspaceStore.ts` to delegate to `spacesOperations.ts`**
Replace lines ~1922-2260 with calls to the pure functions in `spacesOperations.ts`, maintaining the subsequent `syncWorkspaces(get().workspaces)` calls. Re-export `getSpaceListIds` from `spacesOperations.ts` for backward compatibility with `spaces.test.ts`.

- [ ] **Step 3: Run spaces unit tests to verify**
Run: `npm test -- src/lib/store/spaces.test.ts`
Expected: PASS (all 14 tests passing).

- [ ] **Step 4: Commit Task 3**
```bash
git add src/lib/store/spacesOperations.ts src/lib/store/useWorkspaceStore.ts
git commit -m "refactor(store): extract space, folder, list, and status operations to pure helper module"
```

---

### Task 4: Full Suite Regression Verification & Line Count Scoreboard

**Files:**
- Check: `src/lib/store/useWorkspaceStore.ts`

- [ ] **Step 1: Run TypeScript compiler check**
Run: `npm run typecheck`
Expected: 0 errors (`tsc --noEmit` passed).

- [ ] **Step 2: Run all unit tests**
Run: `npm test`
Expected: 264/264 tests passed across 16 suites.

- [ ] **Step 3: Measure and document line count reduction**
Run: `wc -l src/lib/store/useWorkspaceStore.ts src/lib/store/trashOperations.ts src/lib/store/viewPreferencesOperations.ts src/lib/store/spacesOperations.ts`
Verify `useWorkspaceStore.ts` has shrunk substantially.

- [ ] **Step 4: Update Walkthrough Artifact**
Record the refactor metrics, new modular architecture, and test verification results in `walkthrough.md`.

