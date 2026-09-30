# Analytics Phase 1: Backend Performance, Engine Invariants & Dual-Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the 25,000-outlet backend memory scan, fix POSM stacked bar data omission (`NOT_STARTED`), correct the MOU SLA calculation and empty-state false positives, and establish offline client dual-persistence with `useAnalyticsData`.

**Architecture:** Replace unconstrained Prisma `findMany` queries in `/api/marcom/analytics` with targeted SQL `count` aggregations. Extend `analyticsEngine.ts` to explicitly compute and preserve `notStarted` in POSM material economics, guard against false-positive "SLA Prima" badges on empty datasets, and extract pure formatting logic into `analyticsFormatters.ts`. Build `useAnalyticsData.ts` as an SWR-style data hook that reads directly from `useMarcomDataStore` and executes `buildMarcomAnalyticsDashboard` in memory before falling back to background HTTP revalidation.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5, Prisma ORM, Zustand 5, Node native test runner (`node:test`).

**Spec:** [`docs/audit-analytics-page-ui-ux.md`](file:///Users/mac/Web%20Development/vrello-up/docs/audit-analytics-page-ui-ux.md)

## Global Constraints

- Tech Stack: Next.js 15 App Router, React 19, TypeScript 5, Tailwind CSS v4, Zustand 5, Node test runner (`node --test`).
- Single Source of Truth: Core domain entities (`MarcomMou`, `MarcomPlacement`, `FieldEventItem`, `ContentPostItem`, `OutletItem`) MUST be imported from `@/types`.
- Dual-Persistence Discipline: Support offline / local memory state gracefully alongside PostgreSQL. Mutations in the store must update client analytics instantly without requiring a blocking network roundtrip.
- Zero Memory Dumps: Master data tables (`Outlet`) must NEVER be scanned with unconstrained `findMany` solely for count operations.
- Testing: All business logic, mathematical engines, and formatters must be accompanied by unit tests executed via `npm test -- <test-file>`.

---

## File Structure

```text
src/
├── app/api/marcom/analytics/
│   ├── route.ts                     # Modified: replace outlet findMany with prisma.outlet.count
│   └── analyticsApi.test.ts         # New: verify API query efficiency and payload contract
├── lib/marcom/
│   ├── analyticsEngine.ts           # Modified: POSM notStarted support, empty state guard, SLA fix
│   ├── analyticsEngine.test.ts      # Modified: test notStarted, SLA domain logic, empty datasets
│   ├── analyticsFormatters.ts       # New: pure compact IDR, rate & SLA duration formatters
│   └── analyticsFormatters.test.ts  # New: test compact IDR edge cases (billions, negatives, NaNs)
└── components/views/AnalyticsView/
    ├── useAnalyticsData.ts          # New: dual-persistence SWR hook (store-first + API fallback)
    └── useAnalyticsData.test.ts     # New: test offline in-memory aggregation and state sync
```

---

### Task 1: Eliminate 25,000 Outlet Scan in Analytics API

**Files:**
- Modify: `src/app/api/marcom/analytics/route.ts:78-95`
- Create: `src/app/api/marcom/analytics/analyticsApi.test.ts`

**Interfaces:**
- Consumes: `prisma.outlet.count({ where: { active: true } })`
- Produces: Aggregated `MarcomAnalyticsDashboardData` without loading 25,000 outlet records into Node.js heap.

- [ ] **Step 1: Write the failing API test**

```typescript
// src/app/api/marcom/analytics/analyticsApi.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { buildMarcomAnalyticsDashboard } from "@/lib/marcom/analyticsEngine";

test("buildMarcomAnalyticsDashboard accepts activeOutletCount without requiring full outlet entities", () => {
  const dashboard = buildMarcomAnalyticsDashboard({
    mous: [],
    placements: [],
    contents: [],
    events: [],
    activeOutletCount: 42,
  });

  assert.ok(dashboard);
  assert.ok(dashboard.actionable);
  assert.equal(dashboard.actionable.costPerOutlet.totalActiveOutlets, 42);
});
```

- [ ] **Step 2: Run test to confirm it fails**

Run:
```bash
npm test -- src/app/api/marcom/analytics/analyticsApi.test.ts
```
Verify failure: `activeOutletCount` is not recognized on `buildMarcomAnalyticsDashboard` input.

- [ ] **Step 3: Update `analyticsEngine.ts` and `analyticsFacade.ts` to accept `activeOutletCount`**

Update `src/lib/marcom/analyticsFacade.ts`:
```typescript
export function calculateCostPerOutlet(
  activeOutletsCountOrList: FacadeOutletInput[] | number = 0,
  placements: FacadePlacementInput[] = [],
  mous: FacadeMouInput[] = []
): ActionableCostPerOutlet {
  const totalActiveOutlets =
    typeof activeOutletsCountOrList === "number"
      ? activeOutletsCountOrList
      : Array.isArray(activeOutletsCountOrList)
      ? activeOutletsCountOrList.filter((o) => o.active !== false).length
      : 0;

  // ... remaining cost aggregation logic ...
```

Update `src/lib/marcom/analyticsEngine.ts`:
```typescript
export function buildMarcomAnalyticsDashboard(params: {
  mous: MouAnalyticsInput[];
  placements: PlacementAnalyticsInput[];
  contents: ContentPostAnalyticsInput[];
  events: FieldEventAnalyticsInput[];
  outlets?: OutletAnalyticsInput[];
  activeOutletCount?: number;
  now?: Date;
}): MarcomAnalyticsDashboardData {
  const activeCount =
    typeof params.activeOutletCount === "number"
      ? params.activeOutletCount
      : params.outlets?.filter((o) => o.active !== false).length ?? 0;

  const actionable = calculateActionableMarcomMetrics({
    mous: params.mous,
    placements: params.placements,
    contents: params.contents,
    events: params.events,
    activeOutletCount: activeCount,
    now: params.now,
  });
  // ...
```

- [ ] **Step 4: Update `/api/marcom/analytics/route.ts` to execute `prisma.outlet.count`**

In `src/app/api/marcom/analytics/route.ts`:
```typescript
const [mous, placements, contents, events, activeOutletCount] = await Promise.all([
  prisma.mou.findMany({
    where: { workspaceId },
    select: {
      id: true,
      status: true,
      submissionDate: true,
      startDate: true,
      endDate: true,
      compensationValue: true,
    },
  }),
  prisma.placement.findMany({
    where: { workspaceId },
    select: {
      id: true,
      status: true,
      cost: true,
      outletId: true,
      material: { select: { id: true, name: true, type: true } },
      outlet: {
        select: {
          id: true,
          branchId: true,
          branch: { select: { id: true, name: true } },
        },
      },
    },
  }),
  prisma.contentPost.findMany({
    where: { workspaceId },
    select: { id: true, platform: true, status: true, publishDate: true },
  }),
  prisma.fieldEvent.findMany({
    where: { workspaceId },
    select: {
      id: true,
      eventType: true,
      status: true,
      budget: true,
      targetAttendee: true,
      attendeeCount: true,
    },
  }),
  prisma.outlet.count({
    where: { active: true },
  }),
]);

const dashboard = buildMarcomAnalyticsDashboard({
  mous,
  placements,
  contents,
  events,
  activeOutletCount,
});
```

- [ ] **Step 5: Run tests and verify 0 failures**

Run:
```bash
npm test -- src/app/api/marcom/analytics/analyticsApi.test.ts
npm test -- "src/lib/marcom/*analytics*.test.ts"
```

- [ ] **Step 6: Commit changes**

```bash
git add src/app/api/marcom/analytics/ src/lib/marcom/analyticsEngine.ts src/lib/marcom/analyticsFacade.ts
git commit -m "perf(analytics): replace 25k outlet memory scan with sql count aggregation"
```

---

### Task 2: Robust Engine Math (POSM `notStarted`, MOU SLA & Empty-State Invariants)

**Files:**
- Modify: `src/lib/marcom/analyticsEngine.ts:184-335,484-520`
- Modify: `src/lib/marcom/analyticsEngine.test.ts`

**Interfaces:**
- Produces:
  - `PosmMaterialMetric.notStarted`: integer count of unstarted installations.
  - `PosmDeploymentResult.notStartedPlacements`: overall count of unstarted placements.
  - `ExecutiveKpis.mouSla.healthStatus`: correctly returns `"HEALTHY"` with label `"Belum Ada Pengajuan"` when dataset is empty.
  - `calculateEventEfficiency`: safely returns 0 with projected target rates for upcoming events without actual attendees.

- [ ] **Step 1: Write failing engine tests for mathematical invariants**

In `src/lib/marcom/analyticsEngine.test.ts`:
```typescript
test("calculatePosmMaterialEconomics preserves notStarted count and totals correctly", () => {
  const placements = [
    { id: "p1", status: "DONE", cost: 100000, material: { id: "m1", name: "Neon Box" } },
    { id: "p2", status: "ON_PROGRESS", cost: 100000, material: { id: "m1", name: "Neon Box" } },
    { id: "p3", status: "ISSUE", cost: 100000, material: { id: "m1", name: "Neon Box" } },
    { id: "p4", status: "NOT_STARTED", cost: 100000, material: { id: "m1", name: "Neon Box" } },
    { id: "p5", status: "NOT_STARTED", cost: 100000, material: { id: "m1", name: "Neon Box" } },
  ];

  const result = calculatePosmMaterialEconomics(placements);
  assert.equal(result.totalPlacements, 5);
  assert.equal(result.donePlacements, 1);
  assert.equal(result.inProgressPlacements, 1);
  assert.equal(result.issuePlacements, 1);
  assert.equal(result.notStartedPlacements, 2);

  const mat = result.materials[0];
  assert.equal(mat.total, 5);
  assert.equal(mat.notStarted, 2);
  assert.equal(mat.done + mat.inProgress + mat.issue + mat.notStarted, mat.total);
});

test("calculateExecutiveKpis handles empty datasets with neutral status rather than false-positive SLA Prima", () => {
  const emptyMou = calculateMouSlaAndAging([]);
  const emptyPosm = calculatePosmMaterialEconomics([]);
  const emptyEvent = calculateEventEfficiency([]);

  const kpis = calculateExecutiveKpis(emptyMou, emptyPosm, emptyEvent);
  assert.equal(kpis.mouSla.avgSlaDays, 0);
  assert.equal(kpis.mouSla.stuckCount, 0);
  assert.equal(kpis.mouSla.label, "Belum Ada Pengajuan");
  assert.equal(kpis.mouSla.healthStatus, "HEALTHY");
});
```

- [ ] **Step 2: Run test to confirm it fails**

Run:
```bash
npm test -- src/lib/marcom/analyticsEngine.test.ts
```

- [ ] **Step 3: Implement minimal engine changes in `analyticsEngine.ts`**

In `src/lib/marcom/analyticsEngine.ts`:
1. Add `notStartedPlacements` to `PosmDeploymentResult` interface.
2. In `calculatePosmMaterialEconomics`:
```typescript
let notStartedPlacements = 0;
// inside placement loop:
if (isDone) donePlacements++;
else if (isInProgress) inProgressPlacements++;
else if (isIssue) issuePlacements++;
else notStartedPlacements++;

// inside return:
return {
  totalPlacements,
  donePlacements,
  inProgressPlacements,
  issuePlacements,
  notStartedPlacements,
  deploymentRate,
  totalInvestment,
  materials,
};
```
3. In `calculateExecutiveKpis`:
```typescript
let mouHealthStatus: "HEALTHY" | "ATTENTION" | "CRITICAL" = "HEALTHY";
let label = "SLA Prima (<7 Hari)";

if (mouResult.totalMous === 0 || (mouResult.submittedCount === 0 && mouResult.approvedOrDoneCount === 0)) {
  mouHealthStatus = "HEALTHY";
  label = "Belum Ada Pengajuan";
} else if (mouResult.stuckCount > 5 || mouResult.avgSlaDays > 14) {
  mouHealthStatus = "CRITICAL";
  label = "Bottleneck Kritis (>14 Hari)";
} else if (mouResult.stuckCount > 0 || mouResult.avgSlaDays > 7) {
  mouHealthStatus = "ATTENTION";
  label = "Ada Keterlambatan Review";
}
```

- [ ] **Step 4: Run test to verify assertions pass**

Run:
```bash
npm test -- src/lib/marcom/analyticsEngine.test.ts
```

- [ ] **Step 5: Commit changes**

```bash
git commit -am "fix(analyticsEngine): preserve notStarted placements and guard empty mou dataset"
```

---

### Task 3: Pure Compact Currency, Rate & SLA Duration Formatters

**Files:**
- Create: `src/lib/marcom/analyticsFormatters.ts`
- Create: `src/lib/marcom/analyticsFormatters.test.ts`

**Interfaces:**
- Produces:
  - `formatCompactIDR(val: number | null | undefined): string`
  - `formatPercent(numerator: number, denominator: number): string`
  - `formatSlaTurnaround(days: number): string`

- [ ] **Step 1: Write the failing formatters test**

```typescript
// src/lib/marcom/analyticsFormatters.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import {
  formatCompactIDR,
  formatPercent,
  formatSlaTurnaround,
} from "./analyticsFormatters.ts";

test("formatCompactIDR formats billions, millions, and thousands safely", () => {
  assert.equal(formatCompactIDR(2_500_000_000), "Rp 2.5 M");
  assert.equal(formatCompactIDR(15_000_000), "Rp 15.0 Jt");
  assert.equal(formatCompactIDR(250_000), "Rp 250 Rb");
  assert.equal(formatCompactIDR(750), "Rp 750");
  assert.equal(formatCompactIDR(0), "Rp 0");
});

test("formatCompactIDR handles negatives, NaNs, and undefined values without crashing", () => {
  assert.equal(formatCompactIDR(-5_000_000), "-Rp 5.0 Jt");
  assert.equal(formatCompactIDR(NaN), "Rp 0");
  assert.equal(formatCompactIDR(null), "Rp 0");
  assert.equal(formatCompactIDR(undefined), "Rp 0");
});

test("formatPercent handles division by zero safely", () => {
  assert.equal(formatPercent(25, 100), "25%");
  assert.equal(formatPercent(0, 0), "0%");
  assert.equal(formatPercent(5, 0), "0%");
});

test("formatSlaTurnaround formats turnaround text with Indonesian day suffix", () => {
  assert.equal(formatSlaTurnaround(0), "0 Hari");
  assert.equal(formatSlaTurnaround(3), "3 Hari");
  assert.equal(formatSlaTurnaround(14), "14 Hari");
});
```

- [ ] **Step 2: Run test to confirm it fails**

Run:
```bash
npm test -- src/lib/marcom/analyticsFormatters.test.ts
```

- [ ] **Step 3: Implement `analyticsFormatters.ts`**

```typescript
// src/lib/marcom/analyticsFormatters.ts

/**
 * Compact Indonesian Rupiah formatter with negative & NaN safety.
 */
export function formatCompactIDR(val: number | null | undefined): string {
  if (typeof val !== "number" || Number.isNaN(val) || !Number.isFinite(val)) {
    return "Rp 0";
  }

  const isNegative = val < 0;
  const abs = Math.abs(val);

  let formatted = "";
  if (abs >= 1_000_000_000) {
    formatted = `Rp ${(abs / 1_000_000_000).toFixed(1)} M`;
  } else if (abs >= 1_000_000) {
    formatted = `Rp ${(abs / 1_000_000).toFixed(1)} Jt`;
  } else if (abs >= 1_000) {
    formatted = `Rp ${(abs / 1_000).toFixed(0)} Rb`;
  } else {
    formatted = `Rp ${abs.toLocaleString("id-ID")}`;
  }

  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Safe percentage formatter with 0-denominator guard.
 */
export function formatPercent(numerator: number, denominator: number): string {
  if (
    typeof numerator !== "number" ||
    typeof denominator !== "number" ||
    denominator <= 0 ||
    Number.isNaN(numerator) ||
    Number.isNaN(denominator)
  ) {
    return "0%";
  }
  return `${Math.round((numerator / denominator) * 100)}%`;
}

/**
 * Formats SLA turnaround days for executive KPI cards.
 */
export function formatSlaTurnaround(days: number): string {
  const safeDays = Math.max(0, Math.round(Number(days) || 0));
  return `${safeDays} Hari`;
}
```

- [ ] **Step 4: Run test to verify formatters pass**

Run:
```bash
npm test -- src/lib/marcom/analyticsFormatters.test.ts
```

- [ ] **Step 5: Commit changes**

```bash
git add src/lib/marcom/analyticsFormatters.ts src/lib/marcom/analyticsFormatters.test.ts
git commit -m "feat(analytics): add robust compact currency, rate and sla formatters"
```

---

### Task 4: Client Dual-Persistence Data Hook (`useAnalyticsData.ts`)

**Files:**
- Create: `src/components/views/AnalyticsView/useAnalyticsData.ts`
- Create: `src/components/views/AnalyticsView/useAnalyticsData.test.ts`

**Interfaces:**
- Consumes:
  - `useWorkspaceStore(state => state.activeWorkspaceId)`
  - `useMarcomDataStore(state => state.placementsByWorkspace, etc.)`
  - `buildMarcomAnalyticsDashboard` (pure in-memory engine)
- Produces:
  - `{ data: MarcomAnalyticsDashboardData | null, isLoading: boolean, isRefreshing: boolean, error: string | null, refresh: () => Promise<void> }`

- [ ] **Step 1: Write the failing hook/aggregation logic test**

```typescript
// src/components/views/AnalyticsView/useAnalyticsData.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { buildMarcomAnalyticsDashboard } from "@/lib/marcom/analyticsEngine";
import type { MarcomPlacement, MarcomMou } from "@/types";

test("in-memory dashboard compilation works directly on client store Marcom types", () => {
  const mockPlacements: Partial<MarcomPlacement>[] = [
    {
      id: "p-1",
      status: "DONE",
      cost: 500000,
      material: { id: "mat-1", name: "Neon Box", type: "OUTDOOR" } as any,
    },
  ];

  const mockMous: Partial<MarcomMou>[] = [
    {
      id: "m-1",
      status: "SUBMITTED",
      submissionDate: new Date().toISOString(),
    },
  ];

  const dashboard = buildMarcomAnalyticsDashboard({
    mous: mockMous as any,
    placements: mockPlacements as any,
    contents: [],
    events: [],
    activeOutletCount: 10,
  });

  assert.equal(dashboard.posmDeployment.totalPlacements, 1);
  assert.equal(dashboard.posmDeployment.donePlacements, 1);
  assert.equal(dashboard.mouSlaAndAging.submittedCount, 1);
});
```

- [ ] **Step 2: Run test to confirm it passes**

Run:
```bash
npm test -- src/components/views/AnalyticsView/useAnalyticsData.test.ts
```

- [ ] **Step 3: Implement `useAnalyticsData.ts` hook**

```typescript
// src/components/views/AnalyticsView/useAnalyticsData.ts
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useMarcomDataStore } from "@/lib/marcom/marcomDataStore";
import {
  buildMarcomAnalyticsDashboard,
  type MarcomAnalyticsDashboardData,
} from "@/lib/marcom/analyticsEngine";

export function useAnalyticsData() {
  const activeWorkspaceId =
    useWorkspaceStore((state) => state.activeWorkspaceId) || "ws-main";

  // Subscribe to client Marcom store caches
  const placements = useMarcomDataStore(
    (state) => state.placementsByWorkspace[activeWorkspaceId]
  );
  const mous = useMarcomDataStore(
    (state) => state.mousByWorkspace[activeWorkspaceId]
  );
  const events = useMarcomDataStore(
    (state) => state.eventsByWorkspace[activeWorkspaceId]
  );
  const posts = useMarcomDataStore(
    (state) => state.postsByWorkspace[activeWorkspaceId]
  );
  const outlets = useMarcomDataStore((state) => state.outlets);

  const [remoteData, setRemoteData] =
    useState<MarcomAnalyticsDashboardData | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // In-memory instant aggregation when store has data
  const localDashboard = useMemo(() => {
    if (!placements && !mous && !events && !posts) {
      return null;
    }
    return buildMarcomAnalyticsDashboard({
      mous: mous || [],
      placements: placements || [],
      contents: posts || [],
      events: events || [],
      outlets: outlets || [],
      activeOutletCount: outlets?.filter((o) => o.active !== false).length,
    });
  }, [placements, mous, events, posts, outlets]);

  const fetchRemote = useCallback(async () => {
    setIsFetching(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/marcom/analytics?workspaceId=${encodeURIComponent(activeWorkspaceId)}`
      );
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Gagal memuat analitik`);
      }
      const json = await res.json();
      if (json.ok && json.data) {
        setRemoteData(json.data);
      }
    } catch (err) {
      // In offline mode, do not throw if local data is already present
      if (!localDashboard) {
        setError(err instanceof Error ? err.message : "Gagal memuat analitik");
      }
    } finally {
      setIsFetching(false);
    }
  }, [activeWorkspaceId, localDashboard]);

  useEffect(() => {
    fetchRemote();
  }, [fetchRemote]);

  // Prefer remote fresh data, but immediately fallback to local in-memory store
  const activeData = remoteData || localDashboard;
  const isLoading = !activeData && isFetching;

  return {
    data: activeData,
    isLoading,
    isRefreshing: Boolean(activeData && isFetching),
    error: activeData ? null : error,
    refresh: fetchRemote,
  };
}
```

- [ ] **Step 4: Update `AnalyticsView.tsx` to consume `useAnalyticsData` and `formatCompactIDR`**

In `src/components/views/AnalyticsView/AnalyticsView.tsx`:
- Replace raw `fetch` state with `const { data, isLoading, isRefreshing, error, refresh } = useAnalyticsData();`
- Replace local `formatRupiah` with `formatCompactIDR` from `@/lib/marcom/analyticsFormatters`.
- Add `<Bar dataKey="notStarted" name="Belum Mulai" stackId="posm" fill="#94a3b8" radius={[0, 4, 4, 0]} />` to Chart 1.
- Update `issue` bar radius to `[0, 0, 0, 0]` so it stacks smoothly inside.

- [ ] **Step 5: Run tests and verify 0 failures**

```bash
npm test -- "src/lib/marcom/*analytics*.test.ts"
npm test -- src/app/api/marcom/analytics/analyticsApi.test.ts
npm test -- src/components/views/AnalyticsView/useAnalyticsData.test.ts
```

- [ ] **Step 6: Commit changes**

```bash
git add src/components/views/AnalyticsView/useAnalyticsData.ts src/components/views/AnalyticsView/useAnalyticsData.test.ts src/components/views/AnalyticsView/AnalyticsView.tsx
git commit -m "feat(analytics): integrate dual-persistence data hook and fix posm stacked bar"
```
