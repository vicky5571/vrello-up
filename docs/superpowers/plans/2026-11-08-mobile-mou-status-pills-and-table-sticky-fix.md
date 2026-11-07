# Plan: Mobile MOU Status Pills Horizontal Scroll & Desktop-Only Table Sticky Columns

- **Status:** Complete
- **Date:** 2026-11-08
- **Author:** Critical Senior Software Engineer (Pair Programmer)
- **ADR Reference:** `docs/adr/0085-mobile-mou-status-pills-scroll-and-desktop-only-sticky-columns.md`
- **Spec Reference:** `docs/superpowers/specs/2026-11-08-mobile-mou-status-pills-and-table-sticky-fix-design.md`

---

## 1. File Manifest & LOC Estimates

| File | Operation | Description | Est. LOC Delta |
| :--- | :--- | :--- | :--- |
| `src/components/views/MousView/mouColumns.test.ts` | Modify | Add unit assertions for `static md:sticky` in `MarcomTableShell` and horizontal scroll classes in `MousHeader` | +30 LOC |
| `src/components/views/MousView/MousHeader.tsx` | Modify | Constrain status chips rail with `w-full sm:w-auto max-w-full overflow-x-auto no-scrollbar`, add `shrink-0 whitespace-nowrap`, and make search full-width on mobile | ~6 LOC |
| `src/components/views/shared/MarcomTableShell.tsx` | Modify | Replace inline `position: "sticky"` with responsive `static md:sticky` and `md:border-l` / `md:shadow-[...]` on header & body cells | ~10 LOC |
| `docs/handover-mobile-mou-status-pills-and-table-sticky-fix.md` | Create | Execution-ready handover guide with exact snippets, diffs, and non-touch boundaries | +145 LOC |
| `docs/SESSION_STATE.md` | Modify | Update session status and track ADR-0085 planning completion | +25 LOC |

---

## 2. Phased Execution Tasks

### Phase 1: Test-Driven Harness Setup (TDD First)
- [x] Update `src/components/views/MousView/mouColumns.test.ts`:
  - [x] Assert `MarcomTableShell.tsx` uses `static md:sticky` for `isRightSticky` header and body cells and does not hardcode inline `position: "sticky"`.
  - [x] Assert `MousHeader.tsx` applies `overflow-x-auto no-scrollbar` and `max-w-full` on the status chips container, `shrink-0 whitespace-nowrap` on chip buttons, and in-rail `sticky left-0 z-20` on the `Status:` label with solid background and shadow separator.
- [x] Run test suite: `node --import tsx --test src/components/views/MousView/mouColumns.test.ts` (verify RED baseline failure).

### Phase 2: Component Refactor (`MousHeader.tsx` & `MarcomTableShell.tsx`)
- [x] In `src/components/views/MousView/MousHeader.tsx`:
  - [x] Line 127: Change `className="relative flex-1 min-w-[200px] max-w-xs"` to `className="relative w-full sm:flex-1 sm:min-w-[200px] sm:max-w-xs"`.
  - [x] Line 148: Add `w-full sm:w-auto max-w-full overflow-x-auto no-scrollbar` to the status chips container.
  - [x] Line 149: Add `sticky left-0 z-20 bg-slate-100 dark:bg-slate-800 pl-1.5 pr-2 py-1 -my-1 rounded-l-lg shrink-0 whitespace-nowrap shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)]` to the `Status:` label `<span>`.
  - [x] Line 161: Add `shrink-0 whitespace-nowrap` to each `<motion.button>` status chip.
- [x] In `src/components/views/shared/MarcomTableShell.tsx`:
  - [x] Lines 470–480 (Header cell): Remove `position: "sticky"` from inline `style` (keep `right: `${rightOffset}px``), replace unconditional `"relative"` + `isRightSticky && "z-20 ..."` with `isRightSticky ? "static md:sticky z-20 bg-slate-50 dark:bg-[#18191B]" : "relative"`, and prefix sticky border/shadow with `md:border-l` and `md:shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.04)] dark:md:shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.2)]`.
  - [x] Lines 578–591 (Body cell): Remove `position: "sticky"` from inline `style` (keep `right: `${rightOffset}px``), prepend `static md:sticky` to the `isRightSticky` class branches, and prefix sticky border/shadow with `md:border-l` and `md:shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.04)] dark:md:shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.2)]`.

### Phase 3: Full Invariant Verification & Session Handoff
- [x] Run targeted test suite:
  ```bash
  node --import tsx --test src/components/views/MousView/mouColumns.test.ts
  ```
  Ensure all assertions pass (GREEN).
- [x] Run architectural drift check:
  ```bash
  npm run drift:check
  ```
  Ensure 112/112 paired specs pass with 0 drift.
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
- [x] Update `docs/SESSION_STATE.md`.

