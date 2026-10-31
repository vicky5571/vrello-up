# Spec — MOUs View Unified Header Component

**Date:** 2026-10-31  
**Status:** DRAFT  
**Scope:** UI / Component Extraction & Modernization (`MousHeader.tsx` & `MousView.tsx`)  
**Target:** Standardize MOUs page header to match the established Marcom header architecture (OutletsHeader, DocumentsHeader, PlacementsHeader, EventsHeader).

---

## 1. Executive Summary

Every primary module in `vrello-up` (Outlets, Documents, Placements, Events, Reports, Analytics, Branches, Inventory) uses a dedicated, modern Header component featuring:
1. Title row with domain icon, counter badge, subtitle, and action buttons (Refresh, Export, New Entity).
2. KPI Summary Cards bar (`KpiSummaryCards`).
3. Search and filter toolbar with Framer Motion sliding pill status chips (`motion.div layoutId="activeMouStatusPill"`), dropdowns for Branch and MOU Type, and urgency filter chips (`Expiring Soon`, `Expired`).

Currently, `MousView.tsx` is the only view still embedding inline title, KPI bar, and filter bar directly into `MarcomTableShell`, inflating its file size to 417 LOC and creating visual inconsistency.

This feature extracts `MousHeader.tsx` into a modular, testable header component, incorporates Framer Motion active pill animations, stabilizes the layout, and reduces `MousView.tsx` complexity.

---

## 2. UX Flow & Visual Hierarchy

```
┌────────────────────────────────────────────────────────────────────────┐
│ [FileText] MOUs & Partnerships  [N MOUs]     [Refresh] [Export] [+ New]│
│ Pusat pengelolaan kontrak kemitraan outlet, komitmen branding...        │
├────────────────────────────────────────────────────────────────────────┤
│ [ Total MOUs ]   [ Active MOUs ]   [ Pending Value ]   [ Expiring Soon]│
├────────────────────────────────────────────────────────────────────────┤
│ [Search...]  Status: [All][Draft][Submitted][Approved][Done][Rejected] │
│              Branch: [All Branches ▾]  Type: [All Types ▾]              │
│              [Expiring Soon] [Expired]  [Reset Filters]                │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Title Row**:
   - Icon: `FileText` (fuchsia-500)
   - Title: "MOUs & Partnerships"
   - Counter Badge: `{totalMous} {totalMous === 1 ? "MOU" : "MOUs"}`
   - Action buttons: Refresh icon button, Export Center trigger button, and "+ New MOU" button (accessible to users with `canCreate`).
2. **KPI Summary Cards**:
   - 4-card horizontal bar calculated via `buildMouKpiItems(mous)` (Total MOUs, Active & Approved, Pending Value, Expiring / At-Risk).
3. **Filter & Search Bar**:
   - Instant search input with `Search` icon and clear `X` button.
   - Status chips: `All`, `Draft`, `Submitted`, `Approved`, `Done`, `Rejected` with animated background sliding pill (`layoutId="activeMouStatusPill"`, spring physics `type: "spring" as const, stiffness: 450, damping: 35`, and `useReducedMotion()`).
   - Branch Filter: `CustomDropdown` containing all active branches.
   - MOU Type Filter: `CustomDropdown` containing `Compensation`, `Exclusive Branding`, `Event Sponsorship`, `Space Rental`, `Joint Promotion`.
   - Urgency Filter Chips: `Expiring Soon` (amber) and `Expired` (rose).
   - Reset button: appears dynamically when any filter or search query is active.

---

## 3. Component Interface Contract (`MousHeader.tsx`)

```typescript
export interface BranchOption {
  id: string;
  name: string;
  code: string;
}

export interface MousHeaderProps {
  totalMous: number;
  kpiItems: KpiCardItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onExport: () => void;
  canCreate: boolean;
  onAddMou: () => void;
  // Search
  searchQuery: string;
  onSearchChange: (q: string) => void;
  // Filters
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  statusChips: { label: string; value: string }[];
  selectedBranchId: string;
  onBranchChange: (branchId: string) => void;
  branches: BranchOption[];
  selectedType: string;
  onTypeChange: (type: string) => void;
  urgencyFilter: "ALL" | "EXPIRING" | "EXPIRED";
  onUrgencyChange: (urgency: "ALL" | "EXPIRING" | "EXPIRED") => void;
  isFiltered: boolean;
  onResetFilters: () => void;
}
```

---

## 4. Acceptance Criteria

- [ ] `MousHeader.tsx` created in `src/components/views/MousView/` adhering to the design system tokens and glassmorphism styling (`bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm`).
- [ ] Status chips utilize Framer Motion fluid sliding pill animation with `layoutId="activeMouStatusPill"`, spring physics (`stiffness: 450, damping: 35`), tap feedback (`whileTap={{ scale: 0.95 }}`), and `useReducedMotion()` support.
- [ ] Search input with instant clear button integrated seamlessly.
- [ ] Branch dropdown, MOU Type dropdown, and Urgency chips work cohesively.
- [ ] `MousView.tsx` refactored to consume `MousHeader.tsx`.
- [ ] `MousView.tsx` LOC reduced significantly below 350 LOC.
- [ ] All verification gates pass: `npm run build:check`, `npm run drift:check`, `npm run test:smoke`, `npm test` with 0 failures.

---

## 5. Non-Goals

- Non-goal: Modifying table column definitions (`mouColumns.tsx`), detail drawer (`MouDetailDrawer.tsx`), or form modal (`MouFormModal.tsx`).
