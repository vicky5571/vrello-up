# Implementation Plan: P0 Workspace Boundary & Tenant Isolation Leak in Views

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or inline execution to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralize marketing event and MOU data fetching into `useMarcomDataStore`, eliminate un-scoped raw `fetch()` calls and local state in `CalendarView.tsx`, enforce strict `workspaceId` validation on backend routes, and fix tenant leaks in `CommandPalette`, `ExportCenter`, and automation `scheduler`.

**Architecture:** Extend Zustand-based `useMarcomDataStore` with scoped `fetchEvents(workspaceId, force?)` and `fetchMous(workspaceId, force?)` methods. Make `CalendarView` reactively subscribe to `eventsByWorkspace[activeWorkspaceId]` and `mousByWorkspace[activeWorkspaceId]`, computing items via `useMemo`. Enforce HTTP 400 Bad Request on `GET /api/marcom/events` and `GET /api/marcom/mous` when `workspaceId` is missing.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5, Zustand 5, Node test runner (`node --test`).

---

## Task 1: Extend `useMarcomDataStore` with Scoped Async Fetch Actions & Unit Tests

**Files:**
- Modify: `src/lib/marcom/marcomDataStore.ts`
- Test: `src/lib/marcom/marcomDataStore.test.ts`

- [ ] **Step 1: Add failing tests for `fetchEvents` and `fetchMous` in `marcomDataStore.test.ts`**
- [ ] **Step 2: Run test to verify failure**
- [ ] **Step 3: Implement `fetchEvents` and `fetchMous` in `marcomDataStore.ts`**
- [ ] **Step 4: Run test to verify it passes**

---

## Task 2: Refactor `CalendarView.tsx` and `EventsView.tsx` to Consume `useMarcomDataStore`

**Files:**
- Modify: `src/components/views/CalendarView/CalendarView.tsx`
- Modify: `src/components/views/EventsView/EventsView.tsx`

- [ ] **Step 1: Replace raw fetch and local state in `CalendarView.tsx` with reactive `useMarcomDataStore` subscription**
- [ ] **Step 2: Update `EventsView.tsx` to leverage `fetchEvents(activeWorkspaceId, true)`**
- [ ] **Step 3: Verify TypeScript typing (`npm run typecheck`)**

---

## Task 3: Enforce Strict Workspace Parameter Validation on Backend Routes

**Files:**
- Modify: `src/app/api/marcom/events/route.ts`
- Modify: `src/app/api/marcom/mous/route.ts`

- [ ] **Step 1: Require `workspaceId` on GET and POST in `events/route.ts` (return 400 if missing)**
- [ ] **Step 2: Require `workspaceId` on GET and POST in `mous/route.ts` (return 400 if missing)**
- [ ] **Step 3: Run Marcom tenant tests (`npm test -- src/lib/marcom/workItemsTenant.test.ts`)**

---

## Task 4: Fix Secondary Un-scoped Fetch Callers (`CommandPalette`, `ExportCenter`, `scheduler.ts`)

**Files:**
- Modify: `src/components/layout/CommandPalette.tsx`
- Modify: `src/components/layout/ExportCenter.tsx`
- Modify: `src/lib/automations/scheduler.ts`

- [ ] **Step 1: Pass `workspaceId` query param in `CommandPalette.tsx` and include in `useEffect` deps**
- [ ] **Step 2: Subscribe to `activeWorkspaceId` and pass `workspaceId` in `ExportCenter.tsx`**
- [ ] **Step 3: Pass `workspaceId` in `scheduler.ts:checkUpcomingEvents` and safely parse JSON response**
- [ ] **Step 4: Run full test suite (`npm test`) and typecheck (`npm run typecheck`)**
