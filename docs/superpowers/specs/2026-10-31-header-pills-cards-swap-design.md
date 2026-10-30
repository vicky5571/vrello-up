# Design Spec: Header Layout Invariant — Static Controls Row Above KPI Cards

**Date:** 2026-10-31  
**Author:** Critical Senior Software Engineer  
**Status:** Approved  
**Affected Files:**
- `src/components/views/BranchesView/BranchesHeader.tsx`
- `src/components/views/OutletsView/OutletsHeader.tsx`
- `src/components/views/DocumentsView/DocumentsHeader.tsx`
- `src/components/views/ReportsView/ReportsHeader.tsx`
- `src/components/views/InventoryView/InventoryHeaderKpis.tsx`
- `src/components/views/PlacementsView/PlacementsHeader.tsx`
- `src/components/views/EventsView/EventsHeader.tsx`
- `src/components/views/AnalyticsView/AnalyticsHeader.tsx`

---

## 1. Problem Statement & UX Defect

In the previous header arrangement, the visual hierarchy was:
1. **Title Row**: Title, icon, record count badge, action buttons.
2. **KPI Cards Row**: 4 or 5 summary metric cards (`KpiSummaryCards`).
3. **Controls Row**: View mode pills, tab switchers, status filter pills, search bar, and dropdowns.

### The UX Breakdown:
1. **Cumulative Layout Shift (CLS) on Interactive Tabs**:
   - In `ReportsHeader`, switching from "Laporan Bulanan" to "Rekap POSM Kuartalan" hides the KPI cards. Because the tab switcher pills were located *below* the cards, the tab switcher jumped upwards by ~110px. When clicking back, it jumped downwards by ~110px.
   - In `PlacementsHeader`, switching to "Peta Sebaran" conditionally hides KPI cards, causing the `PlacementViewSwitcher` pills to jump violently under the user's cursor.
2. **Dynamic Height Push on Loading & Responsive Breakpoints**:
   - When cards load (`isLoading={true}` -> `false`), wrap from 4 columns to 2x2 on tablet/mobile, or render dynamic badge values, the entire controls row was pushed downward. Users trying to click a status filter pill (e.g. "Semua Status", "Done", "Pending") experienced displaced targets.

---

## 2. Invariant Architecture: Controls Row Above KPI Cards

The inverted header structure permanently stabilizes the controls row:

```
┌────────────────────────────────────────────────────────────────────────┐
│ [Icon] Page Title  [Count Badge]                   [Refresh] [+ Action]│
├────────────────────────────────────────────────────────────────────────┤
│ [Pill 1] [Pill 2] [Pill 3]   [CustomDropdown] [🔍 Search            ] │ <- Fixed Y-Position
├────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│ │ KPI Card 1   │ │ KPI Card 2   │ │ KPI Card 3   │ │ KPI Card 4   │    │ <- Dynamic / Contextual
│ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘    │
└────────────────────────────────────────────────────────────────────────┘
```

### Key Principles:
1. **Zero Layout Shift on Controls**:
   - The pills button and filter toolbar are anchored directly beneath the page title row. Their vertical coordinate ($Y$) is 100% deterministic and unaffected by metric loading states, card visibility, or responsive metric grid reflows.
2. **Analytical Flow**:
   - Filter selection (Controls Row) immediately precedes metric calculation (Cards Row), which in turn immediately precedes domain records (Table Shell / Data Stage below header border).
3. **Consistent Spacing**:
   - Maintain `space-y-4` in header wrapper, with `pt-1` or subtle gap between controls row and cards row.

---

## 3. Verification Checklist

- [ ] `BranchesHeader.tsx`: Status pills + search placed as Row 2, KPI cards as Row 3
- [ ] `OutletsHeader.tsx`: View switcher + search placed as Row 2, KPI cards as Row 3
- [ ] `DocumentsHeader.tsx`: Category filter pills + search placed as Row 2, KPI cards as Row 3
- [ ] `ReportsHeader.tsx`: Tab switcher placed as Row 2, KPI cards as Row 3
- [ ] `InventoryHeaderKpis.tsx`: Tab switcher placed as Row 2, KPI cards as Row 3
- [ ] `PlacementsHeader.tsx`: PlacementViewSwitcher placed as Row 2, KPI cards as Row 3
- [ ] `EventsHeader.tsx`: View switcher placed as Row 2, KPI cards as Row 3
- [ ] `AnalyticsHeader.tsx`: Filter toolbar placed as Row 2, KPI cards as Row 3
- [ ] Verification gates pass: `drift:check`, `build:check`, and `npm test`
