# Implementation Plan: Sitewide Active Pills Animation

Spec: `docs/superpowers/specs/2026-10-31-sitewide-active-pills-animation-design.md`

## Overview
Implement Framer Motion `layoutId` animated sliding pills across all segmented controls and pill button groups identified across the vrello-up codebase.

---

## Phased Execution

### Phase 1: DocumentsView Header Animated Pills
- [ ] Upgrade View Mode Switcher (`Cards` | `Table`) in `src/components/views/DocumentsView/DocumentsHeader.tsx` with `layoutId="activeDocumentsViewPill"`.
- [ ] Upgrade Category Filter Chips in `src/components/views/DocumentsView/DocumentsHeader.tsx` with `layoutId="activeDocumentsCategoryPill"`.

### Phase 2: OutletsView & ReportsView Header Animated Pills
- [ ] Upgrade View Mode Switcher (`Tabel Data` | `Peta Sebaran` | `Antrean Approval`) in `src/components/views/OutletsView/OutletsHeader.tsx` with `layoutId="activeOutletsViewPill"`.
- [ ] Upgrade Tab Switcher (`Laporan Bulanan` | `Rekap POSM Kuartalan`) in `src/components/views/ReportsView/ReportsHeader.tsx` with `layoutId="activeReportsTabPill"`.

### Phase 3: InventoryView & AnalyticsView Header Animated Pills
- [ ] Upgrade Catalog vs Borrow Tab Switcher (`Equipment Catalog` | `Borrow Transactions`) in `src/components/views/InventoryView/InventoryHeaderKpis.tsx` with `layoutId="activeInventoryTabPill"`.
- [ ] Upgrade Catalog & Borrow View Mode Switchers in `src/components/views/InventoryView/InventoryHeaderKpis.tsx` with `layoutId="activeInventoryViewModePill"`.
- [ ] Upgrade Brand Toggle Pills (`Semua Brand` | `IM3` | `Tri (3)`) in `src/components/views/AnalyticsView/AnalyticsHeader.tsx` with `layoutId="activeAnalyticsBrandPill"`.

### Phase 4: BranchesView & ProjectsView Animated Pills
- [ ] Upgrade Status Filter Chips (`Semua Status` | `Done` | `In Progress` | `Pending`) in `src/components/views/BranchesView/BranchesHeader.tsx` with `layoutId="activeBranchesStatusPill"`.
- [ ] Upgrade Group By Switcher in `src/components/views/ProjectsView/ProjectsListHeader.tsx` with `layoutId="activeProjectsGroupByPill"`.

### Phase 5: Modals & Comboboxes Animated Pills
- [ ] Upgrade Help Tab Switcher (`Shortcuts` | `Guides`) in `src/components/modals/HelpDocsModal.tsx` with `layoutId="activeHelpDocsTabPill"`.
- [ ] Upgrade Settings Tab Switcher (`Backup & Data` | `Appearance`) in `src/components/modals/SettingsModal.tsx` with `layoutId="activeSettingsTabPill"`.
- [ ] Upgrade Brand Override Pills in `src/components/views/PlacementsView/OutletSearchCombobox.tsx` with `layoutId="activeComboboxBrandPill"`.

### Phase 6: Verification & Review Gates
- [ ] Run `npm run drift:check`
- [ ] Run `npm run build:check`
- [ ] Run `npm test`
- [ ] Verify 0 regressions, all tests passing
