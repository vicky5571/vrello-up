# ADR 0110: POSM Unit Economics Segmented Progress Bar List Layout

- **Status:** APPROVED
- **Date:** 2026-11-12
- **Author:** Senior Software Engineer & Principal Systems Architect
- **References:** ADR-0098, ADR-0050, ADR-0053

---

## 1. Context & Business Problem

In the Operational Intelligence & ROI dashboard (`src/components/views/AnalyticsView/charts/PosmEconomicsChart.tsx`), Vrello Up monitors POSM (Point of Sale Materials) deployment across retail partner outlets. This chart tracks both unit economics (average cost per unit) and installation progress (`DONE`, `ON_PROGRESS`, `ISSUE`, `NOT_STARTED`) across distinct material categories.

### The Readability Defect
The component was previously implemented as a horizontal stacked bar chart using Recharts (`BarChart layout="vertical"`). On both mobile and desktop viewports, this implementation suffers from a critical visual collision defect:
1. **Long Descriptive Domain Strings:**  
   Real-world marketing inventory specifications are descriptive and long (43 to 55 characters), e.g.:
   - *"Signboard Acrylic LED 240x80cm Backlit Aluminium Frame"* (55 chars)
   - *"Shopblind Kanvas Outdoor 300x100cm UV Resistant"* (46 chars)
   - *"X-Banner Indoor 60x160cm Albatros + Matte Lamination"* (51 chars)
   - *"Roll-up Banner Premium 85x200cm Stainless Steel Base"* (52 chars)
   - *"Neon Box Gantung 90x60cm Double Sided Slim Profile"* (48 chars)
   - *"Poster Promosi A2 Art Carton 260g Full Color"* (43 chars)
2. **Horizontal Squeeze on SVG Y-Axis:**  
   The Y-axis column width was restricted to `96px` (mobile) and `120px` (desktop). Squeezing 50+ characters into 96px forces the SVG text to wrap into 4 to 5 lines of text (~65px to 75px vertical height).
3. **Vertical Space Starvation & Text Collisions:**  
   The chart container height was constrained to `h-96` (384px on mobile) and `sm:h-72` (288px on desktop). Across 6 materials, after deducting margins, X-axis, and legend, each category only receives ~31px of vertical height on desktop and ~48px on mobile.
4. **The Collision Disaster:**  
   Because a 70px tall text block cannot fit into a 31px vertical slot, the text lines of adjacent material categories collide directly into each other. Letters overlap vertically in an illegible mess on both mobile and desktop viewports, destroying user readability.

---

## 2. Options Considered

### Option 1: Modern Segmented Progress Bar List (Progress Meter List) (Chosen)
- Move away from the cramped left-axis SVG canvas of Recharts to the modern enterprise progress list pattern (widely adopted by Linear, Tremor, Vercel, and GitHub).
- **Layout Architecture per Material Item:**
  - **Top Row (100% Width):**  
    - Left: Full material name in bold typography (`text-xs font-semibold`), completely free of truncation and vertical collisions.
    - Right: Unit economics summary badge (e.g. `5 Titik · 71% Selesai · Avg Rp 1.5M/unit`).
  - **Bottom Row (Full-Width Track):**  
    - A segmented horizontal progress bar (`h-3 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800`).
    - Proportional color segments representing deployment status:
      - Green (`bg-emerald-500`): `done`
      - Amber (`bg-amber-500`): `inProgress`
      - Rose (`bg-rose-500`): `issue`
      - Slate (`bg-slate-400 dark:bg-slate-500`): `notStarted`
    - Segment hover triggers rich tooltips and cursor-pointer click triggers `onDrilldown(materialName, status)`.
- **Card Context:**
  - Wrapped inside `ChartCard` with total placement telemetry badge, top legend row, and accessible table.
- **Pros:** 100% immune to text collision bugs; handles material names of arbitrary length without truncation; highly scannable and beautiful on both mobile (320px) and wide desktop; retains all interactivity, tooltips, and click drill-downs.
- **Cons:** Transitions the internal rendering from Recharts SVG `<BarChart>` to semantic HTML/CSS progress meters.

### Option 2: Huge Vertical Height Expansion in Recharts SVG
- Expand the Recharts container height to `min-h-[480px] sm:min-h-[420px]` and widen the Y-axis to `160px`.
- **Pros:** Keeps Recharts SVG component.
- **Cons:** Huge vertical bloat on dashboard; long labels still consume 40% of horizontal chart space, squeezing the actual bars into narrow stumps; does not scale gracefully if more materials are added.

### Option 3: Hardcoded String Truncation / Shortening Dictionary
- Synthesize short names (e.g. *"Signboard LED"*, *"Shopblind Kanvas"*).
- **Pros:** Fits in narrow columns.
- **Cons:** Rejected per ADR-0098 deciders. Strips critical dimensions (e.g. 240x80cm vs 300x100cm) and creates data distortion against actual warehouse catalog inventory.

---

## 3. Deep Trade-Off Matrix

| Evaluation Dimension | Option 1 (Segmented Progress List - Chosen) | Option 2 (Recharts Height Expansion) | Option 3 (String Shortening) |
| :--- | :--- | :--- | :--- |
| **Readability on Mobile (360px)** | **100% Flawless (Full-width text row)** | Mediocre (40% width for bars) | Poor (truncated technical specs) |
| **Readability on Desktop** | **100% Flawless (Clear visual hierarchy)** | Acceptable, but excessively tall | Poor |
| **Immunity to Text Collisions** | **Absolute (Natural block flow)** | Fragile (breaks if names >55 chars) | Fragile |
| **Data Integrity & Specifics** | **Full domain string preserved** | Full domain string preserved | Distorted / Shortened |
| **Ergonomic Density** | **Compact & Highly Scannable** | Bloated card height (>480px) | Compact |
| **Drill-Down Interactivity** | **Full parity (`onDrilldown` on segments)** | Full parity | Full parity |

---

## 4. Decision & Technical Architecture

We adopt **Option 1: Modern Segmented Progress Bar List (Progress Meter List)**.

### 4.1. Structural Component Architecture (`PosmEconomicsChart.tsx`)
1. **Container & Header:**
   - Retains `ChartCard` wrapper with title `"POSM Unit Economics & Deployment Rate"`, subtitle, and action badge (`Total X Titik`).
   - Renders a clean status legend row at the top:
     - Green dot + `"Selesai (DONE)"`
     - Amber dot + `"Sedang Proses"`
     - Rose dot + `"Kendala (Issue)"`
     - Slate dot + `"Belum Mulai"`
2. **List of Material Deployment Meters:**
   - For each item in `data.materials`:
     - **Title & Stats Row:**
       - Left: `<span className="font-semibold text-xs text-slate-800 dark:text-slate-200 break-words">{m.materialName}</span>`
       - Right: `<div className="text-[11px] font-medium text-slate-500 shrink-0"><span>{m.total} Titik ({m.doneRate}%)</span> · <span className="font-semibold text-slate-700 dark:text-slate-300">{formatCompactIDR(m.avgCost)}/unit</span></div>`
     - **Progress Bar Track:**
       - `<div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800/80 overflow-hidden flex mt-1.5 shadow-inner">`
       - Proportional flex segments:
         - Done: `style={{ width: `${(m.done / m.total) * 100}%` }}`
         - In Progress: `style={{ width: `${(m.inProgress / m.total) * 100}%` }}`
         - Issue: `style={{ width: `${(m.issue / m.total) * 100}%` }}`
         - Not Started: `style={{ width: `${(m.notStarted / m.total) * 100}%` }}`
       - Each segment includes native `title` or popover tooltip and `onClick={() => onDrilldown?.(m.materialName, status)}`.
3. **Preservation of Screen Reader Accessibility:**
   - Retains `accessibleTable` prop on `ChartCard` with exact rows and financial columns.

---

## 5. Consequences & Trade-offs

### Positive Consequences
- **Total Elimination of Collision Bugs:** Zero chance of overlapping text on any screen size.
- **Superior Information Density:** Users immediately see the full material name, total locations, completion percentage, and average unit cost at a glance.
- **Flawless Mobile Ergonomics:** Stacks naturally on mobile screens (320px–420px) without horizontal scrolling or font shrinkage.
- **Preserved Business Logic:** All drill-down callbacks, average cost metrics, and accessible table structures are 100% maintained.

### Accepted Trade-offs
- Recharts `<BarChart>` and `<ResponsiveContainer>` SVG elements are replaced with pure semantic CSS-flex progress meters. This reduces JavaScript bundle overhead and eliminates SVG layout calculation quirks.

---

## 6. Verification & Invariants

1. **Zero Text Overlap Invariant:** Labels use standard DOM block flow; no SVG text overlap or clipping occurs under any viewport width (320px to 2560px).
2. **Drill-down Parity Invariant:** Clicking a status segment triggers `onDrilldown(materialName, status)`.
3. **Data Integrity Invariant:** Proportions mathematically sum to 100% of `m.total` points for each material.
4. **Non-Negotiable Gates:** `npm run drift:check`, `npm run build:check`, and `npm test` must pass with 0 failures and 0 errors.



