# Implementation Plan: Z-Index Stacking Context Standardization & Table Shell Isolation

- **Date:** 2026-11-05
- **Status:** COMPLETE
- **Related Spec:** [docs/superpowers/specs/2026-11-05-z-index-stacking-context-standardization-design.md](../specs/2026-11-05-z-index-stacking-context-standardization-design.md)
- **Related ADR:** [docs/adr/0039-z-index-stacking-context-standardization.md](../../adr/0039-z-index-stacking-context-standardization.md)

---

## 1. Executive Summary

Standardize the application-wide Z-Index and CSS Stacking Context hierarchy to prevent sticky table headers (`"Dokumen MOU"`) and cell elements (`"Dokumen PDF"`) from clipping or occluding opened `CustomDropdown` filter menus. Enforce CSS stacking isolation on `MarcomTableShell` (`isolation: isolate`), elevate active dropdowns to Layer 50 (`z-50`), coordinate Marcom view headers to Layer 30 (`z-30`), and set global navigation to Layer 40 (`z-40`).

---

## 2. File Manifest & Estimated Surface Area

| Action | File Path | Estimated LOC | Responsibility |
| :--- | :--- | :--- | :--- |
| **Modify** | `docs/architecture-system-invariants.md` | +25 LOC | Document the Canonical 7-Layer Z-Index Hierarchy SSOT contract |
| **Create** | `src/components/ui/customDropdownZIndex.test.ts` | ~60 LOC | Automated unit tests asserting z-index & isolation invariants |
| **Modify** | `src/components/views/shared/MarcomTableShell.tsx` | +1 / -1 LOC | Add `isolate` to root container |
| **Modify** | `src/components/ui/CustomDropdown.tsx` | +1 / -1 LOC | Change active container from `z-30` to `z-50` when `isOpen` |
| **Modify** | `src/components/views/MousView/MousView.tsx` | +1 / -1 LOC | Add `isolate` to main table content container |
| **Modify** | `src/components/views/MousView/MousHeader.tsx` | +1 / -1 LOC | Update from `relative z-20` to `relative z-30` |
| **Modify** | `src/components/views/OutletsView/OutletsHeader.tsx` | +1 / -1 LOC | Update from `relative z-20` to `relative z-30` |
| **Modify** | `src/components/views/BranchesView/BranchesHeader.tsx` | +1 / -1 LOC | Update from `relative z-20` to `relative z-30` |
| **Modify** | `src/components/views/DocumentsView/DocumentsHeader.tsx` | +1 / -1 LOC | Update from `relative z-20` to `relative z-30` |
| **Modify** | `src/components/views/EventsView/EventsHeader.tsx` | +1 / -1 LOC | Update from `relative z-20` to `relative z-30` |
| **Modify** | `src/components/views/ReportsView/ReportsHeader.tsx` | +1 / -1 LOC | Update from `relative z-20` to `relative z-30` |
| **Modify** | `src/components/views/AnalyticsView/AnalyticsHeader.tsx` | +1 / -1 LOC | Update from `relative z-20` to `relative z-30` |
| **Modify** | `src/components/views/InventoryView/InventoryHeaderKpis.tsx` | +1 / -1 LOC | Update from `relative z-20` to `relative z-30` |
| **Modify** | `src/components/views/UsersView/UsersHeader.tsx` | +1 / -1 LOC | Update from `relative z-20` to `relative z-30` |
| **Modify** | `src/components/views/ProfileView/ProfileHeader.tsx` | +1 / -1 LOC | Update from `relative z-20` to `relative z-30` |
| **Modify** | `src/components/layout/ProjectsFilterBar.tsx` | +1 / -1 LOC | Update from `relative z-20` to `relative z-30` |
| **Modify** | `src/components/views/PipelineView/PipelineFilterBar.tsx` | +1 / -1 LOC | Update from `relative z-20` to `relative z-30` |
| **Modify** | `src/components/layout/TopNav.tsx` | +1 / -1 LOC | Update from `relative z-30` to `relative z-40` |

---

## 3. Phased Implementation Roadmap

### Phase 1: Architecture Invariant Documentation & TDD Red Gate
- [x] **Task 1.1:** Add the Canonical 7-Layer Z-Index Stacking Hierarchy table to `docs/architecture-system-invariants.md`.
- [x] **Task 1.2:** Create `src/components/ui/customDropdownZIndex.test.ts` asserting:
  - `CustomDropdown.tsx` uses `isOpen ? "z-50" : "z-auto"`.
  - `MarcomTableShell.tsx` includes `"isolate"`.
  - `MousHeader.tsx` includes `"relative z-30"`.
  - `TopNav.tsx` includes `"relative z-40"`.
- [x] **Task 1.3:** Run test `node --test --import ./test/register-alias.mjs src/components/ui/customDropdownZIndex.test.ts` and confirm failure (Red Phase).

### Phase 2: Core Stacking Isolation & Dropdown Elevation
- [x] **Task 2.1:** Modify `src/components/views/shared/MarcomTableShell.tsx`:
  - Add `isolate` to root container `className={cn("w-full isolate", ...)}`.
- [x] **Task 2.2:** Modify `src/components/ui/CustomDropdown.tsx`:
  - Change line 184: `isOpen ? "z-30" : "z-auto"` $\rightarrow$ `isOpen ? "z-50" : "z-auto"`.
- [x] **Task 2.3:** Modify `src/components/views/MousView/MousView.tsx`:
  - Add `isolate` to the main table content container `<div className="p-4 sm:p-6 flex-1 min-h-0 space-y-4 isolate">`.

### Phase 3: Marcom Headers Standardization & TopNav Coordination
- [x] **Task 3.1:** Update all Marcom headers from `relative z-20` to `relative z-30`:
  - `src/components/views/MousView/MousHeader.tsx`
  - `src/components/views/OutletsView/OutletsHeader.tsx`
  - `src/components/views/BranchesView/BranchesHeader.tsx`
  - `src/components/views/DocumentsView/DocumentsHeader.tsx`
  - `src/components/views/EventsView/EventsHeader.tsx`
  - `src/components/views/ReportsView/ReportsHeader.tsx`
  - `src/components/views/AnalyticsView/AnalyticsHeader.tsx`
  - `src/components/views/InventoryView/InventoryHeaderKpis.tsx`
  - `src/components/views/UsersView/UsersHeader.tsx`
  - `src/components/views/ProfileView/ProfileHeader.tsx`
  - `src/components/layout/ProjectsFilterBar.tsx`
  - `src/components/views/PipelineView/PipelineFilterBar.tsx`
- [x] **Task 3.2:** Update `src/components/layout/TopNav.tsx` from `relative z-30` to `relative z-40`.

### Phase 4: Non-Negotiable Verification & Handover
- [x] **Task 4.1:** Run `node --test --import ./test/register-alias.mjs src/components/ui/customDropdownZIndex.test.ts` and verify 100% pass (Green Phase).
- [x] **Task 4.2:** Run `npm run drift:check` and verify `✅ No drift detected`.
- [x] **Task 4.3:** Run `npm test` and verify all 817+ tests pass.
- [x] **Task 4.4:** Run `npm run build:check` and verify 0 TypeScript/Next.js errors.
- [x] **Task 4.5:** Update `docs/SESSION_STATE.md` with completed feature details.


