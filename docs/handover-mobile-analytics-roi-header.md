# Handover: Mobile Analytics ROI Header Layout and Horizontal KPI Carousel

- **Status:** READY FOR EXECUTION
- **Date:** 2026-11-07
- **Target File:** `src/components/views/AnalyticsView/AnalyticsHeader.tsx`
- **Refs:** ADR-0065, Spec `docs/superpowers/specs/2026-11-07-mobile-analytics-roi-header-design.md`, Plan `docs/superpowers/plans/2026-11-07-mobile-analytics-roi-header.md`

## 1. Context & Objective

Restructure the mobile layout (< 640px) of `AnalyticsHeader.tsx` to:
1. Align the action button (`RefreshCw`) to the right on mobile (`justify-end sm:justify-start`).
2. Reorganize the filter toolbar into two distinct rows:
   - Row 1: 50/50 2-column grid (`grid grid-cols-2 gap-2 w-full sm:w-auto`) for Branch and Quarter dropdowns, hiding `Filter:` text on mobile (`hidden sm:flex`).
   - Row 2: Brand radio pills and conditional Reset button in `flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto`.
3. Transform the 2x2 KPI grid into a smooth horizontal scroll strip on mobile (`flex overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5 scrollbar-none`) with cards `min-w-[210px] shrink-0 sm:min-w-0 sm:shrink`.
4. Preserve desktop view ($\ge 640\text{px}$) 100% byte-for-byte unchanged.

## 2. Exact Code Changes

### Change 1: Action Button Alignment (`AnalyticsHeader.tsx` ~Line 98)

Current:
```tsx
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
```

Replace with:
```tsx
        <div className="flex items-center gap-2 justify-end sm:justify-start">
          <button
            type="button"
            onClick={onRefresh}
```

### Change 2: Filter Toolbar 2-Row Restructuring (`AnalyticsHeader.tsx` ~Line 114)

Current:
```tsx
      {/* 2. Integrated Filter Toolbar Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
            <Filter className="w-3.5 h-3.5 text-indigo-500" />
            <span>Filter:</span>
          </div>

          {/* Branch Selector */}
          <CustomDropdown
            value={filters.branchId}
            onChange={(val) => onFilterChange({ ...filters, branchId: val })}
            options={[
              { value: "ALL", label: "Semua Branch" },
              ...branches.map((b) => ({ value: b.id, label: b.name })),
            ]}
            ariaLabel="Filter Wilayah Branch"
            icon={MapPin}
            searchPlaceholder="Cari branch..."
            className="w-36 sm:w-44 text-xs"
          />

          {/* Quarter Selector */}
          <CustomDropdown
            value={filters.quarter}
            onChange={(val) => onFilterChange({ ...filters, quarter: val })}
            options={QUARTERS}
            ariaLabel="Filter Periode Kuartal"
            icon={Calendar}
            className="w-32 sm:w-36 text-xs"
          />

          {/* Brand Toggle Pills */}
          <div
            role="radiogroup"
            aria-label="Filter Brand"
            className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60"
          >
            {BRANDS.map((b) => {
              const isSelected = filters.brand === b.value;
              return (
                <motion.button
                  key={b.value}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
                  onClick={() => onFilterChange({ ...filters, brand: b.value })}
                  className={cn(
                    "relative px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1.5",
                    isSelected
                      ? "text-slate-900 dark:text-slate-100 font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  )}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="activeAnalyticsBrandPill"
                      className="absolute inset-0 bg-white dark:bg-slate-900 rounded-md shadow-2xs border border-slate-200/60 dark:border-slate-700/60"
                      transition={pillTransition}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    {b.color && (
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          b.color,
                          !isSelected && "opacity-60"
                        )}
                      />
                    )}
                    <span>{b.label}</span>
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Reset Button */}
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset ({activeFilterCount})</span>
          </button>
        )}
      </div>
```

Replace with:
```tsx
      {/* 2. Integrated Filter Toolbar Row */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-3 pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full sm:w-auto">
          {/* Row 1 on mobile: Symmetrical 50/50 2-Column Grid */}
          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center">
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
              <Filter className="w-3.5 h-3.5 text-indigo-500" />
              <span>Filter:</span>
            </div>

            {/* Branch Selector */}
            <CustomDropdown
              value={filters.branchId}
              onChange={(val) => onFilterChange({ ...filters, branchId: val })}
              options={[
                { value: "ALL", label: "Semua Branch" },
                ...branches.map((b) => ({ value: b.id, label: b.name })),
              ]}
              ariaLabel="Filter Wilayah Branch"
              icon={MapPin}
              searchPlaceholder="Cari branch..."
              className="w-full sm:w-44 text-xs"
            />

            {/* Quarter Selector */}
            <CustomDropdown
              value={filters.quarter}
              onChange={(val) => onFilterChange({ ...filters, quarter: val })}
              options={QUARTERS}
              ariaLabel="Filter Periode Kuartal"
              icon={Calendar}
              className="w-full sm:w-36 text-xs"
            />
          </div>

          {/* Row 2 on mobile: Brand Toggle Pills + Reset Filters */}
          <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
            {/* Brand Toggle Pills */}
            <div
              role="radiogroup"
              aria-label="Filter Brand"
              className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60"
            >
              {BRANDS.map((b) => {
                const isSelected = filters.brand === b.value;
                return (
                  <motion.button
                    key={b.value}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
                    onClick={() => onFilterChange({ ...filters, brand: b.value })}
                    className={cn(
                      "relative px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1.5",
                      isSelected
                        ? "text-slate-900 dark:text-slate-100 font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    )}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="activeAnalyticsBrandPill"
                        className="absolute inset-0 bg-white dark:bg-slate-900 rounded-md shadow-2xs border border-slate-200/60 dark:border-slate-700/60"
                        transition={pillTransition}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      {b.color && (
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            b.color,
                            !isSelected && "opacity-60"
                          )}
                        />
                      )}
                      <span>{b.label}</span>
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Reset Button (Mobile right aligned / desktop normal) */}
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={onResetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer sm:hidden"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset ({activeFilterCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* Reset Button (Desktop) */}
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={onResetFilters}
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset ({activeFilterCount})</span>
          </button>
        )}
      </div>
```

### Change 3: Horizontal KPI Scroll Strip (`AnalyticsHeader.tsx` ~Line 207)

Current:
```tsx
      {/* 3. Embedded 4 KPI Cards (Inventory Standard) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {!data || isLoading ? (
          [1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs animate-pulse"
            >
...
            <button
              type="button"
              onClick={() => onNavigate("mous")}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs text-left cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors"
            >
```

Replace with:
```tsx
      {/* 3. Embedded 4 KPI Cards (Responsive Horizontal Strip on Mobile) */}
      <div className="flex overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5 scrollbar-none">
        {!data || isLoading ? (
          [1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs animate-pulse min-w-[210px] shrink-0 sm:min-w-0 sm:shrink"
            >
...
            <button
              type="button"
              onClick={() => onNavigate("mous")}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs text-left cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors min-w-[210px] shrink-0 sm:min-w-0 sm:shrink"
            >
```
(Apply `min-w-[210px] shrink-0 sm:min-w-0 sm:shrink` to all 4 card buttons).

## 3. Explicit "Do Not Touch" List
- `src/components/views/AnalyticsView/AnalyticsActionableStrip.tsx`: Already verified and responsive.
- `src/components/views/AnalyticsView/charts/*`: All charts remain untouched.
- `src/app/api/marcom/analytics/route.ts`: No backend changes.
- `src/lib/marcom/analyticsEngine.ts` & `src/lib/marcom/analyticsFacade.ts`: Pure logic unchanged.

