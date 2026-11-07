# ADR-0072: Mobile Field Event Checklist Readability & Header Layout Enhancement

- **Status:** ACCEPTED
- **Date:** 2026-11-07
- **Deciders:** Senior Software Engineer, Lead Developer

## Context & Business Problem

*vrello-up* is an enterprise field marketing management platform for Indosat Ooredoo Hutchison (IM3 & Tri brands). Field operators coordinate on-ground marketing activations (e.g., mall roadshows, store launches, pop-up booths) using the Field Events module (`EventsView.tsx`).

When drafting a new event via `EventCreateModal.tsx`, operators rely on the subcomponent `EventChecklistSection.tsx` to review and customize operational logistics subtasks (e.g., permits, sound rigging, flyer distribution, sales targets) that automatically sync as subtasks to the Kanban Board.

On mobile viewports (< 640px, such as 360px - 390px smartphone displays), several critical readability and layout defects impair field usability:
1. **Header Layout Collision:** The section header currently places the section title (`Event Preparation Checklist (Task Subtasks)`), completion counter badge (`0/5 completed`), and the template reset trigger (`Template <type>`) within a single horizontal flex row (`flex items-center justify-between`). In a ~320px container, this causes extreme lateral crowding: the title text is squashed into 4 fragmented vertical lines, while the counter badge and reset button overlap awkwardly in the remaining space.
2. **Subtask Title Truncation (`truncate`):** Checklist item rows enforce single-line truncation (`truncate text-slate-800`), cutting off actionable logistics directions mid-sentence (e.g., `"Route planning & high-traffi..."`, `"Flyering & acoustic sound ri..."`). Field coordinators cannot inspect the scope of preparation tasks without external reference.
3. **Truncated Add-Item Placeholder:** The input placeholder string (`"Add new checklist item... (e.g. Rent 10kVA generator)"`) spans 53 characters, abruptly truncating at `"Add new checklist item... ("` on mobile widths.
4. **Checkbox Vertical Misalignment on Multi-Line Text:** Using `items-center` on item rows causes checkboxes to float vertically centered rather than aligning to the first line of text when multi-line wrapping occurs.

## Options Considered

### Option 1: Tailwind Responsive Breakpoints (`sm:`) on Atomic Component (Chosen)
- Refactor the section header to a 2-row vertical stack on mobile: Row 1 displays the title with full horizontal space (`Event Preparation Checklist`), and Row 2 distributes the completion counter badge and template reset action with `justify-between sm:justify-end`. On desktop ($\ge 640\text{px}$), the header resets to a unified single inline row (`sm:flex-row sm:items-center sm:justify-between`).
- Replace `truncate` on checklist item titles with `break-words text-xs leading-snug`, and adjust row flex alignment to `items-start sm:items-center` with `mt-0.5 shrink-0` on the checkbox.
- Shorten the mobile input placeholder to `"Tambah item checklist baru..."` to prevent text cutoffs.
- *Trade-Offs:*
  - *Pros:* Fully localized to `EventChecklistSection.tsx` (~15 lines of Tailwind adjustments); zero risk to state management or Kanban synchronization; preserves 100% byte-for-byte desktop rendering; respects YAGNI.
  - *Cons:* None.

### Option 2: Architectural Deconstruction into Micro-Components
- Split `EventChecklistSection.tsx` into multiple dedicated files (`ChecklistHeader.tsx`, `ChecklistItemRow.tsx`, `ChecklistAddInput.tsx`).
- *Trade-Offs:*
  - *Pros:* Isolated subcomponent scopes.
  - *Cons:* Violates YAGNI and adds unnecessary cognitive overhead for an existing component that is only 157 LOC (well below the 250 LOC threshold).

### Option 3: Collapsible Checklist Accordion with Lazy-Loading
- Wrap subtask items inside an expandable disclosure/accordion panel.
- *Trade-Offs:*
  - *Pros:* Conserves vertical viewport space.
  - *Cons:* Adds unnecessary click friction; operators must tap an extra accordion before seeing whether checklist tasks are present.

## Decision

We adopt **Option 1: Tailwind Responsive Breakpoints (`sm:`) on Atomic Component**.

Specifically:
1. **Header Anti-Collision Layout:**
   - Container: `flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2`
   - Title Row (Mobile Row 1): `flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100` with concise label `Event Preparation Checklist`
   - Controls Row (Mobile Row 2 / Desktop Right Column): `flex items-center justify-between sm:justify-end gap-2.5` containing the counter badge (`0/5 selesai`) and the template button (`Template <type>`).
2. **Subtask Multi-Line Wrapping & Alignment:**
   - Change task item container to `flex items-start justify-between gap-2.5 p-2 rounded-lg ...`
   - Checkbox: `w-4 h-4 mt-0.5 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500`
   - Label: `break-words text-xs leading-snug flex-1 min-w-0` (removing `truncate`)
   - Remove Button: `p-1 shrink-0 text-slate-400 hover:text-rose-500`
3. **Concise Input Placeholder:**
   - `placeholder="Tambah item checklist baru..."`
4. **Desktop Parity Invariant:**
   - On viewports $\ge 640\text{px}$ (`sm:`), the header aligns inline horizontally with `sm:flex-row sm:items-center sm:justify-between`, matching the existing desktop presentation.

## Consequences

### Positive Consequences
1. **Uncompromised Field Legibility:** Subtasks render with full multi-line text wrapping without truncation, allowing field operators to review complete task descriptions on any mobile screen.
2. **Deterministic Header Geometry:** The 2-row mobile structure eliminates horizontal text collisions and prevents awkward multi-line title wrapping.
3. **Ergonomic Tap Targets:** Checkboxes and delete buttons maintain dedicated spatial boundaries (`shrink-0` with `mt-0.5`), preventing accidental taps.
4. **Desktop Byte-for-Byte Preservation:** Desktop viewports retain their exact single-row layout without visual regression.
5. **Architectural Simplicity:** Keeps `EventChecklistSection.tsx` well under the 250 LOC coordinator limit (~160 LOC) with zero database or state mutations.

### Negative Consequences / Accepted Technical Debt
1. None. The changes are strictly localized CSS utility enhancements.



