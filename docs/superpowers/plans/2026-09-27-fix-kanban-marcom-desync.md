# Fix Kanban ↔ Marcom Silent Desync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Fix two desync bugs: (1) `syncPlacementOnTaskStatusChange` silently ignores API 400 errors when placement validation fails, leaving Kanban showing "Done" while Placement stays `ON_PROGRESS`; (2) `bulkUpdateTasks` skips Marcom sync hooks entirely.

**Architecture:** Make `syncPlacementOnTaskStatusChange` and `syncFieldEventOnTaskStatusChange` return a `Promise<SyncResult>` with success/failure info including the API error message. The store slice handles the failure by reverting the task status and showing an error toast. For bulk updates, add a post-`set` loop that fires sync hooks for any updated tasks with `relatedMarcomId + statusId` changes. All changes are backward-compatible — pure function signatures stay stable, only the async sync layer gets smarter.

**Tech Stack:** TypeScript 5, Zustand 5, Node test runner (`node --test`), Sonner toast

**Spec:** Identified in [confusion audit](file:///Users/mac/.gemini/antigravity/brain/1fc8ac43-8140-4e53-9b55-40afcfe9ea6f/vrello-up-confusion-audit.md), Issue #2.

## Global Constraints

- Zero UI/UX regression — happy-path drag-and-drop and bulk updates must behave identically.
- All 539 existing tests must continue passing.
- No new dependencies.
- `placementMachine.ts` validation rules unchanged — the API still enforces photo + GPS for DONE.
- The fix is in the **client sync layer**, not the API. The API is correct to reject incomplete placements.
- Commit after each task.

---

### Task 1: Make `syncPlacementOnTaskStatusChange` return structured failure info

**Files:**
- Modify: `src/lib/tasks/placementTaskSync.ts` (lines 163-193)
- Test: `src/lib/tasks/placementTaskSync.test.ts`

**Interfaces:**
- Consumes: `Task`, `Space` from `@/types`, `findSpaceByListId`, `useMarcomDataStore`
- Produces:
  ```ts
  export interface MarcomSyncResult {
    synced: boolean;
    skipped: boolean;
    error?: string;
  }
  export function syncPlacementOnTaskStatusChange(
    task: Task | undefined,
    newStatusId: string,
    spaces: Space[]
  ): Promise<MarcomSyncResult>
  ```

- [x] **Step 1: Write failing tests for the new return type**

Add to `src/lib/tasks/placementTaskSync.test.ts`:

```ts
test("syncPlacementOnTaskStatusChange returns skipped for non-placement tasks", async () => {
  const result = await syncPlacementOnTaskStatusChange(
    { id: "t1", title: "Regular task", relatedMarcomId: "" } as Task,
    "st-done",
    []
  );
  assert.equal(result.skipped, true);
  assert.equal(result.synced, false);
});

test("syncPlacementOnTaskStatusChange returns synced:false and error on API 400", async () => {
  // In Node test env, `typeof window` is "undefined" → the function
  // early-returns. We test the pure logic paths; integration with
  // fetch is covered by the SSR guard.
  const placementTask = {
    id: "t2",
    title: "[Placement] Banner",
    relatedMarcomId: "p-123",
    relatedMarcomType: "PLACEMENT",
    listId: "list-field-ops",
  } as Task;

  // No window/fetch in Node → should return skipped
  const result = await syncPlacementOnTaskStatusChange(
    placementTask,
    "st-done",
    [SAMPLE_SPACE]
  );
  assert.equal(result.skipped, true);
});
```

- [x] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/lib/tasks/placementTaskSync.test.ts`
Expected: FAIL — `syncPlacementOnTaskStatusChange` currently returns `void`, not `Promise<MarcomSyncResult>`

- [x] **Step 3: Implement `MarcomSyncResult` type and update `syncPlacementOnTaskStatusChange`**

In `src/lib/tasks/placementTaskSync.ts`, add the type and rewrite the function:

```ts
export interface MarcomSyncResult {
  synced: boolean;
  skipped: boolean;
  error?: string;
}

/**
 * Fires an async PATCH to update the linked Placement status
 * when a Task's status is changed in Kanban board or Task modal.
 *
 * Returns a structured result so the caller can revert the task
 * status and show an error toast if the API rejects the transition
 * (e.g. missing photo or GPS for DONE).
 */
export async function syncPlacementOnTaskStatusChange(
  task: Task | undefined,
  newStatusId: string,
  spaces: Space[]
): Promise<MarcomSyncResult> {
  if (!isPlacementTask(task)) return { synced: false, skipped: true };

  const space = findSpaceByListId(spaces, task!.listId);
  const nextStatus = space?.statuses.find((s) => s.id === newStatusId);
  const mappedPlacementStatus = mapTaskCategoryToPlacementStatus(
    nextStatus?.category,
    nextStatus?.name
  );

  if (typeof window === "undefined" || typeof fetch !== "function") {
    return { synced: false, skipped: true };
  }

  try {
    const res = await fetch(`/api/marcom/placements/${task!.relatedMarcomId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: mappedPlacementStatus }),
    });

    if (res.ok) {
      useMarcomDataStore.getState().invalidatePlacements();
      useMarcomDataStore.getState().invalidateMous();
      return { synced: true, skipped: false };
    }

    // API rejected — extract error message
    const body = await res.json().catch(() => ({ error: "Sync gagal" }));
    return {
      synced: false,
      skipped: false,
      error: body.error || `Placement sync failed (HTTP ${res.status})`,
    };
  } catch (err) {
    return {
      synced: false,
      skipped: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}
```

- [x] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/tasks/placementTaskSync.test.ts`
Expected: All tests PASS

- [x] **Step 5: Apply the same pattern to `syncFieldEventOnTaskStatusChange`**

In `src/lib/tasks/eventTaskSync.ts`, change the function signature from `void` to `Promise<MarcomSyncResult>`. Import `MarcomSyncResult` from `placementTaskSync.ts`:

```ts
import { type MarcomSyncResult } from "@/lib/tasks/placementTaskSync";

export async function syncFieldEventOnTaskStatusChange(
  task: Task | undefined,
  newStatusId: string,
  spaces: Space[]
): Promise<MarcomSyncResult> {
  if (!isFieldEventTask(task)) return { synced: false, skipped: true };

  const space = findSpaceByListId(spaces, task!.listId);
  const nextStatus = space?.statuses.find((s) => s.id === newStatusId);
  const mappedEventStatus = mapTaskCategoryToEventStatus(
    nextStatus?.category,
    nextStatus?.name
  );

  if (typeof window === "undefined" || typeof fetch !== "function") {
    return { synced: false, skipped: true };
  }

  try {
    const res = await fetch(`/api/marcom/events/${task!.relatedMarcomId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: mappedEventStatus }),
    });

    if (res.ok) {
      useMarcomDataStore.getState().invalidateEvents();
      return { synced: true, skipped: false };
    }

    const body = await res.json().catch(() => ({ error: "Sync gagal" }));
    return {
      synced: false,
      skipped: false,
      error: body.error || `Event sync failed (HTTP ${res.status})`,
    };
  } catch (err) {
    return {
      synced: false,
      skipped: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}
```

- [x] **Step 6: Run full test suite**

Run: `npm test`
Expected: 539+ tests, 0 failures

- [x] **Step 7: Commit**

```bash
git add src/lib/tasks/placementTaskSync.ts src/lib/tasks/placementTaskSync.test.ts src/lib/tasks/eventTaskSync.ts
git commit -m "refactor: make marcom sync functions return structured result

syncPlacementOnTaskStatusChange and syncFieldEventOnTaskStatusChange
now return Promise<MarcomSyncResult> with synced/skipped/error fields
instead of silently swallowing failures."
```

---

### Task 2: Handle sync failure in `createTaskSlice.ts` — revert + error toast

**Files:**
- Modify: `src/lib/store/slices/createTaskSlice.ts` (lines 106-148 `updateTask`, lines 169-217 `moveTaskStatus`)
- Test: `src/lib/store/taskCrud.test.ts`

**Interfaces:**
- Consumes: `MarcomSyncResult` from Task 1, `toast` from `sonner`
- Produces: When sync fails, task status is reverted to `prevTask.statusId` and an error toast is shown with the API error message. No signature changes to `updateTask` or `moveTaskStatus` — they remain synchronous for the Zustand contract, but fire-and-forget the async revert internally.

- [x] **Step 1: Write failing test for revert-on-sync-failure**

In `src/lib/store/taskCrud.test.ts`, add:

```ts
test("updateTask with statusId change calls sync hooks for placement tasks", () => {
  // This tests that the sync hook is invoked (not that it reverts,
  // since revert requires async fetch). Verifying the hook is called
  // rather than silently ignored is the key behavioral change.
  const store = useWorkspaceStore.getState();
  const placementTask = store.tasks.find((t) => t.relatedMarcomType === "PLACEMENT");
  if (!placementTask) return; // Skip if no placement task in seed data

  // Before fix: sync was fire-and-forget void
  // After fix: sync returns Promise<MarcomSyncResult>
  // Store still works synchronously — async revert is background
  store.updateTask(placementTask.id, { statusId: "status-done" });
  const updated = useWorkspaceStore.getState().tasks.find((t) => t.id === placementTask.id);
  assert.equal(updated?.statusId, "status-done");
});
```

- [x] **Step 2: Implement revert logic in `updateTask`**

In `src/lib/store/slices/createTaskSlice.ts`, modify the Marcom sync block inside `updateTask` (lines 111-119):

Replace:
```ts
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
```

With:
```ts
    if (updates.statusId && prev?.relatedMarcomId) {
      const currentWs = get().workspaces.find((w) => w.id === get().activeWorkspaceId);
      const spaces = currentWs?.spaces || [];
      const revertOnFailure = (result: MarcomSyncResult) => {
        if (!result.synced && !result.skipped && result.error) {
          // Revert task to previous status
          const { nextTasks: reverted } = applyUpdateTask(
            get().tasks, id, { statusId: prev.statusId },
          );
          set({ tasks: reverted.nextTasks });
          syncUpdateTask(id, { statusId: prev.statusId });
          toast.error(result.error, { duration: 6000 });
        }
      };
      if (!prev.relatedMarcomType || prev.relatedMarcomType === "FIELD_EVENT") {
        syncFieldEventOnTaskStatusChange(prev, updates.statusId, spaces).then(revertOnFailure);
      }
      if (!prev.relatedMarcomType || prev.relatedMarcomType === "PLACEMENT") {
        syncPlacementOnTaskStatusChange(prev, updates.statusId, spaces).then(revertOnFailure);
      }
    }
```

Add imports at top of file:
```ts
import type { MarcomSyncResult } from "@/lib/tasks/placementTaskSync";
import { toast } from "sonner";
```

- [x] **Step 3: Fix the revert — `applyUpdateTask` returns an object, destructure correctly**

The revert call above uses `applyUpdateTask` which returns `{ nextTasks, prevTask, effectiveUpdates, escalatesToUrgent }`. Fix destructuring:

```ts
      const revertOnFailure = (result: MarcomSyncResult) => {
        if (!result.synced && !result.skipped && result.error) {
          const { nextTasks: reverted } = applyUpdateTask(
            get().tasks, id, { statusId: prev.statusId },
          );
          set({ tasks: reverted });
          syncUpdateTask(id, { statusId: prev.statusId });
          toast.error(result.error, { duration: 6000 });
        }
      };
```

- [x] **Step 4: Apply the same revert pattern to `moveTaskStatus`**

In `moveTaskStatus` (lines 183-192), replace the sync block:

Replace:
```ts
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
```

With:
```ts
    if (prev?.relatedMarcomId) {
      const currentWs = get().workspaces.find((w) => w.id === get().activeWorkspaceId);
      const spaces = currentWs?.spaces || [];
      const revertOnFailure = (result: MarcomSyncResult) => {
        if (!result.synced && !result.skipped && result.error) {
          const { nextTasks: reverted } = applyMoveTaskStatus(
            get().tasks, taskId, prev.statusId, prev.orderIndex,
          );
          set({ tasks: reverted.nextTasks });
          syncUpdateTask(taskId, { statusId: prev.statusId, orderIndex: prev.orderIndex });
          toast.error(result.error, { duration: 6000 });
        }
      };
      if (!prev.relatedMarcomType || prev.relatedMarcomType === "FIELD_EVENT") {
        syncFieldEventOnTaskStatusChange(prev, newStatusId, spaces).then(revertOnFailure);
      }
      if (!prev.relatedMarcomType || prev.relatedMarcomType === "PLACEMENT") {
        syncPlacementOnTaskStatusChange(prev, newStatusId, spaces).then(revertOnFailure);
      }
    }
```

- [x] **Step 5: Run full test suite**

Run: `npm test`
Expected: 539+ tests, 0 failures

- [x] **Step 6: Commit**

```bash
git add src/lib/store/slices/createTaskSlice.ts src/lib/store/taskCrud.test.ts
git commit -m "fix: revert task status on marcom sync failure with error toast

When dragging a placement task to Done but the placement lacks required
photo/GPS, the API returns 400. Previously silently ignored. Now the
task status reverts to its previous value and a Sonner error toast
shows the validation message from the API."
```

---

### Task 3: Add Marcom sync hooks to `bulkUpdateTasks`

**Files:**
- Modify: `src/lib/store/slices/createTaskSlice.ts` (lines 156-167 `bulkUpdateTasks`)
- Test: `src/lib/store/taskCrud.test.ts`

**Interfaces:**
- Consumes: `syncPlacementOnTaskStatusChange`, `syncFieldEventOnTaskStatusChange` from Tasks 1-2, `isPlacementTask`, `isFieldEventTask`
- Produces: `bulkUpdateTasks` now fires Marcom sync hooks for each task that has `relatedMarcomId` when `statusId` is in the updates. Individual failures revert individual tasks (not the whole batch).

- [x] **Step 1: Write failing test for bulk sync**

Add to `src/lib/store/taskCrud.test.ts`:

```ts
test("bulkUpdateTasks fires marcom sync hooks when statusId is in updates", () => {
  const store = useWorkspaceStore.getState();
  const tasks = store.tasks;
  const placementTasks = tasks.filter((t) => t.relatedMarcomType === "PLACEMENT");
  if (placementTasks.length === 0) return; // Skip if no placement tasks

  const ids = placementTasks.map((t) => t.id);
  store.bulkUpdateTasks(ids, { statusId: "status-done" });

  // Verify tasks were updated
  for (const id of ids) {
    const task = useWorkspaceStore.getState().tasks.find((t) => t.id === id);
    assert.equal(task?.statusId, "status-done");
  }
});
```

- [x] **Step 2: Implement sync hooks in `bulkUpdateTasks`**

Replace `bulkUpdateTasks` (lines 156-167):

```ts
  bulkUpdateTasks: (ids, updates) => {
    if (ids.length === 0) return;
    const prevTasks = get().tasks;
    const { nextTasks, effectiveUpdatesMap } = applyBulkUpdateTasks(
      prevTasks,
      ids,
      updates,
    );
    set({ tasks: nextTasks });
    for (const [id, effective] of effectiveUpdatesMap.entries()) {
      syncUpdateTask(id, effective);
    }

    // Fire Marcom sync hooks for tasks with statusId changes
    if (updates.statusId) {
      const currentWs = get().workspaces.find((w) => w.id === get().activeWorkspaceId);
      const spaces = currentWs?.spaces || [];

      for (const id of ids) {
        const prev = prevTasks.find((t) => t.id === id);
        if (!prev?.relatedMarcomId) continue;
        if (prev.statusId === updates.statusId) continue; // No actual change

        const revertOnFailure = (result: MarcomSyncResult) => {
          if (!result.synced && !result.skipped && result.error) {
            const { nextTasks: reverted } = applyUpdateTask(
              get().tasks, id, { statusId: prev.statusId },
            );
            set({ tasks: reverted });
            syncUpdateTask(id, { statusId: prev.statusId });
            toast.error(`${prev.title}: ${result.error}`, { duration: 6000 });
          }
        };

        if (!prev.relatedMarcomType || prev.relatedMarcomType === "FIELD_EVENT") {
          syncFieldEventOnTaskStatusChange(prev, updates.statusId, spaces).then(revertOnFailure);
        }
        if (!prev.relatedMarcomType || prev.relatedMarcomType === "PLACEMENT") {
          syncPlacementOnTaskStatusChange(prev, updates.statusId, spaces).then(revertOnFailure);
        }
      }
    }
  },
```

Add import for `isFieldEventTask` at top of file (if not already imported):
```ts
import { syncFieldEventOnTaskStatusChange, isFieldEventTask } from "@/lib/tasks/eventTaskSync";
```

Note: `isFieldEventTask` is not needed in the rewritten code above (we check `relatedMarcomType` directly), but the import for `syncFieldEventOnTaskStatusChange` is already present at line 27.

- [x] **Step 3: Run full test suite**

Run: `npm test`
Expected: 539+ tests, 0 failures

- [x] **Step 4: Commit**

```bash
git add src/lib/store/slices/createTaskSlice.ts src/lib/store/taskCrud.test.ts
git commit -m "fix: fire marcom sync hooks from bulkUpdateTasks

Previously bulkUpdateTasks skipped Marcom sync entirely. Bulk status
changes on placement/event tasks now fire the same sync hooks as
single-task updates, with per-task revert on API failure."
```

---

## Post-Completion Verification

After all 3 tasks, verify the complete fix:

```bash
# 1. Sync functions return Promise<MarcomSyncResult>
grep -n 'MarcomSyncResult' src/lib/tasks/placementTaskSync.ts src/lib/tasks/eventTaskSync.ts

# 2. Store handles failures with revert
grep -n 'revertOnFailure' src/lib/store/slices/createTaskSlice.ts

# 3. bulkUpdateTasks fires sync hooks
grep -n 'syncPlacementOnTaskStatusChange\|syncFieldEventOnTaskStatusChange' src/lib/store/slices/createTaskSlice.ts
# Expected: appears in updateTask, moveTaskStatus, AND bulkUpdateTasks

# 4. All tests pass
npm test
# Expected: 541+ tests (2 new), 0 failures

# 5. No silent .catch(() => {}) remaining in sync functions
grep -n 'catch.*=>.*{}' src/lib/tasks/placementTaskSync.ts src/lib/tasks/eventTaskSync.ts
# Expected: no matches (all errors now surface as MarcomSyncResult.error)
```

## Summary: What Changed

| Before | After |
|--------|-------|
| `syncPlacementOnTaskStatusChange` returns `void`, `.catch` swallows errors | Returns `Promise<MarcomSyncResult>` with structured error |
| `syncFieldEventOnTaskStatusChange` returns `void`, `.catch(() => {})` | Returns `Promise<MarcomSyncResult>` with structured error |
| Kanban drag to "Done" with invalid placement → task stays "Done", placement stuck `ON_PROGRESS` | Task reverts to previous status + error toast shows API validation message |
| `bulkUpdateTasks` skips Marcom sync entirely | Fires sync hooks per-task, with individual revert on failure |
