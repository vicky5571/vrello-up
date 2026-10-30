# Implementation Plan: Inventory-Style Header Standardization Across Marcom Views

**Spec:** `docs/superpowers/specs/2026-10-31-inventory-style-header-standardization-design.md`  
**Date:** 2026-10-31  
**Status:** Completed  

---

## Proposed Changes

### Phase 1: Media Placements Header Upgrade
- **`src/components/views/PlacementsView/PlacementsHeader.tsx`**:
  - Update container styling to `p-4 sm:p-6 pb-3 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm`.
  - Update Title row: inline icon (`MapPin className="w-5 h-5 text-emerald-500"`), bold title, badge, subtitle.
  - Standardize top-right buttons: Refresh (`p-2 border rounded-lg`), Export (`px-3.5 py-1.5 border rounded-lg text-xs font-semibold`), Add Placement (`px-3.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold`).
  - Integrate KPI cards (`KpiSummaryCards items={kpiItems}`) conditionally within header when `viewMode !== "map"`.
  - Position `PlacementViewSwitcher` at the bottom controls row before `border-b`.
- **`src/components/views/PlacementsView/PlacementsView.tsx`**:
  - Outer container: `flex flex-col h-full bg-[#FAFBFC] dark:bg-[#121316] overflow-y-auto`.
  - Content container: `p-4 sm:p-6 flex-1 min-h-0`.
  - Keep coordinator under 250 LOC.

### Phase 2: Content Planner Header Upgrade
- **`src/components/views/ContentPlannerView/ContentPlannerHeader.tsx`**:
  - Create atomic header component (LOC ~120).
  - Container styling: `p-4 sm:p-6 pb-3 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm`.
  - Row 1: Inline icon (`Sparkles text-pink-500`), Title, count badge, subtitle; Top-right actions: Refresh button (`p-2 border rounded-lg`), Schedule Post (`px-3.5 py-1.5 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg text-xs font-semibold`).
  - Row 2: KPI summary cards (`KpiSummaryCards items={kpiItems}`).
  - Row 3: Platform pills, Search input, and View mode switcher (Cards | Table) with animated sliding pills.
- **`src/components/views/ContentPlannerView/ContentPlannerView.tsx`**:
  - Outer container: `flex flex-col h-full bg-[#FAFBFC] dark:bg-[#121316] overflow-y-auto`.
  - Replace inline header with `<ContentPlannerHeader ... />`.
  - Content container: `p-4 sm:p-6 flex-1 min-h-0`.

### Phase 2.5: Field Events Header Upgrade
- **`src/components/views/EventsView/EventsHeader.tsx`**:
  - Update container styling to `p-4 sm:p-6 pb-2 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm`.
  - Row 1: Inline icon (`CalendarDays text-blue-500`), Title, count badge, subtitle; Top-right actions: Refresh button (`p-2 border rounded-lg`), `+ New Field Event` button (`px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold`).
  - Row 2: Integrated `KpiSummaryCards items={kpiItems}`.
  - Row 3: View mode switcher (Cards | Table | Calendar | Timeline) with animated sliding pill.
- **`src/components/views/EventsView/EventsView.tsx`**:
  - Outer container: `flex flex-col h-full bg-[#FAFBFC] dark:bg-[#121316] overflow-y-auto`.
  - Pass `kpiItems={kpis}` to `<EventsHeader />`.
  - Wrap content area in `<div className="p-4 sm:p-6 space-y-4 flex-1 min-h-0">`.

### Phase 2.6: Pipeline Header Upgrade
- **`src/components/views/PipelineView/PipelineView.tsx`**:
  - Outer container: `flex flex-col h-full bg-[#FAFBFC] dark:bg-[#121316] overflow-y-auto`.
  - Top header zone: `p-4 sm:p-6 pb-2 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm`.
  - Row 1: Inline icon (`Layers text-indigo-500`), Title `Pipeline Operasional Outlet`, badge `Cockpit 360°`, subtitle, and top-right Refresh button (`p-2 border rounded-lg`).
  - Row 2: `KpiSummaryCards items={kpiItems}` integrated in header.
  - Content container: `p-4 sm:p-6 space-y-4 flex-1 min-h-0` housing bottleneck alerts, filter bar, and matrix table.

### Phase 2.7: Analytics & ROI Header Upgrade
- **`src/components/views/AnalyticsView/AnalyticsHeader.tsx`**:
  - Create atomic header component (`p-4 sm:p-6 pb-3 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm`).
  - Row 1: Inline icon (`BarChart3 text-indigo-500`), Title `Operational Intelligence & ROI`, badge `Live Metrics`, subtitle, and top-right Refresh button (`p-2 border rounded-lg`).
  - Row 2: 4 KPI Cards (MOU SLA Turnaround, POSM Deployment Rate, Efisiensi Event Lapangan, Reliabilitas Konten Sosmed) with drill-down navigation and zero-CLS skeleton placeholders when loading.
  - Row 3: Integrated Filter Toolbar (Branch selector, Quarter selector, Brand toggle pills, Reset button).
- **`src/components/views/AnalyticsView/AnalyticsActionableStrip.tsx`**:
  - Extract the 3-card Actionable Telemetry Mini-Strip (Cost per Outlet realization, MOU Funnel conversion rate, Critical Content aging alerts) for the stage content area.
- **`src/components/views/AnalyticsView/AnalyticsSkeleton.tsx`**:
  - Update skeleton to mirror the stage area (Actionable Telemetry strip + 2×2 Chart Grid).
- **`src/components/views/AnalyticsView/AnalyticsView.tsx`**:
  - Outer container: `flex flex-col h-full bg-[#FAFBFC] dark:bg-[#121316] overflow-y-auto`.
  - Integrate `<AnalyticsHeader />` and `<AnalyticsActionableStrip />`.
  - Wrap chart area in responsive stage container `p-4 sm:p-6 flex-1 min-h-0 space-y-6`.

### Phase 2.8: Reports & Exports Header Upgrade
- **`src/components/views/ReportsView/ReportsHeader.tsx`**:
  - Create atomic header component (`p-4 sm:p-6 pb-3 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm`).
  - Row 1: Inline icon (`BarChart3 text-orange-500`), Title `Reports & Exports`, badge `Executive Archive`, subtitle, and top-right action buttons (Refresh, Export Center, 1-Click Executive PDF).
  - Row 2: 4 Embedded KPI Cards (`KpiSummaryCards items={kpiCards} skeletonCount={4}`).
  - Row 3: Tab switcher (Laporan Bulanan & Rekap POSM Kuartalan) and New Monthly Report button.
- **`src/components/views/ReportsView/ReportsView.tsx`**:
  - Outer container: `flex flex-col h-full bg-[#FAFBFC] dark:bg-[#121316] overflow-y-auto`.
  - Replace inline header with `<ReportsHeader ... />`.
  - Wrap content area in responsive stage container `p-4 sm:p-6 flex-1 min-h-0 space-y-4`.

### Phase 2.9: Documents & Asset Library Header Upgrade
- **`src/components/views/DocumentsView/DocumentsHeader.tsx`**:
  - Create atomic header component (`p-4 sm:p-6 pb-3 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm`).
  - Row 1: Inline icon (`Files text-teal-500`), Title `Documents & Asset Library`, count badge, subtitle, and top-right action buttons (Refresh, + Tambah Dokumen).
  - Row 2: 4 Embedded KPI Cards (`KpiSummaryCards items={kpiCards} skeletonCount={4}`).
  - Row 3: Category chips with count badges, search input, and view mode switcher (Cards | Table).
- **`src/components/views/DocumentsView/DocumentsView.tsx`**:
  - Outer container: `flex flex-col h-full bg-[#FAFBFC] dark:bg-[#121316] overflow-y-auto` (remove restrictive `max-w-7xl mx-auto`).
  - Replace inline header, KPI cards, and filter bar with `<DocumentsHeader ... />`.
  - Wrap content area in responsive stage container `p-4 sm:p-6 flex-1 min-h-0 space-y-4`.

### Phase 2.10: Outlets Directory Header Upgrade
- **`src/components/views/OutletsView/OutletsHeader.tsx`**:
  - Create atomic header component (`p-4 sm:p-6 pb-3 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm`).
  - Row 1: Inline icon (`Store text-orange-500`), Title `Outlets Directory`, count badge, subtitle, and top-right action buttons (Refresh, + Add Outlet / Ajukan Toko Baru).
  - Row 2: 5 Embedded KPI Cards (`KpiSummaryCards items={kpiItems} skeletonCount={5}`).
  - Row 3: View mode switcher (Tabel Data, Peta Sebaran, Antrean Approval with pending count badge), Branch selector, Store Type selector, Search input, and Reset Filters button.
- **`src/components/views/OutletsView/OutletsView.tsx`**:
  - Outer container: `flex flex-col h-full bg-[#FAFBFC] dark:bg-[#121316] overflow-y-auto`.
  - Replace inline header, floating KPI strip, and inline filterBar with `<OutletsHeader ... />`.
  - Wrap stage content area in responsive stage container `p-4 sm:p-6 flex-1 min-h-0 space-y-4`.

### Phase 3: Verification & Gate Checks
- [x] Run `npm run drift:check`
- [x] Run `npm run build:check`
- [x] Run `npm test`
- [x] Update `docs/SESSION_STATE.md`

---

## File Manifest

| File | Action | LOC Impact |
|---|---|---|
| `docs/superpowers/specs/2026-10-31-inventory-style-header-standardization-design.md` | Create / Modify | ~140 LOC |
| `docs/superpowers/plans/2026-10-31-inventory-style-header-standardization.md` | Create / Modify | ~135 LOC |
| `src/components/views/PlacementsView/PlacementsHeader.tsx` | Modify | ~110 LOC |
| `src/components/views/PlacementsView/PlacementsView.tsx` | Modify | ~210 LOC |
| `src/components/views/ContentPlannerView/ContentPlannerHeader.tsx` | Create | ~160 LOC |
| `src/components/views/ContentPlannerView/ContentPlannerView.tsx` | Modify | ~-120 LOC (reduction) |
| `src/components/views/EventsView/EventsHeader.tsx` | Create | ~130 LOC |
| `src/components/views/EventsView/EventsView.tsx` | Modify | ~200 LOC |
| `src/components/views/PipelineView/PipelineView.tsx` | Modify | ~220 LOC |
| `src/components/views/AnalyticsView/AnalyticsHeader.tsx` | Create | ~200 LOC |
| `src/components/views/AnalyticsView/AnalyticsActionableStrip.tsx` | Create | ~110 LOC |
| `src/components/views/AnalyticsView/AnalyticsView.tsx` | Modify | ~210 LOC |
| `src/components/views/ReportsView/ReportsHeader.tsx` | Create | ~160 LOC |
| `src/components/views/ReportsView/ReportsView.tsx` | Modify | ~210 LOC |
| `src/components/views/DocumentsView/DocumentsHeader.tsx` | Create | ~209 LOC |
| `src/components/views/DocumentsView/DocumentsView.tsx` | Modify | ~210 LOC |
| `src/components/views/OutletsView/OutletsHeader.tsx` | Create | ~190 LOC |
| `src/components/views/OutletsView/OutletsView.tsx` | Modify | ~-100 LOC (reduction) |
