# Spec — Workspace Shell Integration for User Management

**Date:** 2026-10-31  
**Status:** DRAFT  
**Scope:** Client navigation architecture (`ViewMode`, `ActiveViewStage`, `GlobalRail`, `urlState.ts`, `UsersView` container polish)  
**Refs:** ADR 07 (`docs/adr/0007-integrate-user-management-into-workspace-stage.md`)

---

## 1. Executive Summary

This feature unifies the User Management interface into the central **Workspace Shell Stage** (`ActiveViewStage.tsx`).
Previously, accessing User Management via `GlobalRail` forced a full Next.js page transition to `/admin/users`, destroying the persistent `GlobalRail`, `Sidebar`, `TopNav`, Command Palette (`Cmd+K`), and user session layout.

By integrating `users` directly into the canonical `ViewMode` union, Super Admins can switch between project views, marcom views, and user administration instantaneously (0ms SPA transition) while retaining the full application shell and active state tracking.

---

## 2. UX Flow & Interaction

```
[GlobalRail: Users Icon] ──(click)──> setActiveView("users")
                                             │
                                             ▼
                                   [ActiveViewStage.tsx]
                                 Is user role === "admin"?
                                    /                 \
                                  YES                  NO
                                  /                     \
                      [Render UsersView]      [Fallback to ProjectsBoardView]
                      - Full shell preserved  - Fail-closed security
                      - Tab switching (Pending/Active/Rejected)
                      - Dynamic counts
```

1. **Activation:**
   - When an Admin clicks the `Users` icon in `GlobalRail`, `useWorkspaceStore.getState().setActiveView("users")` is invoked.
   - The icon receives active styling (`isActive: activeView === "users"`).
2. **Rendering in Workspace:**
   - `ActiveViewStage` renders `UsersView` inside the standard `<main id="workspace-main">` viewport.
   - `TopNav` displays breadcrumb: `Workspace / Administrasi / Manajemen Pengguna`.
   - The redundant `<Link href="/">Kembali ke Workspace</Link>` is removed since the user never leaves the workspace.
3. **Deep-linking & Persistence:**
   - Opening `/?view=users` or `/?v=users` restores the User Management stage.
   - Accessing `/admin/users` performs a server 307 redirect to `/?view=users`.

---

## 3. Data Contracts & SSOT (`src/types/index.ts`)

```typescript
export type ViewMode =
  | "pipeline"
  | "home"
  | "list"
  | "board"
  | "calendar"
  | "channel"
  | "content"
  | "content-planner"
  | "branches"
  | "outlets"
  | "placements"
  | "mous"
  | "events"
  | "inventory"
  | "documents"
  | "reports"
  | "analytics"
  | "users";
```

---

## 4. Router & URL State Integration (`src/lib/router/urlState.ts`)

- Add `"users"` to `VALID_VIEWS` in `src/lib/router/urlState.ts`.
- Ensure `parseUrlNavState("?view=users")` returns `{ view: "users" }`.
- Test deep-link serialization and parsing in `src/lib/router/urlState.test.ts`.

---

## 5. Security & Authorization Constraints

1. **Client-Side Fail-Closed Guard:**
   - In `ActiveViewStage.tsx`, if `activeView === "users"` and `session?.user?.role !== "admin"`, the view does not render `UsersView`. It safely falls back to default view.
2. **Server-Side API Enforcement:**
   - All underlying endpoints (`/api/admin/users`, `/api/admin/users/[id]`) remain strictly guarded with `session.user.role !== "admin" => 403 Forbidden`.

---

## 6. Acceptance Criteria

- [ ] `"users"` added to `ViewMode` union in `src/types/index.ts`.
- [ ] `urlState.ts` accepts `?view=users` and `?v=users`.
- [ ] `ActiveViewStage.tsx` dynamically imports and renders `<UsersView />` when `activeView === "users"`.
- [ ] `GlobalRail.tsx` toggles `setActiveView("users")` and displays active state without hard page navigation.
- [ ] Non-admin users cannot render `UsersView` even if attempting URL parameter manipulation.
- [ ] Legacy `/admin/users` redirects to `/?view=users`.
- [ ] Redundant "Kembali ke Workspace" button in `UsersView.tsx` cleaned up for in-stage presentation.
- [ ] All verification gates pass: `npm run build:check`, `npm run drift:check`, `npm test` with 0 failures.

---

## 7. Non-Goals

- Non-goal: Modifying user management CRUD logic or modal designs; this task strictly unifies the container presentation and navigation shell.
