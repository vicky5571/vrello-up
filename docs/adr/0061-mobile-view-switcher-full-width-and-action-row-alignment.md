# ADR-0061: Mobile View Switcher Full-Width and Action Row Right Alignment

- **Status:** ACCEPTED
- **Date:** 2026-11-06
- **Deciders:** Senior Software Engineer, Lead Developer

## Context & Business Problem

Following mobile shell and typography polish (ADR-0058, ADR-0059, ADR-0060), visual audit of `PlacementsHeader.tsx` (and companion headers `OutletsHeader.tsx`, `EventsHeader.tsx`) on mobile devices (< 640px) revealed two layout inconsistencies:

1. **Left-Floating Action Row on Mobile:** On smartphone viewports where header title and action buttons stack vertically (`flex-col`), the action buttons row (`[Refresh]`, `[Export]`, `[+ Add Placement]`) currently left-aligns, leaving an unanchored void on the right side of the screen.
2. **Partial-Width View Mode Switcher:** The segmented view switcher pills (`[Table] [Map View] [Rekap Kuartal]`) render with intrinsic inline width (`shrink-0`), occupying ~80% of the screen width and stopping abruptly before the right card margin. This deviates from native mobile segmented controls (iOS/Android/Material) where tabs span 100% of the available width with equal distribution.
3. **Desktop Preservation Invariant:** On desktop screens ($\ge 640\text{px}$), title and action buttons sit side-by-side (`justify-between`), and the view switcher is a compact inline component. The desktop appearance must remain 100% byte-for-byte unchanged.

## Options Considered

### Option 1: Right-Aligned Action Row & Full-Width Segmented View Switcher (Chosen)
- **Mobile (`< 640px`) Structure:**
  - **Action Row:** Set wrapper to `flex items-center justify-end sm:justify-start gap-1.5 sm:gap-2 w-full sm:w-auto`. Buttons right-align cleanly to the right margin of the card on mobile.
  - **View Mode Switcher:** Set wrapper to `w-full grid grid-cols-3 p-1 sm:w-auto sm:flex sm:items-center` (or `w-full flex` with each tab `flex-1 justify-center`). Tabs span 100% of the mobile width with equal 33.3% distribution, providing expansive thumb tap targets and edge-to-edge alignment.
- **Desktop (`sm:` / ≥ 640px) Preservation:**
  - Action row reverts to `sm:w-auto sm:justify-start` (sitting naturally on the right side of the flex row).
  - View switcher reverts to `sm:w-auto sm:inline-flex` with original padding.
  - Zero layout shift or pixel deviation on desktop.

*Trade-Offs:*
- **Pros:** Crisp, intentional alignment; action buttons anchor naturally to the right; view switcher matches modern mobile segmented control standards; 100% zero changes on desktop.
- **Cons:** None. Clean responsive CSS token application.

### Option 2: Full-Width Stretched Action Buttons + Centered Switcher
- Stretch all action buttons to fill 100% width and center the partial-width switcher.

*Trade-Offs:*
- **Pros:** Fills the action row completely.
- **Cons:** Buttons can look disproportionately stretched, and the view switcher remains unaligned. Rejected per user preference.

## Decision

We adopt **Option 1: Right-Aligned Action Row & Full-Width Segmented View Switcher**.

### Core Technical Implementation:

1. **`PlacementsHeader.tsx` & `PlacementFilterControls.tsx`:**
   - In `PlacementsHeader.tsx`, update action buttons container:
     ```tsx
     <div className="flex items-center justify-end sm:justify-start gap-1.5 sm:gap-2 w-full sm:w-auto">
     ```
   - In `PlacementFilterControls.tsx`, update `PlacementViewSwitcher`:
     ```tsx
     <div
       role="tablist"
       aria-label="Placements View Switcher"
       className="relative w-full sm:w-auto flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 select-none shrink-0"
     >
       {VIEW_SWITCHER_OPTIONS.map((opt) => (
         <motion.button
           ...
           className={cn(
             "relative flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-1 rounded-lg text-xs font-semibold ...",
           )}
         >
     ```

2. **`OutletsHeader.tsx` & `EventsHeader.tsx` (Module Consistency):**
   - In `OutletsHeader.tsx`:
     - Action container: `flex items-center justify-end sm:justify-start gap-1.5 sm:gap-2 w-full sm:w-auto`
     - View mode switcher container: `w-full sm:w-auto flex items-center ...` with each button `flex-1 sm:flex-initial justify-center`
   - In `EventsHeader.tsx`:
     - Action container: `flex items-center justify-end sm:justify-start gap-1.5 sm:gap-2 w-full sm:w-auto`
     - View switcher container: `w-full sm:w-auto flex items-center ...` with each button `flex-1 sm:flex-initial justify-center`

## Consequences & Mitigations

- **Positive:** Unifies header visual balance across the entire application on smartphones; tabs become effortless thumb targets.
- **Negative:** None; no structural markup shifts or state regressions.
- **Mitigation:** Protected by unit test assertions verifying `justify-end sm:justify-start` and `w-full sm:w-auto flex-1`.



