# Implementation Plan: Standardized ConfirmDialog Component & Inventory Deletion Integration

- **Date:** 2026-11-05
- **Status:** COMPLETE
- **Spec:** `docs/superpowers/specs/2026-11-05-standardized-confirm-dialog-component-design.md`
- **ADR Reference:** `docs/adr/0040-standardized-confirm-dialog-component.md`

## 1. Executive Summary & File Manifest

Build a reusable, accessible confirmation dialog component (`ConfirmDialog.tsx`) wrapping the native HTML `<dialog>` primitive (`Modal.tsx`), and integrate it into the Equipment Inventory view (`InventoryView.tsx`) to replace thread-blocking browser `window.confirm(...)` popups with tactile visual loading feedback and contextual asset confirmation.

### File Manifest:
| File | Action | Purpose & Scope | Estimated LOC |
|---|---|---|---|
| `src/components/ui/ConfirmDialog.tsx` | Create | Reusable confirmation dialog component wrapping `Modal.tsx` | ~90 LOC |
| `src/components/ui/confirmDialog.test.ts` | Create | Unit test asserting component contract, variants, and loading state | ~55 LOC |
| `src/components/views/InventoryView/InventoryView.tsx` | Modify | State management (`deletingItem`, `isDeleting`) and `ConfirmDialog` mounting | ~25 LOC |
| `src/components/views/InventoryView/InventoryItemsGrid.tsx` | Modify | Pass item object or ID to delete handler | ~5 LOC |
| `src/components/views/InventoryView/InventoryTableView.tsx` | Modify | Pass item object or ID to delete handler | ~5 LOC |
| `src/components/views/InventoryView/inventoryDeleteConfirm.test.ts` | Create | Integration test asserting elimination of `window.confirm` and modal mount | ~45 LOC |
| `docs/SESSION_STATE.md` | Modify | Track feature completion & session progress | ~20 LOC |
| `CHANGELOG.md` | Modify | Document user-facing change under Unreleased | ~15 LOC |

## 2. Implementation Phases

### Phase 1: Test-Driven Contract Verification (TDD Red)
- [x] Create `src/components/ui/confirmDialog.test.ts`:
  - [x] Assert `ConfirmDialog` accepts `isOpen`, `onClose`, `onConfirm`, `title`, `description`, `confirmLabel`, `cancelLabel`, `variant`, `isLoading`, and `itemDetails`.
  - [x] Assert `variant="danger"` applies red/rose styling (`bg-rose-600`) and renders `<AlertTriangle />`.
  - [x] Assert `isLoading={true}` disables buttons and renders spinning `<Loader2 />`.
  - [x] Assert `itemDetails` renders code badge and name.
- [x] Create `src/components/views/InventoryView/inventoryDeleteConfirm.test.ts`:
  - [x] Assert `InventoryView.tsx` mounts `ConfirmDialog`.
  - [x] Assert `InventoryView.tsx` no longer calls browser `confirm(...)`.
  - [x] Assert deletion mutation resets state in `try ... finally`.
- [x] Run `node --test src/components/ui/confirmDialog.test.ts src/components/views/InventoryView/inventoryDeleteConfirm.test.ts` to confirm tests fail (Red).

### Phase 2: ConfirmDialog Component & Inventory View Integration (Green)
- [x] Create `src/components/ui/ConfirmDialog.tsx`:
  - [x] Wrap `src/components/ui/Modal.tsx`.
  - [x] Implement circular header icon badge for `danger`, `warning`, and `default` variants.
  - [x] Render contextual `itemDetails` card when provided.
  - [x] Render Cancel button and Confirm button with `isLoading` spinner and disabled guard.
- [x] Update `src/components/views/InventoryView/InventoryView.tsx`:
  - [x] Add states: `const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null);` and `const [isDeleting, setIsDeleting] = useState(false);`.
  - [x] Update `handleDeleteItem` to set `deletingItem(item)`.
  - [x] Implement `handleConfirmDelete` async function wrapping `DELETE /api/marcom/inventory/${deletingItem.id}` in `try ... finally { setIsDeleting(false); }`.
  - [x] Render `<ConfirmDialog>` with English labels and `itemDetails`.
- [x] Update `InventoryItemsGrid.tsx` and `InventoryTableView.tsx`:
  - [x] Pass `item` directly to `onDelete(item)`.
- [x] Run `node --test src/components/ui/confirmDialog.test.ts src/components/views/InventoryView/inventoryDeleteConfirm.test.ts` to confirm tests pass (Green).

### Phase 3: Invariant Verification, Documentation & Handoff
- [x] Run `npm run drift:check` (must pass 67/67 paired specs).
- [x] Run `npm run build:check` (0 errors).
- [x] Run `npm test` (0 failures across all test suites).
- [x] Produce execution-ready handover guide: `docs/handover-standardized-confirm-dialog-component.md`.
- [x] Update `docs/SESSION_STATE.md` and `CHANGELOG.md`.

## 3. Risks, Mitigations & Invariants

| Risk | Impact | Mitigation Strategy |
|---|---|---|
| Accidental asset deletion | Loss of physical equipment record | The dialog prominently displays the asset's code (e.g. `[CBL-001]`) and name inside a dedicated card before confirmation. |
| Double-click race condition | Duplicate DELETE requests to backend | Action buttons are marked `disabled={isLoading}` and backdrop click / Escape dismissal is prevented during transit. |
| Backend rejection on active borrows | Unhandled promise rejection / UI freeze | The async delete call is wrapped in `try ... catch ... finally`. If the backend returns HTTP 400 (`Cannot delete item with active borrow records`), a red toast displays the error and the dialog resets state safely. |

## 4. Verification Checklist

- [x] `node --test src/components/ui/confirmDialog.test.ts` passes (3/3 passing)
- [x] `node --test src/components/views/InventoryView/inventoryDeleteConfirm.test.ts` passes (3/3 passing)
- [x] `npm run drift:check` passes (67/67 paired specs, coordinator LOC < 250 rules respected)
- [x] `npm run build:check` passes with 0 TypeScript/Next.js errors
- [x] `npm test` passes with 0 failures



