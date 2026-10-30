# ADR 07: Unify User Management into Workspace Stage Shell

**Date:** 2026-10-31  
**Status:** Accepted  
**Author:** Critical Senior Software Engineer (Pair Programmer)  
**Related Specs:** `docs/superpowers/specs/2026-10-31-workspace-user-management-integration-design.md`  
**Related Plans:** `docs/superpowers/plans/2026-10-31-workspace-user-management-integration.md`  

---

## Context

`vrello-up` is designed as a cohesive Single-Page Workspace Application (SPA) where all functional modules (Kanban Board, List, Calendar, Pipeline 360°, Outlets, MOUs, Field Events, Placements, Inventory, Documents, Reports, Analytics) live inside a unified app shell:
- Left: `GlobalRail` (persistent dark icon rail)
- Middle: Collapsible `Sidebar`
- Top: `TopNav` (breadcrumbs, search, theme toggle, user profile)
- Center: `ActiveViewStage` (seamless zero-reload view rendering)

However, the previous User Management implementation deviated from this architecture:
- Clicking the "Users" button in `GlobalRail` executed `router.push("/admin/users")`.
- `/admin/users/page.tsx` was a standalone Next.js server route that destroyed the entire workspace shell, stripping away `GlobalRail`, `Sidebar`, `TopNav`, notifications, AI drawer, and Command Palette (`Cmd+K`).
- It presented a blank isolated screen with an `<ArrowLeft /> Kembali ke Workspace` button, forcing a hard page reload when navigating back to the workspace.

This created a jarring user experience, broke navigation state, and violated the architectural principle of a single, unified workspace shell.

---

## Decisions

### 1. Integrate `users` as a First-Class `ViewMode` in `ActiveViewStage`
We will add `"users"` to the canonical `ViewMode` union in `src/types/index.ts` and register it in `src/lib/router/urlState.ts`.
When `activeView === "users"`, `ActiveViewStage` will dynamically render `<UsersView />` directly inside the primary workspace stage without any page reload.

### 2. Update `GlobalRail` to Use Store-Driven Navigation
Instead of `router.push("/admin/users")`, the Users button in `GlobalRail` will:
- Set `activeView: "users"` via `useWorkspaceStore.getState().setActiveView("users")`.
- Maintain active state styling: `isActive: activeView === "users"`.
- Remain visible exclusively to users with `role === "admin"`.

### 3. Fail-Closed Security Boundary in `ActiveViewStage`
If a non-admin user somehow activates `view=users` via URL tampering:
- `ActiveViewStage` will enforce a fail-closed guard: if `session?.user?.role !== "admin"`, it will fall back to `"board"` (or `"pipeline"`).
- The server API endpoints (`/api/admin/users/*`) already enforce `role === "admin"` with HTTP 403.

### 4. Backwards-Compatible URL Redirection
The existing `/admin/users/page.tsx` route will redirect via `redirect("/?view=users")`, ensuring existing deep-links and bookmarks continue to function seamlessly without a 404 error.

---

## Consequences

### Positive
- **Cohesive UX:** Super Admins manage users directly within the workspace without losing the sidebar, top navigation, search, or active session context.
- **Zero Page Reload (Instant Navigation):** Switching between Outlets/MOUs and User Management happens instantaneously with 0ms transition.
- **Clean Architecture:** Eliminates isolated orphan routes and aligns user management with every other domain view in `vrello-up`.
- **Active Navigation Pill:** The `Users` icon in `GlobalRail` now reflects active state properly (`isActive: activeView === "users"`).

### Negative / Trade-offs
- `UsersView` must adapt its layout padding and height to fit seamlessly inside the workspace `<main>` container (removing redundant "Kembali ke Workspace" link).
