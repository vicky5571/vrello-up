# ADR 09: Global View Layout Isolation and Profile Hierarchy

**Date:** 2026-11-01  
**Status:** Accepted  
**Author:** Critical Senior Software Engineer (Pair Programmer)  
**Related Specs:** `docs/superpowers/specs/2026-11-01-profile-layout-hierarchy-design.md`  
**Related Plans:** `docs/superpowers/plans/2026-11-01-profile-layout-hierarchy.md`  
**Refs:** ADR 08 (`docs/adr/0008-dedicated-user-profile-workspace-view.md`)

---

## Context

Following the implementation of ADR 08 (Dedicated User Profile Workspace View), the `profile` view was successfully integrated into the single-page application stage (`ActiveViewStage.tsx`). However, visual and structural analysis revealed a significant Information Architecture (IA) and layout defect:

1. **False Dichotomy in Layout Context:** The application shell historically divided all views into two operational modules:
   - Projects (`appMode: "tasks"`): Kanban Board, List, Calendar.
   - Marketing Hub (`appMode: "marcom"`): Pipeline, Events, Placements, MOUs, Master Data.
2. **Context Bleed on Breadcrumbs:** Because `profile` is not in `MARCOM_VIEW_SET`, `createUiSlice` defaulted `appMode` to `"tasks"`. Consequently, `TopNavBreadcrumbs` rendered:
   ```
   Vrello / Projects / profile
   ```
   This wrongly implied that user account management is an operational child task inside the Projects module.
3. **Irrelevant Projects Filter Bar:** In `TopNav.tsx`, `{appMode === "tasks" && <ProjectsFilterBar />}` was rendered above the Profile view, exposing work item filters (`Search work items...`, `All`, `Content`, `Event`, `Placement`, `More Filters`) that have zero relevance to account security and avatar settings.
4. **Context Clutter from Operational Sidebar:** The 240px wide `Sidebar` remained open, displaying the Projects/Marcom mode switcher and Kanban/List/Calendar buttons. This cramped the profile editor and distracted the user with irrelevant work-item navigation.

---

## Decisions

### 1. Establish Explicit Distinction Between Operational and Global Views
We formally bifurcate application views into two architectural tiers:
- **Operational Views (Contextual):** Views scoped to work management (`board`, `list`, `calendar`, and all `MARCOM_VIEW_SET` items). These views require the module `Sidebar` and contextual toolbars (`ProjectsFilterBar`).
- **Global Account Views (Workspace-wide):** Views representing account, identity, and system-level configuration (`profile`, `users`). These views operate directly under root workspace scope without module nesting.

### 2. Hide Contextual Sidebar on Profile View while Retaining Global Rail
In `src/components/layout/Sidebar.tsx`:
- When `activeView === "profile"`, `Sidebar` immediately returns `null`.
- The persistent `GlobalRail` (52px dark vertical bar at the far left) **remains visible and interactive at all times**. This ensures the user is never trapped and can return to `Home`, `Calendar`, `AI`, or `Users` with a single click.
- The main stage (`<main id="workspace-main">`) naturally expands via `flex-1` across the viewport, providing a spacious, focused, distraction-free account workspace.

### 3. Direct Root-Level Breadcrumb Hierarchy
In `src/components/layout/TopNavBreadcrumbs.tsx`:
- When `activeView === "profile"`, render directly after the root brand anchor:
  ```
  Vrello / Profil & Keamanan Akun
  ```
- Omit the `Projects /` intermediate segment.
- Provide a clear "Kembali ke Workspace" (Back to Workspace) return shortcut button with an `ArrowLeft` icon that returns the user directly to their previous work item view (`lastTaskView` or `lastMarcomView`).

### 4. Restrict `ProjectsFilterBar` Exclusively to Work Item Views
In `src/components/layout/TopNav.tsx`:
- Condition `ProjectsFilterBar` rendering on:
  ```tsx
  {appMode === "tasks" && (activeView === "board" || activeView === "list" || activeView === "calendar") && <ProjectsFilterBar />}
  ```
- This guarantees `ProjectsFilterBar` never leaks into `profile`, `users`, or other non-work-item views.

### 5. State Preservation in `createUiSlice.ts`
In `src/lib/store/slices/createUiSlice.ts`:
- Navigating to `profile` via `setActiveView("profile")` must **not** overwrite `lastTaskView`.
- The user's active work item view (`board`, `list`, or `calendar`) is preserved so returning from Profile to Projects restores their exact previous screen.

---

## Consequences

### Positive
- **Correct Information Architecture:** Profile is clearly situated at the workspace root level, matching modern SaaS standards (Linear, GitHub, Notion, Slack).
- **Zero Context Bleed:** Eliminates the work-item filter bar and operational sidebar when editing account settings.
- **Enhanced Screen Geometry:** Form and security controls gain full horizontal breathing room without layout cramping.
- **Uncompromised Navigation Safety:** Retaining `GlobalRail` plus the new "Kembali ke Workspace" shortcut ensures frictionless return navigation.
- **Zero Extra Dependencies:** Pure frontend layout and state refinement; no new libraries or database schema changes.

### Negative / Trade-offs
- The sidebar transition when opening Profile is an instant conditional unmount. We will ensure this is clean and free of cumulative layout shift (CLS).

