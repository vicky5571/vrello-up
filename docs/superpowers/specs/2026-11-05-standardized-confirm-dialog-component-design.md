# Design Specification: Standardized ConfirmDialog Component & Inventory Deletion Integration

- **Date:** 2026-11-05
- **Status:** IMPLEMENTED
- **ADR Reference:** `docs/adr/0040-standardized-confirm-dialog-component.md`

## 1. Executive Summary & Goals

This specification details the architecture, design, and integration of a canonical, reusable confirmation dialog component (`ConfirmDialog.tsx`) built on top of the native HTML `<dialog>` primitive (`Modal.tsx`). The primary driver is eliminating thread-blocking, unstyled browser `window.confirm(...)` popups on the Equipment Inventory page (`localhost:3000/?mode=marcom&view=inventory`), providing tactile loading feedback, dark-mode alignment, and accidental deletion prevention.

### Core Objectives:
1. **Reusable Primitive:** Provide `src/components/ui/ConfirmDialog.tsx` with customizable title, description, confirm/cancel buttons, danger/warning/default variants, and asynchronous loading states.
2. **Contextual Confirmation Card:** Render the target asset's code and name (e.g., `[CBL-001] Heavy Duty Cable Roll 50m`) so operators clearly see which item is slated for deletion.
3. **Double-Submission & In-Flight Protection:** Disable both action buttons while the DELETE request is executing, swap the confirm icon with `<Loader2 className="animate-spin" />`, and prevent backdrop dismissal during transit.
4. **Resilient Error Recovery:** Guarantee the loading state resets cleanly via `try ... finally { setIsDeleting(false); }` whether the server accepts or rejects the deletion.
5. **English User Interface:** Default all confirmation dialog strings to English (matching the Equipment Inventory page).

## 2. Component Contract & Architecture (`ConfirmDialog.tsx`)

### 2.1 Interface Definition
```ts
export type ConfirmDialogVariant = "danger" | "warning" | "default";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmDialogVariant;
  isLoading?: boolean;
  itemDetails?: {
    name: string;
    code?: string;
    badgeText?: string;
  };
}
```

### 2.2 Visual Anatomy & Styling Tokens
- **Backdrop:** Utilizes `Modal.tsx`'s native `<dialog>` top-layer backdrop: `backdrop:bg-slate-950/60 backdrop:backdrop-blur-xs`.
- **Panel Container:** Centered dialog, `max-w-md w-full p-6 rounded-2xl bg-white dark:bg-[#18191B] border border-slate-200 dark:border-white/10 shadow-2xl`.
- **Header Icon Badge:**
  - `variant="danger"`: Circular badge with `w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4`. Icon: `<AlertTriangle className="w-5 h-5" />`.
  - `variant="warning"`: Circular badge with `bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400`. Icon: `<AlertCircle className="w-5 h-5" />`.
  - `variant="default"`: Circular badge with `bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400`. Icon: `<HelpCircle className="w-5 h-5" />`.
- **Item Details Card (Contextual Preview):**
  - Container: `mt-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between text-xs`.
  - Left: Code `font-mono font-bold text-slate-800 dark:text-slate-200` + Name `text-slate-600 dark:text-slate-300 truncate max-w-[240px]`.
  - Right: Optional badge `px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300`.
- **Action Buttons:**
  - Cancel Button: `px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer`.
  - Confirm Button:
    - Danger: `px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50 cursor-pointer`.

## 3. Interaction Flow & State Machine

```
┌─────────────────────────────────────────────────────────────┐
│  State: IDLE (Table / Grid View)                           │
│  User clicks Trash icon on item (e.g. CBL-001)             │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  State: OPEN (deletingItem = item, isDeleting = false)       │
│  - ConfirmDialog opens via native HTML <dialog>.showModal() │
│  - Displays: [CBL-001] Heavy Duty Cable Roll 50m           │
│  - Buttons: [Cancel] [Delete Item]                          │
└───────────────┬─────────────────────────────┬───────────────┘
                │                             │
    User clicks Cancel / Escape   User clicks Delete Item
                │                             │
                ▼                             ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│  deletingItem = null        │ │  State: DELETING            │
│  Dialog closes              │ │  isDeleting = true          │
└─────────────────────────────┘ │  Buttons disabled           │
                                │  Confirm: [⟳ Deleting...]   │
                                └──────────────┬──────────────┘
                                               │
                                               ▼
                              DELETE /api/marcom/inventory/[id]
                                               │
                       ┌───────────────────────┴───────────────────────┐
                       ▼                                               ▼
              [Success: 200 OK]                               [Error: 400 / 500]
       - toast.success("Item deleted")                 - toast.error(error.message)
       - removeCachedInventoryItem(id)                 - dialog closes cleanly
       - deletingItem = null                           - deletingItem = null
       - isDeleting = false                            - isDeleting = false
```

## 4. Integration in Equipment Inventory (`InventoryView.tsx`)

### 4.1 State Management
```tsx
const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null);
const [isDeleting, setIsDeleting] = useState(false);

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

### 4.2 Modal Rendering
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

## 5. Verification Checklist & Invariants

- [ ] Automated unit test `src/components/ui/confirmDialog.test.ts` testing:
  - Renders title, description, and itemDetails card correctly.
  - Applies red/rose styling on `variant="danger"`.
  - Disables action buttons and renders spinner when `isLoading={true}`.
  - Triggers `onConfirm` and `onClose` appropriately.
- [ ] Automated integration test `src/components/views/InventoryView/inventoryDeleteConfirm.test.ts` testing:
  - `InventoryView.tsx` mounts `ConfirmDialog` and no longer calls `window.confirm`.
  - Passing item to delete triggers `setDeletingItem`.
  - Deletion mutation cleans up state in `finally`.
- [ ] Non-negotiable gates:
  - `npm run drift:check` passes with no drift detected.
  - `npm run build:check` passes with 0 TypeScript errors.
  - `npm test` passes with 0 test failures.



