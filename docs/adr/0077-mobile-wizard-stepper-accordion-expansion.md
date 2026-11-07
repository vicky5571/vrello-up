# ADR-0077: Mobile Wizard Stepper Header Dynamic Accordion Expansion

- **Status:** ACCEPTED
- **Date:** 2026-11-07
- **Deciders:** Senior Software Engineer, Lead Developer

## Context & Business Problem

*vrello-up* is an enterprise field marketing management platform for Indosat Ooredoo Hutchison (IM3 & Tri brands). Field operators, agency installers, and supervisors register POSM executions using the 4-step wizard modal `PlacementFormModal.tsx`.

In `WizardStepperHeader.tsx`, progress through the four execution steps is indicated:
1. Step 1: Pilih Outlet
2. Step 2: Material & Tema
3. Step 3: Foto Bukti Fisik
4. Step 4: Validasi Lokasi

On mobile viewports (< 640px), the stepper header currently utilizes a static `grid grid-cols-4 gap-1` layout. Because total mobile card width is limited (~320px - 360px), all text labels are hidden (`hidden sm:flex`), rendering only a number circle and icon (`[ 1 🏬 ] [ 2 📚 ] [ 3 📷 ] [ 4 📍 ]`).

This absence of text on mobile causes significant disorientation for field installers, who cannot visually confirm the active step's objective without relying on memory or deciphering small icons.

Desktop viewports ($\ge 640\text{px}$) have sufficient horizontal width where all 4 steps display full 2-line labels (`shortLabel` and `Langkah N`); desktop layout must remain 100% byte-for-byte unaffected.

## Options Considered

### Option 1: Dynamic Flex Accordion: Expand Active Step, Shrink Inactive Steps (Chosen)
- Replace static `grid-cols-4` on mobile with a dynamic flex accordion:
  ```tsx
  className="flex items-center gap-1.5 sm:grid sm:grid-cols-4 sm:gap-2"
  ```
- **Active Step (`isCurrent === true`):**
  - Expands to occupy all remaining width using `flex-1 min-w-0 px-2.5 py-1.5`.
  - Displays the number circle, icon, and **full active label** (`<span className="truncate text-xs font-bold text-lime-900 dark:text-lime-200">{s.label}</span>`).
- **Inactive Steps (`isCurrent === false`):**
  - Shrinks to compact milestone chips using `shrink-0 px-2 py-1.5`.
  - Displays only the number circle / checkmark badge (`w-5 h-5`) and icon (`w-3.5 h-3.5`), leaving text labels hidden (`hidden sm:flex`).
- **Desktop Invariant ($\ge 640\text{px}$):**
  - Retains `sm:grid sm:grid-cols-4 sm:gap-2` where all four steps render their 2-line desktop labels side-by-side.
- *Trade-Offs:*
  - *Pros:* Unlocks instant active-step clarity on mobile; adapts smoothly without horizontal overflow; delivers a polished, app-like accordion interaction; 100% desktop visual parity preserved.
  - *Cons:* None. Zero runtime dependencies and ~15 lines changed.

### Option 2: Horizontal Scrollable Stepper
- Make the stepper horizontally scrollable with `overflow-x-auto flex-nowrap` so that all four steps retain full labels.
- *Trade-Offs:*
  - *Pros:* All labels are present.
  - *Cons:* Obscures overall milestone progress; forces field users to swipe horizontally to check Step 3 and 4; poor touch UX inside a modal.

## Decision

We adopt **Option 1: Dynamic Flex Accordion: Expand Active Step, Shrink Inactive Steps**.

Specifically:
1. In `src/components/views/PlacementsView/wizard/WizardStepperHeader.tsx`:
   - Change the container from `grid grid-cols-4 gap-1 sm:gap-2` to `flex items-center gap-1 sm:gap-2 sm:grid sm:grid-cols-4`.
   - On the step button, conditionally apply:
     - Active step: `flex-1 min-w-0 px-2.5 py-1.5` and render `<span className="truncate text-xs font-bold sm:hidden text-lime-900 dark:text-lime-200">{s.label}</span>`.
     - Inactive step: `shrink-0 px-2 py-1.5` keeping mobile text hidden.
   - Retain the desktop 2-line label block (`hidden sm:flex flex-col min-w-0`) and desktop grid layout (`sm:grid-cols-4`).

## Consequences

### Positive Consequences
1. **Clear Orientation on Mobile:** Operators instantly recognize the active step by name (`Pilih Outlet`, `Material & Tema`, etc.) without guessing or squinting at tiny icons.
2. **Compact Milestone Visibility:** Inactive and completed steps remain neatly visible as milestone badges with checkmarks or numbers without taking up unnecessary horizontal width.
3. **Flawless Fluid Responsiveness:** Works smoothly across 320px–420px mobile displays without clipping or horizontal overflow.
4. **Desktop Zero-Regression:** 100% visual parity preserved on desktop viewports ($\ge 640\text{px}$).
5. **No Logic/State Impact:** Pure presentation component refinement; step selection and validation states remain unchanged.

### Negative Consequences / Accepted Technical Debt
1. None. The change is strictly a responsive layout enhancement.

---

## Amendment (2026-11-07): Unified Short Labels & Redundant Subtitle Elimination

### Context & Problem
During live mobile validation on ~360px viewports (e.g., standard Android & iPhone screens), using the long title `s.label` (`"Pilih Outlet"`, `"Material & Tema"`, `"Foto Bukti Fisik"`, `"Validasi Lokasi"`) caused horizontal ellipsis clipping (`"Pilih ..."`) when paired with the step number badge and icon.
Furthermore, the secondary line `"Langkah {s.step}"` (`"Langkah 1"`, `"Langkah 2"`, etc.) was identified as redundant across all viewports because the step number `1`, `2`, `3`, `4` is already prominently rendered in the numeric circle badge right beside it.

### Decision
1. **Unify Text to Short Labels:** Adopt `s.shortLabel` (`"Outlet"`, `"Materi"`, `"Foto"`, `"Lokasi"`) across **all viewports** (both mobile and desktop). These concise 4–6 character titles fit comfortably on the expanded mobile active step without text clipping.
2. **Eliminate Subtitle Globally:** Remove the secondary `"Langkah {s.step}"` line from all viewports (mobile and desktop).
3. **Consolidated Label Markup:** Replace separate mobile and desktop label elements with a unified responsive element:
   ```tsx
   <span
     className={cn(
       "truncate text-xs font-bold min-w-0",
       isCurrent ? "inline text-lime-900 dark:text-lime-200" : "hidden sm:inline"
     )}
   >
     {s.shortLabel}
   </span>
   ```
4. **Visual Result:**
   - **Mobile Active:** Clean, single-row pill `[ (1) 🏬 Outlet ]` with zero text truncation.
   - **Mobile Inactive:** Compact icon badge `[ (2) 📚 ] [ (3) 📷 ] [ (4) 📍 ]`.
   - **Desktop:** Four sleek, uncluttered pills `[ (1) 🏬 Outlet ] [ (2) 📚 Materi ] [ (3) 📷 Foto ] [ (4) 📍 Lokasi ]`.

---

## Verification Strategy
- **Unit & Structural Test:** `src/components/views/PlacementsView/wizardStepperResponsiveness.test.ts` to assert:
  - Stepper header container includes `flex items-center gap-1 sm:grid sm:grid-cols-4 sm:gap-2`.
  - Active step button applies `flex-1 min-w-0` on mobile and renders active step label.
  - Inactive step button applies `shrink-0` on mobile.
- **Regression Suite:** `npm run drift:check`, `npm run build:check`, and `npm test`.



