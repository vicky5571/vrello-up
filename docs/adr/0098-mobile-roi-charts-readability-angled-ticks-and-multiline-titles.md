# ADR-0098: Mobile ROI Charts Readability via Angled Ticks, Viewport Height & Multiline Card Titles

- **Status:** PROPOSED (Approved by User Direction)
- **Date:** 2026-11-08
- **Deciders:** Senior Software Engineer, Lead Developer

## Context & Business Problem

In `src/components/views/AnalyticsView/`, the Operational Intelligence & ROI dashboard visualizes capital allocation, event cost efficiency, POSM deployment rate, and social media publication reliability. The charts (`PosmEconomicsChart`, `EventEfficiencyChart`, `ContentCadenceChart`, and `MouAgingChart`) are wrapped by `ChartCard.tsx`.

On mobile viewports (`< sm` / 360px–390px), three major readability defects compromise operational monitoring:

1. **Severe Card Title Truncation (`ChartCard.tsx`)**:
   - `<h3>` applies `truncate`. When paired with an action or telemetry badge on the right (e.g. `"Total 22 Titik"`, `"6 Kegiatan"`, `"50% Publikasi Berhasil"`), chart titles are clipped prematurely (e.g., `"POSM Unit Economics & Dep..."`, `"Efisiensi Biaya Event & Capaia..."`, `"Reliabilitas Publik..."`), depriving mobile users of immediate analytical context.

2. **Dropped & Misleading Event Type Ticks (`EventEfficiencyChart.tsx`)**:
   - Event types use raw database keys (e.g. `EXHIBITION_BOOTH`, `CFD_ACTIVATION`).
   - Because horizontal screen width is restricted and labels are long, Recharts' collision detection automatically drops the first bar's tick label entirely. The remaining label (`EXHIBITION_BOOTH`) centers under bar 2 and extends under bar 1, misleading field managers into misidentifying which bar represents which event. Furthermore, `bottom: 5` margin cuts off ticks against the card edge.

3. **Dense Text Collisions on POSM Horizontal Bar Chart (`PosmEconomicsChart.tsx`)**:
   - Material names are descriptive (up to 45 characters, e.g. *"Signboard Acrylic LED 240x80cm Backlit"*, *"Shopblind Kanvas Outdoor 300x100cm UV Resistant"*).
   - In a fixed `h-72` (288px) vertical layout across 6 materials, each category only receives ~40px of vertical height. Recharts wraps the 45-character strings into 3–4 lines with 14px–16px line-height, causing adjacent lines of text to collide and overlap vertically into an unreadable inkblot.

---

## Options Considered

### Option 1: Hardcoded String Simplification Dictionary (Rejected by User)
- Create helper functions (`formatCompactMaterialName`, `formatEventTypeName`) that strip technical specifications and translate enum keys to short words (e.g. *"Exhibition"*, *"CFD"*).
- *Trade-offs:* Rejected explicitly by user. Modifying or synthesizing domain strings creates data distortion, maintenance overhead when new materials/events are added, and disconnects chart labels from the operational database.

### Option 2: Horizontal Overflow Scroll Container (Rejected)
- Place charts in `overflow-x-auto min-w-[500px]` on mobile.
- *Trade-offs:* Poor mobile ergonomics; nested horizontal gestures conflict with vertical dashboard scrolling; requires extra user interaction before metrics can be digested.

### Option 3: Combination of Multiline Wrapping, Angled Ticks, and Mobile Height Allocation (Chosen)
- **Zero String Mutation:** Do not mutate, shorten, or create dictionary helpers for material or event strings.
- **Card Title Wrapping (`ChartCard.tsx`):**
  - Replace `truncate` with `line-clamp-2 sm:truncate`.
  - Replace subtitle `line-clamp-1` with `line-clamp-2 sm:line-clamp-1`.
  - Allows full 2-line title readability on mobile without affecting desktop single-line truncation.
- **Event Efficiency Chart (`EventEfficiencyChart.tsx`):**
  - Angle X-axis ticks on mobile: `angle={-35}` (or `-45`), `textAnchor="end"`.
  - Force all ticks to render with `interval={0}`, preventing Recharts from dropping the first bar's label.
  - Expand bottom margin on mobile (`bottom: 35 sm:bottom: 5`) and tick fontSize `9px sm:10px`.
  - Desktop retains `angle={0}`, `textAnchor="middle"`, and standard `bottom: 5`.
- **POSM Economics Chart (`PosmEconomicsChart.tsx`):**
  - Expand mobile height to `h-96 sm:h-72` (or `h-[380px] sm:h-72`), increasing per-item vertical clearance from ~40px to ~60px+.
  - This eliminates line-on-line text collisions while keeping all 45 characters of raw material text intact.
  - Reduce YAxis width slightly on mobile (`width={96}` on mobile vs `width={120}` on desktop) or adjust tick styling so the bar area retains healthy horizontal width.
  - Maintain 100% byte-for-byte desktop appearance on `sm:` (`≥ 640px`).

---

## Decision

Adopt **Option 3**. Refine mobile chart readability by enabling 2-line title wrapping on `ChartCard`, angled non-collapsing ticks (`interval={0}`, `angle={-35}`) on `EventEfficiencyChart`, and expanded vertical height on `PosmEconomicsChart`, with zero string shortening helpers and zero regression to desktop viewports.

---

## Consequences & Invariants

- **Desktop Invariant (`sm:` / `≥ 640px`):**
  - Card titles remain single-line truncated (`sm:truncate`).
  - Event chart ticks remain horizontal (`sm:angle={0}`, `sm:textAnchor="middle"`, `sm:bottom-5`).
  - POSM chart remains `h-72` with `width={120}`.
- **Data Integrity:** No custom dictionary, regex truncation, or mock data mapping is introduced. All labels render genuine database values.
- **Accessibility:** WCAG 1.1.1 accessible fallback tables and hover tooltips continue to provide full unabridged details.
- **Verification:** Unit tests in `PosmEconomicsChart.test.ts` and `analyticsHeaderResponsiveness.test.ts` verify invariants.


