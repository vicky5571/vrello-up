# ADR-0083: Event Preparation Checklist Checkbox Center-Left Alignment

- **Status:** Accepted
- **Date:** 2026-11-07
- **Author:** Critical Senior Software Engineer (Pair Programmer)
- **Deciders:** User & Senior Software Engineer
- **Consulted:** Field Events Operations, UI Ergonomics Team

---

## Context & Business Problem

In `EventCreateModal.tsx` and `EventDrawer.tsx`, the `EventChecklistSection.tsx` component renders operational logistics subtasks (permits, branding, sound rigging, flyer distribution).

Following ADR-0072, subtask item titles wrap onto multiple lines (`break-words text-xs leading-snug`). The checkbox was anchored to the top-left (`items-start` with `mt-0.5`).

While top-aligning prevented text clipping, review of the actual production rendering on mobile screens (`media_1794068904205_2ee84f41.png`) highlighted an ergonomic and visual limitation:
1. **Visual Imbalance in Multi-Line Cards**: When a subtask wraps across 2–3 lines, a top-left aligned checkbox appears awkwardly isolated in the upper-left corner of the rounded card, leaving an unbalanced void in the lower-left area.
2. **Thumb Interaction Ergonomics**: On touchscreens, field operators intuitively tap the center of card rows. Centering the checkbox vertically on the left side of the card (*center-left*) aligns the touch target with the visual midpoint of the card, creating a much more cohesive, modern, and symmetrical unit.

---

## Options Considered

### Option 1: Symmetrical Vertical Centering Across Container, Label, and Checkbox (Accepted)
- In `EventChecklistSection.tsx`:
  - Update row container from `items-start` to `items-center`.
  - Update `<label>` wrapper from `items-start` to `items-center`.
  - Remove `mt-0.5` offset from `<input type="checkbox">` while preserving `w-4 h-4 shrink-0`.
  - Result: The checkbox aligns vertically in the center of the left edge (*center-left*), multi-line text occupies the middle, and the remove `X` button aligns vertically in the center of the right edge (*center-right*).
- *Pros*: Produces a balanced, symmetrical card for 1-line, 2-line, and 3-line subtask items; improves mobile thumb tap ergonomics; requires minimal code edits (~3 lines of Tailwind classes).
- *Cons*: Modifies previous ADR-0072 alignment assertions in `eventChecklistResponsiveness.test.ts`.

### Option 2: Center-Left Checkbox Only with Top-Aligned Delete Button
- Use `items-center` only inside `<label>`, keeping the delete button anchored to `self-start`.
- *Rejected*: Visually asymmetric and awkward—having the checkbox centered on the left while the delete button sits pinned to the top right looks disjointed on rounded cards.

---

## Trade-Off Matrix

| Dimension | Option 1 (Symmetrical Center-Left - Accepted) | Option 2 (Asymmetric Centering) |
| :--- | :--- | :--- |
| **Visual Balance on Multi-Line Cards** | **High (Balanced on both axes)** | Medium (Lopsided right side) |
| **Touch Ergonomics on Mobile** | **High (Midpoint touch target)** | High |
| **Implementation Simplicity** | **Zero-risk Tailwind class update** | Added per-element flex overrides |
| **Cross-Viewport Consistency** | **Identical on Mobile and Desktop** | Fragmented |

---

## Decision

We accept **Option 1**: Update `EventChecklistSection.tsx` to vertically center the checkbox and item contents (*center-left*):
1. Card row container: `className="flex items-center justify-between gap-2.5 p-2 rounded-lg ..."`
2. Label wrapper: `className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"`
3. Checkbox input: `className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 shrink-0"` (purging `mt-0.5`).

---

## Consequences

### Positive Consequences
- **Symmetrical Modern Presentation**: Checklist item cards appear visually anchored and polished regardless of whether the title is single-line or multi-line.
- **Improved Thumb Ergonomics**: Centered touch targets reduce accidental misclicks on adjacent items.
- **Zero Invariant Drift**: Preserves coordinator file size limit ($\le 250$ LOC) and leaves subtask logic and Kanban synchronization intact.

### Negative Consequences / Accepted Technical Debt
- None.

---

## References
- Spec: `docs/superpowers/specs/2026-11-07-event-checklist-checkbox-center-left-design.md`
- Plan: `docs/superpowers/plans/2026-11-07-event-checklist-checkbox-center-left.md`
- Target Component: `src/components/views/EventsView/EventChecklistSection.tsx`

