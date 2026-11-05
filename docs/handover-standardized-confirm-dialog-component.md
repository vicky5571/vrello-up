# Handover: Standardized ConfirmDialog Component & Inventory Deletion Integration

- **Date:** 2026-11-05
- **Status:** READY FOR EXECUTION
- **Spec:** `docs/superpowers/specs/2026-11-05-standardized-confirm-dialog-component-design.md`
- **Plan:** `docs/superpowers/plans/2026-11-05-standardized-confirm-dialog-component.md`
- **ADR:** `docs/adr/0040-standardized-confirm-dialog-component.md`

## 1. File Paths & Purpose

| File Path | One-Line Purpose |
|---|---|
| `src/components/ui/ConfirmDialog.tsx` | Reusable confirmation modal primitive wrapping `Modal.tsx` |
| `src/components/ui/confirmDialog.test.ts` | Unit tests asserting component contract, variants, and loading states |
| `src/components/views/InventoryView/InventoryView.tsx` | Inventory view coordinator tracking `deletingItem` state and mounting `ConfirmDialog` |
| `src/components/views/InventoryView/InventoryItemsGrid.tsx` | Cards grid view passing item object to `onDelete` |
| `src/components/views/InventoryView/InventoryTableView.tsx` | Table view passing item object to `onDelete` |
| `src/components/views/InventoryView/inventoryDeleteConfirm.test.ts` | Integration tests asserting elimination of `window.confirm` and modal deletion flow |

## 2. Explicit "Do Not Touch" List

- **`src/app/api/marcom/inventory/[id]/route.ts`**: Do not modify backend DELETE API or validation logic. The server endpoint already rejects items with active borrows and is fully tested.
- **`src/components/ui/Modal.tsx`**: Do not alter `Modal.tsx`. It provides the native `<dialog>` browser Top Layer primitive and focus trap.
- **Multi-Tenant / `workspaceId` Scaffolding**: Invariant rule. Single-tenant architecture must remain strictly untouched.

## 3. Current Code Snippets & Exact Change Instructions

### 3.1 `src/components/views/InventoryView/InventoryView.tsx`

#### Exact Current Snippet (Lines 91-102):
```tsx
  const handleDeleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this equipment item?")) return;
    try {
      const res = await fetch(`/api/marcom/inventory/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete item");
      removeCachedInventoryItem(id);
      toast.success("Equipment item deleted");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };
```

#### Change Instruction:
Replace with state-driven confirmation and safe async execution:
```tsx
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteItem = (target: InventoryItem | string) => {
    const item = typeof target === "string" ? inventoryItems.find((i) => i.id === target) : target;
    if (item) setDeletingItem(item);
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/marcom/inventory/${deletingItem.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete equipment item");
      removeCachedInventoryItem(deletingItem.id);
      toast.success(`Equipment item "${deletingItem.name}" deleted`);
      setDeletingItem(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete equipment item");
    } finally {
      setIsDeleting(false);
    }
  };
```

And mount `ConfirmDialog`:
```tsx
      <ConfirmDialog
        isOpen={Boolean(deletingItem)}
        onClose={() => !isDeleting && setDeletingItem(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Equipment Item"
        description="Are you sure you want to permanently delete this equipment item from the master catalog? This action cannot be undone."
        confirmLabel={isDeleting ? "Deleting..." : "Delete Item"}
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isDeleting}
        itemDetails={
          deletingItem
            ? {
                name: deletingItem.name,
                code: deletingItem.code,
                badgeText: deletingItem.category,
              }
            : undefined
        }
      />
```

---

### 3.2 `src/components/ui/ConfirmDialog.tsx` (New Component)

#### Specification:
- Imports: `React`, `Modal` from `@/components/ui/Modal`, `AlertTriangle`, `AlertCircle`, `HelpCircle`, `Loader2` from `lucide-react`, `cn` from `@/lib/utils`.
- Wraps `<Modal isOpen={isOpen} onClose={...} label={title} panelClassName="max-w-md w-full">`.
- Header: Circular icon badge colored by `variant` (`danger`: rose, `warning`: amber, `default`: blue).
- Content: Title (`font-semibold text-base`), Description (`text-xs text-slate-600 dark:text-slate-400 mt-1`).
- Contextual preview: `itemDetails` card displaying `[code] name` and category badge.
- Footer actions: Cancel button (disabled when `isLoading`) and Confirm button (`variant="danger"` with `bg-rose-600 hover:bg-rose-700`, spinner when `isLoading`).

## 4. Numbered Execution Order

1. **Step 1:** Create `src/components/ui/confirmDialog.test.ts` and `src/components/views/InventoryView/inventoryDeleteConfirm.test.ts`. Run with `node --test` to confirm failure (Red Phase).
2. **Step 2:** Implement `src/components/ui/ConfirmDialog.tsx`.
3. **Step 3:** Update `src/components/views/InventoryView/InventoryView.tsx` with `deletingItem`, `isDeleting`, `handleConfirmDelete`, and `<ConfirmDialog />`.
4. **Step 4:** Run tests to confirm pass (Green Phase).
5. **Step 5:** Run non-negotiable verification gates (`npm run drift:check`, `npm run build:check`, `npm test`).
6. **Step 6:** Update `docs/SESSION_STATE.md`, `CHANGELOG.md`, and git commit.

## 5. Acceptance Criteria Checklist

- [ ] `src/components/ui/ConfirmDialog.tsx` exists and exports `ConfirmDialog` and `ConfirmDialogProps`
- [ ] Dialog wraps native `<dialog>` `Modal.tsx` for accessible top layer promotion
- [ ] Red/rose styling and `AlertTriangle` icon render when `variant="danger"`
- [ ] Contextual card displays item code, name, and category badge
- [ ] Confirm button enters loading state with spinning `<Loader2 />` and disables buttons
- [ ] `InventoryView.tsx` no longer calls `window.confirm(...)`
- [ ] Deletion state cleanly resets in `try ... finally` on success or error
- [ ] All verification gates pass (`npm run drift:check`, `npm run build:check`, `npm test`)



