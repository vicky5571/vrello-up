# Spec: Placements Persistent Top Header & Static View Switcher

**Spec ID:** `2026-10-31-placements-persistent-header-view-switcher`  
**Status:** Draft  
**Date:** 2026-10-31  
**Plan:** [docs/superpowers/plans/2026-10-31-placements-persistent-header-view-switcher.md](file:///Users/mac/Web%20Development/vrello-up/docs/superpowers/plans/2026-10-31-placements-persistent-header-view-switcher.md)  

---

## 1. Executive Summary

Resolves a critical UX disorientation flaw on the Media Placements page (`PlacementsView.tsx`) where the view mode toggle pills (`Table` vs `Map View` vs `Rekap Kuartal`) jump physically between Y ≈ 280px (below KPI cards in Table mode) and Y ≈ 160px (above KPI cards in Map and Recap modes).

By establishing a unified, persistent page-level header and persistent KPI summary bar across all three view modes, the view switcher pills, refresh button, export trigger, and primary action button (`+ Add Placement`) remain permanently anchored at the exact same coordinates. Furthermore, the active pill gains fluid Framer Motion sliding physics (`layoutId="activePlacementViewPill"`) matching the established standard in `ContentPlannerView` and `EventsView`.

---

## 2. Problem Statement & Root Cause

### 2.1 Problem Statement
When a user clicks "Map View" while on the "Table" view:
1. The toggle pills abruptly shift ~120px upwards, stranding the user's cursor over empty space.
2. The user must visually relocate the button and move their mouse to click back to "Table".
3. Upon clicking "Table", the pills jump ~120px back downwards below the KPI cards.
4. This violates **Fitts's Law**, **Spatial Consistency**, and **Jakob's Law** of user interface design.

### 2.2 Root Cause
- In `Table` view, `PlacementsView` renders `MarcomTableShell` with `kpiBar={<KpiSummaryCards />}` at the top, and places the view switcher inside `headerExtra` of the table toolbar (below the KPI cards).
- In `Map View` and `Rekap Kuartal`, `PlacementsMapTab` and `PlacementsRecapTab` each render an independent top banner card containing their own copy of the view switcher, placing KPI cards or controls below it.

---

## 3. Desired Architecture & Information Hierarchy

```
┌────────────────────────────────────────────────────────────────────────┐
│  [📋] Media Placements [6]                  [ Table | Map | Rekap ] [+]│  ← Unified Page Header (Fixed)
│  Visualisasi sebaran titik materi promosi di outlet lapangan           │
├────────────────────────────────────────────────────────────────────────┤
│  [ KPI 1: Budget ]  [ KPI 2: Selesai ]  [ KPI 3: Rasio ]  [ KPI 4 ]    │  ← Persistent KPI Bar (Fixed)
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │  ← Dynamic Content Stage
│  • Mode Table: Toolbar Filter Status/Brand + Data Table                │
│  • Mode Map: Filter Outlet/Brand + Peta Interaktif Leaflet             │
│  • Mode Rekap: Filter Kuartal/Cabang + Matriks POSM                    │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Persistent Header:** Top row containing page title, record count, subtitle, persistent `PlacementViewSwitcher`, `RefreshCw` button, `Export` button, and `+ Add Placement` button.
2. **Persistent KPI Bar:** 4 KPI Cards rendered immediately below the header for all 3 view modes.
3. **Dynamic Stage:**
   - **Table Mode:** `MarcomTableShell` renders without its own top header/KPI bar duplication, hosting brand chips, status filter chips, search input, and table rows.
   - **Map Mode:** `PlacementsMapTab` renders without duplicating the top header/KPI bar, hosting map-specific filters (brand chips, status chips, search input) and the Leaflet interactive map.
   - **Recap Mode:** `PlacementsRecapTab` renders without duplicating the top header, hosting quarter/branch controls and the POSM quarterly distribution matrix.

---

## 4. Component Changes & Contracts

### 4.1 `PlacementViewSwitcher` (`PlacementFilterControls.tsx`)
- Wrap buttons in `role="tablist"` and `role="tab"` with `aria-selected`.
- Add Framer Motion `motion.div` with `layoutId="activePlacementViewPill"`.
- Configure spring physics (`stiffness: 450, damping: 35`).
- Add `useReducedMotion()` fallback and `whileTap={{ scale: 0.95 }}` micro-interaction.

### 4.2 `PlacementsHeader` (`PlacementsHeader.tsx` or inline in `PlacementsView.tsx`)
- Extract a clean subcomponent to guarantee `PlacementsView.tsx` stays strictly under 250 LOC (architectural invariant).
- Props contract:
  ```ts
  export interface PlacementsHeaderProps {
    totalPlacements: number;
    viewMode: "table" | "map" | "recap";
    onViewModeChange: (mode: "table" | "map" | "recap") => void;
    isLoading: boolean;
    onRefresh: () => void;
    onExport: () => void;
    canManage: boolean;
    onAddPlacement: () => void;
  }
  ```

### 4.3 Sub-view Cleanups (`PlacementsMapTab.tsx` & `PlacementsRecapTab.tsx`)
- Remove redundant duplicate header banners.
- Remove redundant duplicate KPI card invocations.
- Retain full filter capabilities and map/matrix workflows intact.

---

## 5. Acceptance Criteria

1. **Zero Spatial Jump:** Switching between `Table`, `Map View`, and `Rekap Kuartal` preserves the exact pixel coordinates of the view switcher pills (0px layout jump).
2. **Smooth Pill Animation:** The active white indicator pill glides smoothly between tabs using Framer Motion layoutId spring physics.
3. **Accessibility:** Screen readers receive proper tablist/tab semantics; users with `prefers-reduced-motion` experience instant transition without animation.
4. **Action Persistence:** `Refresh`, `Export`, and `Add Placement` buttons are accessible and anchored at the top right in all view modes.
5. **Architectural Invariants:**
   - `PlacementsView.tsx` and all coordinator files remain $\le 250$ LOC.
   - Single-tenant invariant preserved (0 `workspaceId`).
   - SSOT types imported exclusively from `src/types/index.ts`.
   - `npm run drift:check`, `npm run build:check`, and `npm test` all pass with 0 errors/failures.

---

## 6. Non-Goals

- Changing map pin rendering or Leaflet clustering logic.
- Altering placement domain models, Prisma schema, or API route endpoints.
- Modifying bulk action bar functionality on table selection.
