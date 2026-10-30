# Spec: Rename Work Item Board and Board to Kanban Board

**Date:** 2026-10-30  
**Status:** Proposed  
**Related Specs:** `docs/superpowers/specs/2026-10-30-projects-work-item-detail-drawers-design.md`, `docs/superpowers/specs/2026-10-31-remove-gantt-design.md`  

---

## 1. Executive Summary

In Vrello, the primary visual task and activity management surface has been referred to interchangeably as "Work Items Board", "Board", "Kanban View", and "Kanban Drag & Drop Board". This inconsistent terminology creates friction in navigation, user documentation, and command palette discovery.

This specification standardizes the name to **"Kanban Board"** across all user-facing interfaces while preserving the underlying technical identifier (`id: "board"`, `ViewMode: "board"`) to avoid breaking database preferences, existing URLs, and routing state. It also adds URL parameter alias support for `?view=kanban` and `?view=kanban-board`.

---

## 2. UX Flow & Terminology Contracts

### 2.1 Standardized User-Facing Copy
- **Projects Board Heading (`ProjectsBoardView.tsx`):**
  - Previous: `Work Items Board`
  - New: `Kanban Board`
- **Sidebar Navigation (`navConfig.ts` $\rightarrow$ `Sidebar.tsx`):**
  - Previous: `Board`
  - New: `Kanban Board`
- **Breadcrumbs Trail (`TopNavBreadcrumbs.tsx`):**
  - Previous: `Projects / Board`
  - New: `Projects / Kanban Board`
- **Command Palette (`CommandPalette.tsx`):**
  - Previous: `Switch to Kanban View`
  - New: `Switch to Kanban Board`
- **More Apps Modal (`MoreAppsMenu.tsx`):**
  - Previous: `Board`
  - New: `Kanban Board`
- **Keyboard Shortcuts & Help Modal (`HelpDocsModal.tsx`):**
  - Previous: `Quick Switch Views (List, Board, Calendar)`
  - New: `Quick Switch Views (List, Kanban Board, Calendar)`
- **Export Center & Modal Copy (`ExportCenter.tsx`, `AuthBrandPanel.tsx`, `ContentDrawer.tsx`):**
  - References to "Board" in task/project views are updated to "Kanban Board".

### 2.2 Deep-Link and Routing Invariants
- `ViewMode` union in `src/types/index.ts` remains `"board" | "list" | "calendar" | ...`.
- Store state `activeView` remains `"board"`.
- `parseUrlNavState` in `src/lib/router/urlState.ts` normalizes incoming `?view=kanban` and `?view=kanban-board` queries to `"board"`.

---

## 3. Architecture & Impact Surface

```
src/
├── lib/
│   └── router/
│       ├── urlState.ts                    ← Add alias normalization for "kanban" and "kanban-board"
│       └── urlState.test.ts               ← Unit tests for alias normalization
├── components/
│   ├── layout/
│   │   ├── navConfig.ts                   ← Label: "Kanban Board"
│   │   ├── topNavConstants.ts             ← Add PROJECTS_VIEW_LABELS (board -> "Kanban Board")
│   │   ├── TopNavBreadcrumbs.tsx          ← Render "Kanban Board" for activeView === "board"
│   │   ├── CommandPalette.tsx             ← Name: "Kanban Board"
│   │   └── ExportCenter.tsx               ← Copy updates
│   ├── modals/
│   │   ├── MoreAppsMenu.tsx               ← Button label: "Kanban Board"
│   │   └── HelpDocsModal.tsx              ← Shortcut text updates
│   ├── auth/
│   │   └── AuthBrandPanel.tsx             ← Marketing subtitle update
│   └── views/
│       ├── ProjectsView/
│       │   └── ProjectsBoardView.tsx      ← Header: "Kanban Board"
│       └── ContentPlannerView/
│           └── ContentDrawer.tsx          ← Button text update
```

---

## 4. Invariants & Non-Goals

### 4.1 Invariants Enforced
- **Zero Breaking Changes to Persistent State:** The `projectsBoardOrder` key in `ViewPreferences` and `activeView: "board"` in `useWorkspaceStore` remain unchanged.
- **Coordinator LOC Limits:** All modified coordinators must stay $\le 250$ LOC (`ProjectsBoardView.tsx` $\le 190$ LOC, `Sidebar.tsx` $\le 230$ LOC, `TopNavBreadcrumbs.tsx` $\le 140$ LOC).
- **Verification Gates:** `npm run drift:check`, `npm run build:check`, and `npm test` must pass with 0 errors.

### 4.2 Non-Goals
- Renaming internal TypeScript types or interface properties (`ViewMode`, `projectsBoardOrder`, `ProjectsBoardViewProps`).
- Renaming file paths (`ProjectsBoardView.tsx`, `useProjectsBoard.ts`).

---

## 5. Verification Checklist

- [ ] Projects Board view displays `Kanban Board` as primary heading.
- [ ] Sidebar Work Item Views section displays `Kanban Board`.
- [ ] Top breadcrumbs trail displays `Projects / Kanban Board`.
- [ ] Command Palette fuzzy search matches `Kanban Board` and switches to `"board"`.
- [ ] More Apps Menu quick views grid displays `Kanban Board`.
- [ ] Keyboard shortcuts modal displays `List, Kanban Board, Calendar`.
- [ ] Navigating to `?view=kanban` or `?view=kanban-board` resolves to `view: "board"`.
- [ ] `npm run drift:check` passes with zero violations.
- [ ] `npm run build:check` passes with zero errors.
- [ ] `npm test` passes with zero failures.
