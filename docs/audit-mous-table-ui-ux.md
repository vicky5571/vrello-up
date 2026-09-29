# UI/UX & Layout Architecture Audit — MOUs Table (`MousView`)

**Codebase:** `vrello-up`  
**Target View:** MOUs & Partnerships Hub (`src/components/views/MousView/`)  
**Scope Files:**
- `src/components/views/MousView/MousView.tsx` (View root, KPI integration, filter chips, modal bindings)
- `src/components/views/MousView/mouColumns.tsx` (TanStack column definitions, cell renderers, sorting declarations)
- `src/components/views/MousView/MouExpandedRow.tsx` (Accordion expansion, budget realization, approval transitions)
- `src/components/views/MousView/mouKpi.ts` (KPI calculation, metric thresholds, visual metadata)
- `src/components/views/MousView/MouDocumentViewerModal.tsx` (Document preview lightbox, PDF/image handlers)
- `src/components/views/MousView/MouFormModal.tsx` (Creation & editing dialog, branch combobox, validation)
- `src/components/views/shared/MarcomTableShell.tsx` (Table shell, scrollports, sorting, pagination)

**Audit Date:** 2026-09-30  
**Overall Verdict:** **Sub-optimal & Ergonomically Fragile**. While the underlying business logic (placement realization bridge, document source parsing, and approval state machine) is sound, the table interface suffers from severe usability, accessibility, and layout issues. Most notably: **sticky headers are completely broken** due to missing `fixedViewport`, the **single most critical contract metric (Validity Period & Expiration Countdown) is absent from the table columns**, row sorting silently fails for the primary entity name, and inline row cells present a "click target minefield" that collides with row expansion.

---

## 1. Executive Summary & Defect Scorecard

| Priority | Category | Finding | Impact |
| :--- | :--- | :--- | :--- |
| **P0** | Layout / Scroll | **Missing `fixedViewport` Prop**: Headers do not stick; vertical scrolling escapes to page container | Column headers disappear immediately upon scrolling past row 5; horizontal scrollbar trapped below the fold. |
| **P0** | Information Arch | **Missing Contract Validity & Expiry Column**: No Start Date, End Date, or Days-to-Expiry in columns | Zero proactive awareness of contracts expiring in 3, 7, or 30 days. Forces manual row-by-row expansion. |
| **P1** | Table Contract | **Broken TanStack Table Sorting**: `initialSorting={[{ id: "partner", desc: false }]}` silently fails | `partner` is a `display` column without an accessor. Clicking "Partner" header does nothing. `status` sorts alphabetically instead of lifecycle order. |
| **P1** | Interaction UX | **"Click Target Minefield" & Conflicting Row Handlers**: 6 disparate click targets in one row | Clicking whitespace to expand often triggers unwanted cross-module navigation to Outlets, Branches, or Placements. |
| **P1** | Visual Density | **Severe Visual Overcrowding in "Realisasi Fisik"**: 4 metrics + progress bar crammed in 210px cell | Vertically bloats every row; repeats identically inside expanded row without progressive disclosure. |
| **P2** | Navigation / Filter | **Inflexible & Underpowered Filtering**: Only status chips provided; no Branch, Type, or Expiry filters | Cannot filter by Branch (despite strict branch governance) or MOU Type; cannot filter for "Expiring Soon". |
| **P2** | Executive Summary | **Underpowered KPI Summary Cards**: Only 3 cards, missing "Expiring Soon / Expired" alert metric | Missing `mobileStrip` causes cards to consume 300px+ vertical height on mobile viewports. |
| **P2** | Workflow UX | **Buried Approval Lifecycle & Hidden State Machine**: Approvals buried inside expanded rows | Managers cannot triage or approve pending agreements directly from the table or batch actions. |
| **P3** | Mobile UX | **Poor Mobile Ergonomics (< 768px)**: 10 columns crammed into unconstrained horizontal scroll | Content overflows severely; filter chips wrap across 3 lines; expanded rows break on mobile viewports. |

---

## 2. Layout Cascade & Scroll Architecture

### 2.1 Computed CSS Layout Cascade Tree

```text
div.flex.h-screen.w-screen.overflow-hidden            page.tsx:180   [H = 100vh definite]
└─ main#workspace-main.flex-1.flex.flex-col.h-full.overflow-hidden
   │                                                  page.tsx:195   [H definite, CLIP]
   ├─ TopNav                                          shrink: 0
   ├─ FilterBar (conditional)
   └─ div.flex-1.overflow-hidden.relative             page.tsx:203   [H definite, CLIP BOUNDARY]
      └─ motion.div.h-full.w-full                     page.tsx:341   [H definite = parent]
         └─ MousView <> (React Fragment)              MousView:169
            └─ MarcomTableShell                       MousView:170   [fixedViewport=FALSE (Default)]
               │
               │  🔴 BREAK #1: Missing `fixedViewport`
               │  - Root div gets className="" (no `h-full flex flex-col min-h-0`)
               │  - Outer card gets `overflow-x-auto` (NOT `overflow-auto flex-1 overscroll-contain`)
               │  - Inner header row gets `bg-slate-50/70` (NOT `sticky top-0 z-20`)
               │
               ├─ div.mb-4 (KPI cards)                MarcomTableShell:277 [3 cards]
               ├─ div.mb-3 (Search + Add + Export)    MarcomTableShell:281
               ├─ div.mb-3 (Filter Bar chips)         MarcomTableShell:347
               │
               ├─ div.rounded-lg.border.overflow-x-auto  MarcomTableShell:416-423  🔴 BREAK #2
               │  │  [NO vertical height constraint, NO independent vertical scrollport]
               │  │  ⇒ Entire table expands to 100% content height (~1800px for 25 rows)
               │  │  ⇒ Document height overflows page.tsx:203 clip boundary!
               │  │
               │  └─ div[style="min-width: 1415px"]   MarcomTableShell:425
               │     ├─ div[role=row] (Header Row)    MarcomTableShell:427  🔴 BREAK #3
               │     │  [NO sticky top-0, NO z-20]
               │     │  ⇒ As user scrolls down past row 5, HEADERS DISAPPEAR OFF-SCREEN.
               │     │
               │     └─ div.divide-y (Table Rows)     MarcomTableShell:494
               │        ├─ Row 1 [tabIndex=0, onClick→expand]
               │        ├─ Row 2 ...
               │        └─ Expanded Row               MouExpandedRow:49 [Expands row to 350px+]
               │
               └─ div.mt-3 (Pagination Bar)           MarcomTableShell:530  🔴 BREAK #4
                  [Trapped below the fold; unreachable without deep page scrolling]
```

### 2.2 Critical Layout Cascade Flaws

1. **Static, Non-Sticky Header**:
   Because `MousView.tsx` does not supply `fixedViewport={true}` to `MarcomTableShell`, the table header is rendered with:
   ```tsx
   // MarcomTableShell.tsx:432
   fixedViewport
     ? "sticky top-0 z-20 bg-slate-50 dark:bg-[#18191B] shadow-2xs"
     : "bg-slate-50/70 dark:bg-slate-800/40"
   ```
   In `MousView`, the second branch is taken. The header has static positioning. When a user scrolls vertically through 25 MOUs, **all column headers vanish**. The user cannot tell which numeric value is Compensation Plafon vs Realisasi Cost, or distinguish PIC from Partner.

2. **Horizontal Scrollbar Trapping**:
   The table has a minimum width of ~1,415px across its 10 columns. With `overflow-x-auto` on the unconstrained card, the horizontal scrollbar is anchored to the bottom of the table DOM node. If 25 rows are rendered, the user must scroll down 1,500px to the bottom of the page just to grab the horizontal scrollbar to see the right-hand columns ("Dokumen MOU" and actions).

3. **Absence of Viewport Clamping**:
   In `BranchesView` and `OutletsView`, passing `fixedViewport={true}` establishes a disciplined flex-column container (`h-full flex flex-col min-h-0`) where the table body scrolls independently with `[scrollbar-gutter:stable]`, sticky headers stay locked at `top-0`, and the pagination bar remains pinned at the bottom. `MousView` lacks this entirely.

---

## 3. Information Architecture & Table Column Design

### 3.1 Column Anatomy & Defect Matrix

The current table declares 10 columns in `src/components/views/MousView/mouColumns.tsx`:

| Index | Column ID | Width | Sorting | Cell Content | Critical UI/UX Defects |
| :---: | :--- | :--- | :---: | :--- | :--- |
| 1 | `select` | 36px | ❌ Disabled | Checkbox | Works as expected. |
| 2 | `partner` | 190px | ⚠️ **Broken** | Partner name (button) | **Sorting fails silently**. Uses `columnHelper.display`, so TanStack Table cannot sort it despite `initialSorting`. Clicking button sets search filter instead of drawer navigation. |
| 3 | `outlet` | 170px | ❌ Disabled | Outlet name + icon | Displays `—` if standalone. Clicking jumps directly to Outlets view, navigating user away from MOU work. |
| 4 | `branch` | 170px | ❌ Disabled | Branch name + icon | Clicking opens `BranchDetailDrawer`, switching contextual focus to Branch instead of MOU. |
| 5 | `type` | 160px | ✅ Active | Text string | Raw string (`Compensation`, `Exclusive Branding`). No semantic badge or icon. |
| 6 | `status` | 140px | ⚠️ Alphabetical | Status badge + expired tag | Sorts alphabetically (`APPROVED` → `DONE` → `DRAFT` → `REJECTED` → `SUBMITTED`), which is confusing. Expired tag only appears after expiry. |
| 7 | `value` | 150px | ✅ Active | `formatIDR(val)` | Right-aligned number would be better for tabular scannability; currently left-aligned. |
| 8 | `placements` | 210px | ❌ Disabled | Points count, utilization badge, 2 prices, progress bar | **Visual bloat & cognitive overload**. Cramming 4 metrics and a progress bar into 210px creates vertical height spikes. Identical duplicate exists in expanded row. |
| 9 | `document` | 145px | ❌ Disabled | "Pratinjau" button + Download icon | Text button is verbose. No visual indicator of document type (PDF vs PNG/JPG vs external URL). |
| 10 | `expander` | 40px | ❌ Disabled | `›` chevron | Static text character `›`. Does not animate or rotate upon expansion. |

### 3.2 The Critical Omission: Missing Contract Validity & Expiry Column

In commercial contract management (MOUs, legal agreements, retail partnerships), the **validity window (Start Date, End Date) and time remaining until expiration** is the single highest-priority operational datum:

```text
CURRENT IMPLEMENTATION:
[Status: APPROVED]
(No date shown in table)
User must guess whether this contract expires tomorrow or in 2 years!

RECOMMENDED PATTERN:
[Status: APPROVED]  │  Period: 01 Jan 2026 – 31 Dec 2026
                   │  ⏳ 92 days remaining  (Active - Safe)
                   │
[Status: APPROVED]  │  Period: 15 Mar 2025 – 15 Oct 2026
                   │  ⚠️ Expires in 15 days (Expiring Soon - Amber)
                   │
[Status: APPROVED]  │  Period: 01 Jan 2025 – 01 Jan 2026
                   │  🔴 Expired 272 days ago (Action Required - Red)
```

**Consequences of this omission:**
- Field ops teams risk continuing POSM branding under expired agreements (legal and financial exposure).
- Branch managers cannot sort or filter by upcoming expiration dates to prioritize renewals.
- The user is forced to expand rows individually just to view dates in `MouExpandedRow.tsx:106`.

### 3.3 The "Click Target Minefield"

Within a single table row, almost every column contains an active click handler with radically different side-effects:

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [ ]  Partner Name      Outlet Name    Branch Name    ...   Realisasi Fisik      Dokumen MOU    [›]               │
│       │                 │              │                    │                    │   │                           │
│       ▼                 ▼              ▼                    ▼                    ▼   ▼                           │
│     Sets Filter       Jumps to       Opens Branch         Jumps to             Opens   Downloads                 │
│     to Partner        /outlets       Detail Drawer        /placements          Modal   Original                  │
│                                                                                                                  │
│  ◀────────────────────────── Any click on whitespace toggles Row Expansion ──────────────────────────────────▶  │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Ergonomic Failure:**
- A user trying to expand row 4 who accidentally clicks 2 pixels too far to the left on "Branch Name" has their screen hijacked by the `BranchDetailDrawer`.
- A user trying to select a checkbox who clicks slightly outside the checkbox clicks the Partner link and resets their entire table filter!
- **Industry Standard Fix**: In modern enterprise tables (ClickUp, Linear, Stripe), **the entire row has one primary action** (open the MOU Detail Drawer or expand row), and secondary links are either scoped to an explicit Actions dropdown or discreet link icons.

---

## 4. Filter System, Search & KPI Ergonomics

### 4.1 Underpowered KPI Summary Cards (`mouKpi.ts`)

Currently, `buildMouKpiItems` computes only 3 metrics:
1. `Active MOUs` (Count of `APPROVED` agreements, emerald)
2. `Pending Approval` (Count of `SUBMITTED` agreements, amber)
3. `Total Compensation Value` (Sum of `compensationValue`, blue)

**Deficiencies:**
- **Missing "Expiring Soon / Expired" Alert Card**: There is no counter for contracts expiring within 30 days or already expired. This is the #1 metric management needs to track contract renewals.
- **Missing Total Agreements / Realization Overview**: No visibility into overall physical delivery rate across all MOUs.
- **No Responsive Strip**: `MousView.tsx:200` calls `<KpiSummaryCards items={kpiItems} />` without the `mobileStrip` prop. On viewports `< 768px`, the 3 cards stack into a vertical column that consumes 320px of mobile screen space before the table is reached.

### 4.2 Limited & Inflexible Filter Bar

`MousView.tsx:228-250` only provides horizontal status pills:
```tsx
const MOU_STATUS_CHIPS = [
  { label: "All", value: "ALL" },
  { label: "Draft", value: "DRAFT" },
  { label: "Submitted", value: "SUBMITTED" },
  { label: "Approved", value: "APPROVED" },
  { label: "Done", value: "DONE" },
  { label: "Rejected", value: "REJECTED" },
];
```

**What is missing:**
1. **Branch Filter**: In `BranchesView` and `OutletsView`, users can filter by Region or Branch. MOUs are strictly associated with branches (`branchId`), but there is no dropdown to view only "Jakarta Pusat" or "Surabaya" MOUs.
2. **MOU Type Filter**: The app supports 5 contract types (`Compensation`, `Exclusive Branding`, `Event Sponsorship`, `Space Rental`, `Joint Promotion`), but provides zero way to filter by type.
3. **Validity Filter**: No toggle or chip to view "Expiring Soon (< 30 Days)" or "Expired".
4. **Active Filters Badge / Reset**: When a user selects a status chip and types a search query, there is no quick "Reset All Filters" button.

---

## 5. Workflow, Approval Transitions & Permissions UX

### 5.1 Buried Approval Flow

The MOU workflow represents a formal legal lifecycle:
`DRAFT` ➔ `SUBMITTED` ➔ `APPROVED` ➔ `DONE` (or `REJECTED`).

```text
CURRENT APPROVAL PATH:
1. User spots "SUBMITTED" status in table.
2. User must click row whitespace or chevron to expand `MouExpandedRow`.
3. User must scroll down past PIC info, period, document preview, and budget realization.
4. User finds "Approve MOU" button in the bottom right corner (line 289 of MouExpandedRow).
5. User clicks "Approve MOU".
```

**Usability Problem:**
An executive or branch PIC reviewing 10 submitted contracts must execute **40+ clicks and deep scrolling** across accordion rows. Approval actions should be elevated to:
- A prominent quick-action button in the row (e.g. green checkmark button if `can("APPROVE_MOU")` is true).
- Or accessible inside a dedicated `MouDetailDrawer`.

### 5.2 Opaque Automation Side-Effects

In `MousView.tsx:106-113`:
```tsx
if (nextStatus === "APPROVED") {
  const triggered = await useWorkspaceStore.getState().runAutomationsForTrigger("mou:approved", {
    mouId: mou.id,
    partnerName: mou.partnerName,
    branchId: mou.branchId,
  });
  if (triggered > 0) toast.info(`Automations triggered: created setup task for ${mou.partnerName}`);
}
```
While automated task creation upon approval is a powerful feature, the user is given **no prior notice** inside the UI that approving the MOU will spawn a new operational task in the tasks pipeline. A subtle helper tooltip or confirmation modal ("Approving will automatically generate an onboarding task in Field Ops") would prevent user surprise.

---

## 6. Mobile & Responsive Ergonomics (< 768px)

1. **Horizontal Grid Collapse**:
   - `MarcomTableShell` attempts to render 10 columns totaling 1,415px width.
   - On a 390px iPhone viewport, more than 75% of the table is off-screen.
   - Users must swipe horizontally repeatedly to see if a document is attached.
2. **Filter Bar Overflow**:
   - The 6 status pills + label wrap into 3 vertical rows on mobile, pushing the table content down by ~120px.
3. **Accordion Bloat**:
   - Expanding a row on mobile renders `grid-cols-2` with multiple action buttons. The bottom action bar (`flex flex-wrap items-center justify-between`) wraps into 5 rows of buttons, requiring 450px+ of vertical scrolling per row.
4. **Touch Target Size**:
   - Several table buttons (`Download` icon at `w-3.5 h-3.5`, `Select` checkbox) have small hit areas (< 32px), failing WCAG 2.5.5 Target Size guidelines (minimum 44x44px for touch targets).

---

## 7. Architectural Remediation Roadmap

To elevate `MousView` to the premier standard set by the modernized `BranchesView` and `OutletsView`, the remediation should follow 4 structured phases:

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: Layout & Core Plumbing (P0)                                                             │
│ • Enable `fixedViewport={true}` on `MarcomTableShell` in `MousView.tsx`.                         │
│ • Lock sticky table header at `top-0 z-20` with stable scrollbar gutter.                         │
│ • Fix TanStack sorting: convert `partner` to accessor column (`accessorKey: "partnerName"`).     │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                │
                                                ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 2: Information Architecture & Validity Column (P0 / P1)                                    │
│ • Introduce dedicated "Validity & Period" Column (`Period` + dynamic countdown badge):           │
│   - Emerald: > 30 days remaining (`184 days left`)                                               │
│   - Amber: ≤ 30 days remaining (`Expires in 12 days` - Warning)                                  │
│   - Rose: Past end date (`Expired` - Danger)                                                     │
│ • Streamline "Realisasi Fisik" Column: display compact status badge + progress; move dense       │
│   cost comparisons to drawer/detail view.                                                        │
│ • Add lifecycle sorting for `status` (Draft → Submitted → Approved → Done → Rejected).           │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                │
                                                ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 3: Filter System & Enhanced KPIs (P1 / P2)                                                 │
│ • Upgrade `mouKpi.ts` to 4 cards:                                                                │
│   1. Total MOUs (All partnerships)                                                               │
│   2. Active MOUs (Approved & operational)                                                        │
│   3. Expiring Soon / Expired (Urgent action needed)                                              │
│   4. Total Plafon Value (Financial commitment)                                                   │
│ • Enable `mobileStrip={true}` for horizontal scrolling on mobile viewports.                      │
│ • Expand Filter Bar: Add Branch Selector dropdown and MOU Type dropdown alongside status chips. │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                │
                                                ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 4: Interaction Hygiene & Drawer-First Ergonomics (P2 / P3)                                 │
│ • Implement `MouDetailDrawer.tsx` (mirroring `BranchDetailDrawer.tsx`) to replace accordion.     │
│ • Bind `onRowClick={(mou) => setSelectedMouId(mou.id)}` for clean, predictable row selection.    │
│ • Surface quick "Approve" action icon for `SUBMITTED` rows when user has permission.             │
│ • Ensure all mobile touch targets meet WCAG 44x44px standard.                                    │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Concrete Design Specifications for Proposed Columns

```text
Proposed 8-Track Modern Table Structure (Min-Width: 1,280px)

┌────┬──────────────────────┬─────────────┬─────────────┬───────────────────────────┬──────────────┬──────────────┬────────┐
│ [ ]│ Partner & Type       │ Outlet      │ Branch      │ Validity & Countdown      │ Status       │ Plafon Value │ Realis │
├────┼──────────────────────┼─────────────┼─────────────┼───────────────────────────┼──────────────┼──────────────┼────────┤
│ [ ]│ PT Sumber Berkah     │ Outlet 01   │ JKT-Pusat   │ 01 Jan 2026 – 31 Dec 2026 │ [ APPROVED ] │ Rp 25.000.00 │ 3 Ttk  │
│    │ Exclusive Branding   │             │             │ ⏳ 92 days remaining      │              │              │ [■■■░] │
├────┼──────────────────────┼─────────────┼─────────────┼───────────────────────────┼──────────────┼──────────────┼────────┤
│ [ ]│ Toko Maju Jaya       │ Outlet 14   │ BDG-Dago    │ 15 Mar 2025 – 15 Oct 2026 │ [ APPROVED ] │ Rp 12.000.00 │ 1 Ttk  │
│    │ Compensation         │             │             │ ⚠️ Expires in 15 days     │              │              │ [■■■■] │
├────┼──────────────────────┼─────────────┼─────────────┼───────────────────────────┼──────────────┼──────────────┼────────┤
│ [ ]│ Mitra Seluler Prima  │ Outlet 88   │ SBY-Timur   │ 01 Feb 2025 – 01 Feb 2026 │ [ APPROVED ] │ Rp 50.000.00 │ 8 Ttk  │
│    │ Joint Promotion      │             │             │ 🔴 Expired 241 days ago   │              │              │ [■■■■] │
└────┴──────────────────────┴─────────────┴─────────────┴───────────────────────────┴──────────────┴──────────────┴────────┘
```

### Key Advantages of This Layout:
1. **Vertical Space Efficiency**: Pairs Partner Name with MOU Type in a 2-line title cell, saving 160px of horizontal column space.
2. **First-Class Expiration Awareness**: Every partnership immediately displays its date range and an automatic relative countdown badge (`92 days remaining`, `Expires in 15 days`, `Expired`).
3. **Decoupled Actions**: Clicking a row opens the complete detail drawer. Row selection checkbox is isolated. Document download and review are clean action buttons.
4. **Predictable Viewport Scrolling**: With `fixedViewport={true}`, headers remain locked at the top, vertical scrolling is smooth, and pagination never leaves the screen.
