# Plan: Event Preparation Checklist Checkbox Center-Left Alignment

- **Status:** Completed
- **Date:** 2026-11-07
- **Author:** Critical Senior Software Engineer (Pair Programmer)
- **ADR Reference:** `docs/adr/0083-event-checklist-checkbox-center-left-alignment.md`
- **Spec Reference:** `docs/superpowers/specs/2026-11-07-event-checklist-checkbox-center-left-design.md`

---

## 1. File Manifest & LOC Estimates

| File | Operation | Description | Est. LOC Delta |
| :--- | :--- | :--- | :--- |
| `src/components/views/EventsView/eventChecklistResponsiveness.test.ts` | Modify | Update unit assertions for center-left checkbox alignment | ~5 LOC |
| `src/components/views/EventsView/EventChecklistSection.tsx` | Modify | Center checkbox, label, and delete action via `items-center` without `mt-0.5` | ~3 LOC |
| `docs/handover-event-checklist-checkbox-center-left.md` | Create | Execution-ready handover guide with exact code diffs and non-touch boundaries | +75 LOC |
| `docs/SESSION_STATE.md` | Modify | Track active feature planning completion | +25 LOC |

---

## 2. Phased Execution Tasks

### Phase 1: Test-Driven Harness & Baseline Verification (TDD First)
- [x] Update `src/components/views/EventsView/eventChecklistResponsiveness.test.ts`:
  - [x] Assert container uses `items-center justify-between` (center-left alignment).
  - [x] Assert `<label>` uses `items-center gap-2.5`.
  - [x] Assert `<input type="checkbox">` uses `w-4 h-4 shrink-0` without `mt-0.5`.
- [x] Run test suite: `node --import tsx --test src/components/views/EventsView/eventChecklistResponsiveness.test.ts` (verify RED baseline failure).

### Phase 2: Component Refactor (`EventChecklistSection.tsx`)
- [x] In `src/components/views/EventsView/EventChecklistSection.tsx`:
  - [x] Line 99: Change `className="flex items-start justify-between gap-2.5 ..."` to `className="flex items-center justify-between gap-2.5 ..."`.
  - [x] Line 101: Change `className="flex items-start gap-2.5 flex-1 min-w-0 cursor-pointer"` to `className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"`.
  - [x] Line 106: Change `className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 mt-0.5 shrink-0"` to `className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 shrink-0"`.
  - [x] Verify coordinator file size remains $\le 250$ LOC (currently 159 LOC).

### Phase 3: Full Invariant Verification & Session Handoff
- [x] Run targeted test suite:
  ```bash
  node --import tsx --test src/components/views/EventsView/eventChecklistResponsiveness.test.ts
  ```
  Ensure all 5 tests pass (GREEN).
- [x] Run architectural drift check:
  ```bash
  npm run drift:check
  ```
  Ensure 110/110 paired specs pass.
- [x] Run TypeScript compilation check:
  ```bash
  npm run build:check
  ```
  Ensure 0 errors.
- [x] Run smoke suite:
  ```bash
  npm run test:smoke
  ```
- [x] Run full test suite:
  ```bash
  npm test
  ```
- [x] Update `CHANGELOG.md` with ADR-0083 entry.
- [x] Update `docs/SESSION_STATE.md`.
- [x] Git commit planning artifacts.

