# Implementation Plan: Swap Placement of Cards Row and Pills/Controls Row

**Spec:** `docs/superpowers/specs/2026-10-31-header-pills-cards-swap-design.md`  
**Date:** 2026-10-31  
**Author:** Critical Senior Software Engineer  

---

## 1. Roadmap

Swap the vertical placement of the KPI Cards row and the Controls/Pills buttons row across all standardized headers, stabilizing the pills button in a fixed position directly under the page title.

### Phase 1: Header Inversions
- [x] **Phase 1.1**: Update `src/components/views/BranchesView/BranchesHeader.tsx`
- [x] **Phase 1.2**: Update `src/components/views/ReportsView/ReportsHeader.tsx`
- [x] **Phase 1.3**: Update `src/components/views/OutletsView/OutletsHeader.tsx`
- [x] **Phase 1.4**: Update `src/components/views/DocumentsView/DocumentsHeader.tsx`
- [x] **Phase 1.5**: Update `src/components/views/InventoryView/InventoryHeaderKpis.tsx`
- [x] **Phase 1.6**: Update `src/components/views/PlacementsView/PlacementsHeader.tsx`
- [x] **Phase 1.7**: Update `src/components/views/EventsView/EventsHeader.tsx`
- [x] **Phase 1.8**: Update `src/components/views/AnalyticsView/AnalyticsHeader.tsx`

### Phase 2: Verification & Invariant Gates
- [x] Run `npm run drift:check`
- [x] Run `npm run build:check`
- [x] Run `npm test`
- [x] Update `docs/SESSION_STATE.md`
