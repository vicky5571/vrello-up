# Technical Specification: Mobile View Switcher Full-Width & Action Row Right Alignment

- **Date:** 2026-11-06
- **Status:** APPROVED
- **Refs:** ADR-0061, ADR-0060, ADR-0059
- **Target Files:**
  - `src/components/views/PlacementsView/PlacementsHeader.tsx`
  - `src/components/views/PlacementsView/PlacementFilterControls.tsx`
  - `src/components/views/OutletsView/OutletsHeader.tsx`
  - `src/components/views/EventsView/EventsHeader.tsx`

---

## 1. Executive Summary

This specification standardizes the mobile layout alignment for the header action buttons and view mode switcher controls across the primary views (`PlacementsView`, `OutletsView`, `EventsView`). On mobile smartphones (< 640px), action button rows are right-aligned to anchor against the right boundary of the content card, while segmented view mode switchers expand to 100% full width with symmetrically divided tabs (e.g. 33.3% for 3 tabs). On desktop viewports ($\ge 640\text{px}$), all elements revert to their standard compact inline layout with zero visual or layout shifts.

---

## 2. Problem Statement & User Experience Flow

### 2.1 Current Defect
- **Floating Action Buttons:** In `PlacementsHeader.tsx`, the action buttons (`[Refresh]`, `[Export]`, `[+ Add Placement]`) currently left-align on mobile under the title, leaving an uneven and unanchored void on the right side of the card.
- **Partial-Width Segmented Controls:** The view switcher pills (`[Table] [Map View] [Rekap Kuartal]`) render with intrinsic width, occupying ~80% of the screen width and stopping abruptly before the right card margin. This produces an asymmetrical gap and small tap targets for mobile thumbs.

### 2.2 Desired User Experience Flow
1. **Smartphone Viewport (< 640px):**
   - **Header Row 1 (Title & Actions):** Title is displayed at top-left. Action buttons are aligned cleanly to the top-right / right margin (`justify-end w-full`), creating an anchored, professional framing.
   - **Header Row 2 (View Switcher):** The segmented control spans 100% full width (`w-full`), with each tab button occupying an equal share of the width (`flex-1 justify-center`). Tapping is effortless, and the active pill animation (`layoutId`) moves smoothly between symmetrical segments.
2. **Desktop Viewport ($\ge 640\text{px}$):**
   - Title and action buttons sit side-by-side (`justify-between`), and the view switcher retains its compact inline width (`sm:w-auto sm:inline-flex`).
   - Desktop layout is 100% preserved.

---

## 3. Component Architecture & CSS Token Contracts

### 3.1 `PlacementsHeader.tsx` & `PlacementFilterControls.tsx`

**A. Action Row Right Alignment in `PlacementsHeader.tsx`:**
```tsx
{/* Row 1: Title & Actions */}
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
  <div>
    <h1 ...>Media Placements ...</h1>
    <p ...>Visualisasi sebaran ...</p>
  </div>

  {/* Action Buttons: Right-aligned on mobile, auto-width on desktop */}
  <div className="flex items-center justify-end sm:justify-start gap-1.5 sm:gap-2 w-full sm:w-auto">
    <button title="Refresh Data" ...>...</button>
    <button title="Open Export Center" ...>Export</button>
    <button title="Add Placement" ...>Add Placement</button>
  </div>
</div>
```

**B. Full-Width Segmented View Switcher in `PlacementFilterControls.tsx`:**
```tsx
export function PlacementViewSwitcher({ ... }) {
  return (
    <div
      role="tablist"
      aria-label="Placements View Switcher"
      className="relative w-full sm:w-auto flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 select-none shrink-0"
    >
      {VIEW_SWITCHER_OPTIONS.map((opt) => (
        <motion.button
          key={opt.id}
          ...
          className={cn(
            "relative flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-1 rounded-lg text-xs font-semibold transition-colors duration-200 cursor-pointer",
            isActive
              ? "text-slate-900 dark:text-slate-100"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
          )}
        >
          ...
        </motion.button>
      ))}
    </div>
  );
}
```

### 3.2 `OutletsHeader.tsx` Consistency

- **Action Buttons Container:** `flex items-center justify-end sm:justify-start gap-1.5 sm:gap-2 w-full sm:w-auto`
- **View Mode Switcher Container:** `w-full sm:w-auto flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80`
- **Tab Buttons:** `relative flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-1 text-xs ...`

### 3.3 `EventsHeader.tsx` Consistency

- **Action Buttons Container:** `flex items-center justify-end sm:justify-start gap-1.5 sm:gap-2 w-full sm:w-auto`
- **View Switcher Container:** `w-full sm:w-auto flex items-center rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-100 dark:bg-slate-800 select-none`
- **Tab Buttons:** `relative flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-1 text-xs ...`

### 3.4 Responsive Breakpoint Token Matrix

| Component / Element | Mobile Class (< 640px) | Desktop Class ($\ge 640\text{px}$) | Rationale |
| :--- | :--- | :--- | :--- |
| **Action Buttons Row** | `w-full justify-end` | `sm:w-auto sm:justify-start` | Anchors to right margin on mobile; sits naturally on desktop |
| **View Switcher Shell** | `w-full` | `sm:w-auto` | Spans 100% of mobile viewport; compact inline on desktop |
| **Segmented Tab Item** | `flex-1 justify-center` | `sm:flex-initial` | Symmetrical 1/3 or 1/4 distribution on mobile; auto width on desktop |

---

## 4. Acceptance Criteria & Non-Goals

### 4.1 Acceptance Criteria
- [ ] On mobile screens (< 640px), action button rows in `PlacementsHeader.tsx`, `OutletsHeader.tsx`, and `EventsHeader.tsx` align to the right boundary of the card (`justify-end w-full`).
- [ ] On mobile screens (< 640px), view mode switchers in `PlacementFilterControls.tsx`, `OutletsHeader.tsx`, and `EventsHeader.tsx` stretch across 100% of the available width (`w-full`).
- [ ] Each tab in the view mode switchers expands symmetrically (`flex-1 justify-center`) on mobile, with the active indicator (`layoutId`) animating across the full segmented width.
- [ ] On desktop screens ($\ge 640\text{px}$), action rows and view mode switchers revert strictly to `sm:w-auto`, `sm:justify-start`, and `sm:flex-initial` (100% byte-for-byte fidelity with current desktop appearance).
- [ ] All unit tests in `src/components/views/PlacementsView/placementsHeaderResponsiveness.test.ts` and companion tests pass with 0 failures.
- [ ] Coordinator line limits remain strictly $\le 250$ LOC.

### 4.2 Non-Goals
- Altering any action button callbacks or view mode switching business logic.
- Changing dropdown behavior in forms or modals.

---

## 5. Verification Checklist

```bash
# 1. Targeted Unit Tests
npx tsx --test src/components/views/PlacementsView/placementsHeaderResponsiveness.test.ts
npx tsx --test src/components/views/OutletsView/outletsHeaderResponsiveness.test.ts

# 2. Invariant & Coordinator LOC Verification
npm run drift:check

# 3. TypeScript Typecheck
npm run build:check

# 4. Smoke Test Suite
npm run test:smoke
```



