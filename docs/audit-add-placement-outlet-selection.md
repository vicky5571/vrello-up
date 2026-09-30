# UI/UX, Algorithmic & Database Architectural Audit — Add Placement Outlet Selection Flow

**Codebase:** `vrello-up`  
**Target Module:** Marketing Communication (Marcom) Operations — Field POSM Placement Wizard (`Step1Outlet`)  
**Scope Files:**
- `src/components/views/PlacementsView/PlacementFormModal.tsx` (Wizard orchestrator, step transitions, state bindings)
- `src/components/views/PlacementsView/wizard/Step1Outlet.tsx` (Step 1 container, brand selector, combobox mount, duplicate profile card)
- `src/components/views/PlacementsView/OutletSearchCombobox.tsx` (Remote debounced combobox, rich selection card, keyboard navigation)
- `src/components/views/PlacementsView/outletSearchComboboxHelpers.ts` (Coordinate formatting, recent materials extraction, brand metadata)
- `src/components/views/PlacementsView/wizard/placementWizardHelpers.ts` (`applySmartDefaultsOnOutletSelect`, validation rules, wizard navigation)
- `src/components/views/PlacementsView/usePlacementMutations.ts` (`handleOpenAddPlacement`, default initialization, inherited coordinates)
- `src/app/api/marcom/outlets/route.ts` & `src/app/api/marcom/outlets/outletsSearchFilter.ts` (Prisma where-clause builder, search limit, ordering)
- `src/lib/marcom/locationUtils.ts` (Geofence status evaluation, coordinate inheritance, Haversine formula)
- `prisma/schema.prisma` (`model Outlet`, indexes, relational cascades)

**Audit Date:** 2026-09-30  
**Overall Verdict:** **Functionally Capable but Structurally Redundant and Algorithmically Flawed**. While the integration of historical coordinate inheritance, geofence audit calculations, and approved MoU auto-linking represents solid domain modeling, the user-facing execution in Step 1 suffers from severe usability and algorithmic regressions. Most critically: **the interface renders duplicate selected outlet cards stacked on top of each other**, the modal **perilously pre-selects the first alphabetized outlet by default**, the search engine **sorts results alphabetically by arbitrary store code rather than query relevance**, the **brand provider toggle is entirely disconnected from the outlet search query**, and a critical **telemetry drop bug wipes out GPS coordinates on newly submitted draft outlets**.

---

## 1. Executive Summary & Defect Scorecard

| Priority | Category | Finding | Operational & Technical Impact |
| :--- | :--- | :--- | :--- |
| **P0** | **UI / Visual** | **Stacked Duplicate Outlet Cards**: Both `OutletSearchCombobox` and `Step1Outlet` render independent preview cards for the same selected store | Severe visual bloat, duplicate action buttons (`[Ganti]`, two distinct `[X]` buttons), conflicting status indicators, and degraded mobile modal height. |
| **P0** | **Workflow Safety** | **Arbitrary Pre-Selection Trap**: Opening "Add Placement" automatically pre-selects `outletsList[0]` | Dangerous for field operations. Field officers or operators can inadvertently attribute physical materials to the wrong outlet if they click "Lanjut" or "Simpan Cepat" without checking. |
| **P0** | **Data Integrity** | **Telemetry Drop Bug on Draft Outlets**: `applySmartDefaultsOnOutletSelect` drops `address`, `latitude`, and `longitude` | Newly drafted outlets submitted via `SubmitDraftOutletModal` instantly report `"Belum ada titik GPS"` and blank address in the UI because coordinates are not persisted into `placement.outlet`. |
| **P1** | **Database / Perf** | **Missing Full-Text / Trigram Index on Master Data**: `where.OR` with `ILIKE '%...%'` across 4 columns | Full table sequential scan across ~25,000 outlets in PostgreSQL on every 300ms keystroke debounce. Zero indexes on `name`, `city`, `picName`, or `brand`. |
| **P1** | **Search Algorithm** | **Arbitrary Code-Ascending Sorting**: Search API executes `orderBy: { code: "asc" }` with a hard limit of 15 records | Relevant name or city matches are cut off or buried if 15 other records happen to have lower alphabetical codes (e.g. `O-AA-...`). Zero relevance scoring. |
| **P1** | **Domain Governance** | **Brand Provider Search Disconnect**: Step 1 Brand toggle (`IM3` vs `3 / Tri`) is ignored by the combobox query | Selecting "Tri (Pink)" still displays IM3 outlets in search results. Field agents can mistakenly log placements for competitor brand alignments. |
| **P1** | **State Sync** | **Brand Overwrite Bug in Smart Defaults**: `applySmartDefaultsOnOutletSelect` uses `prevPlacement.brand || detectedBrand` | If the modal initial state has already defaulted to IM3, picking a Tri-dedicated store fails to switch the placement brand to Tri. |
| **P2** | **Query Mechanics** | **Single-Phrase Search Inflexibility**: Query requires exact contiguous substring match across separate columns | Searching "Berkah Semarang" yields 0 results if "Berkah" is in the store name and "Semarang" is in the city column. No tokenization. |
| **P2** | **Resilience** | **Zero In-Memory Fallback on Network Error**: `OutletSearchCombobox` fails catastrophically if API fetch fails | When offline or on a weak cellular connection, the combobox renders a static red error and locks out the user, despite `outletsList` existing in client memory. |
| **P2** | **Display Bug** | **Empty Brackets Glitch (`[]`)**: Unconditional rendering of `[{currentOutlet.code}]` in `OutletSearchCombobox` | Displays literal empty brackets `[]` when an outlet lacks a registered code, creating an unpolished, broken appearance. |
| **P2** | **Interaction UX** | **Disorienting Auto-Advance**: Selecting an outlet triggers immediate skip to Step 2 | If the user returns to Step 1 to inspect or verify their selection, they are greeted by the broken duplicate card layout without an intuitive edit state. |
| **P3** | **Data Transparency** | **Ambiguous Coordinate Provenance**: UI does not distinguish Master GPS from Inherited Historical GPS | Users cannot tell whether the store coordinate is officially registered in master data or inherited from a previous team member's placement. |

---

## 2. Visual & Layout Cascade Breakdown

### 2.1 Computed CSS Layout Cascade Tree & Stacking Context

```text
div.fixed.inset-0.z-50.flex.items-center.justify-center.p-3   PlacementFormModal:217 [MODAL BACKDROP, z=50]
└─ div.w-full.max-w-xl.max-h-[92vh].overflow-y-auto.rounded-2xl.bg-white  PlacementFormModal:218 [MODAL DIALOG, SCROLLPORT]
   ├─ div.flex.items-center.justify-between.border-b            Header (shrink: 0)
   ├─ WizardStepperHeader                                       Stepper (shrink: 0)
   └─ form.space-y-4                                            Step Content
      └─ Step1Outlet                                            Step 1 Container
         ├─ div (Brand Provider Segmented Toggle)               IM3 / Tri toggle
         ├─ div (Outlet Combobox Container)
         │  ├─ label.flex.justify-between                       "Pilih Outlet *" + "Outlet Terpilih" badge
         │  └─ OutletSearchCombobox (relative w-full)
         │     │
         │     │  🔴 COMPONENT CARD #1 (Selected State)
         │     ├─ div.rounded-xl.border.border-lime-500/40.bg-lime-50/20 [P = 12px, border = lime-500]
         │     │  ├─ Store Icon + Store Name + [Code] + BrandBadge + Tier
         │     │  ├─ Address + City + (Branch Name)
         │     │  ├─ PIC Name + Phone
         │     │  ├─ Buttons: [Ganti] + [X] Clear (Click target #1)
         │     │  ├─ GPS Badge: ⚠️ Titik GPS belum diatur
         │     │  └─ Riwayat: [Recent material tags]
         │     │
         │     │  🔴 DROPDOWN FLYOUT (When Open)
         │     └─ ul.absolute.top-full.left-0.right-0.z-50.max-h-60.overflow-y-auto [POPOVER z=50]
         │        ⚠️ Vulnerability: Clipped if modal parent overflow-y-auto is not accommodating height
         │
         │  🔴 COMPONENT CARD #2 (DUPLICATE IN STEP1OUTLET)
         └─ div.p-3.rounded-xl.bg-slate-50.border.border-slate-200  Step1Outlet:98-165 [P = 12px, border = slate-200]
            ├─ Store Icon + Store Name + Draft Badge
            ├─ Button: [X] Clear (Click target #2)
            ├─ Address (line-clamp-1)
            ├─ GPS Badge: 📍 Belum ada titik GPS (Conflicting icon & text)
            └─ PIC Name
```

### 2.2 Usability Collisions

1. **Two Competing Close Buttons:** Users see two distinct `[X]` buttons within 100 pixels of each other. Clicking either clears the outlet, but with differing state side effects.
2. **Inconsistent GPS Labels:** The top card reports `⚠️ Titik GPS belum diatur` while the bottom card reports `📍 Belum ada titik GPS` (redundant phrasing, conflicting icon styles).
3. **Empty Bracket Artifact:** The top card displays `Toko Berkah Cellular - Semarang #1 [] • IM3` because `currentOutlet.code` is an empty string, and the template renders literal brackets around empty values.
4. **Vertical Viewport Exhaustion:** On standard 13-inch laptops or mobile screens, the stacked cards consume over 260px of vertical space, pushing the primary action buttons (`Batal`, `Simpan Cepat`, `Lanjut`) below the browser fold, forcing awkward vertical scrolling.

---

## 3. Deep Dive: Telemetry & Smart Defaults Data-Loss Bug

### 3.1 The Failure Trace

When a field agent is registering a new placement at an unregistered retail location:
1. The user clicks `+ Ajukan Outlet Baru` inside `OutletSearchCombobox`.
2. This opens `SubmitDraftOutletModal`, where the agent inputs:
   - Store Name: `"Toko Berkah Baru"`
   - Address: `"Jl. Kaliurang KM 5"`
   - GPS Coordinates: `latitude: -7.7554, longitude: 110.3781`
3. The draft creation API (`/api/marcom/outlets/draft`) successfully returns the created draft record.
4. `SubmitDraftOutletModal` triggers `onSuccess(created)` which calls `handleSelect(created)` in `OutletSearchCombobox`.
5. `handleSelect` triggers `onSelectOutlet(created)` into `PlacementFormModal`.
6. Inside `PlacementFormModal.tsx:L151`:
   ```typescript
   const updated = applySmartDefaultsOnOutletSelect(outlet, placement);
   ```
7. Inside `placementWizardHelpers.ts:L78-84`:
   ```typescript
   return {
     ...prevPlacement,
     outletId: outlet.id,
     brand: prevPlacement.brand || detectedBrand,
     picName: prevPlacement.picName || outlet.picName || currentUserName || "",
     quarter: prevPlacement.quarter || "Q3 2026",
     date: prevPlacement.date || today,
     status: prevPlacement.status || "NOT_STARTED",
     outlet: {
       id: outlet.id,
       code: outlet.code || "",
       name: outlet.name,
       brand: detectedBrand,
       // 🔴 BUG: latitude, longitude, and address are COMPLETELY OMITTED!
     },
   };
   ```
8. In `PlacementFormModal.tsx:L95-128`:
   ```typescript
   const selOutlet = outletsList.find((o) => o.id === placement.outletId);
   ```
   Because the draft outlet was just created in PostgreSQL, the client Zustand store `outletsList` has NOT yet refetched. Therefore, `selOutlet` evaluates to `undefined`.
9. The memoized `selectedOutletObj` falls back to `placement.outlet`.
10. Because `placement.outlet` had its telemetry dropped, `selectedOutletObj.latitude` and `selectedOutletObj.address` evaluate to `undefined`.
11. **Result:** The UI immediately wipes out the coordinates the user just submitted, displaying `"Belum ada titik GPS"`, and fails the 100m geofence evaluation!

---

## 4. Deep Dive: Database Execution & Query Scalability

### 4.1 PostgreSQL Schema Index Audit

In `prisma/schema.prisma`:
```prisma
model Outlet {
  id         String      @id @default(cuid())
  code       String      @unique
  name       String
  type       OutletType
  tier       OutletTier
  address    String      @default("")
  city       String      @default("")
  picName    String      @default("")
  picPhone   String      @default("")
  active     Boolean     @default(true)
  brand      Brand       @default(IM3)
  latitude   Float?
  longitude  Float?
  branchId   String
  branch     Branch      @relation(...)
  // ...
  @@index([status])
  @@index([branchId])
}
```

### 4.2 Query Execution Bottleneck

When a user types into the combobox, `/api/marcom/outlets` executes:
```sql
SELECT * FROM "Outlet"
WHERE (
  "code" ILIKE '%query%' OR
  "name" ILIKE '%query%' OR
  "city" ILIKE '%query%' OR
  "picName" ILIKE '%query%'
)
ORDER BY "code" ASC
LIMIT 15;
```

1. **Sequential Scan Inevitability:**
   - Standard B-Tree indexes (such as the `@unique` index on `code`) **cannot be used** for wildcard queries (`'%query%'`).
   - The query planner is forced to execute a **Full Table Sequential Scan** across all ~25,000 retail outlets for every keystroke.
2. **Missing Brand Index:**
   - Even if we add `WHERE brand = 'IM3'`, the lack of a composite index `(brand, status)` means PostgreSQL still scans the entire table before filtering.
3. **Database Scalability Requirement:**
   - To achieve sub-15ms search across 25,000+ stores, PostgreSQL requires either:
     - Trigram GIN indexes via `CREATE EXTENSION pg_trgm; CREATE INDEX idx_outlet_search ON "Outlet" USING gin (name gin_trgm_ops, city gin_trgm_ops);`
     - Or prefix-first querying (`'query%'`) that can leverage B-Tree pattern ops.

---

## 5. State Machine & Transition Matrix

The `OutletSearchCombobox` operates across 6 distinct operational states:

| Current State | Trigger / Event | Target State | State Transitions & Side Effects |
| :--- | :--- | :--- | :--- |
| **S0: Clean Empty** | User clicks Add Placement | **S0** | `outletId: ""`, input focused, zero card rendered, "Lanjut" disabled. |
| **S0: Clean Empty** | User types query (`>= 1 char`) | **S1: Querying** | 300ms debounce started, `isLoading: true`, `isOpen: true`, results list pending. |
| **S1: Querying** | API returns matches | **S2: Dropdown Open** | Results rendered, keyboard navigation enabled (ArrowDown/Enter), highlightIndex = 0. |
| **S1: Querying** | API request fails (Offline) | **S3: Fallback** | Fall back to in-memory `outletsList` filtering before showing error banner. |
| **S2: Dropdown Open**| User clicks result or Enter | **S4: Selected** | `outletId` set, smart defaults applied (brand, date, quarter, PIC), single card rendered, "Lanjut" enabled. |
| **S4: Selected** | User clicks `[Ganti]` | **S5: Changing** | `isChanging: true`, card hides, input opens with focus, previous selection preserved if user hits Escape. |
| **S4: Selected** | User clicks `[X]` (Clear) | **S0: Clean Empty** | All outlet fields reset, input focused, "Lanjut" disabled. |
| **S2: Dropdown Open**| User clicks "+ Ajukan Outlet" | **S6: Draft Modal** | `isDraftModalOpen: true`, modal mounts, parent keyboard listeners suspended. |

---

## 6. Actionable Remediation Roadmap

### Phase 1: UI & Layout Consolidation (Immediate)
1. **Eliminate Duplicate Profile Card:**
   - Remove lines 98–165 in `Step1Outlet.tsx`.
   - Retain `OutletSearchCombobox` as the sole interactive presentation card for the selected outlet.
   - Migrate any missing metadata (such as the `⏳ Menunggu ACC Atasan` draft warning badge) directly into `OutletSearchCombobox.tsx`.
2. **Fix Empty Code Bracket Display:**
   - In `OutletSearchCombobox.tsx`, wrap the code badge in a conditional check: render `[{currentOutlet.code}]` only when `currentOutlet.code` is non-empty and non-null.
3. **Harmonize GPS Badges:**
   - Standardize visual treatment for GPS status across all card states using consistent icons, colors, and phrasing.

### Phase 2: Workflow & Initialization Hardening
1. **Enforce Clean Initialization:**
   - In `usePlacementMutations.ts`, initialize `modalPlacement.outletId` as an empty string (`""`).
   - Leave `materialId`, `mouId`, and coordinates unpopulated until the user explicitly selects an outlet.
   - Display a clean, focused search input when the modal opens.
2. **Remove Jarring Auto-Advance:**
   - In `handleSelectOutlet`, remove the automatic transition `if (currentStep === 1) setCurrentStep(2)`.
   - Allow the user to see the selected outlet card, review the auto-detected brand and GPS status, and click `"Lanjut"` at their own pace.

### Phase 3: Search Relevance & Multi-Token Engine
1. **Tokenized Search Query Construction:**
   - Update `buildOutletSearchWhere` to split search queries by whitespace.
   - Require all tokens to be satisfied across `[code, name, city, picName]`, enabling combined queries like `"Berkah Semarang"`.
2. **Relevance-Driven Result Ordering:**
   - In the API handler, prioritize exact code or name matches before broad substring matches, replacing blind `code: "asc"` sorting.
3. **In-Memory Offline Fallback:**
   - If `/api/marcom/outlets` returns a network error, filter client-cached `outletsList` using the same relevance scoring instead of showing a blocking red error.

### Phase 4: Brand Synchronization & Telemetry Integrity
1. **Fix Telemetry Drop on Draft Outlets:**
   - In `applySmartDefaultsOnOutletSelect`, persist `address`, `latitude`, and `longitude` into the returned `placement.outlet` object so draft store coordinates are never lost.
2. **Direct Brand Synchronization:**
   - In `applySmartDefaultsOnOutletSelect`, prioritize the outlet's explicit brand: set `brand: detectedBrand || prevPlacement.brand || "IM3"`.
3. **Brand-Aware Query Filtering:**
   - Pass `currentBrand` from Step 1 into `OutletSearchCombobox`.
   - Include `brand` in the `/api/marcom/outlets` query parameters so that results prioritize or strictly filter for the selected telecom brand.
4. **Database Performance Indexing Recommendation:**
   - Add composite indexes `@@index([brand, status])` and explore `pg_trgm` GIN indexes for production deployment.

---

## 7. Verification & Acceptance Criteria Matrix

| Test Case ID | Target Area | Expected Behavior | Verification Method |
| :--- | :--- | :--- | :--- |
| **TC-OUT-01** | Modal Open | Add Placement modal opens with empty outlet state; search input is focused; no outlet is pre-selected | Visual check in browser; modal snapshot |
| **TC-OUT-02** | Selection UI | Selecting an outlet renders exactly ONE card; no stacked cards; no duplicate `[X]` buttons | Visual DOM inspection; component snapshot |
| **TC-OUT-03** | Code Bracket | Outlet without a code displays clean store name without empty `[]` brackets | Unit test in `OutletSearchCombobox.test.ts` |
| **TC-OUT-04** | Draft Telemetry | Submitting a draft outlet preserves `latitude`, `longitude`, and `address` without dropping | Unit test in `placementWizardHelpers.test.ts` |
| **TC-OUT-05** | Multi-token Search | Typing "Berkah Semarang" successfully returns "Toko Berkah Cellular" located in Semarang | Integration test on `/api/marcom/outlets` |
| **TC-OUT-06** | Brand Sync | Selecting a Tri outlet automatically flips the active brand provider to Tri | Unit test in `placementWizardHelpers.test.ts` |
| **TC-OUT-07** | Manual Navigation | Selecting an outlet populates card and enables "Lanjut" button without forcibly jumping to Step 2 | User interaction test in Playwright E2E |
| **TC-OUT-08** | Step Validation | "Lanjut" and "Simpan Cepat" remain disabled until an outlet is explicitly chosen | Unit test on `canAdvanceFromStep` |
| **TC-OUT-09** | Offline Fallback | When offline, searching falls back gracefully to in-memory `outletsList` | Mock fetch failure unit test |
