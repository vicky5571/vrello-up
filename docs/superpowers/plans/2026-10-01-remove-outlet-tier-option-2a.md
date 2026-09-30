# Remove Outlet Tier (Option 2A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eradicate the obsolete `tier` field from retail outlets across the database schema, domain types, API routes, engines, UI views, and test suites, updating the Analytics dashboard to a clean 3-KPI and 5-chart layout (Option 2A).

**Architecture:** Pure YAGNI removal of `OutletTier` across all architectural tiers. Master Data schema in Prisma and SSOT types in `src/types/index.ts` drop `tier` completely. Analytics and Pipeline engines are streamlined without speculative replacements, and the Analytics dashboard is rebalanced into 3 executive KPI cards and 5 responsive charts.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5, Prisma (PostgreSQL), Recharts, Tailwind CSS v4, Node test runner (`node --test`).

**Spec:** [`docs/superpowers/specs/2026-10-01-remove-outlet-tier-option-2a-design.md`](file:///Users/mac/Web%20Development/vrello-up/docs/superpowers/specs/2026-10-01-remove-outlet-tier-option-2a-design.md)

## Global Constraints

- Master Data Invariant: `Outlet` remains a global Master Data entity without `workspaceId`.
- Single Source of Truth: All domain entities (`Outlet`, `OutletItem`) are strictly imported from `src/types/index.ts`. No inline interface duplicates.
- Preservation Invariant: `src/lib/marcom/placementMouBridge.ts` "3-Tier Resolution" algorithm refers to material governance priority, NOT outlet tiers — DO NOT touch or rename it.
- Zero Test Regressions: Every modified subsystem must pass with 0 test failures under `npm test`.

---

### Task 1: Database Schema & Master Domain Types

**Files:**
- Modify: `prisma/schema.prisma:50-56,120-135`
- Modify: `prisma/seed.ts:910-930`
- Modify: `src/types/index.ts:530-580`

**Interfaces:**
- Consumes: None (Root Data Layer)
- Produces: Updated Prisma Client and domain `Outlet` / `OutletItem` interfaces without `tier` / `OutletTier`.

- [x] **Step 1: Update `prisma/schema.prisma`**
  - Delete `enum OutletTier` block (lines 51-55):
    ```prisma
    enum OutletTier {
      TIER_1
      TIER_2
      TIER_3
    }
    ```
  - In `model Outlet`, delete line 124: `tier OutletTier`.

- [x] **Step 2: Generate Prisma Client**
  - Run: `npx prisma generate`
  - Expected: "Generated Prisma Client ... successfully."

- [x] **Step 3: Update `prisma/seed.ts`**
  - Remove `const outletTiers = ["TIER_1", "TIER_2", "TIER_3"] as const;` if present or remove `tier: outletTiers[(index + 1) % outletTiers.length]` from outlet record creation.

- [x] **Step 4: Update `src/types/index.ts`**
  - Delete `export type OutletTier = "TIER_1" | "TIER_2" | "TIER_3";`
  - Remove `tier?: OutletTier;` from `interface OutletItem`
  - Remove `tier: string;` from `interface Outlet`

- [x] **Step 5: Verify Prisma and Types compile**
  - Run: `npx tsc --noEmit --skipLibCheck || true` (Observe TypeScript diagnostics acknowledging removal of `tier`)

- [x] **Step 6: Commit**
  ```bash
  git add prisma/schema.prisma prisma/seed.ts src/types/index.ts
  git commit -m "refactor(schema): remove tier from outlet model and domain types"
  ```

---

### Task 2: Backend API Endpoints & Search Filters

**Files:**
- Modify: `src/app/api/marcom/outlets/outletsSearchFilter.ts`
- Modify: `src/app/api/marcom/outlets/draft/draftOutletHelpers.ts`
- Modify: `src/app/api/marcom/pipeline/route.ts`
- Modify: `src/app/api/marcom/pipeline/pipelineApi.test.ts`

**Interfaces:**
- Consumes: Prisma Client (from Task 1)
- Produces: Clean API endpoints for `/api/marcom/outlets` and `/api/marcom/pipeline` without tier query filtering.

- [x] **Step 1: Update `src/app/api/marcom/outlets/outletsSearchFilter.ts`**
  - Remove `OutletTier` from `@prisma/client` import.
  - Remove `tier?: string | OutletTier | null;` from `OutletFilterParams`.
  - Remove `tier` query parsing (`searchParams.get("tier")`) and `where.tier = tier as OutletTier`.

- [x] **Step 2: Update `src/app/api/marcom/outlets/draft/draftOutletHelpers.ts`**
  - Remove `OutletTier` from `@/types` import.
  - Remove `tier` from `DraftOutletPayload` and creation mappings.

- [x] **Step 3: Update `src/app/api/marcom/pipeline/route.ts`**
  - Remove `VALID_TIERS` constant.
  - Remove `tier` query parameter extraction and `outletWhere.tier` filtering.

- [x] **Step 4: Update `src/app/api/marcom/pipeline/pipelineApi.test.ts`**
  - Remove test cases and assertions testing `filterPipelineRows(..., { tier: "TIER_2" })` and mock objects with `tier: "TIER_1"`.

- [x] **Step 5: Run pipeline API test to verify**
  - Run: `npm test -- src/app/api/marcom/pipeline/pipelineApi.test.ts`
  - Expected: PASS with 0 failures.

- [x] **Step 6: Commit**
  ```bash
  git add src/app/api/marcom/outlets/outletsSearchFilter.ts src/app/api/marcom/outlets/draft/draftOutletHelpers.ts src/app/api/marcom/pipeline/route.ts src/app/api/marcom/pipeline/pipelineApi.test.ts
  git commit -m "refactor(api): remove tier filtering from outlets and pipeline endpoints"
  ```

---

### Task 3: Marcom Core Engines (Analytics, Outlet Analytics, Pipeline Engine)

**Files:**
- Modify: `src/lib/marcom/analyticsFacade.ts`
- Modify: `src/lib/marcom/outletAnalytics.ts`
- Modify: `src/lib/marcom/outletAnalytics.test.ts`
- Modify: `src/lib/marcom/pipelineEngine.ts`
- Modify: `src/lib/marcom/pipelineEngine.test.ts`
- Modify: `src/lib/marcom/workItemsTenant.test.ts`
- Modify: `src/lib/marcom/analyticsEngine.ts`
- Modify: `src/lib/marcom/analyticsEngine.test.ts`

**Interfaces:**
- Consumes: Updated `src/types/index.ts`
- Produces:
  - `calculateDashboardAnalytics(...)` returning 3 executive KPIs (mouSla, posmDeployment, eventEfficiency) and 5 analytics charts.
  - `transformOutletToPipelineRow(...)` without `tier`.
  - `calculateEnhancedOutletKPIs(...)` without `tier1Count`, `tier2Count`, `tier3Count`.

- [x] **Step 1: Update `src/lib/marcom/outletAnalytics.ts` & test**
  - In `OutletInput`: remove `tier?: string`.
  - In `EnhancedOutletKPIs`: remove `tier1Count`, `tier2Count`, `tier3Count`.
  - In `calculateEnhancedOutletKPIs`: remove `tier1Count`, `tier2Count`, `tier3Count` counters and return properties.
  - In `OutletMarkerMeta`: remove `tierLabel`.
  - In `getOutletMarkerMeta`: remove `tier` argument, `tierLabel` calculation and return.
  - In `src/lib/marcom/outletAnalytics.test.ts`: remove tier fields from mock outlets and assertions.
  - Run: `npm test -- src/lib/marcom/outletAnalytics.test.ts` (Expected: PASS).

- [x] **Step 2: Update `src/lib/marcom/pipelineEngine.ts` & test**
  - Remove `OutletTier` import.
  - In `PipelineOutletInput`: remove `tier?: OutletTier | string`.
  - In `PipelineFilterOptions`: remove `tier?: string | null`.
  - In `transformOutletToPipelineRow`: remove `tier: outlet.tier || ""`.
  - In `filterPipelineRows`: remove `const tier = filters.tier; ... if (tier ...)` block.
  - In `src/lib/marcom/pipelineEngine.test.ts` & `src/lib/marcom/workItemsTenant.test.ts`: remove `tier` from mock outlets and filter assertions.
  - Run: `npm test -- src/lib/marcom/pipelineEngine.test.ts src/lib/marcom/workItemsTenant.test.ts` (Expected: PASS).

- [x] **Step 3: Update `src/lib/marcom/analyticsFacade.ts`**
  - In `OutletInput`: remove `tier?: string | null`.

- [x] **Step 4: Update `src/lib/marcom/analyticsEngine.ts` & test**
  - Remove `OutletTierCoverageResult` interface and `TierCoverageMetric` (or unused tier types).
  - In `ExecutiveKpis`: remove `tier1Penetration: { ... }`.
  - In `AnalyticsDashboardData`: remove `outletTierCoverage: OutletTierCoverageResult`.
  - Delete `calculateOutletTierCoverage` function.
  - In `buildExecutiveKpis`: remove `tierResult: OutletTierCoverageResult` parameter, remove `tier1` calculations, return only `mouSla`, `posmDeployment`, and `eventEfficiency`.
  - In `calculateDashboardAnalytics`: remove `const outletTierCoverage = calculateOutletTierCoverage(...)`, remove `tierResult` passed to `buildExecutiveKpis`, and remove `outletTierCoverage` from return object.
  - In `src/lib/marcom/analyticsEngine.test.ts`:
    - Remove import of `calculateOutletTierCoverage`.
    - Delete `describe("calculateOutletTierCoverage", ...)` suite.
    - Update `calculateDashboardAnalytics` test to assert 3 KPI cards (`mouSla`, `posmDeployment`, `eventEfficiency`) and assert `outletTierCoverage` is undefined.
  - Run: `npm test -- src/lib/marcom/analyticsEngine.test.ts` (Expected: PASS).

- [x] **Step 5: Commit**
  ```bash
  git add src/lib/marcom/analyticsFacade.ts src/lib/marcom/outletAnalytics.ts src/lib/marcom/outletAnalytics.test.ts src/lib/marcom/pipelineEngine.ts src/lib/marcom/pipelineEngine.test.ts src/lib/marcom/workItemsTenant.test.ts src/lib/marcom/analyticsEngine.ts src/lib/marcom/analyticsEngine.test.ts
  git commit -m "refactor(marcom): remove tier calculations from analytics and pipeline engines"
  ```

---

### Task 4: Outlets View Components & Validation Helpers

**Files:**
- Modify: `src/components/views/OutletsView/outletFormHelpers.ts`
- Modify: `src/components/views/OutletsView/outletFormHelpers.test.ts`
- Modify: `src/components/views/OutletsView/submitDraftOutletHelpers.ts`
- Modify: `src/components/views/OutletsView/SubmitDraftOutletModal.test.ts`
- Modify: `src/components/views/OutletsView/OutletApprovalQueueTab.test.ts`
- Modify: `src/components/views/OutletsView/outletRowHelpers.ts`
- Modify: `src/components/views/OutletsView/OutletFormModal.tsx`
- Modify: `src/components/views/OutletsView/SubmitDraftOutletModal.tsx`
- Modify: `src/components/views/OutletsView/OutletExpandedRow.tsx`
- Modify: `src/components/views/OutletsView/OutletMapView.tsx`
- Modify: `src/components/views/OutletsView/OutletsView.tsx`

**Interfaces:**
- Consumes: Updated `src/types/index.ts`
- Produces: Outlets UI without tier columns, filters, form fields, or validation errors.

- [x] **Step 1: Update outlet form helpers and tests**
  - In `outletFormHelpers.ts`: remove `errors.tier = "Outlet tier is required"`, remove `tier` property normalization in `normalizeOutletPayload` and `resetOutletForm`.
  - In `outletFormHelpers.test.ts`: remove tests expecting `errors.tier`.
  - In `submitDraftOutletHelpers.ts` & `SubmitDraftOutletModal.test.ts`: remove `tier: OutletTier` from `DraftOutletFormState` and test fixtures.
  - In `OutletApprovalQueueTab.test.ts`: remove `tier` from mock outlets.
  - Run: `npm test -- src/components/views/OutletsView/outletFormHelpers.test.ts src/components/views/OutletsView/SubmitDraftOutletModal.test.ts src/components/views/OutletsView/OutletApprovalQueueTab.test.ts` (Expected: PASS).

- [x] **Step 2: Update `outletRowHelpers.ts` and `OutletExpandedRow.tsx`**
  - In `outletRowHelpers.ts`: change `formatTierAndBrand(tier, brand)` to `formatBrand(brand)` or remove tier references.
  - In `OutletExpandedRow.tsx`: remove tier badge display.

- [x] **Step 3: Update `OutletFormModal.tsx` and `SubmitDraftOutletModal.tsx`**
  - In `OutletFormModal.tsx`: remove `tier` state field, remove Tier `<select>` label and options, remove `errors.tier` feedback.
  - In `SubmitDraftOutletModal.tsx`: remove Tier input and initial `tier: "TIER_1"` state.

- [x] **Step 4: Update `OutletsView.tsx` and `OutletMapView.tsx`**
  - In `OutletsView.tsx`: remove `OutletTier` from imports/exports; remove `<th>Tier</th>` column header and `<td>` tier cell; remove Tier filter dropdown from the toolbar.
  - In `OutletMapView.tsx`: remove `selectedTier` filter state, dropdown selector, and `(o.tier || "TIER_1") !== selectedTier` filter check.

- [x] **Step 5: Run outlets tests to verify**
  - Run: `npm test -- src/components/views/OutletsView/outletFormHelpers.test.ts src/components/views/OutletsView/SubmitDraftOutletModal.test.ts src/components/views/OutletsView/OutletApprovalQueueTab.test.ts`
  - Expected: PASS with 0 failures.

- [x] **Step 6: Commit**
  ```bash
  git add src/components/views/OutletsView/
  git commit -m "refactor(outlets-view): remove tier columns, filters, form fields, and validations"
  ```

---

### Task 5: Pipeline & Placements View Components

**Files:**
- Modify: `src/components/views/PipelineView/pipelineTypes.ts`
- Modify: `src/components/views/PipelineView/pipelineLogic.test.ts`
- Modify: `src/components/views/PipelineView/PipelineFilterBar.tsx`
- Modify: `src/components/views/PipelineView/PipelineMatrixTable.tsx`
- Modify: `src/components/views/PipelineView/PipelineCockpitCardList.tsx`
- Modify: `src/components/views/PlacementsView/OutletSearchCombobox.tsx`
- Modify: `src/components/views/PlacementsView/outletSearchComboboxHelpers.ts`

**Interfaces:**
- Consumes: Updated `pipelineEngine.ts` and `src/types/index.ts`
- Produces: Pipeline UI and Placement outlet combobox without tier references.

- [x] **Step 1: Update `pipelineTypes.ts` & `pipelineLogic.test.ts`**
  - In `pipelineTypes.ts`: remove `tier: string` from `PipelineFilters`, remove `tier: "ALL"` from `DEFAULT_PIPELINE_FILTERS`, remove `"tier"` from sort field union and comparator switch case.
  - In `pipelineLogic.test.ts`: remove `tier` from test fixtures and assertions.
  - Run: `npm test -- src/components/views/PipelineView/pipelineLogic.test.ts` (Expected: PASS).

- [x] **Step 2: Update `PipelineFilterBar.tsx`**
  - Remove Tier `<select>` filter dropdown and associated state handlers.

- [x] **Step 3: Update `PipelineMatrixTable.tsx` & `PipelineCockpitCardList.tsx`**
  - In `PipelineMatrixTable.tsx`: remove `<th>Tier</th>` column header and `renderTierBadge(outlet.tier)` cell.
  - In `PipelineCockpitCardList.tsx`: remove `renderTierBadge(outlet.tier)`.

- [x] **Step 4: Update `OutletSearchCombobox.tsx` & `outletSearchComboboxHelpers.ts`**
  - In `outletSearchComboboxHelpers.ts`: remove `tier?: string` from `ComboboxOutletItem`.
  - In `OutletSearchCombobox.tsx`: remove `Tier: {currentOutlet.tier}` metadata and `• {outlet.tier}` text in search item list.

- [x] **Step 5: Run pipeline logic test to verify**
  - Run: `npm test -- src/components/views/PipelineView/pipelineLogic.test.ts`
  - Expected: PASS with 0 failures.

- [x] **Step 6: Commit**
  ```bash
  git add src/components/views/PipelineView/ src/components/views/PlacementsView/
  git commit -m "refactor(pipeline-placements): remove tier controls, columns, and search badges"
  ```

---

### Task 6: Analytics Dashboard (Option 2A 3-KPI + 5-Chart Layout) & End-to-End Verification

**Files:**
- Modify: `src/components/views/AnalyticsView/AnalyticsView.tsx`

**Interfaces:**
- Consumes: `calculateDashboardAnalytics` returning `{ kpis: { mouSla, posmDeployment, eventEfficiency }, ... }`
- Produces: Clean Analytics dashboard UI adhering to Option 2A (3 KPI cards, 5 charts with Chart 5 spanning 2 columns).

- [x] **Step 1: Update Top KPI Header in `AnalyticsView.tsx`**
  - Change KPI grid container class from `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` to `grid-cols-1 md:grid-cols-3`.
  - Remove Card 3 (`data.kpis.tier1Penetration`) completely:
    ```tsx
    // Remove:
    <KpiCard
      title="Penetrasi Toko Prioritas"
      value={`${data.kpis.tier1Penetration.rate}%`}
      ...
    />
    ```
  - The 3 remaining KPI cards are:
    1. Turnaround SLA MOU (`data.kpis.mouSla`)
    2. Deployment POSM Fisik (`data.kpis.posmDeployment`)
    3. Efisiensi Biaya Event (`data.kpis.eventEfficiency`)

- [x] **Step 2: Update Chart Grid in `AnalyticsView.tsx`**
  - Remove Chart 3 ("Penetrasi Branding Fisik per Tier Toko") and its `<BarChart data={data.outletTierCoverage.tiers} ...>` completely.
  - Update Chart 5 ("Horizon Kedaluwarsa MOU (30/60/90 Hari)") by adding `lg:col-span-2` to its container card class:
    - Row 1: Chart 1 (MOU Turnaround SLA) + Chart 2 (POSM Deployment Rate by Material)
    - Row 2: Chart 3 (Event Budget vs Footfall) + Chart 4 (Top 5 Branch Velocity)
    - Row 3: Chart 5 (MoU Expiry Horizon) spanning full width (`lg:col-span-2`), completing a balanced layout.

- [x] **Step 3: Run full TypeScript diagnostics**
  - Run: `npx tsc --noEmit`
  - Expected: Clean output with 0 errors.

- [x] **Step 4: Run full test suite**
  - Run: `npm test`
  - Expected: 100% passing tests (all 700+ tests pass with 0 failures).

- [x] **Step 5: Commit**
  ```bash
  git add src/components/views/AnalyticsView/AnalyticsView.tsx
  git commit -m "feat(analytics): adapt layout to 3 executive KPIs and 5 charts for option 2a"
  ```
