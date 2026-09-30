# Architecture Spec: Remove Outlet Tier (Option 2A)

**Status:** Approved
**Date:** 2026-10-01
**Author:** Critical Senior Software Engineer
**Topic:** Complete Removal of Outlet Tier (Database, Domain Types, Pipeline, Analytics, and UI)

---

## 1. Context & Motivation

Under the updated operational brief, the concept of **Priority Tiers** (`TIER_1`, `TIER_2`, `TIER_3`) on retail outlets is obsolete and no longer needed in `vrello-up`. Previously, outlets were assigned a `tier` column in Master Data to indicate store classification, and this filtered into pipeline matrices, analytics penetration charts, and form inputs.

Per User Decision, **Option 2A** (Pure YAGNI Removal) is selected:
- Completely eradicate `tier` from the database, domain types, API routes, UI views, and test suites.
- Do not introduce artificial replacement fields or speculative abstractions.
- Re-balance the Analytics dashboard to a 3-card executive KPI header and a 5-chart layout (with the final chart spanning full width across both columns).

---

## 2. Invariants & Scope Boundaries

1. **Master Data Boundary**:
   - `Outlet` remains a global Master Data entity without `workspaceId`.
   - Removing `tier` drops `tier OutletTier` from `model Outlet` and deletes `enum OutletTier` from `prisma/schema.prisma`.
2. **Single Source of Truth**:
   - [`src/types/index.ts`](file:///Users/mac/Web%20Development/vrello-up/src/types/index.ts) is the sole source of truth for frontend entities. `OutletTier` must be removed; `Outlet` and `OutletItem` must not contain `tier`.
3. **Analytics Layout Integrity (Option 2A)**:
   - Executive KPIs drop from 4 cards to 3 cards (`grid-cols-1 md:grid-cols-3`):
     1. MOU SLA Turnaround
     2. POSM Physical Deployment
     3. Event Footfall Efficiency
   - Chart grid drops from 6 charts to 5 charts:
     1. MOU Turnaround SLA & Aging (BarChart)
     2. POSM Deployment Rate by Material (BarChart)
     3. Event Budget vs Footfall Efficiency (Scatter/BarChart)
     4. Top 5 Branch Velocity (BarChart)
     5. MoU Expiry Horizon (BarChart, styled with `lg:col-span-2` to cleanly anchor the bottom grid).
4. **Preserve Unrelated Domain Logic**:
   - `src/lib/marcom/placementMouBridge.ts` has a comment and internal resolution pattern termed "3-Tier Resolution" (referring to fallback priority: DB SSOT -> Domain Taxonomy -> Heuristic). This is **unrelated** to outlet tiers and MUST NOT be touched.

---

## 3. Subsystem Modifications

### 3.1 Database & Schema (`prisma/`)
- **`prisma/schema.prisma`**:
  - Remove `enum OutletTier`.
  - Remove `tier OutletTier` from `model Outlet`.
- **`prisma/seed.ts`**:
  - Remove `tier: outletTiers[...]` from the outlet creation generator loop.
  - Remove unused `outletTiers` array.

### 3.2 Domain Types (`src/types/`)
- **`src/types/index.ts`**:
  - Remove `export type OutletTier = "TIER_1" | "TIER_2" | "TIER_3";`.
  - Remove `tier?: OutletTier;` from `interface OutletItem`.
  - Remove `tier: string;` from `interface Outlet`.

### 3.3 Backend API Routes & Filters (`src/app/api/`)
- **`src/app/api/marcom/outlets/outletsSearchFilter.ts`**:
  - Remove `OutletTier` import.
  - Remove `tier` from `OutletFilterParams`.
  - Remove `searchParams.get("tier")` and `where.tier` filtering.
- **`src/app/api/marcom/outlets/draft/draftOutletHelpers.ts`**:
  - Remove `OutletTier` import.
  - Remove `tier` from `DraftOutletPayload` and draft mapping.
- **`src/app/api/marcom/pipeline/route.ts`**:
  - Remove `VALID_TIERS`.
  - Remove `tier` query parameter extraction and Prisma `outletWhere.tier` filtering.

### 3.4 Marcom Core Engines & Analytics (`src/lib/marcom/`)
- **`src/lib/marcom/analyticsEngine.ts`**:
  - Remove `OutletTierCoverageResult` interface.
  - Remove `tier1Penetration` from `ExecutiveKpis`.
  - Remove `outletTierCoverage` from `AnalyticsDashboardData`.
  - Delete `calculateOutletTierCoverage` function.
  - Update `buildExecutiveKpis` to remove `tierResult` parameter and `tier1Penetration`.
  - Update `calculateDashboardAnalytics` signature and returned payload.
- **`src/lib/marcom/analyticsFacade.ts`**:
  - Remove `tier?: string | null` from `OutletInput`.
- **`src/lib/marcom/outletAnalytics.ts`**:
  - Remove `tier?: string` from `OutletInput`.
  - Remove `tier1Count`, `tier2Count`, `tier3Count` from `EnhancedOutletKPIs`.
  - Remove `tierLabel` from `OutletMarkerMeta`.
- **`src/lib/marcom/pipelineEngine.ts`**:
  - Remove `OutletTier` import.
  - Remove `tier?: OutletTier | string` from `PipelineOutletInput`.
  - Remove `tier` mapping in `transformOutletToPipelineRow`.
  - Remove `tier` filter from `PipelineFilterOptions` and `filterPipelineRows`.

### 3.5 Frontend Views & Components (`src/components/views/`)
- **`OutletsView/`**:
  - `OutletsView.tsx`: Remove `OutletTier` import/export, remove `<th>Tier</th>` and table cell, remove Tier filter dropdown from toolbar.
  - `OutletFormModal.tsx`: Remove `tier` state, `errors.tier`, and the Tier `<select>` input.
  - `SubmitDraftOutletModal.tsx`: Remove `tier` input and default state.
  - `outletFormHelpers.ts`: Remove `errors.tier = "Outlet tier is required"`, remove `tier` normalization.
  - `submitDraftOutletHelpers.ts`: Remove `tier` from draft form state and payload.
  - `outletRowHelpers.ts`: Remove `formatTierAndBrand` helper or simplify to brand-only badge.
  - `OutletExpandedRow.tsx`: Remove `tier` rendering.
  - `OutletMapView.tsx`: Remove `selectedTier` filter state, dropdown, and marker filtering.
- **`PipelineView/`**:
  - `pipelineTypes.ts`: Remove `tier` from `PipelineFilters`, `DEFAULT_PIPELINE_FILTERS`, and sort fields.
  - `PipelineFilterBar.tsx`: Remove Tier filter dropdown.
  - `PipelineMatrixTable.tsx`: Remove Tier column header and `renderTierBadge(outlet.tier)` cell.
  - `PipelineCockpitCardList.tsx`: Remove tier badge.
- **`PlacementsView/`**:
  - `OutletSearchCombobox.tsx`: Remove `Tier: {currentOutlet.tier}` metadata and `• {outlet.tier}` text.
  - `outletSearchComboboxHelpers.ts`: Remove `tier?: string`.
- **`AnalyticsView/`**:
  - `AnalyticsView.tsx`:
    - Update KPI card grid from `lg:grid-cols-4` to `md:grid-cols-3`.
    - Delete Card 3 ("Penetrasi Tier 1").
    - Delete Chart 3 ("Penetrasi Branding Fisik per Tier Toko").
    - Update Chart 5 (MoU Expiry Horizon) with `lg:col-span-2` to create a balanced 2-column layout.

### 3.6 Test Suites
Update test fixtures, mocks, and assertions across:
1. `src/lib/marcom/analyticsEngine.test.ts`
2. `src/lib/marcom/outletAnalytics.test.ts`
3. `src/lib/marcom/pipelineEngine.test.ts`
4. `src/lib/marcom/workItemsTenant.test.ts`
5. `src/components/views/OutletsView/outletFormHelpers.test.ts`
6. `src/components/views/OutletsView/SubmitDraftOutletModal.test.ts`
7. `src/components/views/OutletsView/OutletApprovalQueueTab.test.ts`
8. `src/components/views/PipelineView/pipelineLogic.test.ts`
9. `src/app/api/marcom/pipeline/pipelineApi.test.ts`

---

## 4. Verification & Success Criteria

1. **Clean Prisma Generation**: `npx prisma generate` succeeds without errors.
2. **Zero TypeScript Errors**: `npx tsc --noEmit` passes with 0 diagnostic errors.
3. **100% Test Suite Green**: `npm test` passes all tests with 0 failures across the entire suite.
4. **Visual & UI Invariants**:
   - Outlets table renders smoothly without missing column offset.
   - Pipeline matrix table and filter bar function without references to tier.
   - Analytics view renders 3 KPI cards and 5 balanced charts with zero console warnings or undefined object access errors.
