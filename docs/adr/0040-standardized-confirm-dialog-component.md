# ADR-0040: Standardized ConfirmDialog Component & Inventory Deletion Integration

- **Status:** APPROVED
- **Date:** 2026-11-05
- **Deciders:** Senior Software Engineer, Principal Systems Architect, Product Owner
- **Consulted:** Marcom Lead, Logistics Coordinator
- **Informed:** Core Development Team

## 1. Context & Business Problem

Throughout Vrello Up, destructive actions—most notably deleting equipment catalog items in `InventoryView.tsx` (`localhost:3000/?mode=marcom&view=inventory`)—rely on browser-native `window.confirm(...)` dialogs.

### Operational Friction & Architectural Deficiencies:
1. **Disjointed User Experience:** Native browser popups render unstyled OS dialogs that ignore theme tokens, lack dark mode support, and visually break the application's enterprise polish.
2. **Synchronous JavaScript Thread-Blocking:** Native `window.confirm` blocks the browser's main event loop until user interaction finishes.
3. **Absence of Contextual Details:** The existing prompt (`"Are you sure you want to delete this equipment item?"`) does not mention the asset's name, code, category, or remaining units, increasing the risk of accidental deletion by logistics operators.
4. **No Visual Loading / In-Flight Protection:** When the user clicks "OK", the dialog immediately dismisses while the network request (`DELETE /api/marcom/inventory/[id]`) is in flight. Users receive zero feedback during network transit, leading to perceived lag or premature page refreshes.
5. **Code Duplication Risk:** Across the application, 12 separate locations currently invoke `window.confirm`. Without a standardized, accessible confirmation primitive, future modules are forced to either tolerate browser dialogs or build redundant one-off modal components.

## 2. Options Considered

### Option 1: Canonical `ConfirmDialog` Primitive Wrapping Native `<dialog>` (`Modal.tsx`) — [CHOSEN]
- **Concept:** Create `src/components/ui/ConfirmDialog.tsx` as a reusable component layered on top of the native HTML `<dialog>` wrapper `src/components/ui/Modal.tsx`. Supports `variant: "danger" | "warning" | "default"`, customizable title/description, contextual asset badge (`itemDetails`), asynchronous loading states (`isLoading`, `<Loader2 className="animate-spin" />`), and disabled button guards during deletion. Integrate into `InventoryView.tsx` by replacing `window.confirm` with local `deletingItem: InventoryItem | null` state.
- **Pros:**
  - Standardized enterprise look and feel with full dark-mode support.
  - Native browser Top Layer promotion and automatic focus trapping via `<dialog>`.
  - Tactile loading feedback while server mutation is in flight.
  - 100% reusable across all other modules (Documents, MOUs, Users, Events, Placements) without duplicated code.
- **Cons:** Adds 1 shared UI component to `src/components/ui/`.

### Option 2: Module-Specific Delete Modal (`InventoryItemDeleteModal.tsx`)
- **Concept:** Implement a one-off confirmation modal purely inside `src/components/views/InventoryView/`.
- **Pros:** Scoped strictly to inventory.
- **Cons:** Violates DRY and architecture invariants; encourages copy-pasting delete modal boilerplate across every other view.

### Option 3: Toast-based Optimistic Deletion with Undo
- **Concept:** Instantly delete item from local state and display a toast with a 5-second "Undo" button before committing to the database.
- **Pros:** Minimizes modal dialog friction.
- **Cons:** Unacceptable risk for physical assets. Equipment items represent physical inventory with serial numbers, capacity limits, and maintenance logs; accidental deletion could disrupt active loan allocations.

## 3. Decision

We adopt **Option 1: Canonical `ConfirmDialog` Primitive Wrapping Native `<dialog>` (`Modal.tsx`)**.

### Architectural Directives:
1. **Component Location & Contract:**
   - Create `src/components/ui/ConfirmDialog.tsx`.
   - Prop contract:
     ```ts
     export interface ConfirmDialogProps {
       isOpen: boolean;
       onClose: () => void;
       onConfirm: () => void | Promise<void>;
       title: string;
       description: React.ReactNode;
       confirmLabel?: string;
       cancelLabel?: string;
       variant?: "danger" | "warning" | "default";
       isLoading?: boolean;
       itemDetails?: {
         name: string;
         code?: string;
         badgeText?: string;
       };
     }
     ```
2. **Accessible Native Modal Underpinnings:**
   - Wrap `src/components/ui/Modal.tsx` for native `<dialog>` browser Top Layer promotion, automatic focus trapping, and background inerting.
3. **Double-Submission Prevention & Loading Animation:**
   - When `isLoading` is true, disable both the Confirm and Cancel buttons, swap the icon to `<Loader2 className="animate-spin" />`, and prevent backdrop or Escape dismissal.
4. **Integration in Equipment Inventory:**
   - In `InventoryView.tsx`, replace `window.confirm` with `deletingItem: InventoryItem | null`.
   - Pass `onDelete={(item) => setDeletingItem(item)}` through `InventoryItemsGrid` and `InventoryTableView`.
   - Render `<ConfirmDialog>` in `InventoryViewModals.tsx` or directly in `InventoryView.tsx`.

## 4. Consequences & Invariants

### Positive:
- Total elimination of thread-blocking browser `window.confirm` dialogs in the Equipment Inventory view.
- Tactile feedback with spinning loading indicators during DELETE network calls.
- Clear contextual safety (showing item name and code before confirming destruction).
- Foundation primitive ready for gradual adoption across Documents, Events, and MOUs.

### Negative / Accepted Debt:
- Existing `window.confirm` calls in other modules (e.g. `MoreAppsMenu`, `DocumentDrawer`, `ReportsView`) remain for future incremental adoption to keep this change tightly scoped.

### Verification:
- Automated unit test suite `src/components/ui/confirmDialog.test.ts`.
- Automated view integration test in `src/components/views/InventoryView/inventoryDeleteConfirm.test.ts`.
- Verification gates: `npm run drift:check`, `npm run build:check`, `npm test` passing with 0 failures.



