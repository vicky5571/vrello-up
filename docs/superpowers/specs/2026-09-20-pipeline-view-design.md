# Pipeline View & Enhanced Outlet 360° Drawer Design Document

**Date:** 2026-09-20  
**Status:** Approved  
**Author:** Antigravity  
**Target:** Next.js 15 App Router, React 19, Tailwind CSS v4, Zustand 5, Prisma (PostgreSQL)

---

## 1. Executive Summary & Problem Statement

### 1.1 The "9 View Lompat-Lompat" Anti-Pattern
Currently, the Marcom module provides nine separate specialized views:
`Branches`, `Outlets`, `Placements`, `MOUs`, `Field Events`, `Documents`, `Reports`, `Analytics`, and `Content Planner`.

To monitor operational progress for a single physical outlet (e.g., *Is the MoU approved? Are signboards installed? Is there an upcoming roadshow event? Has the promotional Reel gone live?*), a user must navigate across multiple views via `navigateToMarcom()`. This causes:
1. **Context Fragmentation**: Search filters get overwritten and users lose context of the outlet they were inspecting.
2. **Operational Bottlenecks**: Difficulties in spotting discrepancies (e.g., permanent signboard requested before legal MoU is `APPROVED`).
3. **Redundant Hops**: Field officers and managers need an end-to-end cockpit view per Outlet rather than individual table hops.

### 1.2 The Solution: Unified Pipeline View & 360° Drawer
We introduce **Pipeline View** (`ViewMode = "pipeline"`) as the central operational command center for Marcom, backed by an enhanced **`Outlet360Drawer`**:
1. **Responsive Adaptive Hybrid UI**:
   - **Desktop ($\ge 768\text{px}$)**: High-density **Matrix Table** displaying all 4 operational dimensions (MoU, POSM, Events, Social Content) in a unified row per outlet with sorting and fast visual bottleneck indicators.
   - **Mobile ($< 768\text{px}$)**: **Cockpit Card Stack** with 0% horizontal scroll, 2x2 status tiles, and thumb-friendly quick actions (Direct WhatsApp PIC, Google Maps route, Open 360° Drawer).
2. **Enhanced `Outlet360Drawer`**:
   - Upgraded to 5 dedicated tabs: `Overview`, `Legal MoU`, `POSM Placements`, `Field Events`, and `Konten Media`.
   - Action buttons for instant WhatsApp chat with pre-filled template and Google Maps turn-by-turn route navigation.
3. **Zero Breaking Changes**:
   - All 9 existing specialized views remain completely intact.
   - 100% test pass rate preserved.

---

## 2. Architecture & Data Flow

### 2.1 Pure Rollup Engine (`src/lib/marcom/pipelineEngine.ts`)
To avoid waterfall API fetching on the client, data aggregation is performed by a pure, testable engine:

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
  branch: {
    id: string;
    name: string;
    code: string;
  };
  // 1. Legal / MoU Status
  mouSummary: {
    total: number;
    latestStatus: "APPROVED" | "SUBMITTED" | "DRAFT" | "REJECTED" | "NONE";
    compensationValue: number;
    isHealthy: boolean;
  };
  // 2. POSM Placement Realization
  placementSummary: {
    total: number;
    doneCount: number;
    pendingCount: number;
    totalCost: number;
    hasBlockedItems: boolean;
  };
  // 3. Field Events
  eventSummary: {
    total: number;
    upcomingCount: number;
    nearestEventName?: string;
    nearestEventDate?: string;
    status?: string;
  };
  // 4. Content Media
  contentSummary: {
    total: number;
    publishedCount: number;
    inReviewCount: number;
    latestPlatform?: string;
  };
}
```

### 2.2 Dedicated Endpoint: `GET /api/marcom/pipeline`
- Fetches outlets in the active workspace with associated branch, placements, and mous.
- Fetches active field events and scheduled/published content posts for the workspace.
- Executes `buildOutletPipelineRows(outlets, mous, placements, events, contents)`.
- Supports query filtering: `q`, `branchId`, `tier`, `bottleneckOnly`.
- Returns `{ total: number, data: OutletPipelineRow[] }`.

### 2.3 Expanded Outlet Detail Endpoint: `GET /api/marcom/outlets/[id]`
Currently returns `branch`, `placements`, and `mous`.
Extended to include:
- `events`: Events associated with this outlet or its branch.
- `contents`: Content posts associated with this outlet's branch.
This ensures `Outlet360Drawer` has all data ready on initial load with zero subsequent network hops.

---

## 3. UI Component Architecture

```text
src/components/views/PipelineView/
├── PipelineView.tsx              # Main container: data fetching, search & filter state, metrics banner
├── PipelineFilterBar.tsx         # Search keyword, Branch filter, Tier filter, Bottleneck quick toggle
├── PipelineMatrixTable.tsx       # Desktop layout (hidden md:block): High-density TanStack/Tailwind table
├── PipelineCockpitCardList.tsx   # Mobile layout (block md:hidden): Touch-friendly card stack
└── pipelineTypes.ts              # Frontend types and filter definitions
```

### 3.1 Desktop Layout: `PipelineMatrixTable`
- **Columns**:
  1. `Outlet & Lokasi`: Code, Name, City, Tier badge.
  2. `1. Legal MoU`: Status badge (`APPROVED`, `SUBMITTED`, `DRAFT`, `NONE`), annual rental compensation value.
  3. `2. POSM Placements`: Progress bar with `X/Y DONE`, cost total, and bottleneck alert if permanent materials lack approved MoU.
  4. `3. Field Events`: Nearest event name, date, and status pill (`UPCOMING` / `ON_PROGRESS`).
  5. `4. Konten Media`: Count of publications and platform badge (IG, TikTok).
  6. `Aksi`: Quick action button opening `Outlet360Drawer`.

### 3.2 Mobile Layout: `PipelineCockpitCardList`
- **Card Structure**:
  - Header: Outlet name, city, tier, active indicator.
  - 2x2 Mini Status Grid:
    - MoU Status tile
    - POSM Realization tile
    - Nearest Event tile
    - Social Media tile
  - Bottom Action Bar:
    - 💬 "Chat WA" (direct link `https://wa.me/...`)
    - 📍 "Rute Maps" (direct Google Maps query)
    - 🔍 "Lihat 360°" (opens drawer)

### 3.3 Enhanced `Outlet360Drawer` (`src/components/views/OutletsView/Outlet360Drawer.tsx`)
- **Tabs**:
  1. `overview`: 4 KPI cards, location details, quick contacts, and Google Maps route button.
  2. `mous`: List of MoUs with status badge and compensation value.
  3. `placements`: List of promotional materials with photo gallery, lightbox, and status.
  4. `events` **[NEW]**: Field events scheduled for this branch/location with attendee count and status.
  5. `content` **[NEW]**: Social media posts linked to this branch/outlet with format, status, and captions.

---

## 4. Navigation & Workspace Integration

1. **`src/types/index.ts`**:
   Add `"pipeline"` to `ViewMode`:
   ```typescript
   export type ViewMode =
     | "pipeline"
     | "home"
     | "list"
     ...
   ```
2. **`src/components/layout/ViewSwitcher.tsx`**:
   Include `{ id: "pipeline", label: "Pipeline 360°", icon: Layers, iconColor: "text-indigo-500", isAvailable: true }` in `WORK_ITEM_VIEWS` at position 0.
3. **`src/components/layout/topNavConstants.ts`**:
   Register `MARCOM_VIEW_LABELS["pipeline"] = "Pipeline 360°"`.
4. **`src/app/page.tsx`**:
   Render `<PipelineView />` when `activeView === "pipeline"`.

---

## 5. Testing & Quality Assurance Plan

### 5.1 Unit Tests (`src/lib/marcom/pipelineEngine.test.ts`)
- Verify `buildOutletPipelineRows`:
  - Test 1: Complete outlet with active MoU, completed placements, upcoming event, published reel.
  - Test 2: Bottleneck detection (permanent shopblind requested but MoU is `SUBMITTED`).
  - Test 3: Empty state handling (new outlet with 0 relations).
  - Test 4: Branch-level event and content aggregation matching.

### 5.2 Regression Verification
- Run existing Node unit tests: `npm test` (verify 268/268 passing).
- Run lint and typecheck: `npm run lint` & `npx tsc --noEmit`.

### 5.3 E2E Smoke Tests (`e2e/marcom-smoke.spec.ts`)
- Test navigating to "Pipeline 360°".
- Verify Desktop matrix table rendered at 1280px width.
- Verify Mobile cards rendered at 375px width.
- Click an outlet and verify `Outlet360Drawer` opens with Events and Content tabs active.
