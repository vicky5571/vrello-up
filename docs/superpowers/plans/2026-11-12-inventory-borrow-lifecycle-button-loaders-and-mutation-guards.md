# Implementation Plan: Inventory Borrow Lifecycle Button Loaders and Mutation Guards

- **Date:** 2026-11-12
- **Status:** APPROVED
- **Spec:** [2026-11-12-inventory-borrow-lifecycle-button-loaders-and-mutation-guards-design.md](../specs/2026-11-12-inventory-borrow-lifecycle-button-loaders-and-mutation-guards-design.md)
- **ADR:** [ADR-0107](../../adr/0107-inventory-borrow-lifecycle-button-loaders-and-mutation-guards.md)

---

## 1. Executive Summary & File Manifest

This plan implements localized visual button loaders (`Loader2`) and click-locks (`disabled`) for inventory borrowing lifecycle operations ([ADR-0107](../../adr/0107-inventory-borrow-lifecycle-button-loaders-and-mutation-guards.md)). When warehouse officers or administrators click "Approve Request" or "Mark as Picked Up", the specific button immediately enters a loading state and becomes disabled, preventing duplicate API requests and providing clear feedback during high network latency or concurrent operations.

### File Manifest & LOC Estimates

| File Path | Action | Purpose | LOC Est. |
| :--- | :--- | :--- | :--- |
| `src/components/views/InventoryView/InventoryView.tsx` | Edit | Manage `mutatingBorrowId` and `mutatingAction` state, pass to child views and modal containers. | ~15 lines edited |
| `src/components/views/InventoryView/InventoryViewModals.tsx` | Edit | Forward `mutatingBorrowId` to `BorrowDetailModal`. | ~6 lines edited |
| `src/components/views/InventoryView/BorrowTrackingBoard.tsx` | Edit | Mount `Loader2` spinner on "Approve Request" and "Mark as Picked Up", lock buttons when mutating. | ~25 lines edited |
| `src/components/views/InventoryView/borrowTrackingBoard.test.ts` | Create | Unit tests verifying loader rendering, label switching, and disabled states under mutation. | ~60 lines |
| `src/components/views/InventoryView/BorrowDetailModal.tsx` | Edit | Mount `Loader2` spinner and lock modal footer buttons during active mutation. | ~20 lines edited |
| `src/components/views/InventoryView/borrowDetailModal.test.ts` | Edit | Assert `isMutating` prop disabled states and spinner rendering on detail modal footer. | ~25 lines added |
| `src/components/views/InventoryView/BorrowRecordsTable.tsx` | Edit | Add disabled / loading visual guard for in-flight table row actions. | ~10 lines edited |
| `CHANGELOG.md` | Edit | Record ADR-0107 entry. | ~15 lines |
| `docs/SESSION_STATE.md` | Edit | Record ADR-0107 completion and test verification results. | ~20 lines |

---

## 2. Phase 1: Controller Mutation State & Container Integration

- [ ] **Task 1.1: Add Mutation State in `InventoryView.tsx`**
  - File: `src/components/views/InventoryView/InventoryView.tsx`
  - Introduce `const [mutatingBorrowId, setMutatingBorrowId] = useState<string | null>(null);` and `const [mutatingAction, setMutatingAction] = useState<string | null>(null);`.
  - In `handleStatusChange`:
    - Add early guard: `if (mutatingBorrowId) return;`
    - Call `setMutatingBorrowId(id)` and `setMutatingAction(newStatus)` before `fetch()`.
    - In `finally` block, call `setMutatingBorrowId(null)` and `setMutatingAction(null)`.
  - Pass `mutatingBorrowId` and `mutatingAction` to `<BorrowTrackingBoard ... />` and `<BorrowRecordsTable ... />`.
  - Pass `mutatingBorrowId={mutatingBorrowId}` to `<InventoryViewModals ... />`.

- [ ] **Task 1.2: Propagate to `BorrowDetailModal` via `InventoryViewModals.tsx`**
  - File: `src/components/views/InventoryView/InventoryViewModals.tsx`
  - Accept `mutatingBorrowId?: string | null` in `InventoryViewModalsProps`.
  - Pass `isMutating={Boolean(mutatingBorrowId && selectedBorrow?.id === mutatingBorrowId)}` to `<BorrowDetailModal ... />`.

---

## 3. Phase 2: Kanban Board Card Loaders & Concurrency Guards

- [ ] **Task 2.1: Update `BorrowTrackingBoard.tsx` Props and Card Buttons**
  - File: `src/components/views/InventoryView/BorrowTrackingBoard.tsx`
  - Import `Loader2` from `lucide-react`.
  - Add `mutatingBorrowId?: string | null; mutatingAction?: string | null;` to `BorrowTrackingBoardProps`.
  - Inside card render loop:
    - Compute `isCardMutating = mutatingBorrowId === r.id`.
    - Compute `isBoardMutating = Boolean(mutatingBorrowId)`.
    - On **"Approve Request"** button:
      - Render `{isCardMutating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}`
      - Render text: `{isCardMutating ? "Approving..." : "Approve Request"}`
      - Set `disabled={isBoardMutating}`
      - Add styling: `disabled:opacity-60 disabled:cursor-not-allowed`
    - On **"Mark as Picked Up"** button:
      - Render `{isCardMutating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PackageCheck className="w-3.5 h-3.5" />}`
      - Render text: `{isCardMutating ? "Picking Up..." : "Mark as Picked Up"}`
      - Set `disabled={isBoardMutating}`
      - Add styling: `disabled:opacity-60 disabled:cursor-not-allowed`
    - On **"Process Return"** button:
      - Set `disabled={isBoardMutating}`
      - Add styling: `disabled:opacity-60 disabled:cursor-not-allowed`
- [ ] **Task 2.2: Add Automated Unit Tests for Board Card Loaders**
  - File: `src/components/views/InventoryView/borrowTrackingBoard.test.ts`
  - Assert that `mutatingBorrowId` renders `Loader2` and `Approving...` / `Picking Up...`.
  - Assert that all buttons on the board are disabled when `isBoardMutating` is true.

---

## 4. Phase 3: Detail Modal & Table Row Loaders

- [ ] **Task 3.1: Update `BorrowDetailModal.tsx` Buttons with Loader and Disabled State**
  - File: `src/components/views/InventoryView/BorrowDetailModal.tsx`
  - Add `isMutating?: boolean;` to `BorrowDetailModalProps`.
  - In modal footer:
    - On "Approve Request":
      - Render `{isMutating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}`
      - Text: `{isMutating ? "Approving..." : "Approve Request"}`
      - `disabled={isMutating}`
    - On "Mark as Picked Up":
      - Render `{isMutating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PackageCheck className="w-3.5 h-3.5" />}`
      - Text: `{isMutating ? "Picking Up..." : "Mark as Picked Up"}`
      - `disabled={isMutating}`
    - On "Cancel Request" / "Cancel Loan":
      - `disabled={isMutating}`
- [ ] **Task 3.2: Update `BorrowRecordsTable.tsx` Row Actions**
  - File: `src/components/views/InventoryView/BorrowRecordsTable.tsx`
  - Add `mutatingBorrowId?: string | null;` to `BorrowRecordsTableProps`.
  - Disable return/action button if `mutatingBorrowId === r.id || Boolean(mutatingBorrowId)`.
- [ ] **Task 3.3: Add Automated Unit Tests for Detail Modal**
  - File: `src/components/views/InventoryView/borrowDetailModal.test.ts`
  - Assert `isMutating` renders spinner and sets `disabled` on action buttons.

---

## 5. Phase 4: Non-Negotiable Verification & Session Handoff

- [ ] **Task 4.1: Drift Check**
  - Run: `npm run drift:check` (must pass 134/134 pairs, coordinator files $\le 250$ LOC).
- [ ] **Task 4.2: Build Check**
  - Run: `npm run build:check` (0 TypeScript errors).
- [ ] **Task 4.3: Full Test Suite**
  - Run: `npm test` (0 failures across all suites).
- [ ] **Task 4.4: Documentation Handoff**
  - Update `CHANGELOG.md` with ADR-0107 details.
  - Update `docs/SESSION_STATE.md`.


