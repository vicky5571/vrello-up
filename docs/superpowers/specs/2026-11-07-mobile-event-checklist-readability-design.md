# Mobile Field Event Checklist Readability & Header Layout Design Spec

- **Status:** APPROVED
- **Date:** 2026-11-07
- **Author:** Senior Software Engineer
- **ADR Reference:** `docs/adr/0072-mobile-event-checklist-readability-enhancement.md`

## 1. Executive Summary & Problem Diagnosis

The `EventChecklistSection.tsx` component embedded in `EventCreateModal.tsx` provides field operators with operational logistics subtasks (venue permits, sound rig setup, flyer distribution, attendance tracking) that sync directly to the Kanban Board.

On mobile viewports (< 640px, e.g., 360px - 390px widths), the section suffers from severe visual clipping and layout collisions:
1. **Header Crowding Collision:** The header flex container (`flex items-center justify-between`) attempts to pack a long title (`Event Preparation Checklist (Task Subtasks)`), a counter badge (`0/5 completed`), and an action link (`Template Roadshow`) on a single line. In narrow containers, the title wraps awkwardly across 4 vertical lines, squishing the counter and action link against each other.
2. **Subtask Title Truncation:** Individual checklist item titles enforce single-line truncation (`truncate`), hiding critical task details from mobile field operators.
3. **Placeholder Cutoff:** The input placeholder string exceeds the visible width of the add-task input, cutting off abruptly at `"Add new checklist item... ("`.
4. **Checkbox Misalignment:** Items with multi-line text cause vertically centered checkboxes to float unnaturally in the middle of the card.

## 2. Component Architecture & Responsive Contracts

The refinement is strictly localized to `src/components/views/EventsView/EventChecklistSection.tsx`.

### 2.1 Responsive Header Architecture
- **Mobile (< 640px):** 2-row vertical stack (`flex flex-col gap-2`).
  - Row 1: Icon (`ListTodo`) + Title (`Event Preparation Checklist`) spanning 100% available width without multi-line wrapping glitches.
  - Row 2: Status strip (`flex items-center justify-between`) distributing completion counter badge (`0/5 selesai`) and the reload template button (`[🔄 Template <type>]`).
- **Desktop ($\ge 640\text{px}$):** Resets to standard 1-row inline layout (`sm:flex-row sm:items-center sm:justify-between sm:gap-0`).

### 2.2 Subtask Item Row Typography & Geometry
- **Container:** `flex items-start justify-between gap-2.5 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs`
- **Checkbox:** `w-4 h-4 mt-0.5 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500`
- **Label / Text:** `break-words text-xs leading-snug flex-1 min-w-0` (eliminated `truncate`)
- **Remove Action:** `p-1 shrink-0 text-slate-400 hover:text-rose-500 transition-colors`

### 2.3 Add-Task Input Placeholder Contract
- **Input Placeholder:** `"Tambah item checklist baru..."` (31 characters), guaranteed to render without clipping on 320px screens.

## 3. Acceptance Criteria & Invariants

1. **AC-1 (Header Layout):** On mobile viewports (< 640px), the title and controls strip stack vertically in 2 distinct rows without text collision or 4-line title wrapping.
2. **AC-2 (Desktop Preservation):** On desktop viewports ($\ge 640\text{px}$), the header remains a single horizontal row (`sm:flex-row sm:items-center sm:justify-between`).
3. **AC-3 (Full Text Legibility):** Subtask items wrap onto multiple lines cleanly with `break-words text-xs leading-snug`. No `truncate` class exists on subtask item titles.
4. **AC-4 (Checkbox Anchor):** Checkbox remains top-aligned to the first line of text (`items-start mt-0.5 shrink-0`) during multi-line wrapping.
5. **AC-5 (LOC Constraints):** `EventChecklistSection.tsx` remains strictly $\le 250$ LOC (baseline ~157 LOC).
6. **AC-6 (Non-Breaking Invariant):** Zero changes to existing subtask completion logic, template resetting, subtask addition, or Kanban synchronization.

## 4. Test Strategy

- Create a targeted structural unit test in `src/components/views/EventsView/eventChecklistResponsiveness.test.ts`.
- Assert `EventChecklistSection.tsx`:
  - Contains `flex-col sm:flex-row` on header.
  - Does NOT contain `truncate` inside the subtask rendering loop.
  - Contains `break-words` and `items-start`.
  - Stays $\le 250$ LOC.



