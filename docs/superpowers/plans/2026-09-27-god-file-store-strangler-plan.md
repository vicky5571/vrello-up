# Monolithic Store Modularization (Option B: Strangler Pattern) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decompose the monolithic 1,976-line `src/lib/store/useWorkspaceStore.ts` god file down to <350 lines using the zero-dependency Pure Functional Operations (Strangler Fig) pattern without breaking any of the 413 consumer call-sites or 518 unit tests.

**Architecture:** Keep `useWorkspaceStore` as a thin orchestrator / façade containing Zustand state declarations, persistence config (`persist`, `quotaAwareStorage`, `migrate`, `partialize`), and side-effect calls (`syncCreateTask`, `toast`). Extract domain-specific state transitions into pure, strongly-typed operation modules (`dependencyOperations.ts`, `commentOperations.ts`, `automationOperations.ts`, `backupOperations.ts`, `tagOperations.ts`, `taskOperations.ts`, `storeStorage.ts`).

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5, Zustand 5, Node Native Test Runner (`node --test`).

**Spec:** Architecture decision on modularizing `useWorkspaceStore.ts` via Pure Operations Strangler Pattern (Option B) discussed with pair programmer.

## Global Constraints

- Zero breaking changes to `useWorkspaceStore.getState()` or component hook subscriptions across all 413 call sites.
- All core types MUST continue to be imported from `@/types` (`src/types/index.ts`). No duplicate inline domain interfaces.
- Dual-persistence discipline must be strictly preserved: mutations update client state immediately and mirror to API/localStorage.
- All existing exports from `useWorkspaceStore.ts` (`wouldCreateCycle`, `normalizeViewMode`, `findSpaceForListId`, `findWorkspaceForListId`, `reconcileWorkspaces`, `STORAGE_WARN_BYTES`, `quotaAwareStorage`, `TrashedTask`) MUST remain exported.
- Every task must end with 100% green tests verified via `npm test -- <test-file>` and the full suite `npm test`.

---

### Task 1: Extract Task Dependencies & Cycle Detection (`dependencyOperations.ts`)

**Files:**
- Create: `src/lib/store/dependencyOperations.ts`
- Modify: `src/lib/store/useWorkspaceStore.ts:430-456,1389-1431`
- Test: `src/lib/store/dependencies.test.ts`

**Interfaces:**
- Consumes: `Task` from `@/types`
- Produces:
  - `wouldCreateCycle(taskId: string, dependsOnTaskId: string, tasks: Task[]): boolean`
  - `applyAddDependency(tasks: Task[], taskId: string, dependsOnTaskId: string): { nextTasks: Task[]; success: boolean }`
  - `applyRemoveDependency(tasks: Task[], taskId: string, dependsOnTaskId: string): { nextTasks: Task[] }`

- [ ] **Step 1: Write unit tests for pure dependency operations in `dependencies.test.ts`**

Ensure `src/lib/store/dependencies.test.ts` covers `applyAddDependency` and `applyRemoveDependency` in addition to `wouldCreateCycle`:

```typescript
import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node strip-types runner requires explicit extension
import { applyAddDependency, applyRemoveDependency, wouldCreateCycle } from "./dependencyOperations.ts";
import type { Task } from "../../types/index.ts";

function stubTask(id: string, dependencies: string[] = []): Task {
  return {
    id,
    listId: "l-1",
    title: id,
    description: "",
    statusId: "status-todo",
    priority: "normal",
    assignees: [],
    tags: [],
    subtasks: [],
    dependencies,
    orderIndex: 0,
    createdAt: "",
    updatedAt: "",
  };
}

test("wouldCreateCycle detects direct, chained, and self cycles", () => {
  const a = stubTask("a", ["b"]);
  const b = stubTask("b");
  assert.equal(wouldCreateCycle("b", "a", [a, b]), true);

  const chain = [stubTask("a", ["b"]), stubTask("b", ["c"]), stubTask("c")];
  assert.equal(wouldCreateCycle("c", "a", chain), true);
  assert.equal(wouldCreateCycle("a", "a", chain), true);

  const clean = [stubTask("a", ["b"]), stubTask("b"), stubTask("c")];
  assert.equal(wouldCreateCycle("c", "a", clean), false);
});

test("applyAddDependency blocks cycle and appends valid dependency", () => {
  const a = stubTask("a");
  const b = stubTask("b");
  const result1 = applyAddDependency([a, b], "b", "a");
  assert.equal(result1.success, true);
  assert.deepEqual(result1.nextTasks.find(t => t.id === "b")?.dependencies, ["a"]);

  const result2 = applyAddDependency(result1.nextTasks, "a", "b");
  assert.equal(result2.success, false);
});

test("applyRemoveDependency filters out target dependency", () => {
  const a = stubTask("a", ["b", "c"]);
  const result = applyRemoveDependency([a], "a", "b");
  assert.deepEqual(result.nextTasks.find(t => t.id === "a")?.dependencies, ["c"]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/store/dependencies.test.ts`
Expected: FAIL because `dependencyOperations.ts` does not yet exist.

- [ ] **Step 3: Create `src/lib/store/dependencyOperations.ts` and re-export in `useWorkspaceStore.ts`**

Create `src/lib/store/dependencyOperations.ts`:
```typescript
import { type Task } from "@/types";

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
      return true;
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

export function applyAddDependency(
  tasks: Task[],
  taskId: string,
  dependsOnTaskId: string,
  nowIso: string = new Date().toISOString(),
): { nextTasks: Task[]; success: boolean } {
  if (taskId === dependsOnTaskId || wouldCreateCycle(taskId, dependsOnTaskId, tasks)) {
    return { nextTasks: tasks, success: false };
  }

  const nextTasks = tasks.map((t) => {
    if (t.id === taskId) {
      const currentDeps = t.dependencies || [];
      if (!currentDeps.includes(dependsOnTaskId)) {
        return {
          ...t,
          dependencies: [...currentDeps, dependsOnTaskId],
          updatedAt: nowIso,
        };
      }
    }
    return t;
  });

  return { nextTasks, success: true };
}

export function applyRemoveDependency(
  tasks: Task[],
  taskId: string,
  dependsOnTaskId: string,
  nowIso: string = new Date().toISOString(),
): { nextTasks: Task[] } {
  const nextTasks = tasks.map((t) => {
    if (t.id === taskId && t.dependencies) {
      return {
        ...t,
        dependencies: t.dependencies.filter((d) => d !== dependsOnTaskId),
        updatedAt: nowIso,
      };
    }
    return t;
  });
  return { nextTasks };
}
```

In `src/lib/store/useWorkspaceStore.ts`:
- Re-export `wouldCreateCycle` from `@/lib/store/dependencyOperations`.
- Update `addDependency` and `removeDependency` to call `applyAddDependency` and `applyRemoveDependency`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/store/dependencies.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/store/dependencyOperations.ts src/lib/store/useWorkspaceStore.ts src/lib/store/dependencies.test.ts
git commit -m "refactor(store): extract dependency operations to pure module"
```

---

### Task 2: Extract Comments, Messages & Activity Log (`commentOperations.ts`)

**Files:**
- Create: `src/lib/store/commentOperations.ts`
- Modify: `src/lib/store/useWorkspaceStore.ts:1294-1388`
- Test: `src/lib/store/actorAttribution.test.ts`

**Interfaces:**
- Consumes: `Task`, `User`, `TaskComment`, `TaskCommentAttachment`, `ActivityLog`, `ChannelMessage` from `@/types`
- Produces:
  - `resolveActor(members: User[], currentUserId: string, fallbackUser: User, provided?: User): User`
  - `applyAddComment(tasks: Task[], taskId: string, content: string, actor: User, attachments?: TaskCommentAttachment[]): { nextTasks: Task[]; newComment?: TaskComment }`
  - `applyDeleteComment(tasks: Task[], taskId: string, commentId: string): { nextTasks: Task[] }`
  - `applyAddChannelMessage(messages: ChannelMessage[], channelId: string, content: string, actor: User): { nextMessages: ChannelMessage[]; newMessage?: ChannelMessage }`
  - `applyLogActivity(tasks: Task[], taskId: string, action: string, actor: User): { nextTasks: Task[]; newActivity: ActivityLog }`

- [ ] **Step 1: Write unit tests in `src/lib/store/commentOperations.test.ts`**

```typescript
import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node strip-types runner requires explicit extension
import { applyAddComment, applyDeleteComment, applyLogActivity } from "./commentOperations.ts";
import type { Task, User } from "../../types/index.ts";

const dummyUser: User = { id: "u-1", name: "Alice", email: "alice@test.com", role: "admin" };
const initialTask: Task = {
  id: "task-1",
  listId: "list-1",
  title: "Test Task",
  description: "",
  statusId: "status-todo",
  priority: "normal",
  assignees: [],
  tags: [],
  subtasks: [],
  comments: [],
  activities: [],
  orderIndex: 0,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

test("applyAddComment appends comment and activity log", () => {
  const result = applyAddComment([initialTask], "task-1", "Great job!", dummyUser);
  const updated = result.nextTasks.find(t => t.id === "task-1");
  assert.equal(updated?.comments?.length, 1);
  assert.equal(updated?.comments?.[0].content, "Great job!");
  assert.equal(updated?.activities?.length, 1);
});

test("applyDeleteComment removes comment by id", () => {
  const withComment = applyAddComment([initialTask], "task-1", "Remove me", dummyUser);
  const commentId = withComment.newComment!.id;
  const deleted = applyDeleteComment(withComment.nextTasks, "task-1", commentId);
  const updated = deleted.nextTasks.find(t => t.id === "task-1");
  assert.equal(updated?.comments?.length, 0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/store/commentOperations.test.ts`
Expected: FAIL because `commentOperations.ts` does not yet exist.

- [ ] **Step 3: Implement `src/lib/store/commentOperations.ts` and delegate in `useWorkspaceStore.ts`**

Extract `resolveActor`, `applyAddComment`, `applyDeleteComment`, `applyAddChannelMessage`, and `applyLogActivity` into `src/lib/store/commentOperations.ts`.
In `src/lib/store/useWorkspaceStore.ts`:
- Replace inline comment, message, and activity logic with calls to `commentOperations.ts`.
- Retain `syncAddComment(taskId, newComment)` side-effect inside the store action.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/store/actorAttribution.test.ts src/lib/store/commentOperations.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/store/commentOperations.ts src/lib/store/commentOperations.test.ts src/lib/store/useWorkspaceStore.ts
git commit -m "refactor(store): extract comment and activity operations"
```

---

### Task 3: Extract Automations Engine (`automationOperations.ts`)

**Files:**
- Create: `src/lib/store/automationOperations.ts`
- Modify: `src/lib/store/useWorkspaceStore.ts:609-789`
- Test: `src/lib/store/automationRules.test.ts`, `src/lib/store/customAutomations.test.ts`

**Interfaces:**
- Consumes: `CustomAutomationRule`, `AutomationTrigger`, `Task`, `User`, `Workspace` from `@/types`
- Produces:
  - `applyAddCustomAutomation(rules: CustomAutomationRule[], data: ...): { nextRules: CustomAutomationRule[]; newRule: CustomAutomationRule }`
  - `applyRemoveCustomAutomation(rules: CustomAutomationRule[], id: string): { nextRules: CustomAutomationRule[] }`
  - `applyToggleCustomAutomation(rules: CustomAutomationRule[], id: string, enabled?: boolean): { nextRules: CustomAutomationRule[] }`
  - `executeCustomAutomationAction(rule: CustomAutomationRule, payload: Record<string, unknown>, context: AutomationContext): Promise<boolean>`

- [ ] **Step 1: Verify existing automation test baseline**

Run: `npm test -- src/lib/store/automationRules.test.ts src/lib/store/customAutomations.test.ts`
Expected: PASS

- [ ] **Step 2: Extract automation logic into `src/lib/store/automationOperations.ts`**

Move `applyAddCustomAutomation`, `applyRemoveCustomAutomation`, `applyToggleCustomAutomation`, and `executeCustomAutomationAction` to `src/lib/store/automationOperations.ts`.

- [ ] **Step 3: Rewire `useWorkspaceStore.ts`**

Delegate `addCustomAutomation`, `removeCustomAutomation`, `toggleCustomAutomation`, and `runAutomationsForTrigger` in `useWorkspaceStore.ts` to the pure helper functions.

- [ ] **Step 4: Run tests to verify zero regressions**

Run: `npm test -- src/lib/store/automationRules.test.ts src/lib/store/customAutomations.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/store/automationOperations.ts src/lib/store/useWorkspaceStore.ts
git commit -m "refactor(store): extract custom automation operations"
```

---

### Task 4: Extract Backup & Restore Import (`backupOperations.ts`)

**Files:**
- Create: `src/lib/store/backupOperations.ts`
- Modify: `src/lib/store/useWorkspaceStore.ts:1785-1830`
- Test: `src/lib/store/backupRestore.test.ts`

**Interfaces:**
- Consumes: `WorkspaceState`
- Produces:
  - `validateAndParseBackup(data: unknown): { isValid: boolean; parsedState?: Partial<WorkspaceState>; error?: string }`

- [ ] **Step 1: Verify existing test baseline**

Run: `npm test -- src/lib/store/backupRestore.test.ts`
Expected: PASS

- [ ] **Step 2: Extract backup validation to `src/lib/store/backupOperations.ts`**

Move the JSON validation, version checks, and schema sanitization of `importBackup` to `validateAndParseBackup`.

- [ ] **Step 3: Rewire `importBackup` in `useWorkspaceStore.ts`**

Use `validateAndParseBackup(data)` inside `importBackup: (data) => { ... }`.

- [ ] **Step 4: Run tests to verify**

Run: `npm test -- src/lib/store/backupRestore.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/store/backupOperations.ts src/lib/store/useWorkspaceStore.ts
git commit -m "refactor(store): extract backup restore validation"
```

---

### Task 5: Extract Tags & Member Operations (`tagOperations.ts` & `workspaceCrud.ts`)

**Files:**
- Create: `src/lib/store/tagOperations.ts`
- Modify: `src/lib/store/workspaceCrud.ts`, `src/lib/store/useWorkspaceStore.ts:1719-1784`
- Test: `src/lib/store/workspaceCrud.test.ts`

**Interfaces:**
- Consumes: `Tag`, `Task`, `Workspace`, `User` from `@/types`
- Produces:
  - `applyCreateTag(tags: Tag[], name: string, color: string): { nextTags: Tag[]; newTag: Tag }`
  - `applyRenameTag(tags: Tag[], id: string, name: string): { nextTags: Tag[] }`
  - `applyDeleteTag(tags: Tag[], tasks: Task[], id: string): { nextTags: Tag[]; nextTasks: Task[] }`
  - `applyToggleTaskTag(tasks: Task[], tags: Tag[], taskId: string, tagId: string): { nextTasks: Task[] }`
  - `applyAddWorkspaceMember(workspaces: Workspace[], workspaceId: string, name: string, email: string, role?: User["role"]): { nextWorkspaces: Workspace[]; newMember: User }`
  - `applyRemoveWorkspaceMember(workspaces: Workspace[], workspaceId: string, userId: string): { nextWorkspaces: Workspace[] }`

- [ ] **Step 1: Write tests in `src/lib/store/tagOperations.test.ts`**

Test tag creation, renaming, deletion (including stripping deleted tag from tasks), and toggling tag on a task.

- [ ] **Step 2: Implement `src/lib/store/tagOperations.ts` and add member functions to `workspaceCrud.ts`**

- [ ] **Step 3: Rewire in `useWorkspaceStore.ts`**

Connect `createTag`, `renameTag`, `deleteTag`, `toggleTaskTag`, `addWorkspaceMember`, `removeWorkspaceMember`.

- [ ] **Step 4: Run tests to verify**

Run: `npm test -- src/lib/store/workspaceCrud.test.ts src/lib/store/tagOperations.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/store/tagOperations.ts src/lib/store/tagOperations.test.ts src/lib/store/workspaceCrud.ts src/lib/store/useWorkspaceStore.ts
git commit -m "refactor(store): extract tag and member operations"
```

---

### Task 6: Extract Core Task Operations (`taskOperations.ts`)

**Files:**
- Create: `src/lib/store/taskOperations.ts`
- Modify: `src/lib/store/useWorkspaceStore.ts:983-1290`
- Test: `src/lib/store/taskCrud.test.ts`

**Interfaces:**
- Consumes: `Task`, `Space`, `Workspace`, `Status` from `@/types`
- Produces:
  - `applyCreateTask(tasks: Task[], data: Partial<Task>, defaultListId: string): { nextTasks: Task[]; newTask: Task }`
  - `applyUpdateTask(tasks: Task[], id: string, updates: Partial<Task>): { nextTasks: Task[]; prevTask?: Task; effectiveUpdates: Partial<Task>; escalatesToUrgent: boolean }`
  - `applyBulkUpdateTasks(tasks: Task[], ids: string[], updates: Partial<Task>): { nextTasks: Task[] }`
  - `applyMoveTaskStatus(tasks: Task[], taskId: string, newStatusId: string, newOrderIndex?: number): { nextTasks: Task[]; prevTask?: Task; isMoved: boolean }`
  - `applyReorderTasksInStatus(tasks: Task[], statusId: string, orderedTaskIds: string[]): { nextTasks: Task[] }`
  - `applyAddSubtask(tasks: Task[], taskId: string, title: string): { nextTasks: Task[] }`
  - `applyToggleSubtask(tasks: Task[], taskId: string, subtaskId: string): { nextTasks: Task[] }`
  - `applyDeleteSubtask(tasks: Task[], taskId: string, subtaskId: string): { nextTasks: Task[] }`
  - `applyToggleTaskSelection(selectedIds: string[], id: string): { nextSelectedIds: string[]; nextSelectedId: string | null }`

- [ ] **Step 1: Run baseline `taskCrud.test.ts`**

Run: `npm test -- src/lib/store/taskCrud.test.ts`
Expected: PASS

- [ ] **Step 2: Implement `src/lib/store/taskOperations.ts`**

Create pure functions for task creation, updating (preserving placement title immutability), reordering, status transition, subtask operations, and selection.

- [ ] **Step 3: Rewire `useWorkspaceStore.ts`**

Wire `createTask`, `updateTask`, `bulkUpdateTasks`, `moveTaskStatus`, `reorderTasksInStatus`, `addSubtask`, `toggleSubtask`, `deleteSubtask`, `toggleTaskSelection` to call `taskOperations.ts`. Retain external sync triggers (`syncCreateTask`, `syncUpdateTask`, `syncFieldEventOnTaskStatusChange`, `syncPlacementOnTaskStatusChange`, `runAutomationsForTrigger`) in the store action wrapper.

- [ ] **Step 4: Run tests to verify**

Run: `npm test -- src/lib/store/taskCrud.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/store/taskOperations.ts src/lib/store/useWorkspaceStore.ts
git commit -m "refactor(store): extract core task operations to taskOperations"
```

---

### Task 7: Extract Storage Quota & Workspace Reconciler (`storeStorage.ts` & `workspaceSync.ts`)

**Files:**
- Create: `src/lib/store/storeStorage.ts`, `src/lib/store/workspaceSync.ts`
- Modify: `src/lib/store/useWorkspaceStore.ts:350-425,490-570`
- Test: `src/lib/store/persistQuota.test.ts`

**Interfaces:**
- Produces:
  - `STORAGE_WARN_BYTES: number`
  - `quotaAwareStorage: StateStorage`
  - `reconcileWorkspaces(clientWorkspaces: Workspace[], serverWorkspaces: Workspace[]): { workspaces: Workspace[]; shouldSyncToServer: boolean }`
- Re-exported from `useWorkspaceStore.ts` for backward compatibility.

- [ ] **Step 1: Run baseline `persistQuota.test.ts`**

Run: `npm test -- src/lib/store/persistQuota.test.ts`
Expected: PASS

- [ ] **Step 2: Create `src/lib/store/storeStorage.ts` and `src/lib/store/workspaceSync.ts`**

Move `quotaAwareStorage` and `STORAGE_WARN_BYTES` to `storeStorage.ts`.
Move `reconcileWorkspaces` to `workspaceSync.ts`.

- [ ] **Step 3: Re-export in `useWorkspaceStore.ts` and wire into `persist` options**

Ensure `export { STORAGE_WARN_BYTES, quotaAwareStorage } from "./storeStorage";` and `export { reconcileWorkspaces } from "./workspaceSync";` exist at the top of `useWorkspaceStore.ts`.

- [ ] **Step 4: Run tests to verify**

Run: `npm test -- src/lib/store/persistQuota.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/store/storeStorage.ts src/lib/store/workspaceSync.ts src/lib/store/useWorkspaceStore.ts
git commit -m "refactor(store): extract storage quota wrapper and workspace reconciler"
```

---

### Task 8: Final Suite Audit & Line Count Verification

**Files:**
- Audit: `src/lib/store/useWorkspaceStore.ts`
- Test: Full test suite

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: 518/518 tests PASS, 0 failures, 0 regressions.

- [ ] **Step 2: Check line count reduction**

Run: `wc -l src/lib/store/useWorkspaceStore.ts`
Expected: Target is <350 lines (reduction of >1,600 lines from original 1,976 lines).

- [ ] **Step 3: Verify all 413 consumer call-sites compile cleanly**

Run: `npm run build` or Next.js typecheck:
`npx tsc --noEmit`
Expected: 0 TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git commit --allow-empty -m "chore(store): complete useWorkspaceStore modularization audit"
```
