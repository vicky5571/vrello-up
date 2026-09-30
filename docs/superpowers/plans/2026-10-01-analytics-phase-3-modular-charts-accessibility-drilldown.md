# Analytics Phase 3: Modular Charts, Accessibility, Skeleton & Interactive Drill-Down Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decompose the remaining monolithic Recharts implementations in `AnalyticsView.tsx` into atomic chart components, achieve WCAG 2.1 AA compliance (dark-mode axis contrast, screen reader fallback data tables, colorblind-friendly indicators), eliminate layout shifts with a skeleton pulse grid, and implement interactive drill-down triage navigation.

**Architecture:** Decompose the 576-line `AnalyticsView.tsx` coordinator down to ~120 lines following the project's Strangler Pattern. Extract `ChartCard.tsx` as an accessible container enforcing `min-w-0` to eliminate CSS grid blowout and Recharts `width(-1)` warnings. Implement four dedicated chart modules (`PosmEconomicsChart`, `MouAgingChart`, `EventEfficiencyChart`, `ContentCadenceChart`) featuring theme-aware axis styling, Deuteranopia-safe patterns, hidden semantic tables for screen readers, and click handlers that navigate directly to pre-filtered entity views. Replace the full-screen spinner with `AnalyticsSkeleton.tsx` to maintain 0 CLS.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5, Recharts, Tailwind CSS v4, Zustand 5, Node test runner (`node:test`).

**Spec:** [`docs/audit-analytics-page-ui-ux.md`](file:///Users/mac/Web%20Development/vrello-up/docs/audit-analytics-page-ui-ux.md)

## Global Constraints

- Tech Stack: Next.js 15 App Router, React 19, TypeScript 5, Tailwind CSS v4, Zustand 5, Node test runner (`node --test`).
- Strangler Pattern: `AnalyticsView.tsx` must remain a clean coordinator (< 150 lines) composing modular components. No inline SVG charts or heavy calculation logic in coordinator files.
- Accessibility Standards: Normal text contrast must exceed 4.5:1 (WCAG AA). Chart data must be accessible to screen readers via semantic hidden tables (`<table className="sr-only">`).
- Grid Safety: Every chart card container in CSS grid must enforce `min-w-0` to prevent horizontal document overflow on compact screens.
- Zero Layout Shift: Loading states must use layout-preserving skeleton pulses matching exact card geometry.

---

## File Structure

```text
src/components/views/AnalyticsView/
├── charts/
│   ├── ChartCard.tsx               # New: accessible card container with min-w-0 & sr-only table wrapper
│   ├── PosmEconomicsChart.tsx      # New: stacked bar with notStarted & colorblind hatching
│   ├── MouAgingChart.tsx           # New: SLA aging distribution with empty-state overlay
│   ├── EventEfficiencyChart.tsx    # New: cost per attendee & audience targets
│   └── ContentCadenceChart.tsx     # New: channel publishing reliability & review aging
├── AnalyticsSkeleton.tsx           # New: layout-preserving skeleton cards (0 CLS)
└── AnalyticsView.tsx               # Refactored: lean coordinator (~120 lines)
```

---

### Task 1: Base Accessible Chart Container (`ChartCard.tsx`)

**Files:**
- Create: `src/components/views/AnalyticsView/charts/ChartCard.tsx`

**Interfaces:**
- Produces:
  - `<ChartCard title="..." subtitle="..." action={...} accessibleTable={...}>{children}</ChartCard>`

- [ ] **Step 1: Implement `ChartCard.tsx`**

```typescript
// src/components/views/AnalyticsView/charts/ChartCard.tsx
"use client";

import { cn } from "@/lib/utils";

interface AccessibleTableData {
  caption: string;
  headers: string[];
  rows: (string | number)[][];
}

interface ChartCardProps {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
  className?: string;
  accessibleTable?: AccessibleTableData;
  children: React.ReactNode;
}

export function ChartCard({
  title,
  subtitle,
  action,
  className,
  accessibleTable,
  children,
}: ChartCardProps) {
  return (
    <div
      className={cn(
        // min-w-0 is mandatory to prevent CSS Grid blowout from SVG charts
        "min-w-0 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#18191B] shadow-2xs p-4 flex flex-col justify-between",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
            {title}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
            {subtitle}
          </p>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      <div className="flex-1 min-h-0 w-full relative">{children}</div>

      {/* WCAG 1.1.1 Accessible Table Fallback for Screen Readers */}
      {accessibleTable && (
        <table className="sr-only">
          <caption>{accessibleTable.caption}</caption>
          <thead>
            <tr>
              {accessibleTable.headers.map((h, i) => (
                <th key={i} scope="col">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {accessibleTable.rows.map((row, rIdx) => (
              <tr key={rIdx}>
                {row.map((cell, cIdx) => (
                  <td key={cIdx}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit component**

```bash
git add src/components/views/AnalyticsView/charts/ChartCard.tsx
git commit -m "feat(analytics): add accessible ChartCard container with min-w-0 grid safety and sr-only tables"
```

---

### Task 2: Atomic Accessible Visualizations

**Files:**
- Create: `src/components/views/AnalyticsView/charts/PosmEconomicsChart.tsx`
- Create: `src/components/views/AnalyticsView/charts/MouAgingChart.tsx`
- Create: `src/components/views/AnalyticsView/charts/EventEfficiencyChart.tsx`
- Create: `src/components/views/AnalyticsView/charts/ContentCadenceChart.tsx`

**Interfaces:**
- Produces:
  - `<PosmEconomicsChart data={posmDeployment} onDrilldown={onDrilldown} />`
  - `<MouAgingChart data={mouSlaAndAging} onDrilldown={onDrilldown} />`
  - `<EventEfficiencyChart data={eventEfficiency} onDrilldown={onDrilldown} />`
  - `<ContentCadenceChart data={contentMetrics} onDrilldown={onDrilldown} />`

- [ ] **Step 1: Implement `PosmEconomicsChart.tsx` with `notStarted` and theme-aware axes**

```typescript
// src/components/views/AnalyticsView/charts/PosmEconomicsChart.tsx
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartCard } from "./ChartCard";
import { formatCompactIDR } from "@/lib/marcom/analyticsFormatters";
import type { PosmDeploymentResult } from "@/lib/marcom/analyticsEngine";

interface PosmEconomicsChartProps {
  data: PosmDeploymentResult;
  onDrilldown?: (materialName: string, status?: string) => void;
}

export function PosmEconomicsChart({ data, onDrilldown }: PosmEconomicsChartProps) {
  const accessibleRows = data.materials.map((m) => [
    m.materialName,
    m.total,
    m.done,
    m.inProgress,
    m.issue,
    m.notStarted,
    `${m.doneRate}%`,
    formatCompactIDR(m.avgCost),
  ]);

  return (
    <ChartCard
      title="POSM Unit Economics & Deployment Rate"
      subtitle="Distribusi titik terpasang dan rata-rata biaya per unit materi"
      action={
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          Total {data.totalPlacements} Titik
        </span>
      }
      accessibleTable={{
        caption: "Distribusi Pemasangan Materi POSM",
        headers: ["Materi", "Total", "Done", "Proses", "Kendala", "Belum Mulai", "Done Rate", "Biaya Rata-rata"],
        rows: accessibleRows,
      }}
    >
      <div className="h-72 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data.materials}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
            <XAxis
              type="number"
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={{ stroke: "#cbd5e1" }}
            />
            <YAxis
              dataKey="materialName"
              type="category"
              width={120}
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={{ stroke: "#cbd5e1" }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="rounded-lg bg-slate-900 text-white text-xs p-3 shadow-lg border border-slate-700 min-w-52">
                      <div className="font-bold mb-1.5">{item.materialName}</div>
                      <div className="space-y-1 text-slate-300 text-[11px]">
                        <div className="flex justify-between gap-4">
                          <span>Total Titik:</span>
                          <span className="font-semibold text-white">{item.total}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>Selesai (DONE):</span>
                          <span className="font-semibold text-emerald-400">
                            {item.done} ({item.doneRate}%)
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>Sedang Proses:</span>
                          <span className="font-semibold text-amber-400">{item.inProgress}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>Kendala (Issue):</span>
                          <span className="font-semibold text-rose-400">{item.issue}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>Belum Mulai:</span>
                          <span className="font-semibold text-slate-400">{item.notStarted}</span>
                        </div>
                        <div className="border-t border-slate-700 pt-1 mt-1 flex justify-between gap-4">
                          <span>Biaya Rata-rata / Unit:</span>
                          <span className="font-bold text-white">{formatCompactIDR(item.avgCost)}</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
            <Bar
              dataKey="done"
              name="Selesai (DONE)"
              stackId="posm"
              fill="#10b981"
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={(d) => onDrilldown?.(d.materialName, "DONE")}
            />
            <Bar
              dataKey="inProgress"
              name="Sedang Proses"
              stackId="posm"
              fill="#f59e0b"
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={(d) => onDrilldown?.(d.materialName, "ON_PROGRESS")}
            />
            <Bar
              dataKey="issue"
              name="Kendala (Issue)"
              stackId="posm"
              fill="#ef4444"
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={(d) => onDrilldown?.(d.materialName, "ISSUE")}
            />
            <Bar
              dataKey="notStarted"
              name="Belum Mulai"
              stackId="posm"
              fill="#94a3b8"
              radius={[0, 4, 4, 0]}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={(d) => onDrilldown?.(d.materialName, "NOT_STARTED")}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
```

- [ ] **Step 2: Implement `MouAgingChart.tsx` with empty-state overlay**

```typescript
// src/components/views/AnalyticsView/charts/MouAgingChart.tsx
"use client";

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartCard } from "./ChartCard";
import type { MouSlaAndAgingResult } from "@/lib/marcom/analyticsEngine";

interface MouAgingChartProps {
  data: MouSlaAndAgingResult;
  onDrilldown?: () => void;
}

export function MouAgingChart({ data, onDrilldown }: MouAgingChartProps) {
  const accessibleRows = data.agingBuckets.map((b) => [b.label, b.count]);
  const hasSubmitted = data.submittedCount > 0;

  return (
    <ChartCard
      title="Distribusi Aging & Bottleneck MOU"
      subtitle="Proposal dalam antrean verifikasi berdasarkan umur pengajuan"
      action={
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          {data.submittedCount} Menunggu Review
        </span>
      }
      accessibleTable={{
        caption: "Distribusi Umur Pengajuan Proposal MOU",
        headers: ["Kategori Umur", "Jumlah Proposal"],
        rows: accessibleRows,
      }}
    >
      <div className="h-72 mt-2 relative">
        {!hasSubmitted && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/70 dark:bg-[#18191B]/70 backdrop-blur-2xs rounded-lg">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Tidak ada proposal dalam antrean review
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5">
              Semua pengajuan telah disetujui atau belum ada proposal baru
            </span>
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data.agingBuckets}
            margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
            <XAxis
              dataKey="label"
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={{ stroke: "#cbd5e1" }}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={{ stroke: "#cbd5e1" }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="rounded-lg bg-slate-900 text-white text-xs p-2.5 shadow-lg border border-slate-700">
                      <div className="font-semibold">{item.label}</div>
                      <div className="text-slate-300 mt-1">
                        Jumlah Proposal: <strong className="text-white">{item.count}</strong>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="count"
              name="Jumlah Proposal"
              radius={[6, 6, 0, 0]}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onDrilldown?.()}
            >
              {data.agingBuckets.map((entry) => (
                <Cell key={entry.bucket} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-[11px] pt-3 border-t border-slate-100 dark:border-slate-800/80 text-slate-500">
        <span>
          Rata-rata Turnaround SLA: <strong>{data.avgSlaDays > 0 ? `${data.avgSlaDays} Hari` : "—"}</strong>
        </span>
        <span>
          Total Proposal Aktif: <strong>{data.approvedOrDoneCount} MOU</strong>
        </span>
      </div>
    </ChartCard>
  );
}
```

- [ ] **Step 3: Implement `EventEfficiencyChart.tsx` and `ContentCadenceChart.tsx`**

Create `src/components/views/AnalyticsView/charts/EventEfficiencyChart.tsx` and `src/components/views/AnalyticsView/charts/ContentCadenceChart.tsx` with:
- `EventEfficiencyChart`: Uses `formatCompactIDR`, handles 0-attendee pending events gracefully with a target projection indicator, and adds drill-down to `events` view.
- `ContentCadenceChart`: Renders channel published vs scheduled vs draft cadence with theme-aware axes and drill-down to `content` view.

- [ ] **Step 4: Commit atomic chart components**

```bash
git add src/components/views/AnalyticsView/charts/
git commit -m "feat(analytics): add atomic accessible chart components with drilldowns and theme awareness"
```

---

### Task 3: Zero-CLS Skeleton Loading Grid (`AnalyticsSkeleton.tsx`)

**Files:**
- Create: `src/components/views/AnalyticsView/AnalyticsSkeleton.tsx`

**Interfaces:**
- Produces:
  - `<AnalyticsSkeleton />`

- [ ] **Step 1: Implement `AnalyticsSkeleton.tsx`**

```typescript
// src/components/views/AnalyticsView/AnalyticsSkeleton.tsx
export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Filter Bar Skeleton */}
      <div className="h-14 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800" />

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-36 bg-slate-100 dark:bg-[#18191B] rounded-xl border border-slate-200/80 dark:border-slate-800 p-4"
          />
        ))}
      </div>

      {/* Charts Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-88 bg-slate-100 dark:bg-[#18191B] rounded-xl border border-slate-200/80 dark:border-slate-800 p-4"
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit skeleton component**

```bash
git add src/components/views/AnalyticsView/AnalyticsSkeleton.tsx
git commit -m "feat(analytics): add layout-preserving skeleton component to eliminate CLS"
```

---

### Task 4: Lean Coordinator Assembly & Interactive Triage Routing

**Files:**
- Modify: `src/components/views/AnalyticsView/AnalyticsView.tsx`

**Interfaces:**
- Consumes:
  - `useAnalyticsData()`
  - `AnalyticsFilterBar`
  - `AnalyticsKpiRow`
  - `PosmEconomicsChart`, `MouAgingChart`, `EventEfficiencyChart`, `ContentCadenceChart`
  - `AnalyticsSkeleton`
  - `useWorkspaceStore(state => state.setActiveView, state => state.setMarcomFilters)`
- Produces:
  - Lean coordinator (< 140 lines) cleanly orchestrating views, filters, and drilldowns.

- [ ] **Step 1: Refactor `AnalyticsView.tsx` down to lean coordinator**

```typescript
// src/components/views/AnalyticsView/AnalyticsView.tsx
"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useAnalyticsData } from "./useAnalyticsData";
import { AnalyticsFilterBar } from "./AnalyticsFilterBar";
import { AnalyticsKpiRow } from "./AnalyticsKpiRow";
import { PosmEconomicsChart } from "./charts/PosmEconomicsChart";
import { MouAgingChart } from "./charts/MouAgingChart";
import { EventEfficiencyChart } from "./charts/EventEfficiencyChart";
import { ContentCadenceChart } from "./charts/ContentCadenceChart";
import { AnalyticsSkeleton } from "./AnalyticsSkeleton";
import {
  DEFAULT_ANALYTICS_FILTERS,
  type AnalyticsFilterState,
} from "@/lib/marcom/analyticsFilterHelpers";

export function AnalyticsView() {
  const setActiveView = useWorkspaceStore((state) => state.setActiveView);
  const setMarcomFilters = useWorkspaceStore((state) => state.setMarcomFilters);

  const [filters, setFilters] = useState<AnalyticsFilterState>(
    DEFAULT_ANALYTICS_FILTERS
  );

  const { data, isLoading, isRefreshing, error, refresh } = useAnalyticsData();

  const handleDrilldown = (targetView: string, searchPreset?: string) => {
    if (searchPreset) {
      setMarcomFilters(targetView as any, searchPreset);
    }
    setActiveView(targetView as any);
  };

  return (
    <div className="h-full w-full overflow-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Operational Intelligence
            </h1>
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 rounded-md border border-indigo-200/60 dark:border-indigo-800/60">
              Live Metrics
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Metrik operasional riil: SLA perizinan, unit economics POSM, reliabilitas konten & efisiensi event.
          </p>
        </div>

        <button
          type="button"
          onClick={refresh}
          disabled={isLoading || isRefreshing}
          title="Segarkan data analitik"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border shadow-2xs bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", (isLoading || isRefreshing) && "animate-spin")} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Bar */}
      <AnalyticsFilterBar
        filters={filters}
        onFilterChange={setFilters}
        onReset={() => setFilters(DEFAULT_ANALYTICS_FILTERS)}
      />

      {/* State Rendering */}
      {isLoading ? (
        <AnalyticsSkeleton />
      ) : error || !data ? (
        <div className="p-12 text-center text-xs flex flex-col items-center gap-3 bg-white dark:bg-[#18191B] rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-rose-600 dark:text-rose-400 font-semibold text-sm">
            {error || "Tidak ada data analitik"}
          </span>
          <button
            type="button"
            onClick={refresh}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:opacity-90 transition-opacity cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      ) : (
        <>
          {/* Executive Pulse & Actionable Telemetry Strip */}
          <AnalyticsKpiRow
            kpis={data.kpis}
            actionable={data.actionable}
            onNavigate={(view) => handleDrilldown(view)}
          />

          {/* Atomic Chart Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <PosmEconomicsChart
              data={data.posmDeployment}
              onDrilldown={(material, status) =>
                handleDrilldown("placements", `${material} ${status || ""}`.trim())
              }
            />
            <MouAgingChart
              data={data.mouSlaAndAging}
              onDrilldown={() => handleDrilldown("mous", "SUBMITTED")}
            />
            <EventEfficiencyChart
              data={data.eventEfficiency}
              onDrilldown={() => handleDrilldown("events")}
            />
            <ContentCadenceChart
              data={data.contentMetrics}
              onDrilldown={() => handleDrilldown("content")}
            />
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Run all tests to confirm 0 failures**

```bash
npm test -- "src/lib/marcom/*analytics*.test.ts"
```

- [ ] **Step 3: Commit refactored coordinator**

```bash
git add src/components/views/AnalyticsView/AnalyticsView.tsx
git commit -m "refactor(analytics): assemble lean coordinator composing atomic charts and drilldown triage"
```
