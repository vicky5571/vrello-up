# Implementation Plan: Mobile Field Event Checklist Readability & Header Layout Enhancement

- **Status:** APPROVED
- **Date:** 2026-11-07
- **Spec:** `docs/superpowers/specs/2026-11-07-mobile-event-checklist-readability-design.md`
- **Refs:** `docs/adr/0072-mobile-event-checklist-readability-enhancement.md`

## 1. Overview & File Manifest

Enhance the mobile readability of the Field Event creation checklist (`EventChecklistSection.tsx`) by converting the crowded single-row header into a structured 2-row layout on mobile (< 640px), removing single-line `truncate` to permit multi-line wrapping of subtask descriptions, top-aligning checkboxes on multi-line text, and shortening the add-item input placeholder.

### File Manifest

| File Path | Responsibility | Estimated Diff |
| :--- | :--- | :--- |
| `src/components/views/EventsView/eventChecklistResponsiveness.test.ts` | TDD structural & responsiveness regression tests | ~50 LOC (New) |
| `src/components/views/EventsView/EventChecklistSection.tsx` | Header 2-row stack, multi-line wrap, top-aligned checkbox, concise placeholder | ~15 LOC modified |
| `CHANGELOG.md` | Document release entry with ADR-0072 reference | ~10 LOC |
| `docs/SESSION_STATE.md` | Session tracking update | ~15 LOC |

## 2. Phased Implementation Plan

### Phase 1: Test-Driven Development (TDD)
- [ ] Create `src/components/views/EventsView/eventChecklistResponsiveness.test.ts`
- [ ] Add assertions verifying:
  - Header uses `flex-col sm:flex-row` and `sm:items-center sm:justify-between`.
  - Subtask loop does not use `truncate`.
  - Subtask items use `break-words` and `items-start`.
  - Checkbox uses `mt-0.5 shrink-0`.
  - `EventChecklistSection.tsx` remains $\le 250$ LOC.
- [ ] Run test suite (`npx tsx --test src/components/views/EventsView/eventChecklistResponsiveness.test.ts`) and confirm failure (RED).

### Phase 2: Atomic Component Refactor
- [ ] In `src/components/views/EventsView/EventChecklistSection.tsx`:
  - Update header container to `flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2`.
  - Wrap controls in `flex items-center justify-between sm:justify-end gap-2.5`.
  - Refine subtask item container to `flex items-start justify-between gap-2.5 ...`.
  - Remove `truncate` from subtask title and add `break-words text-xs leading-snug`.
  - Anchor checkbox with `mt-0.5 shrink-0 w-4 h-4`.
  - Update placeholder on input to `"Tambah item checklist baru..."`.
- [ ] Run test suite and confirm pass (GREEN).

### Phase 3: Verification & Invariant Enforcement
- [ ] Run `npm run drift:check` (verify 0 drift and spec-plan pairing).
- [ ] Run `npm run build:check` (verify 0 TypeScript errors).
- [ ] Run `npm run test:smoke` (verify smoke test passing).
- [ ] Run `npm test` (verify full test suite passes).
- [ ] Update `CHANGELOG.md` and `docs/SESSION_STATE.md`.


