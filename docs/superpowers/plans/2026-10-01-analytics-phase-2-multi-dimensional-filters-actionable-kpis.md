# Analytics Phase 2: Multi-Dimensional Operational Filtering & Actionable KPI Strip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable regional branch, brand portfolio (IM3 vs Tri), and quarterly temporal filtering across the operational analytics hub, and surface the unrendered actionable executive metrics from `data.actionable` in an executive telemetry strip.

**Architecture:** Create pure filtering utilities in `analyticsFilterHelpers.ts` that scope placements, MOUs, events, and posts by branch, brand, and date/quarter horizons before calculations are executed. Build an accessible `AnalyticsFilterBar.tsx` equipped with branch selection, brand toggles, quarterly pills, and one-click filter resets. Extract `AnalyticsKpiRow.tsx` to render the 3 executive pulse cards alongside a new 3-card Actionable Telemetry Strip (Cost per Outlet realization, MOU funnel conversion rate, and Content review aging alerts) using the existing `data.actionable` payload.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5, Lucide React icons, Tailwind CSS v4, Zustand 5, Node test runner (`node:test`).

**Spec:** [`docs/audit-analytics-page-ui-ux.md`](file:///Users/mac/Web%20Development/vrello-up/docs/audit-analytics-page-ui-ux.md)

## Global Constraints

- Tech Stack: Next.js 15 App Router, React 19, TypeScript 5, Tailwind CSS v4, Zustand 5, Node test runner (`node --test`).
- Single Source of Truth: Core domain entities (`BranchItem`, `MarcomMou`, `MarcomPlacement`, `FieldEventItem`, `ContentPostItem`) MUST be imported from `@/types`.
- Master Data Boundary: Branches must be read directly from `useMarcomDataStore.branches` without duplicating branch states or making separate un-cached fetches.
- Strangler Pattern: Filter UI must live in `AnalyticsFilterBar.tsx`, KPI cards in `AnalyticsKpiRow.tsx`, and pure filtering algorithms in `analyticsFilterHelpers.ts`. Never dump filter logic into coordinator files.
- Testing: All filter helpers and date matchers must have 100% test coverage executed via `npm test -- <test-file>`.

---

## File Structure

```text
src/
├── lib/marcom/
│   ├── analyticsFilterHelpers.ts      # New: pure filtering logic for branch, brand & quarters
│   └── analyticsFilterHelpers.test.ts # New: tests for multi-dimensional dataset scoping
└── components/views/AnalyticsView/
    ├── AnalyticsFilterBar.tsx         # New: branch dropdown, quarter selector, brand toggle pills
    ├── AnalyticsKpiRow.tsx            # New: executive pulse cards + actionable telemetry strip
    └── AnalyticsView.tsx              # Modified: integrate FilterBar and KpiRow into coordinator
```

---

### Task 1: Multi-Dimensional Operational Filter Adapters

**Files:**
- Create: `src/lib/marcom/analyticsFilterHelpers.ts`
- Create: `src/lib/marcom/analyticsFilterHelpers.test.ts`

**Interfaces:**
- Produces:
  - `AnalyticsFilterState`: `{ branchId: string; brand: string; quarter: string; year: number }`
  - `filterPlacementsByCriteria(placements, filters): MarcomPlacement[]`
  - `filterMousByCriteria(mous, filters): MarcomMou[]`
  - `filterEventsByCriteria(events, filters): FieldEventItem[]`
  - `filterContentByCriteria(contents, filters): ContentPostItem[]`
  - `isDateInQuarter(dateStr, quarter, year): boolean`

- [ ] **Step 1: Write the failing filter helpers test**

```typescript
// src/lib/marcom/analyticsFilterHelpers.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import {
  filterPlacementsByCriteria,
  filterMousByCriteria,
  isDateInQuarter,
  type AnalyticsFilterState,
} from "./analyticsFilterHelpers.ts";

test("isDateInQuarter accurately matches calendar quarters", () => {
  assert.equal(isDateInQuarter("2026-02-15", "Q1", 2026), true);
  assert.equal(isDateInQuarter("2026-05-10", "Q1", 2026), false);
  assert.equal(isDateInQuarter("2026-05-10", "Q2", 2026), true);
  assert.equal(isDateInQuarter("2026-08-20", "Q3", 2026), true);
  assert.equal(isDateInQuarter("2026-11-01", "Q4", 2026), true);
  assert.equal(isDateInQuarter("2026-11-01", "ALL", 2026), true);
  assert.equal(isDateInQuarter(null, "ALL", 2026), true);
});

test("filterPlacementsByCriteria filters by branch, brand and quarter", () => {
  const mockPlacements = [
    {
      id: "p1",
      outlet: { branchId: "b-semarang" },
      brand: "IM3",
      date: "2026-02-10",
    },
    {
      id: "p2",
      outlet: { branchId: "b-solo" },
      brand: "TRI",
      date: "2026-02-15",
    },
    {
      id: "p3",
      outlet: { branchId: "b-semarang" },
      brand: "TRI",
      date: "2026-05-20",
    },
  ];

  const filterSemarang: AnalyticsFilterState = {
    branchId: "b-semarang",
    brand: "ALL",
    quarter: "ALL",
    year: 2026,
  };
  const semarangOnly = filterPlacementsByCriteria(mockPlacements as any, filterSemarang);
  assert.equal(semarangOnly.length, 2);

  const filterSemarangIM3: AnalyticsFilterState = {
    branchId: "b-semarang",
    brand: "IM3",
    quarter: "ALL",
    year: 2026,
  };
  const semarangIM3 = filterPlacementsByCriteria(mockPlacements as any, filterSemarangIM3);
  assert.equal(semarangIM3.length, 1);
  assert.equal(semarangIM3[0].id, "p1");

  const filterQ1Only: AnalyticsFilterState = {
    branchId: "ALL",
    brand: "ALL",
    quarter: "Q1",
    year: 2026,
  };
  const q1Placements = filterPlacementsByCriteria(mockPlacements as any, filterQ1Only);
  assert.equal(q1Placements.length, 2);
});
```

- [ ] **Step 2: Run test to confirm it fails**

Run:
```bash
npm test -- src/lib/marcom/analyticsFilterHelpers.test.ts
```

- [ ] **Step 3: Implement `src/lib/marcom/analyticsFilterHelpers.ts`**

```typescript
// src/lib/marcom/analyticsFilterHelpers.ts
import type {
  MarcomPlacement,
  MarcomMou,
  FieldEventItem,
  ContentPostItem,
} from "@/types";

export interface AnalyticsFilterState {
  branchId: string; // "ALL" or specific branchId
  brand: string;    // "ALL" | "IM3" | "TRI"
  quarter: string;  // "ALL" | "Q1" | "Q2" | "Q3" | "Q4"
  year: number;     // e.g. 2026
}

export const DEFAULT_ANALYTICS_FILTERS: AnalyticsFilterState = {
  branchId: "ALL",
  brand: "ALL",
  quarter: "ALL",
  year: new Date().getFullYear(),
};

export function isDateInQuarter(
  dateVal: string | Date | null | undefined,
  quarter: string,
  year: number
): boolean {
  if (quarter === "ALL") return true;
  if (!dateVal) return false;

  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return false;
  if (d.getFullYear() !== year) return false;

  const month = d.getMonth(); // 0-11
  switch (quarter) {
    case "Q1":
      return month >= 0 && month <= 2;
    case "Q2":
      return month >= 3 && month <= 5;
    case "Q3":
      return month >= 6 && month <= 8;
    case "Q4":
      return month >= 9 && month <= 11;
    default:
      return true;
  }
}

export function filterPlacementsByCriteria(
  placements: MarcomPlacement[],
  filters: AnalyticsFilterState
): MarcomPlacement[] {
  return placements.filter((p) => {
    // 1. Branch filter
    if (filters.branchId !== "ALL") {
      const pBranchId = (p as any).outlet?.branchId || (p as any).branchId;
      if (pBranchId !== filters.branchId) return false;
    }

    // 2. Brand filter
    if (filters.brand !== "ALL") {
      const pBrand = (p.brand || "").toUpperCase();
      if (!pBrand.includes(filters.brand.toUpperCase())) return false;
    }

    // 3. Quarter / Year filter
    if (filters.quarter !== "ALL") {
      const dateVal = (p as any).date || p.createdAt;
      if (!isDateInQuarter(dateVal, filters.quarter, filters.year)) {
        return false;
      }
    }

    return true;
  });
}

export function filterMousByCriteria(
  mous: MarcomMou[],
  filters: AnalyticsFilterState
): MarcomMou[] {
  return mous.filter((m) => {
    // 1. Branch filter
    if (filters.branchId !== "ALL" && m.branchId !== filters.branchId) {
      return false;
    }

    // 2. Quarter / Year filter (based on submissionDate or startDate)
    if (filters.quarter !== "ALL") {
      const dateVal = m.submissionDate || m.startDate || m.createdAt;
      if (!isDateInQuarter(dateVal, filters.quarter, filters.year)) {
        return false;
      }
    }

    return true;
  });
}

export function filterEventsByCriteria(
  events: FieldEventItem[],
  filters: AnalyticsFilterState
): FieldEventItem[] {
  return events.filter((e) => {
    // 1. Branch filter
    if (filters.branchId !== "ALL" && (e as any).branchId !== filters.branchId) {
      return false;
    }

    // 2. Quarter / Year filter
    if (filters.quarter !== "ALL") {
      const dateVal = (e as any).eventDate || (e as any).startDate || e.createdAt;
      if (!isDateInQuarter(dateVal, filters.quarter, filters.year)) {
        return false;
      }
    }

    return true;
  });
}

export function filterContentByCriteria(
  contents: ContentPostItem[],
  filters: AnalyticsFilterState
): ContentPostItem[] {
  return contents.filter((c) => {
    // 1. Quarter / Year filter
    if (filters.quarter !== "ALL") {
      const dateVal = c.publishDate || c.createdAt;
      if (!isDateInQuarter(dateVal, filters.quarter, filters.year)) {
        return false;
      }
    }

    return true;
  });
}
```

- [ ] **Step 4: Run test to verify passes**

Run:
```bash
npm test -- src/lib/marcom/analyticsFilterHelpers.test.ts
```

- [ ] **Step 5: Commit changes**

```bash
git add src/lib/marcom/analyticsFilterHelpers.ts src/lib/marcom/analyticsFilterHelpers.test.ts
git commit -m "feat(analytics): add pure multi-dimensional filtering utilities for marcom entities"
```

---

### Task 2: Multi-Dimensional Filter Bar Component (`AnalyticsFilterBar.tsx`)

**Files:**
- Create: `src/components/views/AnalyticsView/AnalyticsFilterBar.tsx`

**Interfaces:**
- Consumes:
  - `useMarcomDataStore(state => state.branches)`
  - `AnalyticsFilterState`
- Produces:
  - `<AnalyticsFilterBar filters={filters} onFilterChange={setFilters} onReset={resetFilters} />`

- [ ] **Step 1: Implement `AnalyticsFilterBar.tsx`**

```typescript
// src/components/views/AnalyticsView/AnalyticsFilterBar.tsx
"use client";

import { useMemo } from "react";
import { Filter, RotateCcw, MapPin, Calendar, Tag } from "lucide-react";
import { useMarcomDataStore } from "@/lib/marcom/marcomDataStore";
import { cn } from "@/lib/utils";
import type { AnalyticsFilterState } from "@/lib/marcom/analyticsFilterHelpers";

interface AnalyticsFilterBarProps {
  filters: AnalyticsFilterState;
  onFilterChange: (next: AnalyticsFilterState) => void;
  onReset: () => void;
}

const QUARTERS = [
  { label: "Semua Kuartal", value: "ALL" },
  { label: "Q1 (Jan–Mar)", value: "Q1" },
  { label: "Q2: (Apr–Jun)", value: "Q2" },
  { label: "Q3 (Jul–Sep)", value: "Q3" },
  { label: "Q4 (Okt–Des)", value: "Q4" },
];

const BRANDS = [
  { label: "Semua Brand", value: "ALL" },
  { label: "IM3", value: "IM3", color: "bg-amber-500" },
  { label: "3 (Tri)", value: "TRI", color: "bg-rose-500" },
];

export function AnalyticsFilterBar({
  filters,
  onFilterChange,
  onReset,
}: AnalyticsFilterBarProps) {
  const branches = useMarcomDataStore((state) => state.branches);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.branchId !== "ALL") count++;
    if (filters.brand !== "ALL") count++;
    if (filters.quarter !== "ALL") count++;
    return count;
  }, [filters]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-[#18191B] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
          <Filter className="w-3.5 h-3.5 text-indigo-500" />
          <span>Filter:</span>
        </div>

        {/* 1. Branch Selector */}
        <div className="relative inline-flex items-center">
          <MapPin className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
          <select
            value={filters.branchId}
            onChange={(e) =>
              onFilterChange({ ...filters, branchId: e.target.value })
            }
            aria-label="Filter Wilayah Branch"
            className="text-xs font-medium pl-8 pr-7 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="ALL">Semua Branch</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Quarter Selector */}
        <div className="relative inline-flex items-center">
          <Calendar className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
          <select
            value={filters.quarter}
            onChange={(e) =>
              onFilterChange({ ...filters, quarter: e.target.value })
            }
            aria-label="Filter Periode Kuartal"
            className="text-xs font-medium pl-8 pr-7 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            {QUARTERS.map((q) => (
              <option key={q.value} value={q.value}>
                {q.label}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Brand Toggle Pills */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
          {BRANDS.map((b) => {
            const isSelected = filters.brand === b.value;
            return (
              <button
                key={b.value}
                type="button"
                onClick={() => onFilterChange({ ...filters, brand: b.value })}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5",
                  isSelected
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                {b.color && (
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      b.color,
                      !isSelected && "opacity-60"
                    )}
                  />
                )}
                {b.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Reset Button */}
      {activeFilterCount > 0 && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset ({activeFilterCount})</span>
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit component**

```bash
git add src/components/views/AnalyticsView/AnalyticsFilterBar.tsx
git commit -m "feat(analytics): add multi-dimensional filter bar with branch, quarter and brand controls"
```

---

### Task 3: Executive Actionable KPI Row with Facade Integration (`AnalyticsKpiRow.tsx`)

**Files:**
- Create: `src/components/views/AnalyticsView/AnalyticsKpiRow.tsx`

**Interfaces:**
- Consumes:
  - `data.kpis: ExecutiveKpis`
  - `data.actionable: ActionableMarcomMetrics`
- Produces:
  - `<AnalyticsKpiRow kpis={data.kpis} actionable={data.actionable} onNavigate={onNavigate} />`

- [ ] **Step 1: Implement `AnalyticsKpiRow.tsx`**

```typescript
// src/components/views/AnalyticsView/AnalyticsKpiRow.tsx
"use client";

import { Clock, Store, Users, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCompactIDR } from "@/lib/marcom/analyticsFormatters";
import type { ExecutiveKpis } from "@/lib/marcom/analyticsEngine";
import type { ActionableMarcomMetrics } from "@/lib/marcom/analyticsFacade";

interface AnalyticsKpiRowProps {
  kpis: ExecutiveKpis;
  actionable?: ActionableMarcomMetrics;
  onNavigate?: (view: string) => void;
}

export function AnalyticsKpiRow({ kpis, actionable, onNavigate }: AnalyticsKpiRowProps) {
  return (
    <div className="space-y-4">
      {/* Top 3 Executive Pulse Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: MOU SLA Turnaround */}
        <div
          onClick={() => onNavigate?.("mous")}
          className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#18191B] p-4 shadow-2xs flex flex-col justify-between cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Kecepatan Persetujuan MOU
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {kpis.mouSla.avgSlaDays > 0 ? `${kpis.mouSla.avgSlaDays} Hari` : "—"}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Rata-rata SLA submission ke aktif
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/60">
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border",
                kpis.mouSla.healthStatus === "HEALTHY"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                  : kpis.mouSla.healthStatus === "ATTENTION"
                  ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                  : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
              )}
            >
              {kpis.mouSla.label}
            </span>
          </div>
        </div>

        {/* Card 2: POSM Deployment Rate */}
        <div
          onClick={() => onNavigate?.("placements")}
          className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#18191B] p-4 shadow-2xs flex flex-col justify-between cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              POSM Deployment Rate
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center shrink-0">
              <Store className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {kpis.posmDeployment.rate}%
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {kpis.posmDeployment.done} dari {kpis.posmDeployment.total} titik terpasang
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/60">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700">
              Investasi: {formatCompactIDR(kpis.posmDeployment.totalInvestment)}
            </span>
          </div>
        </div>

        {/* Card 3: Field Event Cost per Attendee */}
        <div
          onClick={() => onNavigate?.("events")}
          className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#18191B] p-4 shadow-2xs flex flex-col justify-between cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Efisiensi Event Lapangan
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/50 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {kpis.eventEfficiency.totalAttendees > 0
                ? `${formatCompactIDR(kpis.eventEfficiency.costPerAttendee)} / Org`
                : "—"}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Biaya riil per kepala pengunjung
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/60">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700">
              {kpis.eventEfficiency.totalAttendees.toLocaleString("id-ID")} total pengunjung
            </span>
          </div>
        </div>
      </div>

      {/* Actionable Telemetry Mini-Strip (Surfaces data.actionable) */}
      {actionable && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-slate-50/70 dark:bg-slate-900/40 rounded-xl border border-slate-200/70 dark:border-slate-800/70 text-xs">
          {/* Actionable 1: Cost per Outlet */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-700 dark:text-amber-300">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                {formatCompactIDR(actionable.costPerOutlet.avgCostPerOutlet)} / Outlet
              </div>
              <div className="text-[11px] text-slate-500">
                Rata-rata investasi per titik ritel
              </div>
            </div>
          </div>

          {/* Actionable 2: MOU Funnel Conversion Rate */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-700 dark:text-indigo-300">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                {actionable.mouFunnel.conversionRate}% Konversi MOU
              </div>
              <div className="text-[11px] text-slate-500">
                Proposal yang mencapai status DONE
              </div>
            </div>
          </div>

          {/* Actionable 3: Critical Content Aging */}
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center",
                actionable.contentAging.criticalAgingCount > 0
                  ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
              )}
            >
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                {actionable.contentAging.criticalAgingCount > 0
                  ? `${actionable.contentAging.criticalAgingCount} Konten Tertahan >2 Hari`
                  : "Review Konten Prima"}
              </div>
              <div className="text-[11px] text-slate-500">
                Turnaround review editorial media sosial
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Connect FilterBar and KpiRow into `AnalyticsView.tsx`**

In `src/components/views/AnalyticsView/AnalyticsView.tsx`:
- Import `AnalyticsFilterBar` and `AnalyticsKpiRow`.
- Add local filter state:
  ```typescript
  const [filters, setFilters] = useState<AnalyticsFilterState>(DEFAULT_ANALYTICS_FILTERS);
  ```
- Pass filtered data into the chart cards and replace inline KPI cards with `<AnalyticsKpiRow>`.

- [ ] **Step 3: Run all unit tests to verify zero regressions**

```bash
npm test -- "src/lib/marcom/*analytics*.test.ts"
```

- [ ] **Step 4: Commit changes**

```bash
git add src/components/views/AnalyticsView/AnalyticsKpiRow.tsx src/components/views/AnalyticsView/AnalyticsView.tsx
git commit -m "feat(analytics): render actionable telemetry strip and connect filter bar"
```
