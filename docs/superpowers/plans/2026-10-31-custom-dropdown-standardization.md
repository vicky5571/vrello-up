# Implementation Plan: CustomDropdown Component & Sitewide Dropdown Standardization

**Spec:** `docs/superpowers/specs/2026-10-31-custom-dropdown-standardization-design.md`  
**Date:** 2026-10-31  
**Author:** Critical Senior Software Engineer  

---

## 1. Overview & Phased Roadmap

This plan executes the replacement of unstyled native `<select>` dropdowns across the site with a modern, searchable, accessible `CustomDropdown` component.

### Phase 1: Core CustomDropdown Component
- Create `src/components/ui/CustomDropdown.tsx`.
- Support auto-search for lists $\ge 6$ options, keyboard navigation, checkmarks, badges, light-dismiss via `useDropdown`, and dark-mode styling.
- Create unit tests in `src/components/ui/CustomDropdown.test.ts`.

### Phase 2: Application across Site Headers & Filters
- **Phase 2.1**: Apply to `src/components/views/BranchesView/BranchesHeader.tsx` (Region dropdown).
- **Phase 2.2**: Apply to `src/components/views/OutletsView/OutletsHeader.tsx` (Branch & Store Type dropdowns).
- **Phase 2.3**: Apply to `src/components/views/AnalyticsView/AnalyticsHeader.tsx` (Branch & Quarter dropdowns).
- **Phase 2.4**: Apply to `src/components/views/PlacementsView/PlacementsHeader.tsx` (Branch, Type, Size dropdowns).
- **Phase 2.5**: Apply to `src/components/views/EventsView/EventsHeader.tsx` (Branch & Category dropdowns).
- **Phase 2.6**: Apply to `src/components/views/PipelineView/PipelineFilterBar.tsx` (Branch dropdown).
- **Phase 2.7**: Apply to `src/components/views/InventoryView/InventoryHeaderKpis.tsx` (Category dropdown).
- **Phase 2.8**: Apply to `src/components/views/MousView/MousView.tsx` (Branch & Status dropdowns).

### Phase 3: Verification & Invariant Gates
- [x] Run `npm run drift:check`
- [x] Run `npm run build:check`
- [x] Run `npm test`
- [x] Update `docs/SESSION_STATE.md`

---

## 2. File Manifest

| File | Action | LOC Impact |
|---|---|---|
| `docs/superpowers/specs/2026-10-31-custom-dropdown-standardization-design.md` | Create | ~75 LOC |
| `docs/superpowers/plans/2026-10-31-custom-dropdown-standardization.md` | Create | ~55 LOC |
| `src/components/ui/CustomDropdown.tsx` | Create | ~180 LOC |
| `src/components/ui/CustomDropdown.test.ts` | Create | ~90 LOC |
| `src/components/views/BranchesView/BranchesHeader.tsx` | Modify | ~-10 LOC |
| `src/components/views/OutletsView/OutletsHeader.tsx` | Modify | ~-15 LOC |
| `src/components/views/AnalyticsView/AnalyticsHeader.tsx` | Modify | ~-15 LOC |
| `src/components/views/PlacementsView/PlacementsHeader.tsx` | Modify | ~-20 LOC |
| `src/components/views/EventsView/EventsHeader.tsx` | Modify | ~-15 LOC |
| `src/components/views/PipelineView/PipelineFilterBar.tsx` | Modify | ~-10 LOC |
| `src/components/views/InventoryView/InventoryHeaderKpis.tsx` | Modify | ~-10 LOC |
| `src/components/views/MousView/MousView.tsx` | Modify | ~-15 LOC |
