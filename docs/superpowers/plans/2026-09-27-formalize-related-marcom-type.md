# Formalize RelatedMarcomType on Task Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate magic string prefix coupling (`[Placement]` and `[Field Event]`) in task sync by introducing a formal `relatedMarcomType?: "PLACEMENT" | "FIELD_EVENT" | "MOU" | "CONTENT"` on the `Task` domain model, database schema, and bidirectional sync handlers.

**Architecture:** Add `relatedMarcomType` to `Task` in `src/types/index.ts` and `TaskItem` in `prisma/schema.prisma`. Refactor `isPlacementTask` and create `isFieldEventTask` to prioritize `relatedMarcomType` while preserving title prefix matching as an offline/legacy fallback. Update task creation sites in Placements, Field Events, MOUs, and Content Planner.

**Tech Stack:** Next.js 15, TypeScript 5, Prisma ORM (PostgreSQL), Zustand 5, Node native test runner (`node --test`).

---

## Global Constraints

- Source code, type definitions, inline comments, technical plans, and commit messages MUST strictly be in English.
- Single source of truth for domain types must remain in `src/types/index.ts`.
- Backward compatibility: Legacy tasks created without `relatedMarcomType` must continue to sync via title prefix fallback.
- Never mutate state objects in-place in Zustand actions.
- All 499+ existing unit tests must continue to pass with 0 regressions.

---

### Task 1: Domain Type & Database Schema

**Files:**
- Modify: `src/types/index.ts`
- Modify: `prisma/schema.prisma`
- Modify: `src/app/api/tasks/route.ts`
- Modify: `src/app/api/tasks/[id]/route.ts`

**Interfaces:**
- Produces: `export type RelatedMarcomType = "PLACEMENT" | "FIELD_EVENT" | "MOU" | "CONTENT";`
- Produces: `Task.relatedMarcomType?: RelatedMarcomType;`

- [ ] **Step 1: Add `RelatedMarcomType` to `src/types/index.ts`**

Add `RelatedMarcomType` union and add `relatedMarcomType?: RelatedMarcomType;` to `Task`:

```ts
export type RelatedMarcomType = "PLACEMENT" | "FIELD_EVENT" | "MOU" | "CONTENT";

export interface Task {
  // ...
  relatedMarcomId?: string;
  relatedMarcomType?: RelatedMarcomType;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 2: Add `relatedMarcomType` to `TaskItem` in `prisma/schema.prisma` and push DB schema**

```prisma
model TaskItem {
  // ...
  relatedMarcomId   String?
  relatedMarcomType String?
  postPlatform      String?
  // ...
  @@index([relatedMarcomId])
  @@index([relatedMarcomType])
}
```

Run schema synchronization:
```bash
npx prisma db push
```

- [ ] **Step 3: Update `POST /api/tasks` and `PATCH /api/tasks/[id]`**

In `src/app/api/tasks/route.ts`:
- Extract `relatedMarcomType` from request body in POST handler.
- Pass `relatedMarcomType: relatedMarcomType || null` in `prisma.taskItem.create`.
- Map `relatedMarcomType: (task.relatedMarcomType as RelatedMarcomType) || undefined` in `formattedTask`.

In `src/app/api/tasks/[id]/route.ts`:
- Add `"relatedMarcomType"` to `stringFields` array in PATCH handler.
- Map `relatedMarcomType: (updated.relatedMarcomType as RelatedMarcomType) || undefined` in `formattedTask`.

- [ ] **Step 4: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 5: Commit Task 1**

```bash
git add src/types/index.ts prisma/schema.prisma src/app/api/tasks/route.ts "src/app/api/tasks/[id]/route.ts"
git commit -m "feat(tasks): add formal relatedMarcomType to domain Task and database schema"
```

---

### Task 2: Sync Logic Refactoring & Unit Tests (TDD)

**Files:**
- Modify: `src/lib/tasks/placementTaskSync.ts`
- Modify: `src/lib/tasks/eventTaskSync.ts`
- Test: `src/lib/tasks/placementTaskSync.test.ts`
- Test: `src/lib/tasks/eventTaskSync.test.ts`

**Interfaces:**
- Consumes: `Task.relatedMarcomType`
- Produces: `isPlacementTask(task: Task | undefined | null): boolean`
- Produces: `isFieldEventTask(task: Task | undefined | null): boolean`

- [ ] **Step 1: Write failing unit tests for renamed tasks in `placementTaskSync.test.ts`**

Add tests in `src/lib/tasks/placementTaskSync.test.ts`:
```ts
test("isPlacementTask recognizes tasks with relatedMarcomType='PLACEMENT' even if title prefix is deleted", () => {
  const renamedTask = {
    id: "task-custom",
    listId: "l1",
    title: "Pasang Baliho Baru di Toko Berkah", // User removed "[Placement]"
    description: "",
    statusId: "s1",
    priority: "normal" as const,
    assignees: [],
    tags: [],
    subtasks: [],
    orderIndex: 0,
    relatedMarcomId: "place-101",
    relatedMarcomType: "PLACEMENT" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  assert.equal(isPlacementTask(renamedTask), true);
});

test("isPlacementTask retains fallback for legacy tasks without relatedMarcomType", () => {
  const legacyTask = {
    id: "task-legacy",
    listId: "l1",
    title: "[Placement] Shop Sign Toko Berkah",
    description: "",
    statusId: "s1",
    priority: "normal" as const,
    assignees: [],
    tags: [],
    subtasks: [],
    orderIndex: 0,
    relatedMarcomId: "place-102",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  assert.equal(isPlacementTask(legacyTask), true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/tasks/placementTaskSync.test.ts`
Expected: First test fails because `isPlacementTask` only checks `title?.startsWith("[Placement]")`.

- [ ] **Step 3: Update `isPlacementTask` and `buildPlacementTaskPayload` in `placementTaskSync.ts`**

In `src/lib/tasks/placementTaskSync.ts`:
```ts
export function isPlacementTask(task: Task | undefined | null): boolean {
  if (!task || !task.relatedMarcomId) return false;
  if (task.relatedMarcomType === "PLACEMENT") return true;
  return Boolean(task.title?.startsWith("[Placement]"));
}
```
And in `buildPlacementTaskPayload`:
```ts
return {
  listId: "list-field-ops",
  title: `[Placement] ${placement.materialName || "Branding"} - ${placement.outletName || "Outlet"}`,
  description: ...,
  statusId: targetStatusId,
  priority: "normal",
  relatedMarcomId: placement.id,
  relatedMarcomType: "PLACEMENT",
  mediaUrl: placement.photoUrl || undefined,
  subtasks: [...],
};
```

- [ ] **Step 4: Update `isFieldEventTask` and `buildEventTaskPayload` in `eventTaskSync.ts`**

Export `isFieldEventTask`:
```ts
export function isFieldEventTask(task: Task | undefined | null): boolean {
  if (!task || !task.relatedMarcomId) return false;
  if (task.relatedMarcomType === "FIELD_EVENT") return true;
  return Boolean(task.title?.startsWith("[Field Event]"));
}
```
Use `isFieldEventTask` inside `syncFieldEventOnTaskStatusChange`:
```ts
export function syncFieldEventOnTaskStatusChange(
  task: Task | undefined,
  newStatusId: string,
  spaces: Space[]
): void {
  if (!isFieldEventTask(task)) return;
  // ...
}
```
And in `buildEventTaskPayload`:
```ts
return {
  listId,
  title: `[Field Event] ${event.name.trim()}`,
  description,
  statusId,
  priority,
  assignees,
  dueDate,
  orderIndex: 0,
  tags: [],
  subtasks,
  relatedMarcomId: event.id,
  relatedMarcomType: "FIELD_EVENT",
};
```

- [ ] **Step 5: Write unit tests in `src/lib/tasks/eventTaskSync.test.ts` and run tests**

Add tests in `src/lib/tasks/eventTaskSync.test.ts` verifying `isFieldEventTask` with renamed titles and legacy fallbacks.
Run:
```bash
npm test -- src/lib/tasks/placementTaskSync.test.ts src/lib/tasks/eventTaskSync.test.ts
```
Expected: All tests pass.

- [ ] **Step 6: Commit Task 2**

```bash
git add src/lib/tasks/placementTaskSync.ts src/lib/tasks/placementTaskSync.test.ts src/lib/tasks/eventTaskSync.ts src/lib/tasks/eventTaskSync.test.ts
git commit -m "refactor(tasks): detect placement and field event tasks via relatedMarcomType with legacy fallback"
```

---

### Task 3: Caller Sites & Component Integration

**Files:**
- Modify: `src/lib/store/useWorkspaceStore.ts`
- Modify: `src/components/views/ContentPlannerView/ContentPlannerView.tsx`
- Modify: `src/components/views/EventsView/EventsView.tsx`
- Modify: `src/components/views/EventsView/EventFormModal.tsx`
- Modify: `src/components/tasks/TaskDrawer.tsx`

- [ ] **Step 1: Update `useWorkspaceStore.ts`**

- In `create_field_ops_task` automation rule:
  ```ts
  relatedMarcomId: mouId || undefined,
  relatedMarcomType: "MOU",
  ```
- In `updateTask` and `moveTaskStatus`:
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

- [ ] **Step 2: Update `ContentPlannerView.tsx`**

Set `relatedMarcomType: "CONTENT"` whenever creating linked tasks from content posts:
- Around line 396 and 523.

- [ ] **Step 3: Update `EventsView.tsx` and `EventFormModal.tsx`**

Set `relatedMarcomType: "FIELD_EVENT"` when dispatching `createTask`:
- In `EventsView.tsx` around line 250.
- In `EventFormModal.tsx` around line 430.

- [ ] **Step 4: Update `TaskDrawer.tsx`**

Around line 403:
```tsx
{(navigatedFromMarcom || (task?.relatedMarcomId && (task?.relatedMarcomType === "FIELD_EVENT" || task?.title?.startsWith("[Field Event]")))) && (
```

- [ ] **Step 5: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 6: Commit Task 3**

```bash
git add src/lib/store/useWorkspaceStore.ts src/components/views/ContentPlannerView/ContentPlannerView.tsx src/components/views/EventsView/EventsView.tsx src/components/views/EventsView/EventFormModal.tsx src/components/tasks/TaskDrawer.tsx
git commit -m "feat(marcom): wire relatedMarcomType across workspace store, content planner, events, and task drawer"
```

---

### Task 4: Full Verification & Zero Regressions

**Files:** None (testing and verification)

- [ ] **Step 1: Run typecheck**

```bash
npx tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 2: Run all task and sync unit tests**

```bash
npm test -- src/lib/tasks/placementTaskSync.test.ts src/lib/tasks/eventTaskSync.test.ts src/lib/tasks/taskSync.test.ts src/lib/tasks/taskPersistence.test.ts
```
Expected: All tests pass.

- [ ] **Step 3: Run full test suite**

```bash
npm test
```
Expected: 499+ pass, 0 fail.
