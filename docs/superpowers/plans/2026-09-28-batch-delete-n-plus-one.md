# Eliminate N+1 HTTP DELETE Pattern (Issue #12) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the N+1 HTTP DELETE pattern when deleting spaces/folders/lists in the task store and when bulk-deleting records in Marcom tables, replacing multiple parallel single-record DELETE requests with atomic batch DELETE endpoints.

**Architecture:**
1. Add a batch `DELETE /api/tasks` endpoint accepting `{ ids: string[] }` that enforces workspace access, deletes tasks via `prisma.taskItem.deleteMany`, and broadcasts real-time deletions.
2. Add `syncDeleteTasksApi` in `src/lib/tasks/taskSync.ts` and `syncDeleteTasks` in `src/lib/store/slices/syncHelpers.ts`, replacing the `res.tasksToDelete.forEach((t) => syncDeleteTask(t.id))` loop in `createSpaceSlice.ts` (`deleteSpace`, `deleteFolder`, `deleteList`) with a single batch sync call.
3. Add batch `DELETE` endpoints to high-volume Marcom routes (`/api/marcom/placements`, `/api/marcom/mous`, `/api/marcom/outlets`).
4. Extend `MarcomTableShellProps<T>` in `src/components/views/shared/MarcomTableShell.tsx` with optional `onDeleteBatch?: (ids: string[]) => Promise<boolean>`, using it in `handleBulkDelete` to execute one batch request instead of `Promise.all(selectedRowIds.map(onDeleteOne))`, while preserving backward compatibility.
5. Wire `onDeleteBatch` into `PlacementsView`, `MousView`, and `OutletsView`.

**Tech Stack:** Next.js 15 App Router, TypeScript 5, Prisma 6, Zustand 5, Node native test runner (`node --test`)

**Spec:** Audit Issue #12 in `vrello-up-confusion-audit.md` — N+1 HTTP Delete Pattern (🟢 Performance).

---

## Global Constraints

- All source code, types, comments, variable names, test descriptions, and git commit messages MUST be in English.
- Import domain types from `@/types` (SSoT).
- Preserve backward compatibility: `onDeleteOne` in `MarcomTableShellProps` must remain supported as a fallback when `onDeleteBatch` is not provided.
- DO NOT introduce new third-party dependencies.
- Keep `@ts-expect-error` directly above single-line imports when importing `.ts` files in Node test runner files.
- Real-time SSE broadcasts must be emitted for deleted tasks so collaborating clients stay synchronized.
- Every task must end with passing tests (`npm test -- <test-file>`) and clean typecheck (`npx tsc --noEmit`).
- Commit after each task with conventional commit messages in English.

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `src/app/api/tasks/route.ts` | **Modify** | Add `DELETE` handler accepting `{ ids: string[] }` with auth and real-time broadcasts |
| `src/lib/tasks/taskSync.ts` | **Modify** | Add `syncDeleteTasksApi(ids: string[]): Promise<boolean>` |
| `src/lib/tasks/taskSync.test.ts` | **Modify** | Unit tests for batch task deletion API helper |
| `src/lib/store/slices/syncHelpers.ts` | **Modify** | Add `syncDeleteTasks(ids: string[])` |
| `src/lib/store/slices/createSpaceSlice.ts` | **Modify** | Replace `tasksToDelete.forEach(syncDeleteTask)` with `syncDeleteTasks` in `deleteSpace`, `deleteFolder`, `deleteList` |
| `src/app/api/marcom/placements/route.ts` | **Modify** | Add `DELETE` handler accepting `{ ids: string[], workspaceId?: string }` |
| `src/app/api/marcom/mous/route.ts` | **Modify** | Add `DELETE` handler accepting `{ ids: string[], workspaceId?: string }` |
| `src/app/api/marcom/outlets/route.ts` | **Modify** | Add `DELETE` handler accepting `{ ids: string[] }` |
| `src/components/views/shared/MarcomTableShell.tsx` | **Modify** | Add `onDeleteBatch` prop and use it in `handleBulkDelete` with fallback |
| `src/components/views/PlacementsView/PlacementsView.tsx` | **Modify** | Pass `onDeleteBatch` to `MarcomTableShell` |
| `src/components/views/MousView/MousView.tsx` | **Modify** | Pass `onDeleteBatch` to `MarcomTableShell` |
| `src/components/views/OutletsView/OutletsView.tsx` | **Modify** | Pass `onDeleteBatch` to `MarcomTableShell` |
| `vrello-up-confusion-audit.md` | **Modify** | Update Issue #12 status to `✅ Fixed` |

---

### Task 1: Batch Task Deletion API & Client Space Slice Integration

**Files:**
- Modify: `src/app/api/tasks/route.ts:470`
- Modify: `src/lib/tasks/taskSync.ts:128`
- Modify: `src/lib/tasks/taskSync.test.ts:120`
- Modify: `src/lib/store/slices/syncHelpers.ts:38`
- Modify: `src/lib/store/slices/createSpaceSlice.ts:89,162,215`

**Interfaces:**
- Produces:
  - `export async function DELETE(request: Request)` in `src/app/api/tasks/route.ts`
  - `export function syncDeleteTasksApi(ids: string[]): Promise<boolean>` in `src/lib/tasks/taskSync.ts`
  - `export function syncDeleteTasks(ids: string[]): void` in `src/lib/store/slices/syncHelpers.ts`

- [ ] **Step 1: Write failing unit test for `syncDeleteTasksApi`**

In `src/lib/tasks/taskSync.test.ts`, add test cases for `syncDeleteTasksApi`:

```typescript
import { syncDeleteTasksApi } from "@/lib/tasks/taskSync";

test("syncDeleteTasksApi handles empty array without error", async () => {
  const result = await syncDeleteTasksApi([]);
  assert.equal(result, true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/tasks/taskSync.test.ts`
Expected: FAIL with "syncDeleteTasksApi is not a function"

- [ ] **Step 3: Implement `syncDeleteTasksApi` and `syncDeleteTasks`**

In `src/lib/tasks/taskSync.ts`:

```typescript
export function syncDeleteTasksApi(ids: string[]): Promise<boolean> {
  if (ids.length === 0) return Promise.resolve(true);
  if (ids.length === 1) return syncDeleteTaskApi(ids[0]);

  return safeTaskSync(
    "/api/tasks",
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    },
    `batch delete tasks (${ids.length} items)`,
  );
}
```

In `src/lib/store/slices/syncHelpers.ts`:

```typescript
import {
  syncCreateTaskApi,
  syncUpdateTaskApi,
  syncDeleteTaskApi,
  syncDeleteTasksApi,
} from "@/lib/tasks/taskSync";

export function syncDeleteTasks(ids: string[]) {
  if (typeof window === "undefined" || ids.length === 0) return;
  syncDeleteTasksApi(ids);
}
```

- [ ] **Step 4: Implement `DELETE` handler in `src/app/api/tasks/route.ts`**

Add `DELETE` handler in `src/app/api/tasks/route.ts`:

```typescript
export async function DELETE(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const ids: string[] = Array.isArray(body?.ids)
      ? body.ids.filter((id: unknown) => typeof id === "string" && id.trim() !== "")
      : [];

    if (ids.length === 0) {
      return NextResponse.json({ error: "No task IDs provided" }, { status: 400 });
    }

    // Query tasks to verify workspace authorization and prepare realtime broadcast targets
    const tasks = await prisma.taskItem.findMany({
      where: { id: { in: ids } },
      include: { list: { include: { space: true } } },
    });

    if (tasks.length === 0) {
      return NextResponse.json({ ok: true, count: 0 });
    }

    // Verify user has staff access to all workspaces represented in the batch
    const workspaceIds = [...new Set(tasks.map((t) => t.list.space.workspaceId))];
    for (const wsId of workspaceIds) {
      const authError = await requireWorkspaceAccess(wsId, {
        requiredRole: "staff",
        request,
      });
      if (authError) return authError;
    }

    const deleteResult = await prisma.taskItem.deleteMany({
      where: { id: { in: ids } },
    });

    // Broadcast deletions per workspace
    for (const wsId of workspaceIds) {
      const wsTaskIds = tasks
        .filter((t) => t.list.space.workspaceId === wsId)
        .map((t) => t.id);
      for (const taskId of wsTaskIds) {
        realtimeHub.broadcastTaskDelete(taskId, wsId);
      }
    }

    return NextResponse.json({ ok: true, count: deleteResult.count });
  } catch (error) {
    console.error("Error batch deleting tasks in database:", error);
    return NextResponse.json(
      { error: "Failed to batch delete tasks in database" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 5: Replace N+1 DELETE calls in `createSpaceSlice.ts`**

In `src/lib/store/slices/createSpaceSlice.ts`:
Update import:
```typescript
import { syncWorkspaces, syncDeleteTask, syncDeleteTasks } from "./syncHelpers";
```

In `deleteSpace` (line 89):
```typescript
    // Replace N+1 syncDeleteTask calls with a single atomic batch delete
    syncDeleteTasks(res.tasksToDelete.map((t) => t.id));
```

In `deleteFolder` (line 162):
```typescript
    syncDeleteTasks(res.tasksToDelete.map((t) => t.id));
```

In `deleteList` (line 215):
```typescript
    syncDeleteTasks(res.tasksToDelete.map((t) => t.id));
```

- [ ] **Step 6: Run tests and typecheck**

Run: `npm test -- src/lib/tasks/taskSync.test.ts src/lib/store/spaces.test.ts`
Expected: PASS (all tests pass)

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 7: Commit**

```bash
git add src/app/api/tasks/route.ts src/lib/tasks/taskSync.ts src/lib/tasks/taskSync.test.ts src/lib/store/slices/syncHelpers.ts src/lib/store/slices/createSpaceSlice.ts
git commit -m "perf(tasks): add batch DELETE endpoint and eliminate N+1 task deletions on space/list removal"
```

---

### Task 2: Batch DELETE Endpoints for High-Volume Marcom Entities

**Files:**
- Modify: `src/app/api/marcom/placements/route.ts`
- Modify: `src/app/api/marcom/mous/route.ts`
- Modify: `src/app/api/marcom/outlets/route.ts`

**Interfaces:**
- Produces:
  - `export async function DELETE(request: Request)` in `src/app/api/marcom/placements/route.ts`
  - `export async function DELETE(request: Request)` in `src/app/api/marcom/mous/route.ts`
  - `export async function DELETE(request: Request)` in `src/app/api/marcom/outlets/route.ts`

- [ ] **Step 1: Implement batch `DELETE` in `src/app/api/marcom/placements/route.ts`**

Add `DELETE` handler:

```typescript
export async function DELETE(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const workspaceId = body?.workspaceId || new URL(request.url).searchParams.get("workspaceId") || "ws-main";
    const authError = await requireWorkspaceAccess(workspaceId, { requiredRole: "staff", request });
    if (authError) return authError;

    const ids: string[] = Array.isArray(body?.ids)
      ? body.ids.filter((id: unknown) => typeof id === "string" && id.trim() !== "")
      : [];

    if (ids.length === 0) {
      return NextResponse.json({ error: "No placement IDs provided" }, { status: 400 });
    }

    const result = await prisma.placement.deleteMany({
      where: {
        id: { in: ids },
        workspaceId,
      },
    });

    return NextResponse.json({ ok: true, count: result.count });
  } catch (error) {
    console.error("Error batch deleting placements:", error);
    return NextResponse.json({ error: "Failed to batch delete placements" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Implement batch `DELETE` in `src/app/api/marcom/mous/route.ts`**

Add `DELETE` handler in `src/app/api/marcom/mous/route.ts`:

```typescript
export async function DELETE(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const workspaceId = body?.workspaceId || new URL(request.url).searchParams.get("workspaceId") || "ws-main";
    const authError = await requireWorkspaceAccess(workspaceId, { requiredRole: "staff", request });
    if (authError) return authError;

    const ids: string[] = Array.isArray(body?.ids)
      ? body.ids.filter((id: unknown) => typeof id === "string" && id.trim() !== "")
      : [];

    if (ids.length === 0) {
      return NextResponse.json({ error: "No MOU IDs provided" }, { status: 400 });
    }

    const result = await prisma.mou.deleteMany({
      where: {
        id: { in: ids },
        workspaceId,
      },
    });

    return NextResponse.json({ ok: true, count: result.count });
  } catch (error) {
    console.error("Error batch deleting MOUs:", error);
    return NextResponse.json({ error: "Failed to batch delete MOUs" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Implement batch `DELETE` in `src/app/api/marcom/outlets/route.ts`**

Add `DELETE` handler in `src/app/api/marcom/outlets/route.ts`:

```typescript
export async function DELETE(request: Request) {
  try {
    // Outlets are global master data; deletion requires admin access
    const authError = await requireWorkspaceAccess("ws-main", { requiredRole: "admin", request });
    if (authError) return authError;

    const body = await request.json().catch(() => ({}));
    const ids: string[] = Array.isArray(body?.ids)
      ? body.ids.filter((id: unknown) => typeof id === "string" && id.trim() !== "")
      : [];

    if (ids.length === 0) {
      return NextResponse.json({ error: "No outlet IDs provided" }, { status: 400 });
    }

    const result = await prisma.outlet.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    return NextResponse.json({ ok: true, count: result.count });
  } catch (error) {
    console.error("Error batch deleting outlets:", error);
    return NextResponse.json({ error: "Failed to batch delete outlets" }, { status: 500 });
  }
}
```

- [ ] **Step 4: Run typecheck and tests**

Run: `npx tsc --noEmit`
Expected: 0 errors

Run: `npm test`
Expected: All 595+ tests pass

- [ ] **Step 5: Commit**

```bash
git add src/app/api/marcom/placements/route.ts src/app/api/marcom/mous/route.ts src/app/api/marcom/outlets/route.ts
git commit -m "feat(marcom): add batch DELETE endpoints for placements, mous, and outlets"
```

---

### Task 3: Support `onDeleteBatch` in `MarcomTableShell.tsx` & Consumer Views

**Files:**
- Modify: `src/components/views/shared/MarcomTableShell.tsx:68-70,110-125,200-225`
- Modify: `src/components/views/PlacementsView/PlacementsView.tsx:610-630,700`
- Modify: `src/components/views/MousView/MousView.tsx:135-146,167`
- Modify: `src/components/views/OutletsView/OutletsView.tsx:445-460,600`

**Interfaces:**
- Consumes:
  - Batch `DELETE` endpoints created in Task 2
- Produces:
  - Extended `MarcomTableShellProps<T>` with optional `onDeleteBatch?: (ids: string[]) => Promise<boolean>`

- [ ] **Step 1: Extend `MarcomTableShellProps` and `handleBulkDelete`**

In `src/components/views/shared/MarcomTableShell.tsx`:
Add to `MarcomTableShellProps<T>`:
```typescript
  // bulk delete
  canDelete: boolean;
  deleteRequiresMessage?: string;
  entityName: string;
  entityPlural: string;
  onDeleteOne: (id: string) => Promise<boolean>;
  onDeleteBatch?: (ids: string[]) => Promise<boolean>;
```

Destructure `onDeleteBatch` in component props.

In `handleBulkDelete`:
```typescript
    setIsDeleting(true);
    try {
      if (onDeleteBatch) {
        const ok = await onDeleteBatch(selectedRowIds);
        if (ok) {
          toast.success(
            `${selectedRowIds.length} ${selectedRowIds.length === 1 ? entityName : entityPlural} deleted`,
          );
          if (expandedId && selectedRowIds.includes(expandedId)) setExpandedId(null);
          setRowSelection({});
          await onRefresh();
        } else {
          toast.error(`Failed to delete selected ${entityPlural}`);
        }
        return;
      }

      // Fallback for views that have not yet implemented batch deletion
      const results = await Promise.all(selectedRowIds.map((id) => onDeleteOne(id)));
      const succeeded = selectedRowIds.filter((_, i) => results[i]);
      const failed = selectedRowIds.filter((_, i) => !results[i]);
      if (failed.length === 0) {
        toast.success(
          `${succeeded.length} ${succeeded.length === 1 ? entityName : entityPlural} deleted`,
        );
      } else if (succeeded.length === 0) {
        toast.error(
          `Failed to delete ${failed.length} ${failed.length === 1 ? entityName : entityPlural}`,
        );
      } else {
        toast.error(
          `${succeeded.length}/${selectedRowIds.length} ${entityPlural} deleted — ${failed.length} failed`,
        );
      }
      if (expandedId && succeeded.includes(expandedId)) setExpandedId(null);
      setRowSelection(failed.length ? Object.fromEntries(failed.map((id) => [id, true])) : {});
      await onRefresh();
    } finally {
      setIsDeleting(false);
    }
```

- [ ] **Step 2: Add `deleteBatch` to `PlacementsView.tsx`**

In `src/components/views/PlacementsView/PlacementsView.tsx`:

```typescript
  const deleteBatch = useCallback(
    async (ids: string[]) => {
      const res = await fetch("/api/marcom/placements", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, workspaceId: activeWorkspaceId }),
      });
      if (res.ok) {
        for (const id of ids) {
          removeCachedPlacement(activeWorkspaceId, id);
        }
        invalidateMous(activeWorkspaceId);
      }
      return res.ok;
    },
    [activeWorkspaceId, removeCachedPlacement, invalidateMous],
  );
```

Pass `onDeleteBatch={deleteBatch}` to `<MarcomTableShell>`.

- [ ] **Step 3: Add `deleteBatch` to `MousView.tsx`**

In `src/components/views/MousView/MousView.tsx`:

```typescript
  const deleteBatch = useCallback(
    async (ids: string[]) => {
      const res = await fetch("/api/marcom/mous", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, workspaceId: activeWorkspaceId }),
      });
      if (res.ok) {
        for (const id of ids) {
          removeCachedMou(activeWorkspaceId, id);
        }
        invalidatePlacements(activeWorkspaceId);
      }
      return res.ok;
    },
    [activeWorkspaceId, removeCachedMou, invalidatePlacements],
  );
```

Pass `onDeleteBatch={deleteBatch}` to `<MarcomTableShell>`.

- [ ] **Step 4: Add `deleteBatch` to `OutletsView.tsx`**

In `src/components/views/OutletsView/OutletsView.tsx`:

```typescript
  const deleteBatch = useCallback(
    async (ids: string[]) => {
      const res = await fetch("/api/marcom/outlets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (res.ok) {
        invalidateOutlets();
        invalidatePlacements(activeWorkspaceId);
        invalidateMous(activeWorkspaceId);
      }
      return res.ok;
    },
    [activeWorkspaceId, invalidateOutlets, invalidatePlacements, invalidateMous],
  );
```

Pass `onDeleteBatch={deleteBatch}` to `<MarcomTableShell>`.

- [ ] **Step 5: Run tests and typecheck**

Run: `npx tsc --noEmit`
Expected: 0 errors

Run: `npm test`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add src/components/views/shared/MarcomTableShell.tsx src/components/views/PlacementsView/PlacementsView.tsx src/components/views/MousView/MousView.tsx src/components/views/OutletsView/OutletsView.tsx
git commit -m "feat(table): add onDeleteBatch support to MarcomTableShell and connect Placements, Mous, and Outlets views"
```

---

### Task 4: Full Suite Verification & Update Audit Ledger

**Files:**
- Modify: `vrello-up-confusion-audit.md`

- [ ] **Step 1: Update Issue #12 status in `vrello-up-confusion-audit.md`**

Change status of Issue #12 to `✅ Fixed` in the table and description.

- [ ] **Step 2: Run full test suite**

Run: `npm test`
Expected: All suites pass with 0 failures.

Run: `npx tsc --noEmit`
Expected: Clean output with 0 errors.

- [ ] **Step 3: Verify git status is clean**

Run: `git status`
Expected: Working tree clean.
