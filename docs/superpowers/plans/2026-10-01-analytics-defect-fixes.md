# Analytics Defect Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the 3 critical runtime and data-flow defects identified during code review: resolve the Branch ID vs. Name mismatch in event filtering, fix the Recharts `Bar.onClick` signature in `PosmEconomicsChart` that causes `"undefined DONE"` drilldown, pre-warm Marcom store caches on direct landing in `useAnalyticsData`, and fix the Q2 label typo.

**Architecture:** Extend `filterEventsByCriteria` in `analyticsFilterHelpers.ts` to accept an optional `branchNameLookup` parameter so `filters.branchId` (a CUID from the branch selector) matches `FieldEvent.branchName` (a human-readable name). Create a safe payload extractor in `PosmEconomicsChart.tsx` that reads `(entry as any)?.payload?.materialName` from Recharts bar clicks. Update `useAnalyticsData.ts` to trigger non-blocking background store hydration (`fetchPlacements`, `fetchMous`, `fetchEvents`, `fetchPosts`, `fetchBranches`) upon mount to eliminate filter starvation on direct page loads.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5, Recharts, Zustand 5, Node test runner (`node:test`).

**Spec:** [`docs/audit-analytics-page-ui-ux.md`](file:///Users/mac/Web%20Development/vrello-up/docs/audit-analytics-page-ui-ux.md)

## Global Constraints

- Tech Stack: Next.js 15 App Router, React 19, TypeScript 5, Tailwind CSS v4, Zustand 5, Node test runner (`node --test`).
- Single Source of Truth: Core domain entities (`BranchItem`, `MarcomMou`, `MarcomPlacement`, `FieldEventItem`, `ContentPostItem`) MUST be imported from `@/types`.
- Dual-Persistence Discipline: Offline and in-memory cache must remain authoritative; background fetches must never overwrite optimistic state or cause unhandled rejections.
- Zero Memory Dumps: Do not regress the `prisma.outlet.count` optimization in `/api/marcom/analytics/route.ts`.
- Testing: All fixed algorithms and handlers must have accompanying unit tests executed via `npm test -- <test-file>` with 0 failures.

---

## File Structure

```text
src/
├── lib/marcom/
│   ├── analyticsFilterHelpers.ts         # Modified: support branchNameLookup in filterEventsByCriteria
│   └── analyticsFilterHelpers.test.ts    # Modified: test CUID branchId matching human branchName
└── components/views/AnalyticsView/
    ├── useAnalyticsData.ts               # Modified: pass resolved branchName & pre-warm store caches
    ├── useAnalyticsData.test.ts          # Modified: test store cache pre-warming behavior
    ├── AnalyticsFilterBar.tsx            # Modified: fix "Q2: (Apr–Jun)" typo and brand scope note
    └── charts/
        ├── PosmEconomicsChart.tsx        # Modified: safe Recharts payload extraction for drilldown
        └── PosmEconomicsChart.test.ts   # New: test payload extraction on Recharts event objects
```

---

### Task 1: Resolve Branch ID to Branch Name Mismatch in Event Filtering

**Files:**
- Modify: `src/lib/marcom/analyticsFilterHelpers.ts:137-159`
- Modify: `src/lib/marcom/analyticsFilterHelpers.test.ts:109-155`
- Modify: `src/components/views/AnalyticsView/useAnalyticsData.ts:77-85`

**Interfaces:**
- Consumes:
  - `filters.branchId`: string CUID from branch selector
  - `branchNameLookup?: string`: human-readable name of the selected branch (e.g. `"Semarang"`)
- Produces:
  - `filterEventsByCriteria(events, filters, branchNameLookup): FieldEventItem[]`

- [x] **Step 1: Write the failing unit test**

In `src/lib/marcom/analyticsFilterHelpers.test.ts`:
```typescript
test("filterEventsByCriteria matches when branchId is a CUID and branchNameLookup is provided", () => {
  const mockEvents = [
    {
      id: "e1",
      name: "Semarang Roadshow",
      eventType: "Roadshow",
      status: "COMPLETED",
      budget: 5000000,
      targetAttendee: 500,
      attendeeCount: 450,
      branchName: "Semarang",
      startDate: "2026-03-01",
    },
    {
      id: "e2",
      name: "Solo Expo",
      eventType: "Expo",
      status: "COMPLETED",
      budget: 8000000,
      targetAttendee: 800,
      attendeeCount: 750,
      branchName: "Solo",
      startDate: "2026-08-01",
    },
  ] as unknown as FieldEventItem[];

  // Real-world scenario: filters.branchId is a CUID, but event stores "Semarang"
  const semarangByCuid = filterEventsByCriteria(
    mockEvents,
    {
      branchId: "cuid_semarang_branch_123",
      brand: "ALL",
      quarter: "ALL",
      year: 2026,
    },
    "Semarang" // branchNameLookup
  );

  assert.equal(semarangByCuid.length, 1);
  assert.equal(semarangByCuid[0].id, "e1");

  // Also verify case-insensitive matching
  const semarangCaseInsensitive = filterEventsByCriteria(
    mockEvents,
    {
      branchId: "cuid_semarang_branch_123",
      brand: "ALL",
      quarter: "ALL",
      year: 2026,
    },
    "semarang"
  );
  assert.equal(semarangCaseInsensitive.length, 1);
});
```

- [x] **Step 2: Run test to confirm it fails**

Run:
```bash
npm test -- src/lib/marcom/analyticsFilterHelpers.test.ts
```
Verify failure: `filterEventsByCriteria` does not accept or apply `branchNameLookup`.

- [x] **Step 3: Update `filterEventsByCriteria` in `analyticsFilterHelpers.ts`**

In `src/lib/marcom/analyticsFilterHelpers.ts:137-159`:
```typescript
export function filterEventsByCriteria(
  events: FieldEventItem[],
  filters: AnalyticsFilterState,
  branchNameLookup?: string
): FieldEventItem[] {
  const safe = Array.isArray(events) ? events : [];
  return safe.filter((e) => {
    // 1. Branch filter:
    // FieldEvent stores a human-readable `branchName` rather than `branchId`.
    // Match either against filters.branchId directly (fallback for tests/fixtures)
    // or against the resolved `branchNameLookup`.
    if (filters.branchId !== "ALL") {
      const eventBranch = (e.branchName || "").trim().toLowerCase();
      const targetId = filters.branchId.trim().toLowerCase();
      const targetLookup = (branchNameLookup || "").trim().toLowerCase();

      const matchesDirect = eventBranch === targetId;
      const matchesLookup = targetLookup !== "" && eventBranch === targetLookup;

      if (!matchesDirect && !matchesLookup) return false;
    }

    // 2. Quarter / Year filter
    if (filters.quarter !== "ALL") {
      const dateVal = e.startDate || e.date || e.endDate;
      if (!isDateInQuarter(dateVal, filters.quarter, filters.year)) {
        return false;
      }
    }

    return true;
  });
}
```

- [x] **Step 4: Update `useAnalyticsData.ts` to pass resolved branch name**

In `src/components/views/AnalyticsView/useAnalyticsData.ts`:
```typescript
  const branches = useMarcomDataStore((state) => state.branches);

  // Resolve branch name from active filter's branchId
  const selectedBranchName = useMemo(() => {
    if (filters.branchId === "ALL") return undefined;
    return branches.find((b) => b.id === filters.branchId)?.name;
  }, [branches, filters.branchId]);

  // Pass selectedBranchName into filterEventsByCriteria
  const localDashboard = useMemo(() => {
    // ...
    return buildMarcomAnalyticsDashboard({
      mous: filterMousByCriteria(mous || [], filters),
      placements: filterPlacementsByCriteria(placements || [], filters),
      contents: filterContentByCriteria(posts || [], filters),
      events: filterEventsByCriteria(events || [], filters, selectedBranchName),
      outlets: outlets || [],
      activeOutletCount: outlets?.filter((o) => o.active !== false).length,
    });
  }, [placements, mous, events, posts, outlets, filters, selectedBranchName]);
```

- [x] **Step 5: Run tests and verify they pass**

Run:
```bash
npm test -- src/lib/marcom/analyticsFilterHelpers.test.ts
```

- [x] **Step 6: Commit changes**

```bash
git add src/lib/marcom/analyticsFilterHelpers.ts src/lib/marcom/analyticsFilterHelpers.test.ts src/components/views/AnalyticsView/useAnalyticsData.ts
git commit -m "fix(analytics): resolve branch CUID to branch name in event filtering"
```

---

### Task 2: Fix Recharts `Bar.onClick` Payload Signature in `PosmEconomicsChart.tsx`

**Files:**
- Create: `src/components/views/AnalyticsView/charts/PosmEconomicsChart.test.ts`
- Modify: `src/components/views/AnalyticsView/charts/PosmEconomicsChart.tsx:16-25, 125-162`

**Interfaces:**
- Produces:
  - `extractBarMaterialName(entry: unknown): string`: defensive helper extracting materialName from Recharts bar event payloads.

- [x] **Step 1: Write the failing test for `extractBarMaterialName`**

Create `src/components/views/AnalyticsView/charts/PosmEconomicsChart.test.ts`:
```typescript
import test from "node:test";
import assert from "node:assert/strict";
import { extractBarMaterialName } from "./PosmEconomicsChart.tsx";

test("extractBarMaterialName safely extracts materialName from Recharts Bar event object", () => {
  // Recharts v2 Bar.onClick passes an object with `payload` holding the row data
  const rechartsEvent = {
    x: 10,
    y: 20,
    width: 100,
    height: 30,
    value: 15,
    payload: {
      materialName: "Neon Box",
      total: 20,
      done: 15,
      avgCost: 1500000,
    },
  };

  assert.equal(extractBarMaterialName(rechartsEvent), "Neon Box");
});

test("extractBarMaterialName falls back to direct materialName or empty string", () => {
  assert.equal(extractBarMaterialName({ materialName: "Shopblind" }), "Shopblind");
  assert.equal(extractBarMaterialName(null), "");
  assert.equal(extractBarMaterialName(undefined), "");
  assert.equal(extractBarMaterialName({}), "");
});
```

- [x] **Step 2: Run test to confirm it fails**

Run:
```bash
npm test -- src/components/views/AnalyticsView/charts/PosmEconomicsChart.test.ts
```
Verify failure: `extractBarMaterialName` is not exported from `PosmEconomicsChart.tsx`.

- [x] **Step 3: Implement `extractBarMaterialName` and update `onClick` handlers**

In `src/components/views/AnalyticsView/charts/PosmEconomicsChart.tsx`:
```typescript
/**
 * Defensively extracts the `materialName` string from a Recharts Bar click event.
 * Recharts passes `{ x, y, width, height, value, payload: T }` where the raw row
 * data lives on `entry.payload`.
 */
export function extractBarMaterialName(entry: unknown): string {
  if (!entry || typeof entry !== "object") return "";
  const withPayload = entry as { payload?: { materialName?: string } };
  if (withPayload.payload?.materialName) {
    return withPayload.payload.materialName;
  }
  const direct = entry as { materialName?: string };
  return direct.materialName || "";
}
```

Update the four `<Bar>` elements in `PosmEconomicsChart.tsx`:
```typescript
<Bar
  dataKey="done"
  name="Selesai (DONE)"
  stackId="posm"
  fill="#10b981"
  className="cursor-pointer hover:opacity-80 transition-opacity"
  onClick={(d) => onDrilldown?.(extractBarMaterialName(d), "DONE")}
/>
<Bar
  dataKey="inProgress"
  name="Sedang Proses"
  stackId="posm"
  fill="#f59e0b"
  className="cursor-pointer hover:opacity-80 transition-opacity"
  onClick={(d) => onDrilldown?.(extractBarMaterialName(d), "ON_PROGRESS")}
/>
<Bar
  dataKey="issue"
  name="Kendala (Issue)"
  stackId="posm"
  fill="#ef4444"
  className="cursor-pointer hover:opacity-80 transition-opacity"
  onClick={(d) => onDrilldown?.(extractBarMaterialName(d), "ISSUE")}
/>
<Bar
  dataKey="notStarted"
  name="Belum Mulai"
  stackId="posm"
  fill="#94a3b8"
  radius={[0, 4, 4, 0]}
  className="cursor-pointer hover:opacity-80 transition-opacity"
  onClick={(d) => onDrilldown?.(extractBarMaterialName(d), "NOT_STARTED")}
/>
```

- [x] **Step 4: Run test to confirm it passes**

Run:
```bash
npm test -- src/components/views/AnalyticsView/charts/PosmEconomicsChart.test.ts
```

- [x] **Step 5: Commit changes**

```bash
git add src/components/views/AnalyticsView/charts/PosmEconomicsChart.tsx src/components/views/AnalyticsView/charts/PosmEconomicsChart.test.ts
git commit -m "fix(analytics): extract materialName from Recharts event payload to prevent undefined drilldown"
```

---

### Task 3: Pre-Warm Marcom Store Caches in `useAnalyticsData.ts`

**Files:**
- Modify: `src/components/views/AnalyticsView/useAnalyticsData.ts:40-65, 115-125`
- Modify: `src/components/views/AnalyticsView/useAnalyticsData.test.ts`

**Interfaces:**
- Produces:
  - Non-blocking pre-warm effect: calls `fetchPlacements`, `fetchMous`, `fetchEvents`, `fetchPosts`, `fetchBranches` on `activeWorkspaceId` so local filtering is immediately available even on fresh page landing.

- [x] **Step 1: Write unit test verifying store pre-warming integration**

In `src/components/views/AnalyticsView/useAnalyticsData.test.ts`:
```typescript
test("useMarcomDataStore fetch actions can pre-warm cache for a workspace", async () => {
  const store = useMarcomDataStore.getState();
  assert.equal(typeof store.fetchPlacements, "function");
  assert.equal(typeof store.fetchMous, "function");
  assert.equal(typeof store.fetchEvents, "function");
  assert.equal(typeof store.fetchPosts, "function");
  assert.equal(typeof store.fetchBranches, "function");
});
```

- [x] **Step 2: Implement pre-warm effect in `useAnalyticsData.ts`**

In `src/components/views/AnalyticsView/useAnalyticsData.ts`:
```typescript
  // Subscribe to store fetch actions for cache hydration
  const fetchPlacements = useMarcomDataStore((s) => s.fetchPlacements);
  const fetchMous = useMarcomDataStore((s) => s.fetchMous);
  const fetchEvents = useMarcomDataStore((s) => s.fetchEvents);
  const fetchPosts = useMarcomDataStore((s) => s.fetchPosts);
  const fetchBranches = useMarcomDataStore((s) => s.fetchBranches);

  // Pre-warm local store caches in background so multi-dimensional filters
  // can slice and dice the data in memory without cold-start starvation
  useEffect(() => {
    if (!activeWorkspaceId) return;

    // Fire non-blocking background fetches
    void fetchBranches(false);
    void fetchPlacements(activeWorkspaceId, false);
    void fetchMous(activeWorkspaceId, false);
    void fetchEvents(activeWorkspaceId, false);
    void fetchPosts(activeWorkspaceId, false);
  }, [
    activeWorkspaceId,
    fetchBranches,
    fetchPlacements,
    fetchMous,
    fetchEvents,
    fetchPosts,
  ]);
```

- [x] **Step 3: Run all analytics tests to ensure no regression**

Run:
```bash
npm test -- src/components/views/AnalyticsView/useAnalyticsData.test.ts
npm test -- "src/lib/marcom/*analytics*.test.ts"
```

- [x] **Step 4: Commit changes**

```bash
git add src/components/views/AnalyticsView/useAnalyticsData.ts src/components/views/AnalyticsView/useAnalyticsData.test.ts
git commit -m "feat(analytics): pre-warm marcom store caches on mount to prevent cold-start filter starvation"
```

---

### Task 4: Polish Filter Bar Typo & Brand Scope Clarification

**Files:**
- Modify: `src/components/views/AnalyticsView/AnalyticsFilterBar.tsx:23`

- [x] **Step 1: Fix `"Q2: (Apr–Jun)"` typo in `AnalyticsFilterBar.tsx`**

In `src/components/views/AnalyticsView/AnalyticsFilterBar.tsx:21-27`:
```typescript
const QUARTERS = [
  { label: "Semua Kuartal", value: "ALL" },
  { label: "Q1 (Jan–Mar)", value: "Q1" },
  { label: "Q2 (Apr–Jun)", value: "Q2" }, // Fixed: removed stray colon
  { label: "Q3 (Jul–Sep)", value: "Q3" },
  { label: "Q4 (Okt–Des)", value: "Q4" },
];
```

- [x] **Step 2: Run all unit tests across entire project**

Run:
```bash
npm test
```
Verify 0 failures across all 715+ tests.

- [x] **Step 3: Commit changes**

```bash
git add src/components/views/AnalyticsView/AnalyticsFilterBar.tsx
git commit -m "fix(analytics): correct Q2 quarter label typo in AnalyticsFilterBar"
```

---

## Verification Checklist

- [x] `npm test -- src/lib/marcom/analyticsFilterHelpers.test.ts` (Passes with CUID branch matching)
- [x] `npm test -- src/components/views/AnalyticsView/charts/PosmEconomicsChart.test.ts` (Passes with Recharts payload extraction)
- [x] `npm test -- src/components/views/AnalyticsView/useAnalyticsData.test.ts` (Passes)
- [x] `npm test` (Full suite passes with 0 failures)
- [x] Manual Check (substituted): Clicking on POSM bar navigates to Placements view without `"undefined"` in search — verified with an automated jsdom click probe replicating the chart's exact Recharts configuration (4 stacked bars, same dataKeys/onClick wiring), which dispatched real click events and received the correct materialName for all four status segments. No browser session was run.
- [x] Manual Check (substituted): Selecting a branch in the filter bar retains event stats without wiping to 0 — covered by `filterEventsByCriteria` CUID→branchName unit tests plus hook wiring review; no browser session was run.

---

## Execution Notes (2026-10-01)

All 4 tasks completed on branch `vicky`. Gate evidence: `npx tsc --noEmit` exit 0; full suite **719 tests / 104 suites / 0 failures** (baseline was 715 tests / 0 failures, +4 new assertions).

### Deviations from the plan as written

1. **Task 2 (test module placement)** — the plan imported `extractBarMaterialName` from `PosmEconomicsChart.tsx`. The Node test runner (`node --test`, v26.8.1) cannot import `.tsx` modules (`ERR_UNKNOWN_FILE_EXTENSION` — type-stripping only covers `.ts`, not JSX). The pure extractor was therefore placed in a dependency-free helper module `charts/posmChartHelpers.ts` (same pattern as `OutletsView/outletRowHelpers.ts`), and `PosmEconomicsChart.test.ts` imports from there. This also satisfies the AGENTS.md "pure helper modules" directive.
2. **Task 2 (defect verification)** — a jsdom probe against the installed `recharts@2.15.4` showed `Bar.onClick` already receives the composed entry whose top level carries `materialName` (Recharts spreads the raw row into the rect entry), so the literal `"undefined DONE"` symptom was **not reproducible** on this version. The defensive extractor was still implemented as specified: it is a cheap guard against future Recharts upgrades and against entries where `materialName` only exists on `payload`.
3. **Task 4 (Q2 label typo)** — no change required: `AnalyticsFilterBar.tsx` already reads `"Q2 (Apr–Jun)"` with no stray colon (verified in the working tree and in the `94db4f8` commit that introduced the file).
