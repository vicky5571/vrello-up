# Mobile Placement Modal Fixed Height and Search Expansion Design Spec

- **Status:** APPROVED
- **Date:** 2026-11-07
- **Author:** Senior Software Engineer
- **ADR Reference:** `docs/adr/0076-mobile-placement-modal-fixed-height-and-search-expansion.md`

## 1. Executive Summary & Problem Diagnosis

In the POSM Placement workflow (`PlacementFormModal.tsx`), field operators, installers, and supervisors register new executions using a 4-step wizard modal.

On mobile viewports (< 640px), dynamic content expansion causes severe interface instability:
1. **Layout Shift of Wizard Navigation Controls:**
   - The outer modal container uses `w-full max-w-xl max-h-[92vh]` without a fixed height constraint on mobile screens.
   - When the search query is empty, the modal height shrinks to ~400px, pulling the footer containing `"Batal"` and `"Lanjut"` high up near the middle of the screen.
   - When users type a search term and results populate, the modal dynamically stretches downward to ~600px, pushing the footer down.
   - This layout shift forces users to chase button tap targets, breaking thumb ergonomics.
2. **Constrained Search Results Height:**
   - In `OutletSearchCombobox.tsx`, the search results list is capped at `max-h-60` (240px) on mobile.
   - With multi-line outlet items, only ~2 items fit vertically before scrolling, hindering fast scanning.
3. **Desktop Invariant:**
   - On desktop viewports ($\ge 640\text{px}$), the modal retains its auto content height bounded by `sm:max-h-[92vh]`, and search results remain at `sm:max-h-72`.

## 2. Component Architecture & Responsive Contracts

### 2.1 Modal Chassis Stabilization Contract (`src/components/views/PlacementsView/PlacementFormModal.tsx`)
In `PlacementFormModal.tsx` (line 210), anchor modal height on mobile to `h-[88dvh]` while preserving existing desktop limits:

```tsx
<div className="w-full max-w-xl h-[88dvh] sm:h-auto sm:max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
  {/* Modal Header: Pinned at top */}
  <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
    ...
  </div>

  {/* Active Step Content Form: Flexible scroll container */}
  <form onSubmit={onSave} className="flex flex-col flex-1 min-h-0">
    <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 space-y-4">
      {/* Steps 1 to 4 */}
    </div>

    {/* Fixed Footer Controls: Permanently pinned at bottom */}
    <div className="px-4 py-3 sm:px-6 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 shrink-0">
      <WizardFooter ... />
    </div>
  </form>
</div>
```

### 2.2 Search Results Container Expansion Contract (`src/components/views/PlacementsView/OutletSearchCombobox.tsx`)
In `OutletSearchCombobox.tsx` (line 674), expand the maximum height of the search results list container on mobile from `max-h-60` (240px) to `max-h-80` (320px):

```tsx
<ul
  ref={listRef}
  id={`${id}-listbox`}
  role="listbox"
  className="overflow-y-auto max-h-80 sm:max-h-72 divide-y divide-slate-100 dark:divide-slate-700/50 p-1.5"
>
  ...
</ul>
```

### 2.3 Desktop Invariance Contract
- On viewports $\ge 640\text{px}$ (`sm:`):
  - Modal container applies `sm:h-auto sm:max-h-[92vh]`, perfectly sizing to content up to 92vh.
  - Search results list applies `sm:max-h-72` (288px).

## 3. Acceptance Criteria & Invariants

1. **AC-1 (Mobile Modal Height Stabilization):** On mobile viewports (< 640px), the placement modal maintains a stable `88dvh` height across all search and wizard states (`h-[88dvh] sm:h-auto sm:max-h-[92vh]`).
2. **AC-2 (Zero Footer Layout Shift):** On mobile viewports (< 640px), the wizard footer containing `"Batal"` and `"Lanjut"` remains stationary at the bottom edge of the modal, never jumping as search queries or step views change.
3. **AC-3 (Mobile Search Results Expansion):** On mobile viewports (< 640px), the search dropdown list container has a maximum height of `max-h-80` (320px), displaying 3 to 4 complete outlet entries comfortably.
4. **AC-4 (Desktop Invariance):** On desktop viewports ($\ge 640\text{px}$), the modal retains auto content height bounded by `sm:max-h-[92vh]`, and the search results list retains `sm:max-h-72`.
5. **AC-5 (Scroll Discipline):** When content inside the form body exceeds available vertical height, internal scrolling occurs smoothly within `flex-1 min-h-0 overflow-y-auto` while header and footer stay locked.

## 4. Explicit Non-Goals
- No changes to form validation or step transition logic.
- No changes to desktop modal behavior.

## 5. Verification Checklist
- [ ] Create unit & structural test `src/components/views/PlacementsView/placementModalResponsiveness.test.ts`.
- [ ] Run test suite (`npm test`).
- [ ] Run architectural drift verification (`npm run drift:check`).
- [ ] Run build check (`npm run build:check`).



