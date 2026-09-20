# URL Routing & Deep-Linking State Synchronization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the single-route client monolith into a fully deep-linkable, history-aware workspace application with bidirectional URL state synchronization and shareable task links.

**Architecture:** A zero-dependency routing slice (`src/lib/router/`) providing pure URL serialization/parsing (`urlState.ts`) and a bidirectional controller hook (`useUrlStateSync.ts`) that synchronizes `window.history` with Zustand store actions and handles browser `popstate` navigation.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5, Zustand 5, Node test runner (`node --test`).

**Spec:** [`docs/superpowers/specs/2026-09-21-url-routing-and-state-sync-design.md`](file:///Users/mac/Web%20Development/vrello-up/docs/superpowers/specs/2026-09-21-url-routing-and-state-sync-design.md)

## Global Constraints
- **Zero God-File Bloat**: Do not add state or logic to [`useWorkspaceStore.ts`](file:///Users/mac/Web%20Development/vrello-up/src/lib/store/useWorkspaceStore.ts). All routing logic lives in `src/lib/router/`.
- **Zero Extra Dependencies**: Use native Web APIs (`URLSearchParams`, `window.history`, `popstate`).
- **Strict View Whitelist**: All incoming view strings must be validated against `ViewMode`.
- **Precision Verification**: Node test runner (`npm test`) must pass with 0 failures.

---

### Task 1: Pure URL Parser & Serializer (`urlState.ts`)

**Files:**
- Create: `src/lib/router/urlState.ts`
- Test: `src/lib/router/urlState.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface UrlNavState {
    appMode?: "tasks" | "marcom";
    view?: ViewMode;
    workspaceId?: string;
    spaceId?: string;
    listId?: string;
    taskId?: string;
  }
  export function parseUrlNavState(searchOrParams: string | URLSearchParams): UrlNavState;
  export function serializeUrlNavState(state: UrlNavState): string;
  export function buildShareableTaskUrl(taskId: string, currentSearch?: string): string;
  ```

- [ ] **Step 1: Write the failing unit tests**
  Create `src/lib/router/urlState.test.ts`:
  - Test parsing complete query string: `?mode=marcom&view=events&space=sp-1&list=l-1&task=t-1&ws=ws-1`.
  - Test validation dropping unknown/invalid `view` modes (e.g. `?view=malicious_eval` -> `undefined`).
  - Test serialization omitting empty/undefined fields cleanly.
  - Test `buildShareableTaskUrl` preserving active view while setting target task ID.

- [ ] **Step 2: Run test to verify it fails**
  Run: `npm test -- src/lib/router/urlState.test.ts`
  Expected: FAIL with module not found or functions undefined.

- [ ] **Step 3: Implement `src/lib/router/urlState.ts`**
  Implement `parseUrlNavState`, `serializeUrlNavState`, and `buildShareableTaskUrl` using `URLSearchParams` and strict whitelist lookup against valid `ViewMode` values.

- [ ] **Step 4: Run test to verify it passes**
  Run: `npm test -- src/lib/router/urlState.test.ts`
  Expected: PASS (all tests pass).

---

### Task 2: Bidirectional URL State Controller Hook (`useUrlStateSync.ts`)

**Files:**
- Create: `src/lib/router/useUrlStateSync.ts`
- Modify: `src/app/page.tsx:145-185`

**Interfaces:**
- Consumes: `parseUrlNavState`, `serializeUrlNavState` from `src/lib/router/urlState.ts`
- Produces:
  ```ts
  export function useUrlStateSync(): void;
  ```

- [ ] **Step 1: Implement `src/lib/router/useUrlStateSync.ts`**
  - Read `window.location.search` on mount:
    - If URL contains `view`, `spaceId`, `listId`, `taskId`, or `appMode`, update store state immediately (`setActiveView`, `setActiveSpace`, `setActiveList`, `setSelectedTaskId`, `setAppMode`).
  - Subscribe to store state changes:
    - Compare target serialized URL against `window.location.search`.
    - If different and change is a user transition (view switch or task selection), call `window.history.pushState(null, "", targetUrl)`.
  - Listen to `window.addEventListener("popstate", ...)`:
    - When back/forward occurs, re-parse `window.location.search` and reconcile store state (e.g. set `selectedTaskId` to `null` if drawer was closed via Back button).

- [ ] **Step 2: Mount `useUrlStateSync` in `src/app/page.tsx`**
  Import and mount `useUrlStateSync()` at the top of `WorkspacePage`.

- [ ] **Step 3: Verify with Node test runner & Typecheck**
  Run: `npm test`
  Run: `npm run typecheck`
  Expected: PASS with 0 errors.

---

### Task 3: Task Drawer Deep-Link Sharing Action

**Files:**
- Modify: `src/components/tasks/TaskDrawer.tsx`

**Interfaces:**
- Consumes: `buildShareableTaskUrl` from `src/lib/router/urlState.ts`

- [ ] **Step 1: Add "Copy Task Link" button to `TaskDrawer.tsx`**
  In the top header actions (next to Close / Delete buttons), add a button with a `LinkIcon` allowing users to copy the permalink.
  When clicked:
  ```ts
  const fullUrl = `${window.location.origin}${buildShareableTaskUrl(task.id, window.location.search)}`;
  navigator.clipboard.writeText(fullUrl);
  toast.success("Task link copied to clipboard");
  ```

- [ ] **Step 2: Run verification**
  Run: `npm test`
  Run: `npm run typecheck`
  Expected: PASS with 0 errors.
