# Design Spec: Mobile Bottom Navigation — Replace Home with Pipeline & Status

- **Status:** APPROVED
- **Date:** 2026-11-07
- **Author:** Senior Software Engineer
- **ADR Reference:** `docs/adr/0066-mobile-bottom-nav-replace-home-with-pipeline.md`

## 1. Executive Summary & Problem Context

On mobile screen viewports (< 768px), *vrello-up* relies on `MobileBottomNav.tsx` as the primary navigation bar. Currently, Slot 1 is allocated to `Home` (`view: "home"`), which redundantly opens the generic Tasks Kanban board (`KanbanBoard.tsx`). Meanwhile, the retail partnership pipeline (`view: "pipeline"`) is one of the highest-frequency operational modules utilized by field staff, but currently requires opening the side drawer menu to access.

This specification details replacing the `Home` tab with a dedicated `Pipeline` tab in Slot 1 of `MobileBottomNav.tsx`, creating an ergonomic, 100% Marcom operational bottom bar (`Pipeline`, `Outlets`, `Placements`, `Events`, `Menu`) while maintaining desktop isolation and strict coordinator file limits.

## 2. Component Contract & Tab Definition

### 2.1 File: `src/components/layout/MobileBottomNav.tsx`

Import replacement:
- Replace `Home` import from `lucide-react` with `Layers`.
- Maintain `Store`, `MapPin`, `CalendarDays`, `Menu` imports.

Tab array definition (`BOTTOM_TABS`):
```tsx
const BOTTOM_TABS: BottomTabItem[] = [
  {
    id: "pipeline",
    label: "Pipeline",
    icon: Layers,
    activeColor: "text-indigo-500 dark:text-indigo-400",
    isActive: (view, isSidebarOpen) => !isSidebarOpen && view === "pipeline",
    onClick: ({ setActiveView, setAppMode }) => {
      setAppMode("marcom");
      setActiveView("pipeline");
    },
  },
  {
    id: "outlets",
    label: "Outlets",
    icon: Store,
    activeColor: "text-violet-500 dark:text-violet-400",
    isActive: (view, isSidebarOpen) => !isSidebarOpen && view === "outlets",
    onClick: ({ setActiveView, setAppMode }) => {
      setAppMode("marcom");
      setActiveView("outlets");
    },
  },
  {
    id: "placements",
    label: "Placements",
    icon: MapPin,
    activeColor: "text-emerald-500 dark:text-emerald-400",
    isActive: (view, isSidebarOpen) => !isSidebarOpen && view === "placements",
    onClick: ({ setActiveView, setAppMode }) => {
      setAppMode("marcom");
      setActiveView("placements");
    },
  },
  {
    id: "events",
    label: "Events",
    icon: CalendarDays,
    activeColor: "text-blue-500 dark:text-blue-400",
    isActive: (view, isSidebarOpen) => !isSidebarOpen && view === "events",
    onClick: ({ setActiveView, setAppMode }) => {
      setAppMode("marcom");
      setActiveView("events");
    },
  },
  {
    id: "menu",
    label: "Menu",
    icon: Menu,
    activeColor: "text-amber-500 dark:text-amber-400",
    isActive: (_view, isSidebarOpen) => isSidebarOpen,
    onClick: ({ toggleSidebar }) => toggleSidebar(),
  },
];
```

### 2.2 Visual Hierarchy & Styling Guarantees
1. **Label Width & Balance:** Label `"Pipeline"` is 8 characters long, fitting comfortably into the 20% column width of the 5-tab flex layout without truncation.
2. **Icon & Accent Color:** `Layers` icon styled with `text-indigo-500 dark:text-indigo-400`, perfectly aligned with `MARCOM_WORK_ITEMS` in `src/components/layout/navConfig.ts`.
3. **Sliding Indicator Pill:** Active indicator continues using `layoutId="activeMobileBottomTab"` with smooth spring motion and reduced-motion guard.

## 3. Invariants & Guardrails

1. **Desktop Invariant:** Desktop rail navigation (`src/components/layout/GlobalRail.tsx`) and desktop sidebar navigation (`src/components/layout/Sidebar.tsx`) are completely unaffected.
2. **Coordinator Size Invariant:** `MobileBottomNav.tsx` remains <= 150 LOC (currently 144 LOC).
3. **AppMode Invariant:** Selecting `Pipeline` automatically updates `appMode` to `"marcom"`, ensuring downstream active views and filters operate in the Marcom context.

## 4. Non-Goals

- No modification to `Sidebar.tsx` or `GlobalRail.tsx`.
- No modification to `PipelineView.tsx` internals or API endpoints.
- No changes to tabs 2–5 (`Outlets`, `Placements`, `Events`, `Menu`).

## 5. Test & Verification Plan

### 5.1 Unit Tests (`src/components/layout/MobileBottomNav.test.ts`)
- Update canonical 5-tab assertion:
  - `assert.ok(bottomNavContent.includes("Pipeline"), "Must include Pipeline tab");`
  - Replaces `assert.ok(bottomNavContent.includes("Home"), ...)`
  - Keep assertions for `Outlets`, `Placements`, `Events`, `Menu`.
- LOC assertion verification (must remain <= 150 LOC).

### 5.2 Verification Gates
- `npm run drift:check`: 0 drift, 100% spec-plan pairing.
- `npm run build:check`: `tsc --noEmit` 0 errors.
- `npm run test:smoke`: 150/150 smoke tests passing.
- `npm test`: 100% test suite passing.



