# Specification: Mobile Analytics ROI Header Layout and Horizontal KPI Carousel

- **Status:** APPROVED
- **Date:** 2026-11-07
- **Target Component:** `src/components/views/AnalyticsView/AnalyticsHeader.tsx`
- **Refs:** ADR-0065

## 1. Executive Summary

This specification establishes the mobile responsive layout rules for the `Operational Intelligence & ROI` dashboard header (`AnalyticsHeader.tsx`). It addresses three UI/UX defects on mobile viewports (< 640px):
1. Right-aligning the header refresh action button (`justify-end sm:justify-start`) for consistent thumb ergonomics.
2. Unifying the filter controls into an organized 2-row layout with a symmetrical 50/50 2-column dropdown grid for Branch and Quarter selectors, and row 2 for Brand toggle pills and the conditional Reset button.
3. Transforming the 2x2 KPI card grid on mobile into a smooth horizontal scrollable carousel (`min-w-[210px]`), eliminating all label text truncation while preserving the 4-column grid on desktop.

## 2. Detailed Layout Specifications

### 2.1 Action Row (Refresh Button)
- **Container Class:**
  ```tsx
  <div className="flex items-center gap-2 justify-end sm:justify-start">
    <button onClick={onRefresh} ... />
  </div>
  ```
- **Behavior:**
  - Mobile (< 640px): Aligned to the right margin of the card.
  - Desktop ($\ge 640\text{px}$): Retains default flex-start placement within its right column.

### 2.2 Filter Toolbar Layout
- **Container Structure:**
  ```tsx
  <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-3 pt-1">
    {/* Row 1 on mobile: Symmetrical 50/50 2-Column Grid */}
    <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center">
      {/* Branch Selector */}
      <CustomDropdown
        value={filters.branchId}
        onChange={...}
        className="w-full sm:w-44 text-xs"
        ...
      />
      {/* Quarter Selector */}
      <CustomDropdown
        value={filters.quarter}
        onChange={...}
        className="w-full sm:w-36 text-xs"
        ...
      />
    </div>

    {/* Row 2 on mobile: Brand Toggle Pills + Reset Filters */}
    <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
      {/* Brand Radio Pills */}
      <div role="radiogroup" className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border ...">
        ...
      </div>

      {/* Reset Button */}
      {activeFilterCount > 0 && (
        <button onClick={onResetFilters} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs ...">
          <RotateCcw className="w-3 h-3" />
          <span>Reset ({activeFilterCount})</span>
        </button>
      )}
    </div>
  </div>
  ```
- **Behavior:**
  - Symmetrical 50/50 grid ensures each dropdown receives ~170px–185px width on smartphone viewports, completely avoiding "Semua Bran..." and "Semua K..." clipping.
  - Brand toggle pills remain compact on the left of Row 2; conditional Reset button anchors to the right via `justify-between`.
  - Desktop retains standard single-row layout (`sm:flex sm:items-center`).

### 2.3 Responsive KPI Cards (Horizontal Carousel on Mobile)
- **Container Class:**
  ```tsx
  <div className="flex overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5 scrollbar-none">
  ```
- **Card Items (`button` elements):**
  ```tsx
  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs text-left cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors min-w-[210px] shrink-0 sm:min-w-0 sm:shrink"
  ```
- **Behavior:**
  - On mobile, cards are horizontally scrollable swipeable cards with negative margin breakout (`-mx-4 px-4`) matching native scroll strip feel.
  - With `min-w-[210px]`, the footer layout (`flex items-center justify-between text-[11px] text-slate-400 mt-1`) has sufficient width for both the descriptive subtitle and the status badge without truncation.
  - On desktop ($\ge 640\text{px}$), the container switches to `sm:grid sm:grid-cols-2 lg:grid-cols-4`, rendering the static 4-column card grid.

## 3. Acceptance Criteria

- [ ] **AC-1 (Refresh Button Alignment):**
  - Mobile: Action container uses `justify-end sm:justify-start`.
  - Desktop: Preserves original flex alignment.
- [ ] **AC-2 (Filter Symmetrical 50/50 Grid):**
  - Mobile: Branch and Quarter dropdowns are housed in a `grid grid-cols-2 gap-2 w-full` container.
  - Dropdown components use `w-full sm:w-44` and `w-full sm:w-36`.
  - Text labels `"Semua Branch"` and `"Semua Kuartal"` do not get truncated with ellipses.
- [ ] **AC-3 (Filter Row 2 Layout):**
  - Mobile: Brand pills and Reset button are housed in `flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto`.
  - Appearing or disappearing Reset button does not shift Row 1 dropdowns.
- [ ] **AC-4 (Horizontal KPI Scroll Strip):**
  - Mobile: 4 KPI cards scroll horizontally via `flex overflow-x-auto ... scrollbar-none`.
  - Each card has `min-w-[210px] shrink-0 sm:min-w-0 sm:shrink`.
  - Subtitle and status label in card footer render without ellipses truncation.
  - Desktop: Renders as standard `sm:grid sm:grid-cols-2 lg:grid-cols-4` grid without scrolling.
- [ ] **AC-5 (Drilldown Preservation):**
  - All 4 KPI card click handlers (`onNavigate("mous")`, `onNavigate("placements")`, `onNavigate("events")`, `onNavigate("content-planner")`) remain fully functional.
- [ ] **AC-6 (Loading State Parity):**
  - Skeleton cards mirror the carousel styling (`min-w-[210px] shrink-0 sm:min-w-0 sm:shrink`) to prevent layout jump during loading.

## 4. Verification Plan

- TDD unit test file: `src/components/views/AnalyticsView/analyticsHeaderResponsiveness.test.ts`.
- Non-negotiable quality gates:
  - `npm run drift:check` (0 drift, 92/92 spec-plan pairs)
  - `npm run build:check` (0 TypeScript errors)
  - `npm run test:smoke` (all smoke tests pass)
  - `npm test` (full suite pass)



