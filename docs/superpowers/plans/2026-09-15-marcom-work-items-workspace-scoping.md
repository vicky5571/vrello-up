# Marcom Work Items Workspace Scoping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scoping `workspaceId` onto all marketing work items (`FieldEvent`, `ContentPost`, `Placement`, `Mou`, `MonthlyReport`, and `DocumentItem`) in PostgreSQL, domain types, API routes, and UI views, ensuring strict tenant isolation and cascading workspace deletion.

**Architecture:** Add `workspaceId String @default("ws-main")` with foreign key cascade to `WorkspaceItem` in `prisma/schema.prisma`. Enforce `requireWorkspaceAccess` guard in all `/api/marcom/*` work item routes and bind UI view queries to `activeWorkspaceId`.

**Tech Stack:** Next.js 15 App Router, TypeScript 5, PostgreSQL, Prisma ORM, Zustand 5.

**Spec:** [`docs/superpowers/specs/2026-09-15-marcom-work-items-workspace-scoping-design.md`](file:///Users/mac/Web%20Development/vrello-up/docs/superpowers/specs/2026-09-15-marcom-work-items-workspace-scoping-design.md)

## Global Constraints

- PostgreSQL schema must maintain backward compatibility: all existing records default to `"ws-main"` without data loss.
- Master data entities (`Branch`, `Outlet`, `Material`) remain global shared reference data.
- All unit tests must continue passing via `npm test`.

---

### Task 1: Skema Prisma & Domain Types

**Files:**
- Modify: `prisma/schema.prisma:120-270`
- Modify: `src/types/index.ts:1-250`
- Test: `npx prisma db push`

**Interfaces:**
- Consumes: `WorkspaceItem.id`
- Produces: `workspaceId` column and foreign key on work item models.

- [ ] **Step 1: Update prisma/schema.prisma with workspaceId and relations**

Add reverse relations to `WorkspaceItem`:
```prisma
model WorkspaceItem {
  ...
  placements     Placement[]
  mous           Mou[]
  fieldEvents    FieldEvent[]
  marcomEvents   MarcomEvent[]
  contentPosts   ContentPost[]
  monthlyReports MonthlyReport[]
  documents      DocumentItem[]
}
```

Add `workspaceId` and relation to `Placement`, `Mou`, `FieldEvent`, `MarcomEvent`, `ContentPost`, `MonthlyReport`, and `DocumentItem`:
```prisma
  workspaceId String        @default("ws-main")
  workspace   WorkspaceItem @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@index([workspaceId])
```

- [ ] **Step 2: Run prisma db push**

Run: `npx prisma db push`
Expected: Database schema synchronized successfully with zero data loss.

- [ ] **Step 3: Update domain types in src/types/index.ts**

Add `workspaceId?: string;` to `Placement`, `Mou`, `FieldEventItem`, `ContentPost`, `MonthlyReport`, and `DocumentItem`.

- [ ] **Step 4: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma src/types/index.ts
git commit -m "feat(schema): add workspaceId and cascade relation to marcom work items"
```

---

### Task 2: Unit Test Suite Tenant Isolation

**Files:**
- Create: `src/lib/marcom/workItemsTenant.test.ts`
- Test: `npm test -- src/lib/marcom/workItemsTenant.test.ts`

**Interfaces:**
- Consumes: `prisma.workspaceItem`, `prisma.fieldEvent`, `prisma.placement`, `prisma.mou`
- Produces: Automated verification of tenant isolation and cascading deletion.

- [ ] **Step 1: Write the failing test**

```typescript
test("Marcom work items are isolated by workspaceId and deleted on workspace cascade", async () => {
  ...
});
```

- [ ] **Step 2: Run test to verify passes**

Run: `npm test -- src/lib/marcom/workItemsTenant.test.ts`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/lib/marcom/workItemsTenant.test.ts
git commit -m "test(marcom): add tenant isolation and cascade delete tests for work items"
```

---

### Task 3: API Routes Tenant Scoping & RBAC Guards

**Files:**
- Modify: `src/app/api/marcom/events/route.ts` & `[id]/route.ts`
- Modify: `src/app/api/marcom/content/route.ts` & `[id]/route.ts`
- Modify: `src/app/api/marcom/placements/route.ts` & `[id]/route.ts`
- Modify: `src/app/api/marcom/mous/route.ts` & `[id]/route.ts`
- Modify: `src/app/api/marcom/reports/route.ts` & `[id]/route.ts`
- Modify: `src/app/api/marcom/documents/route.ts` & `[id]/route.ts`

**Interfaces:**
- Consumes: `requireWorkspaceAccess` from `@/lib/server/workspaceAuth`
- Produces: Tenant-filtered JSON responses and authenticated creation/modification.

- [ ] **Step 1: Update events and content API routes**
- [ ] **Step 2: Update placements and mous API routes**
- [ ] **Step 2: Update reports and documents API routes**
- [ ] **Step 4: Run unit tests**

Run: `npm test`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/marcom/
git commit -m "feat(api): scope marcom work items by workspaceId with RBAC guards"
```

---

### Task 4: UI Views Integration

**Files:**
- Modify: `src/components/views/EventsView/EventsView.tsx`
- Modify: `src/components/views/ContentPlannerView/ContentPlannerView.tsx`
- Modify: `src/components/views/PlacementsView/PlacementsView.tsx`
- Modify: `src/components/views/MousView/MousView.tsx`
- Modify: `src/components/views/ReportsView/ReportsView.tsx`
- Modify: `src/components/views/DocumentsView/DocumentsView.tsx`

**Interfaces:**
- Consumes: `useWorkspaceStore((state) => state.activeWorkspaceId)`
- Produces: Workspace-reactive queries and item creations.

- [ ] **Step 1: Bind EventsView and ContentPlannerView to activeWorkspaceId**
- [ ] **Step 2: Bind PlacementsView and MousView to activeWorkspaceId**
- [ ] **Step 3: Bind ReportsView and DocumentsView to activeWorkspaceId**
- [ ] **Step 4: Typecheck and test**

Run: `npx tsc --noEmit && npm test`
Expected: 0 errors, all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/views/
git commit -m "feat(views): bind marcom views to activeWorkspaceId"
```

---

### Task 5: Full Suite Verification & Final Audit

- [ ] **Step 1: Run complete test suite**

Run: `npm test`
Expected: 100% passing tests.

- [ ] **Step 2: Run production build check**

Run: `npm run build`
Expected: Successful Next.js build.

