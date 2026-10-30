# Implementation Plan: Placements Persistent Top Header & Static View Switcher

**Date:** 2026-10-31  
**Spec:** `docs/superpowers/specs/2026-10-31-placements-persistent-header-view-switcher-design.md`  
**Status:** Planned  

---

## 1. Overview & Strategy

Unify the top header and KPI summary bar of `PlacementsView.tsx` into a persistent, page-level scaffold across `Table`, `Map View`, and `Rekap Kuartal` modes. This eliminates layout shifts and anchors the view switcher pills at a constant position. We will also extract a dedicated `PlacementsHeader.tsx` atomic subcomponent to enforce the $\le 250$ LOC coordinator file limit (Strangler Pattern) and upgrade `PlacementViewSwitcher` with fluid Framer Motion sliding pill physics.

---

## 2. File Manifest & LOC Estimates

| File | Action | Purpose | LOC Est. |
|---|---|---|---|
| `src/components/views/PlacementsView/PlacementFilterControls.tsx` | Modify | Upgrade `PlacementViewSwitcher` with `framer-motion` `layoutId`, spring physics, and ARIA roles | ~35 LOC changed |
| `src/components/views/PlacementsView/PlacementsHeader.tsx` | Create | Extract persistent top header with title, view switcher, refresh, export, and add placement buttons | ~80 LOC |
| `src/components/views/PlacementsView/PlacementsMapTab.tsx` | Modify | Remove duplicate top header and duplicate KPI cards; render map filters and Leaflet map cleanly | -45 LOC |
| `src/components/views/PlacementsView/PlacementsRecapTab.tsx` | Modify | Remove duplicate top header; retain quarterly recap matrix and filters cleanly | -25 LOC |
| `src/components/views/PlacementsView/PlacementsView.tsx` | Modify | Mount persistent `PlacementsHeader` and `KpiSummaryCards` at top; stream content into clean sub-views; maintain $\le 250$ LOC | ~195 LOC (down from 227) |
| `docs/SESSION_STATE.md` | Modify | Track implementation and verification status | +15 LOC |

---

## 3. Phased Implementation Steps

### Phase 1: Framer Motion Sliding Pill Upgrade
- [ ] In `src/components/views/PlacementsView/PlacementFilterControls.tsx`:
  - Import `motion, useReducedMotion` from `framer-motion`.
  - Wrap buttons inside container with `role="tablist"` and `aria-label="Placements View Switcher"`.
  - Add `motion.div` with `layoutId="activePlacementViewPill"` inside active button.
  - Set spring physics (`stiffness: 450, damping: 35`) and `whileTap={{ scale: 0.95 }}`.
  - Elevate label and icon to `relative z-10`.

### Phase 2: Create Atomic Subcomponent `PlacementsHeader.tsx`
- [ ] Create `src/components/views/PlacementsView/PlacementsHeader.tsx`:
  - Render title (`Media Placements`), total record badge, and descriptive subtitle.
  - Render right-aligned action group: `PlacementViewSwitcher`, `RefreshCw` button, `Export` button, and `+ Add Placement` button.
  - Fully typed interface `PlacementsHeaderProps`.

### Phase 3: Clean Sub-views (`PlacementsMapTab.tsx` & `PlacementsRecapTab.tsx`)
- [ ] In `src/components/views/PlacementsView/PlacementsMapTab.tsx`:
  - Remove redundant top header card.
  - Remove redundant `<KpiSummaryCards />` invocation (now rendered once in parent).
  - Simplify props by removing `viewSwitcherControls`, `onRefresh`, `onExport`, `onAddPlacement`, `kpiItems`.
- [ ] In `src/components/views/PlacementsView/PlacementsRecapTab.tsx`:
  - Remove redundant top header card.
  - Simplify props by removing `viewSwitcherControls` and `onRefresh`.

### Phase 4: Coordinator Restructure (`PlacementsView.tsx`)
- [ ] In `src/components/views/PlacementsView/PlacementsView.tsx`:
  - Mount `<PlacementsHeader ... />` at the root top.
  - Mount persistent `<KpiSummaryCards items={kpiItems} />` immediately below header.
  - In `Table` view:
    - Pass `kpiBar={undefined}` to `MarcomTableShell`.
    - Clean up `headerExtra` in `MarcomTableShell` to only host `brandChips` (removing duplicate switcher & buttons).
  - In `Map` view:
    - Mount streamlined `<PlacementsMapTab ... />`.
  - In `Recap` view:
    - Mount streamlined `<PlacementsRecapTab ... />`.
  - Verify total LOC of `PlacementsView.tsx` remains $\le 250$ LOC.

### Phase 5: Verification Gates
- [ ] Run `npm run drift:check` (verify spec-plan pairing, coordinator file limits, single-tenant invariant).
- [ ] Run `npm run build:check` (verify 0 TypeScript compilation errors).
- [ ] Run `npm test` (verify 0 test failures across all 100 suites).
- [ ] Update `docs/SESSION_STATE.md`.

---

## 4. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| `MarcomTableShell` styling expecting `kpiBar` | Low | `kpiBar` is optional (`kpiBar?: React.ReactNode`). When omitted, `MarcomTableShell` cleanly renders toolbar and data grid without empty gaps. |
| Coordinator LOC exceeds 250 lines | Medium | Extracting `PlacementsHeader.tsx` reduces `PlacementsView.tsx` from 227 LOC to ~190 LOC, well below the 250 LOC threshold. |
| Layout jump on mobile devices | Low | `PlacementsHeader.tsx` uses responsive flex layout (`flex-col sm:flex-row sm:items-center justify-between gap-3`), ensuring controls wrap gracefully on smaller viewports. |

---

## 5. Dependencies

- `framer-motion` for shared layout pill sliding physics
- `lucide-react` icons (`ClipboardList`, `RefreshCw`, `Download`, `Plus`)
- `KpiSummaryCards` shared component
- Next.js / TypeScript strict build
