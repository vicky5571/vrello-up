# POSM Quarterly Regional Reports Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dual-view POSM Quarterly & Campaign Theme reporting system for Regional Central Java (`vrello-up`), featuring an interactive operational tab with matrix drill-down in `PlacementsView` (Option A) and a formal executive report with branch comparisons in `ReportsView` (Option B), backed by a single shared pure calculation engine.

**Architecture:** A pure, zero-dependency analytics engine (`posmQuarterlyAnalytics.ts`) computes 2D matrix aggregations (Themes × Materials), KPI metrics, GPS integrity ratios, and branch-level rollups from the existing Prisma `Placement` records (`quarter` and `campaignTheme`). UI components in `PlacementsView` and `ReportsView` consume this single source of truth.

**Tech Stack:** React 19, TypeScript 5, Tailwind CSS v4, Lucide React, Node native test runner (`node --test`).

**Spec:** [`docs/superpowers/specs/2026-09-21-posm-quarterly-regional-reports-design.md`](file:///Users/mac/Web%20Development/vrello-up/docs/superpowers/specs/2026-09-21-posm-quarterly-regional-reports-design.md)

## Global Constraints
- Single Source of Truth: All types imported from `@/types` (`src/types/index.ts`).
- Strangler Pattern on God Files: Do NOT dump large code blocks into `PlacementsView.tsx` or `ReportsView.tsx`; extract modular components into `QuarterlyRecapTab.tsx` and `QuarterlyPosmReportTab.tsx`.
- Zero Database Migrations: Use existing `quarter` and `campaignTheme` fields on `Placement`.
- Evidence Before Assertions: Every task ends with verified tests using `npm test -- <test-file>` and `tsc --noEmit`. 0 failures required.

---

### Task 1: Domain Types Definition

**Files:**
- Modify: `src/types/index.ts`

**Interfaces:**
- Produces:
  - `PosmMatrixCell`
  - `PosmMatrixRow`
  - `PosmQuarterlyMatrix`
  - `PosmBranchBreakdown`
  - `PosmQuarterlyKpis`
  - `QuarterlyTargetAllocation`

- [ ] **Step 1: Append POSM Quarterly types to `src/types/index.ts`**

Add the interfaces to `src/types/index.ts`:
```typescript
export interface PosmMatrixCell {
  materialId: string;
  materialName: string;
  actual: number;
  target: number;
  percentage: number;
}

export interface PosmMatrixRow {
  theme: string;
  cells: Record<string, PosmMatrixCell>;
  totalActual: number;
  totalTarget: number;
  totalPercentage: number;
}

export interface PosmQuarterlyMatrix {
  quarter: string;
  materials: { id: string; name: string }[];
  rows: PosmMatrixRow[];
  columnTotals: Record<string, { actual: number; target: number; percentage: number }>;
  grandTotalActual: number;
  grandTotalTarget: number;
  grandTotalPercentage: number;
}

export interface PosmBranchBreakdown {
  branchId: string;
  branchName: string;
  totalPlacements: number;
  targetPlacements: number;
  percentage: number;
  validGpsCount: number;
  gpsIntegrityRate: number;
  topTheme: string;
}

export interface PosmQuarterlyKpis {
  totalActual: number;
  totalTarget: number;
  completionRate: number;
  validLocationCount: number;
  validLocationPercentage: number;
  averageDeviationMeters: number;
  activeOutletsCount: number;
}

export type QuarterlyTargetMap = Record<string, Record<string, number>>; // theme -> materialId -> target
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`  
Expected: PASS (0 errors)

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat(types): add posm quarterly report and matrix domain types"
```

---

### Task 2: Pure Calculation Analytics Engine (`posmQuarterlyAnalytics.ts`)

**Files:**
- Create: `src/lib/marcom/posmQuarterlyAnalytics.ts`
- Create: `src/lib/marcom/posmQuarterlyAnalytics.test.ts`

**Interfaces:**
- Consumes: `MarcomPlacement`, `Branch`, `Material`, types from `src/types/index.ts`
- Produces:
  - `getAvailableQuarters(placements: MarcomPlacement[], fallbackQuarter?: string): string[]`
  - `calculateQuarterKpis(placements: MarcomPlacement[], quarter: string, targets?: QuarterlyTargetMap, branchId?: string): PosmQuarterlyKpis`
  - `buildQuarterlyMatrix(placements: MarcomPlacement[], materials: { id: string; name: string }[], quarter: string, targets?: QuarterlyTargetMap, branchId?: string): PosmQuarterlyMatrix`
  - `calculateBranchBreakdown(placements: MarcomPlacement[], branches: Branch[], quarter: string, targets?: Record<string, number>): PosmBranchBreakdown[]`

- [ ] **Step 1: Write failing unit test suite `src/lib/marcom/posmQuarterlyAnalytics.test.ts`**

Write tests covering:
1. `getAvailableQuarters`: returns sorted unique quarters and includes fallback if provided.
2. `calculateQuarterKpis`: handles empty lists safely without NaN, aggregates actual count, valid location count, and average deviation.
3. `buildQuarterlyMatrix`: groups placements by `campaignTheme` (defaulting empty/null to "Reguler / Tanpa Tema") and material, calculates row/column totals and percentages correctly.
4. `calculateBranchBreakdown`: aggregates placements per branch and computes GPS integrity rate.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --import test/register-alias.mjs src/lib/marcom/posmQuarterlyAnalytics.test.ts`  
Expected: FAIL ("Cannot find module posmQuarterlyAnalytics")

- [ ] **Step 3: Implement minimal logic in `src/lib/marcom/posmQuarterlyAnalytics.ts`**

Implement the 4 pure functions using robust numeric safeguards (`target > 0 ? Math.round((actual / target) * 100) : 0`).

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --import test/register-alias.mjs src/lib/marcom/posmQuarterlyAnalytics.test.ts`  
Expected: PASS (All tests pass)

- [ ] **Step 5: Commit**

```bash
git add src/lib/marcom/posmQuarterlyAnalytics.ts src/lib/marcom/posmQuarterlyAnalytics.test.ts
git commit -m "feat(marcom): implement pure posm quarterly analytics calculation engine"
```

---

### Task 3: Operational Tab Component in PlacementsView (`QuarterlyRecapTab.tsx`)

**Files:**
- Create: `src/components/views/PlacementsView/QuarterlyRecapTab.tsx`
- Create: `src/components/views/PlacementsView/QuarterlyRecapTab.test.ts`

**Interfaces:**
- Consumes: `posmQuarterlyAnalytics.ts`, `MarcomPlacement`, `Branch`, `Material`
- Produces:
  - `QuarterlyRecapTab` component with props:
    - `placements: MarcomPlacement[]`
    - `branches: Branch[]`
    - `materials: Material[]`
    - `onDrillDown: (filters: { quarter: string; campaignTheme?: string; materialId?: string }) => void`

- [ ] **Step 1: Write unit test for QuarterlyRecap helpers in `QuarterlyRecapTab.test.ts`**

Test helper logic: filter sanitization, target allocation updates, and drill-down argument formatting.

- [ ] **Step 2: Run test to verify failure/missing module**

Run: `node --test --import test/register-alias.mjs src/components/views/PlacementsView/QuarterlyRecapTab.test.ts`

- [ ] **Step 3: Implement `QuarterlyRecapTab.tsx`**

Build:
- Quarter selector & Branch selector.
- KPI summary cards (Total Realisasi, Target Alokasi, Ketercapaian, GPS Valid Rate).
- Interactive 2D Matrix table with color-coded progress bars and clickable cells triggering `onDrillDown`.
- "Atur Target Alokasi" modal dialog with local storage persistence per workspace.

- [ ] **Step 4: Run test & verify pass**

Run: `node --test --import test/register-alias.mjs src/components/views/PlacementsView/QuarterlyRecapTab.test.ts`  
Run: `npx tsc --noEmit`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/views/PlacementsView/QuarterlyRecapTab.tsx src/components/views/PlacementsView/QuarterlyRecapTab.test.ts
git commit -m "feat(ui): add operational quarterly recap tab for placements view"
```

---

### Task 4: Integrate Operational Tab in `PlacementsView.tsx`

**Files:**
- Modify: `src/components/views/PlacementsView/PlacementsView.tsx`

**Interfaces:**
- Consumes: `QuarterlyRecapTab`

- [ ] **Step 1: Update view mode state in `PlacementsView.tsx`**

Change view toggle from boolean map/table to tri-state:
```typescript
const [activeTab, setActiveTab] = useState<"table" | "map" | "recap">("table");
```
Add `[ 📊 Rekap Kuartal & Tema ]` tab button in the sub-header.

- [ ] **Step 2: Implement drill-down handler**

```typescript
const handleDrillDown = useCallback((drillFilters: { quarter: string; campaignTheme?: string; materialId?: string }) => {
  setActiveTab("table");
  if (drillFilters.campaignTheme) {
    setSearchQuery(drillFilters.campaignTheme);
  }
  toast.info(`Menampilkan pemasangan: ${drillFilters.campaignTheme || "Semua"} (${drillFilters.quarter})`);
}, []);
```

- [ ] **Step 3: Render `QuarterlyRecapTab` conditionally when `activeTab === "recap"`**

- [ ] **Step 4: Verify compilation & run tests**

Run: `npx tsc --noEmit`  
Run: `npm test -- src/components/views/PlacementsView/OutletSearchCombobox.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/views/PlacementsView/PlacementsView.tsx
git commit -m "feat(ui): integrate operational quarterly recap tab in placements view"
```

---

### Task 5: Formal Executive Tab in ReportsView (`QuarterlyPosmReportTab.tsx`)

**Files:**
- Create: `src/components/views/ReportsView/QuarterlyPosmReportTab.tsx`
- Create: `src/components/views/ReportsView/QuarterlyPosmReportTab.test.ts`
- Modify: `src/components/views/ReportsView/ReportsView.tsx`

**Interfaces:**
- Consumes: `posmQuarterlyAnalytics.ts`, `MarcomPlacement`, `Branch`
- Produces:
  - `QuarterlyPosmReportTab` component for formal reporting and printing.

- [ ] **Step 1: Write unit tests for `QuarterlyPosmReportTab` helpers**

Test export CSV formatter and branch comparison table sorting.

- [ ] **Step 2: Implement `QuarterlyPosmReportTab.tsx`**

Features:
- Formal report header with "Laporan Eksekutif Distribusi POSM Regional Jawa Tengah".
- Quarter selector and executive narrative paragraph.
- KPI Overview and Inter-Branch Comparative Table (Semarang, Solo, Purwokerto, Kudus).
- Print CSS rules (`@media print`) and "Export CSV" action.

- [ ] **Step 3: Add tab selector in `ReportsView.tsx`**

Add top-level tab switcher:
`[ 📄 Laporan Bulanan ] [ 🎯 Rekap POSM Kuartalan ]`
Render `QuarterlyPosmReportTab` when second tab is active.

- [ ] **Step 4: Verify compilation & tests**

Run: `npx tsc --noEmit`  
Run: `node --test --import test/register-alias.mjs src/components/views/ReportsView/QuarterlyPosmReportTab.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/views/ReportsView/QuarterlyPosmReportTab.tsx src/components/views/ReportsView/QuarterlyPosmReportTab.test.ts src/components/views/ReportsView/ReportsView.tsx
git commit -m "feat(reports): add formal executive posm quarterly report tab in reports view"
```

---

### Task 6: Full Regression & System Verification

**Files:**
- All touched files

- [ ] **Step 1: Run TypeScript compiler check**

Run: `npx tsc --noEmit`  
Expected: PASS (0 errors)

- [ ] **Step 2: Run full regression test suite**

Run: `npm test`  
Expected: PASS (All 359+ tests pass, 0 failures, 0 regressions)

- [ ] **Step 3: Verification commit (if needed)**

```bash
git status
```
Confirm working tree is clean.
