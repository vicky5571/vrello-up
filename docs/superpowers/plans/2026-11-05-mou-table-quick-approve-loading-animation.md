# Implementation Plan: Row-Scoped Loading Animation & State Guard for MOU Quick Approve

- **Date:** 2026-11-05
- **Status:** COMPLETE
- **Spec:** `docs/superpowers/specs/2026-11-05-mou-table-quick-approve-loading-animation-design.md`
- **ADR Reference:** `docs/adr/0038-mou-table-quick-approve-loading-animation.md`

## 1. Executive Summary & File Manifest

Add visual loading feedback (`<RefreshCw className="animate-spin" />` and `"Menyetujui..."`) and double-submission protection (`disabled={isApproving}`) to the Quick Approve button on the MOUs table view.

### File Manifest:
| File | Action | Purpose & Scope | Estimated LOC |
|---|---|---|---|
| `src/components/views/MousView/mouColumns.test.ts` | Modify | Unit tests verifying `approvingMouId` column contract & loading markup | ~35 LOC |
| `src/components/views/MousView/mouColumns.tsx` | Modify | Update `MouColumnDeps` & actions column cell markup with loading spinner | ~20 LOC |
| `src/components/views/MousView/MousView.tsx` | Modify | Local state `approvingMouId` & safe `try ... finally` mutation guard | ~15 LOC |
| `docs/SESSION_STATE.md` | Modify | Track feature completion & session progress | ~20 LOC |
| `CHANGELOG.md` | Modify | Document user-facing change under Unreleased | ~10 LOC |

## 2. Implementation Phases

### Phase 1: Test-Driven Contract Verification (TDD Red)
- [x] Add unit test assertions in `src/components/views/MousView/mouColumns.test.ts`:
  - [x] Assert `approvingMouId` is accepted in `MouColumnDeps`.
  - [x] Assert `RefreshCw` icon is imported from `lucide-react`.
  - [x] Assert conditional rendering of `animate-spin` when `approvingMouId === row.original.id`.
  - [x] Assert conditional label `"Menyetujui..."` inside `hidden xl:inline`.
  - [x] Assert button `disabled` attribute and `cursor-not-allowed` class.
- [x] Run `node --test src/components/views/MousView/mouColumns.test.ts` to confirm test fails (Red).

### Phase 2: Action Column & Coordinator Integration (Green)
- [x] Update `src/components/views/MousView/mouColumns.tsx`:
  - [x] Import `RefreshCw` from `lucide-react`.
  - [x] Add `approvingMouId?: string | null;` to `MouColumnDeps`.
  - [x] In `actions` column, compute `const isApproving = approvingMouId === row.original.id;`.
  - [x] Render spinner and disabled state on the Quick Approve button.
  - [x] Guard `onClick` against concurrent triggers: `onClick={() => !isApproving && onQuickApprove(row.original)}`.
- [x] Update `src/components/views/MousView/MousView.tsx`:
  - [x] Add state `const [approvingMouId, setApprovingMouId] = useState<string | null>(null);`.
  - [x] Pass `approvingMouId` into `buildMouColumns` and dependency array `useMemo`.
  - [x] In `handleStatusTransition`: set `setApprovingMouId(mou.id)` if `nextStatus === "APPROVED"`, and wrap all mutation calls in `try ... finally { setApprovingMouId(null); }`.
- [x] Run `node --test src/components/views/MousView/mouColumns.test.ts` to confirm test passes (Green).

### Phase 3: Invariant Verification, Documentation & Handoff
- [x] Run `npm run drift:check` (must pass 65/65 paired specs).
- [x] Run `npm run build:check` (0 errors).
- [x] Run `npm test` (0 failures across all test suites).
- [x] Produce execution-ready handover guide: `docs/handover-mou-table-quick-approve-loading-animation.md`.
- [x] Update `docs/SESSION_STATE.md` and `CHANGELOG.md`.

## 3. Risks, Mitigations & Invariants

| Risk | Impact | Mitigation Strategy |
|---|---|---|
| Column width overflow on small viewports | UI clipping or horizontal table drift | The text label `"Menyetujui..."` uses `hidden xl:inline`. On viewports `< 1280px`, only the 14px spinner is rendered, preserving the 130px column width. |
| Stuck loading state on network failure | Button permanently locked until page refresh | Wrap mutation call in `try ... finally { setApprovingMouId(null); }`. Regardless of HTTP 4xx, 5xx, or automation exceptions, state is reset. |
| Double-click race condition | Duplicate webhook / task triggers | Button is marked `disabled={isApproving}` and `onClick` handler checks `!isApproving` before forwarding call. |

## 4. Verification Checklist

- [x] `node --test src/components/views/MousView/mouColumns.test.ts` passes (6/6 passing)
- [x] `npm run drift:check` passes (65/65 specs paired, coordinator LOC < 250 rules respected)
- [x] `npm run build:check` passes with 0 TypeScript/Next.js errors
- [x] `npm test` passes with 0 failures (818/818 tests passing)



