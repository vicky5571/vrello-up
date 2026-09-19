# Pipeline View & Enhanced Outlet 360° Drawer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a unified Marcom Pipeline View that aggregates Outlets, MoUs, POSM Placements, Field Events, and Social Content into a single operational cockpit, with a Responsive Hybrid UI (Desktop Matrix Table + Mobile Cockpit Cards) and an enhanced 5-tab `Outlet360Drawer`.

**Architecture:** A pure rollup engine (`pipelineEngine.ts`) transforms multi-module state into structured `OutletPipelineRow` items. A dedicated `GET /api/marcom/pipeline` endpoint serves cached/pre-computed rollups, while `GET /api/marcom/outlets/[id]` provides enriched event/content data to the enhanced `Outlet360Drawer`. The frontend utilizes Tailwind responsive breakpoints (`hidden md:block` vs `block md:hidden`) to seamlessly render a high-density Matrix Table on desktop and a thumb-friendly Cockpit Card stack on mobile.

**Tech Stack:** Next.js 15.2.0 (App Router), React 19, TypeScript 5, Tailwind CSS v4, Lucide React, Node.js native test runner (`node:test`), Playwright E2E.

**Spec:** [`docs/superpowers/specs/2026-09-20-pipeline-view-design.md`](file:///Users/mac/Web%20Development/vrello-up/docs/superpowers/specs/2026-09-20-pipeline-view-design.md)

## Global Constraints
- Preserve dual-persistence discipline (offline/quota-aware localStorage + PostgreSQL).
- Maintain 100% pass rate on the existing 268 unit tests and 6 Playwright smoke tests.
- Keep the 9 existing specialized Marcom views intact with zero regressions.
- Do not dump new business logic into god files (`useWorkspaceStore.ts`); keep components and engines modular.
- Zero horizontal scrolling on mobile viewports (< 768px).

---

### Task 1: Core Domain Types & Pure Pipeline Rollup Engine

**Files:**
- Create: `src/lib/marcom/pipelineEngine.ts`
- Test: `src/lib/marcom/pipelineEngine.test.ts`
- Modify: `src/types/index.ts:167-185`

**Interfaces:**
- Consumes: `Outlet`, `Mou`, `Placement`, `FieldEvent`, `ContentPost` from `@/types` and `isPermanentMaterial` from `@/lib/marcom/placementMouBridge`.
- Produces: `OutletPipelineRow` type and `buildOutletPipelineRows()` function:
  ```typescript
  export interface OutletPipelineRow {
    id: string;
    code: string;
    name: string;
    type: string;
    tier: string;
    city: string;
    address: string;
    picName: string;
    picPhone: string;
    active: boolean;
    branch: { id: string; name: string; code: string };
    mouSummary: {
      total: number;
      latestStatus: "APPROVED" | "SUBMITTED" | "DRAFT" | "REJECTED" | "NONE";
      compensationValue: number;
      isHealthy: boolean;
    };
    placementSummary: {
      total: number;
      doneCount: number;
      pendingCount: number;
      totalCost: number;
      hasBlockedItems: boolean;
    };
    eventSummary: {
      total: number;
      upcomingCount: number;
      nearestEventName?: string;
      nearestEventDate?: string;
      status?: string;
    };
    contentSummary: {
      total: number;
      publishedCount: number;
      inReviewCount: number;
      latestPlatform?: string;
    };
  }
  ```

- [ ] **Step 1: Write failing unit test `src/lib/marcom/pipelineEngine.test.ts`**

```typescript
import test from "node:test";
import assert from "node:assert/strict";
import { buildOutletPipelineRows } from "@/lib/marcom/pipelineEngine";

test("pipelineEngine: transforms outlet with approved MoU, completed placements, event and content", () => {
  const outlets = [
    {
      id: "outlet-1",
      code: "OUT-001",
      name: "Toko Berkah",
      type: "MODERN_RETAIL",
      tier: "TIER_1",
      city: "Semarang",
      address: "Jl. Pemuda 10",
      picName: "Budi",
      picPhone: "08123456789",
      active: true,
      branchId: "branch-1",
      branch: { id: "branch-1", name: "Semarang", code: "SMG" },
      mous: [
        { id: "mou-1", status: "APPROVED", compensationValue: 12000000, outletId: "outlet-1" },
      ],
      placements: [
        { id: "plc-1", status: "DONE", cost: 2500000, material: { name: "Signboard", type: "PERMANENT" } },
        { id: "plc-2", status: "DONE", cost: 1500000, material: { name: "Neon Box", type: "PERMANENT" } },
      ],
    },
  ];

  const events = [
    {
      id: "evt-1",
      name: "Semarang Expo",
      branchName: "Semarang",
      location: "Toko Berkah",
      startDate: new Date("2026-10-15").toISOString(),
      status: "UPCOMING",
    },
  ];

  const contents = [
    {
      id: "cnt-1",
      title: "Reel Promo Berkah",
      branchName: "Semarang",
      platform: "instagram",
      status: "PUBLISHED",
      publishDate: new Date("2026-10-01").toISOString(),
    },
  ];

  const result = buildOutletPipelineRows(outlets, events, contents);
  assert.equal(result.length, 1);
  const row = result[0];
  assert.equal(row.id, "outlet-1");
  assert.equal(row.mouSummary.latestStatus, "APPROVED");
  assert.equal(row.mouSummary.isHealthy, true);
  assert.equal(row.placementSummary.total, 2);
  assert.equal(row.placementSummary.doneCount, 2);
  assert.equal(row.placementSummary.hasBlockedItems, false);
  assert.equal(row.eventSummary.total, 1);
  assert.equal(row.eventSummary.nearestEventName, "Semarang Expo");
  assert.equal(row.contentSummary.publishedCount, 1);
});

test("pipelineEngine: detects bottleneck when permanent placement lacks approved MoU", () => {
  const outlets = [
    {
      id: "outlet-2",
      code: "OUT-002",
      name: "Minimarket Surya",
      type: "TRADITIONAL",
      tier: "TIER_2",
      city: "Solo",
      address: "Jl. Slamet Riyadi",
      picName: "Agus",
      picPhone: "08987654321",
      active: true,
      branchId: "branch-2",
      branch: { id: "branch-2", name: "Solo", code: "SLO" },
      mous: [
        { id: "mou-2", status: "SUBMITTED", compensationValue: 5000000, outletId: "outlet-2" },
      ],
      placements: [
        { id: "plc-3", status: "PENDING", cost: 3000000, material: { name: "Shopblind", type: "PERMANENT" } },
      ],
    },
  ];

  const result = buildOutletPipelineRows(outlets, [], []);
  assert.equal(result.length, 1);
  const row = result[0];
  assert.equal(row.mouSummary.latestStatus, "SUBMITTED");
  assert.equal(row.mouSummary.isHealthy, false);
  assert.equal(row.placementSummary.hasBlockedItems, true);
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test -- src/lib/marcom/pipelineEngine.test.ts`  
Expected: FAIL with module `@/lib/marcom/pipelineEngine` not found.

- [ ] **Step 3: Implement `src/lib/marcom/pipelineEngine.ts` and add `"pipeline"` to `ViewMode` in `src/types/index.ts`**

Update `src/types/index.ts` to include `"pipeline"` in `ViewMode`.  
Create `src/lib/marcom/pipelineEngine.ts` implementing `buildOutletPipelineRows()`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/marcom/pipelineEngine.test.ts`  
Expected: PASS (2/2 tests passing).

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts src/lib/marcom/pipelineEngine.ts src/lib/marcom/pipelineEngine.test.ts
git commit -m "feat(marcom): add pipelineEngine rollup logic and unit tests"
```

---

### Task 2: Dedicated API Endpoint `GET /api/marcom/pipeline` & Extended Outlet Detail

**Files:**
- Create: `src/app/api/marcom/pipeline/route.ts`
- Modify: `src/app/api/marcom/outlets/[id]/route.ts:20-44`
- Test: `src/app/api/marcom/pipeline/pipelineApi.test.ts`

**Interfaces:**
- Consumes: Prisma models (`outlet`, `placement`, `mou`, `fieldEvent`, `contentPost`), `requireMember`, `buildOutletPipelineRows`.
- Produces:
  - `GET /api/marcom/pipeline?q=&branchId=&tier=&bottleneckOnly=` returning `{ total: number, data: OutletPipelineRow[] }`.
  - `GET /api/marcom/outlets/[id]` returning outlet with `branch`, `placements`, `mous`, `events`, and `contents`.

- [ ] **Step 1: Write test `src/app/api/marcom/pipeline/pipelineApi.test.ts`**

Validate filtering logic on mock data sets (filtering by branch, search query, and bottleneck flag).

- [ ] **Step 2: Run test to verify failure**

Run: `npm test -- src/app/api/marcom/pipeline/pipelineApi.test.ts`  
Expected: FAIL (route or filter helper not yet implemented).

- [ ] **Step 3: Implement `src/app/api/marcom/pipeline/route.ts` and update `src/app/api/marcom/outlets/[id]/route.ts`**

Implement `GET /api/marcom/pipeline`:
1. Check session auth with `requireMember("ws-main")`.
2. Query `prisma.outlet.findMany` including `branch`, `placements`, and `mous`.
3. Query `prisma.fieldEvent.findMany` and `prisma.contentPost.findMany`.
4. Apply `buildOutletPipelineRows` and filter params.
5. Return JSON payload `{ total: data.length, data }`.

Update `src/app/api/marcom/outlets/[id]/route.ts`:
Include events matching `branchName` or outlet name, and content posts matching `branchName`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/app/api/marcom/pipeline/pipelineApi.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/marcom/pipeline/route.ts src/app/api/marcom/pipeline/pipelineApi.test.ts src/app/api/marcom/outlets/[id]/route.ts
git commit -m "feat(marcom): add /api/marcom/pipeline route and enrich outlet detail"
```

---

### Task 3: Enhanced `Outlet360Drawer` with Events & Content Tabs

**Files:**
- Modify: `src/components/views/OutletsView/Outlet360Drawer.tsx:47-150, 450-636`

**Interfaces:**
- Consumes: Enriched outlet response from `GET /api/marcom/outlets/[id]`.
- Produces: 5-tab drawer:
  - `overview`: 4 KPI cards, location details, direct WhatsApp button (`https://wa.me/...`), and Google Maps link (`buildGoogleMapsUrl`).
  - `placements`: Existing photo gallery and placement cards.
  - `mous`: Existing MoU agreements list.
  - `events` **[NEW]**: Related field events list with status pill, dates, attendee target.
  - `content` **[NEW]**: Related social media posts with platform icon, format, status pill.

- [ ] **Step 1: Check existing drawer props & state**

Verify `activeTab` type is expanded to `"overview" | "placements" | "mous" | "events" | "content"`.

- [ ] **Step 2: Implement UI tabs and quick actions in `Outlet360Drawer.tsx`**

1. Add tab buttons for `Field Events` and `Konten Media` with count badges.
2. Render `events` tab pane displaying `data.events`.
3. Render `content` tab pane displaying `data.contents`.
4. Add direct WhatsApp action button with pre-filled text.
5. Add direct Google Maps route button using `buildGoogleMapsUrl`.

- [ ] **Step 3: Run TypeScript compiler and unit tests**

Run: `npx tsc --noEmit && npm test`  
Expected: 0 TypeScript errors and all unit tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/views/OutletsView/Outlet360Drawer.tsx
git commit -m "feat(marcom): add events, content tabs, and quick actions to Outlet360Drawer"
```

---

### Task 4: Responsive Hybrid `PipelineView` Components

**Files:**
- Create: `src/components/views/PipelineView/pipelineTypes.ts`
- Create: `src/components/views/PipelineView/PipelineFilterBar.tsx`
- Create: `src/components/views/PipelineView/PipelineMatrixTable.tsx`
- Create: `src/components/views/PipelineView/PipelineCockpitCardList.tsx`
- Create: `src/components/views/PipelineView/PipelineView.tsx`

**Interfaces:**
- Consumes: `OutletPipelineRow`, `Outlet360Drawer`.
- Produces: `<PipelineView />` component rendering:
  - Desktop ($\ge 768\text{px}$): `<PipelineMatrixTable />` (high-density table with sorting).
  - Mobile ($< 768\text{px}$): `<PipelineCockpitCardList />` (2x2 status tiles, 0% horizontal scroll, direct WA and Maps action buttons).

- [ ] **Step 1: Create `pipelineTypes.ts` and `PipelineFilterBar.tsx`**

Define filter state (`search`, `branchId`, `tier`, `bottleneckOnly`) and render search input + dropdown filters + quick bottleneck chip.

- [ ] **Step 2: Create `PipelineMatrixTable.tsx` (Desktop View)**

Implement table with 6 columns:
1. `Outlet & Lokasi`: Name, city, tier.
2. `1. Legal MoU`: Status badge and annual compensation value.
3. `2. POSM Placements`: Done/Total counter, progress bar, bottleneck alert.
4. `3. Field Events`: Nearest event name and date.
5. `4. Konten Media`: Published post count.
6. `Aksi`: "Buka 360°" button.

- [ ] **Step 3: Create `PipelineCockpitCardList.tsx` (Mobile View)**

Implement responsive cards with:
- Top: Outlet title, tier badge, active indicator.
- Center: 2x2 mini status grid (MoU, POSM, Event, Content).
- Bottom: WhatsApp chat button, Maps route button, Open 360° button.

- [ ] **Step 4: Create `PipelineView.tsx`**

Connect data fetching from `/api/marcom/pipeline`, filter state, metrics banner (Total Outlets, Healthy MoU %, POSM Realization %, Active Events), and container rendering:
```tsx
<div className="hidden md:block">
  <PipelineMatrixTable data={filtered} onSelectOutlet={handleSelectOutlet} />
</div>
<div className="block md:hidden">
  <PipelineCockpitCardList data={filtered} onSelectOutlet={handleSelectOutlet} />
</div>
<Outlet360Drawer outletId={selectedOutletId} onClose={() => setSelectedOutletId(null)} />
```

- [ ] **Step 5: Verify build & lint**

Run: `npm run lint && npx tsc --noEmit`  
Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/views/PipelineView/
git commit -m "feat(marcom): implement responsive hybrid PipelineView components"
```

---

### Task 5: Navigation Integration & E2E Verification

**Files:**
- Modify: `src/components/layout/ViewSwitcher.tsx:46-65`
- Modify: `src/components/layout/topNavConstants.ts:1-12`
- Modify: `src/app/page.tsx:210-420`
- Modify: `e2e/marcom-smoke.spec.ts`

**Interfaces:**
- Consumes: `<PipelineView />`.
- Produces: Seamless tab switching to `Pipeline 360°` in top navigation and sidebar, tested across desktop and mobile viewports.

- [ ] **Step 1: Wire up navigation**

1. In `ViewSwitcher.tsx`, add `pipeline` at the top of `WORK_ITEM_VIEWS`.
2. In `topNavConstants.ts`, add `"pipeline": "Pipeline 360°"`.
3. In `src/app/page.tsx`, add `activeView === "pipeline"` block rendering `<PipelineView />`.

- [ ] **Step 2: Add Playwright E2E smoke tests in `e2e/marcom-smoke.spec.ts`**

Add tests verifying:
1. Switching to `Pipeline 360°` view.
2. Verifying Desktop Matrix Table is visible at 1280px viewport.
3. Resizing viewport to mobile (375x667) and verifying Cockpit Card stack is visible while table is hidden.
4. Clicking an outlet opens `Outlet360Drawer` with `Events` and `Content` tabs.

- [ ] **Step 3: Run full test suites**

Run unit tests: `npm test`  
Run E2E tests: `npx playwright test e2e/marcom-smoke.spec.ts`  
Expected: All tests pass.

- [ ] **Step 4: Run linter and typecheck**

Run: `npm run lint && npx tsc --noEmit`  
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/ViewSwitcher.tsx src/components/layout/topNavConstants.ts src/app/page.tsx e2e/marcom-smoke.spec.ts
git commit -m "feat(marcom): integrate PipelineView into navigation and add E2E tests"
```
