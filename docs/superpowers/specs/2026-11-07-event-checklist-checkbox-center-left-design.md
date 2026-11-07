# Spec: Event Preparation Checklist Checkbox Center-Left Alignment Design

- **Status:** Approved
- **Date:** 2026-11-07
- **Author:** Critical Senior Software Engineer (Pair Programmer)
- **ADR Reference:** `docs/adr/0083-event-checklist-checkbox-center-left-alignment.md`
- **Plan Reference:** `docs/superpowers/plans/2026-11-07-event-checklist-checkbox-center-left.md`

---

## 1. Executive Summary

In `EventCreateModal.tsx` and `EventDrawer.tsx`, the `EventChecklistSection.tsx` component allows field marketing coordinators to manage subtask checklists for roadshows, booth activations, and field events.

Currently, checklist items with multi-line titles render with the checkbox aligned to the top-left corner (`items-start` with `mt-0.5`). On mobile touchscreens, this top alignment creates visual imbalance on rounded card rows (`media_1794068904205_2ee84f41.png`), leaving a vacant lower-left area and misaligning thumb tap targets with the card's vertical center.

This specification refines the flex layout of checklist cards in `EventChecklistSection.tsx` to center the checkbox vertically on the left (*center-left*), centering the subtask text in the middle, and symmetrically centering the delete action icon on the right (*center-right*).

---

## 2. Layout Specifications & Component Mapping

### 2.1 File: `src/components/views/EventsView/EventChecklistSection.tsx`

```
CURRENT (Top-Left):
+-------------------------------------------------------------+
| [ ] Van / vehicle branded                             [ X ] |
|     wrapping & safety                                       |
|     inspection                                              |
+-------------------------------------------------------------+

TARGET (Center-Left):
+-------------------------------------------------------------+
|     Van / vehicle branded                                   |
| [ ] wrapping & safety                                 [ X ] |
|     inspection                                              |
+-------------------------------------------------------------+
```

### 2.2 Exact JSX Class Adjustments

#### 1. Row Container (Line 99):
```tsx
// BEFORE:
<div
  key={s.id || idx}
  className="flex items-start justify-between gap-2.5 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
>

// AFTER:
<div
  key={s.id || idx}
  className="flex items-center justify-between gap-2.5 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
>
```

#### 2. Label Wrapper (Line 101):
```tsx
// BEFORE:
<label className="flex items-start gap-2.5 flex-1 min-w-0 cursor-pointer">

// AFTER:
<label className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer">
```

#### 3. Checkbox Input (Line 106):
```tsx
// BEFORE:
<input
  type="checkbox"
  checked={Boolean(s.completed)}
  onChange={(e) => handleToggleSubtask(idx, e.target.checked)}
  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 mt-0.5 shrink-0"
/>

// AFTER:
<input
  type="checkbox"
  checked={Boolean(s.completed)}
  onChange={(e) => handleToggleSubtask(idx, e.target.checked)}
  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 shrink-0"
/>
```

#### 4. Subtask Text & Delete Action:
- Subtask title `<span>`: Retains `break-words text-xs leading-snug flex-1 min-w-0`.
- Delete `<button>`: Inherits vertical centering from row container's `items-center`.

---

## 3. Data Contracts & Invariants

1. **State Preservation**: Zero changes to `eventSubtasks`, `setEventSubtasks`, `handleToggleSubtask`, or `handleRemoveSubtask`.
2. **Coordinator File Budget**: `EventChecklistSection.tsx` remains strictly $\le 250$ LOC (currently 159 LOC).
3. **Cross-Platform Uniformity**: Centering behaves identically across mobile (< 640px) and desktop viewports.

---

## 4. Acceptance Criteria

- [ ] Checkbox input aligns to the vertical center of the card row on the left (*center-left*).
- [ ] Subtask title text continues to wrap gracefully across multiple lines without clipping (`break-words text-xs leading-snug`).
- [ ] Delete `X` button aligns to the vertical center of the card row on the right (*center-right*).
- [ ] No `mt-0.5` offset remains on the checkbox input.
- [ ] Unit tests in `src/components/views/EventsView/eventChecklistResponsiveness.test.ts` pass 100%.
- [ ] Quality gates (`drift:check` 110/110, `build:check`, `test:smoke`, `npm test`) pass with 0 errors.

---

## 5. Non-Goals

- Modifying subtask persistence to SQLite/PostgreSQL.
- Altering the checklist header or template reset mechanism.

