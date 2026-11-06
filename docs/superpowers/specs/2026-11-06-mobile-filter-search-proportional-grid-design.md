# Technical Specification: Mobile Filter & Search Proportional Grid Layout

- **Date:** 2026-11-06
- **Status:** COMPLETE
- **Refs:** ADR-0060, ADR-0059
- **Target File:** `src/components/views/OutletsView/OutletsHeader.tsx`

---

## 1. Executive Summary

This specification governs the proportional responsive layout refactoring for the filter controls and search bar within the Outlets Directory header (`OutletsHeader.tsx`). On mobile smartphone screens (< 640px), the controls are re-architected into a 2-row layout: a symmetrical 50/50 2-column grid for the dropdowns on Row 1, and a full-width search and reset container on Row 2. On desktop viewports ($\ge 640\text{px}$), all controls revert to their canonical single-row horizontal inline arrangement with zero pixel deviation.

---

## 2. Problem Statement & User Experience Flow

### 2.1 Current Defect
- **Dropdowns on Mobile:** `CustomDropdown` instances for *All Branches* and *All Store Types* are constrained with fixed `w-36` (144px). On a 375px viewport, 144px + 144px + 8px gap = 296px, leaving ~47px of awkward, empty whitespace on the right margin.
- **Search Bar on Mobile:** The search container is constrained to `relative w-44` (176px). It wraps onto row 2, taking only half the screen width and leaving ~50% empty void space on the right.
- **Visual Asymmetry:** The controls appear pinched and unaligned with the surrounding full-width cards and tables.

### 2.2 Desired User Experience Flow
1. **Smartphone Viewport (< 640px):**
   - **Row 1:** User sees *All Branches* on the left (50% width) and *All Store Types* on the right (50% width), spanning edge-to-edge with an 8px gap. Tap targets are wide, comfortable, and balanced.
   - **Row 2:** User sees the search bar immediately below, stretching across 100% of the available width. If filters are active, the search bar flexibly yields space (`flex-1`) to the *Reset Filters* button (`shrink-0`) on the right.
2. **Desktop Viewport ($\ge 640\text{px}$):**
   - User sees the original inline layout: `[All Branches (176px)] [All Store Types (176px)] [Search input (208px)] [Reset Filters]`.
   - Desktop layout is 100% preserved.

---

## 3. Component Architecture & CSS Token Contracts

### 3.1 DOM Hierarchy Transformation in `OutletsHeader.tsx`

```tsx
{/* Filters & Search Wrapper */}
<div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto">
  {/* Mobile Row 1: Symmetrical 50/50 2-Column Grid */}
  <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center">
    <CustomDropdown
      value={selectedBranch}
      onChange={onBranchChange}
      options={[...]}
      ariaLabel="Filter by branch"
      searchPlaceholder="Cari cabang..."
      className="w-full sm:w-44 text-xs sm:text-sm"
    />

    <CustomDropdown
      value={selectedType}
      onChange={onTypeChange}
      options={[...]}
      ariaLabel="Filter by store type"
      searchPlaceholder="Cari tipe..."
      className="w-full sm:w-44 text-xs sm:text-sm"
    />
  </div>

  {/* Mobile Row 2: Full-Width Search & Reset Action */}
  <div className="flex items-center gap-2 w-full sm:w-auto">
    <div className="relative flex-1 sm:w-52 text-xs sm:text-sm">
      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        placeholder="Cari outlet, kota..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full h-8 sm:h-9 pl-9 pr-7 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-orange-500"
      />
      {searchQuery && (
        <button
          type="button"
          onClick={() => onSearchChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>

    {isFiltered && (
      <button
        type="button"
        onClick={onResetFilters}
        className="text-xs text-orange-600 hover:text-orange-700 dark:text-orange-400 underline font-medium cursor-pointer shrink-0"
      >
        Reset Filters
      </button>
    )}
  </div>
</div>
```

### 3.2 Token Mapping & Responsive Breakpoint Matrix

| Component / Container | Mobile Class (< 640px) | Desktop Class ($\ge 640\text{px}$) | Rationale |
| :--- | :--- | :--- | :--- |
| **Filters & Search Outer** | `flex flex-col items-stretch w-full` | `sm:flex-row sm:flex-wrap sm:items-center sm:w-auto` | Mobile stacks Row 1 & Row 2; desktop flows horizontally |
| **Dropdowns Wrapper** | `grid grid-cols-2 gap-2 w-full` | `sm:flex sm:items-center sm:w-auto` | 50/50 edge-to-edge columns on mobile; inline flex on desktop |
| **Branch Dropdown** | `w-full` | `sm:w-44` | Fills 1st column on mobile; fixed 176px on desktop |
| **Type Dropdown** | `w-full` | `sm:w-44` | Fills 2nd column on mobile; fixed 176px on desktop |
| **Search Row Wrapper** | `flex items-center gap-2 w-full` | `sm:w-auto` | Full width on mobile; auto width inline on desktop |
| **Search Input Box** | `relative flex-1` | `sm:w-52` | Stretches across mobile row; fixed 208px on desktop |
| **Reset Filters Button** | `shrink-0 text-xs` | `shrink-0 text-xs` | Stays beside search bar on both viewports |

---

## 4. Acceptance Criteria & Non-Goals

### 4.1 Acceptance Criteria
- [x] On mobile screens (< 640px), *All Branches* and *All Store Types* render in a 2-column grid (`grid-cols-2`), each taking exactly 50% of the container width without right-side blank gaps.
- [x] On mobile screens (< 640px), the search input box stretches across 100% of the available width on Row 2 (`flex-1 w-full`), leaving no unproportional empty dead space on the right.
- [x] When active filters are selected (`isFiltered === true`), the *Reset Filters* button sits cleanly to the right of the search input on Row 2 (`shrink-0`).
- [x] On desktop screens ($\ge 640\text{px}$), all controls align in a single horizontal row with exact dimensions `sm:w-44` (dropdowns) and `sm:w-52` (search bar).
- [x] Filter callbacks (`onBranchChange`, `onTypeChange`, `onSearchChange`, `onResetFilters`) remain 100% functional.
- [x] Coordinator line limits remain strictly $\le 250$ LOC (`OutletsHeader.tsx` line count monitored).
- [x] All unit tests in `src/components/views/OutletsView/outletsHeaderResponsiveness.test.ts` pass with 0 failures.

### 4.2 Non-Goals
- Modifying filter options, data fetching, or backend API query parameters.
- Changing dropdown behavior in modals, forms, or views other than `OutletsHeader.tsx`.
- Introducing new client-side state variables.

---

## 5. Verification Checklist

```bash
# 1. Targeted Unit Test
npx tsx --test src/components/views/OutletsView/outletsHeaderResponsiveness.test.ts

# 2. Architecture & Coordinator LOC Invariants
npm run drift:check

# 3. TypeScript Typecheck
npm run build:check

# 4. Smoke Test Suite
npm run test:smoke
```



