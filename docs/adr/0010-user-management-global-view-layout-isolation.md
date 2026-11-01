# ADR 10: User Management Global View Layout Isolation

**Date:** 2026-11-01  
**Status:** Accepted  
**Author:** Critical Senior Software Engineer (Pair Programmer)  
**Related Specs:** `docs/superpowers/specs/2026-11-01-user-management-global-layout-design.md`  
**Related Plans:** `docs/superpowers/plans/2026-11-01-user-management-global-layout.md`  
**Refs:** ADR 07 (`docs/adr/0007-integrate-user-management-into-workspace-stage.md`), ADR 09 (`docs/adr/0009-global-view-layout-isolation-and-profile-hierarchy.md`)

---

## Context

In **ADR 07**, User Management (`users`) was integrated into the SPA workspace stage (`ActiveViewStage.tsx`), eliminating detached server routes and hard page reloads. In **ADR 09**, we established the distinction between Operational Views (scoped to Projects/Marcom) and Global Account Views, suppressing the contextual `Sidebar` on `profile`.

However, the User Management page (`activeView === "users"`) was still subject to inconsistent layout rules:
1. When an administrator navigated to User Management from the `GlobalRail`, the 240px wide operational `Sidebar` (showing Projects or Marcom menu items like Kanban Board, List, Calendar, or Operations & Planning) remained visible beside the User Management table.
2. The user management table contains dense administrative metadata: user names, emails, RBAC role selector badges, assigned branch chips, registration dates, and approval/rejection actions. Compressing this table next to a 240px irrelevant module sidebar cramped table column widths, forced horizontal scrollbars on medium screens, and increased visual clutter.
3. Because `users` is triggered exclusively from `GlobalRail` (for administrators) and represents an administrative/account domain rather than an operational campaign or project task, keeping the operational `Sidebar` open violated the Information Architecture principles established in ADR 09.

---

## Decisions

### 1. Classify User Management as a Global Account View
User Management (`users`) is formally grouped alongside User Profile (`profile`) within `GLOBAL_ACCOUNT_VIEWS`. It is treated as a top-level administrative workspace view that operates directly under the root workspace scope, independent of `Projects` or `Marketing Hub`.

### 2. Suppress Contextual Sidebar for User Management
In `src/components/layout/layoutHierarchyHelpers.ts`:
- Refactor `shouldRenderSidebar(activeView)` to return `false` whenever `activeView` is in `GLOBAL_ACCOUNT_VIEWS` (covering both `"profile"` and `"users"`).
- In `Sidebar.tsx`, the component returns `null` when `activeView === "users"`.
- The main stage container (`<main id="workspace-main">`) expands via `flex-1` across the full viewport, providing an expansive widescreen surface for administrative tables, user role audits, and approval workflows.

### 3. Retain Persistent GlobalRail
The 52px dark `GlobalRail` on the far left remains permanently visible. The `Users` icon continues to display active state (`isActive: activeView === "users"`), ensuring the administrator always has immediate access to return to `Home`, `Calendar`, `AI`, or change modules.

### 4. Direct Root Breadcrumb & Shortcut Return
In `TopNavBreadcrumbs.tsx`:
- Renders directly under root brand:
  ```
  Vrello / Manajemen Pengguna
  ```
- Displays the `Users` icon and an accessible "Kembali ke Workspace" shortcut button that brings the administrator back to their prior work item view (`lastTaskView` or `lastMarcomView`).

---

## Consequences

### Positive
- **Architectural Uniformity:** Both personal account (`profile`) and administrative user management (`users`) share identical, predictable layout rules.
- **Superior Table Ergonomics:** User approval and active user tables gain 240px of extra horizontal canvas, eliminating horizontal scrolling and cramped badges.
- **Cognitive Clarity:** Removes irrelevant work item menus (Kanban, List, Calendar) while performing administrative user management.
- **Persistent Global Anchor:** `GlobalRail` remains anchored with zero navigation disorientation.

### Negative / Trade-offs
- None. `layoutHierarchyHelpers.ts` and `TopNavBreadcrumbs.tsx` were already structured to support `users`; this ADR fully aligns `shouldRenderSidebar` to complete the architectural pattern.

