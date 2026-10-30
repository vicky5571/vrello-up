# Design Spec: Sitewide Active Pills Animation

## Executive Summary
This specification defines the standardization of fluid sliding pill animations across all segmented controls, view mode switchers, tab toggles, and filter pills throughout the vrello-up application. Using Framer Motion's shared `layoutId`, `motion.div`, spring physics, and `useReducedMotion()`, this feature eliminates abrupt state changes and provides a unified, tactile, high-polish micro-interaction whenever a user switches views, tabs, or filter modes.

---

## Problem & Motivation
In multiple page headers and modal dialogs (including Documents, Outlets, Reports, Inventory, Analytics, Branches, Projects List, Help Docs, Settings, and Comboboxes), segmented controls and pill buttons switch active styling via conditional static CSS class toggles (`isSelected ? "bg-white text-emerald-600 shadow-2xs font-semibold" : "text-slate-500"`). While functional, the transition is abrupt (0ms instant color jump) compared to the polished sliding pill interaction in `ContentPlannerHeader` (`layoutId="activeContentPlannerViewPill"`), `PlacementFilterControls` (`layoutId="activePlacementViewPill"`), and `EventsHeader` (`layoutId="activeFieldEventsViewPill"`).

Standardizing animated pills across the application ensures:
1. **Visual Continuity**: The active pill slides seamlessly across sibling buttons via GPU-accelerated transforms.
2. **Tactile Feedback**: Subtle `whileTap={{ scale: 0.95 }}` tap gestures provide instant responsive feedback.
3. **Accessibility**: Full compliance with `prefers-reduced-motion` via `useReducedMotion()` from Framer Motion, instantly disabling sliding transforms when reduced motion is requested.
4. **Architectural Consistency**: Zero component regressions, preserving existing event handlers, keyboard navigation, and DOM structure.

---

## Scope & Inventory of Components

| Component | Pill Group | Items / Options | Motion `layoutId` |
|---|---|---|---|
| `DocumentsHeader.tsx` | View Mode Switcher | `Cards` \| `Table` (Matches user screenshot) | `activeDocumentsViewPill` |
| `DocumentsHeader.tsx` | Category Filter Chips | `Semua Dokumen` + Category List | `activeDocumentsCategoryPill` |
| `OutletsHeader.tsx` | View Mode Switcher | `Tabel Data` \| `Peta Sebaran` \| `Antrean Approval` | `activeOutletsViewPill` |
| `ReportsHeader.tsx` | Report Tab Switcher | `Laporan Bulanan` \| `Rekap POSM Kuartalan` | `activeReportsTabPill` |
| `InventoryHeaderKpis.tsx` | Catalog vs Borrow Tab | `Equipment Catalog` \| `Borrow Transactions` | `activeInventoryTabPill` |
| `InventoryHeaderKpis.tsx` | Catalog / Borrow View Mode | `Grid` \| `Table` / `Board` \| `Table` | `activeInventoryViewModePill` |
| `AnalyticsHeader.tsx` | Brand Toggle Pills | `Semua Brand` \| `IM3` \| `Tri (3)` | `activeAnalyticsBrandPill` |
| `BranchesHeader.tsx` | Status Filter Chips | `Semua Status` \| `Done` \| `In Progress` \| `Pending` | `activeBranchesStatusPill` |
| `ProjectsListHeader.tsx` | Group By Switcher | `type` \| `status` \| `branch` \| `pic` \| `none` | `activeProjectsGroupByPill` |
| `HelpDocsModal.tsx` | Help Tab Switcher | `Shortcuts` \| `Guides` | `activeHelpDocsTabPill` |
| `SettingsModal.tsx` | Settings Tab Switcher | `Backup & Data` \| `Appearance` | `activeSettingsTabPill` |
| `OutletSearchCombobox.tsx` | Brand Override Pills | `IM3` \| `3 / Tri` | `activeComboboxBrandPill` |

---

## Technical Specification & Interaction Patterns

### 1. Spring Physics Standard
All animated pills use the standardized spring physics already established in `ContentPlannerHeader` and `PlacementFilterControls`:
```tsx
const shouldReduceMotion = useReducedMotion();

const pillTransition = shouldReduceMotion
  ? { duration: 0 }
  : { type: "spring", stiffness: 450, damping: 35 };
```

### 2. DOM & Stacking Structure
To prevent z-index clipping and ensure text/icons remain crisp and visible above the sliding background pill:
```tsx
<div role="tablist" className="relative flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
  {OPTIONS.map((opt) => {
    const isActive = current === opt.id;
    return (
      <motion.button
        key={opt.id}
        type="button"
        role="tab"
        aria-selected={isActive}
        whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
        onClick={() => onChange(opt.id)}
        className={cn(
          "relative px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5",
          isActive
            ? "text-teal-600 dark:text-teal-400"
            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
        )}
      >
        {isActive && (
          <motion.div
            layoutId="activeDocumentsViewPill"
            className="absolute inset-0 bg-white dark:bg-slate-900 rounded-md shadow-2xs border border-slate-200/60 dark:border-slate-700/60"
            transition={pillTransition}
          />
        )}
        <span className="relative z-10 flex items-center gap-1.5">
          <opt.icon className="w-3.5 h-3.5" />
          <span>{opt.label}</span>
        </span>
      </motion.button>
    );
  })}
</div>
```

---

## Non-Goals
- Modifying underlying business logic, state machines, or URL query parameters.
- Re-architecting view coordinator components or altering API endpoints.
- Introducing external animation libraries (leveraging existing `framer-motion` package).

---

## Verification Checklist
- [ ] All 12 pill groups across 10 components render smoothly with sliding pill animations.
- [ ] No layout shift, flickering, or text clipping during animation.
- [ ] Reduced motion accessibility honored (`useReducedMotion`).
- [ ] Coordinator file sizes remain strictly $\le 250$ LOC.
- [ ] `npm run drift:check` passes with 0 drift detected.
- [ ] `npm run build:check` passes with 0 TypeScript errors.
- [ ] `npm test` passes all tests with 0 failures.
