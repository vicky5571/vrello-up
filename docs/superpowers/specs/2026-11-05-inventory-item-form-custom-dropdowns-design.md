# Spec: Standardize Inventory Item Form CustomDropdowns

- **Status:** APPROVED
- **Date:** 2026-11-05
- **Refs:** `docs/adr/0041-inventory-item-form-custom-dropdowns.md` (ADR-0041)
- **Author:** Senior Software Engineer & Principal Systems Architect

---

## 1. Executive Summary

This specification defines the migration of form select inputs in `InventoryItemFormModal.tsx` from unstyled native HTML `<select>` elements to the canonical `CustomDropdown` primitive (`src/components/ui/CustomDropdown.tsx`). The objective is to eliminate raw OS-rendered dropdown overlays (specifically macOS Aqua popovers) during master equipment catalog item creation and editing, guaranteeing full design system harmonization, accessible keyboard interaction, and consistent styling with adjacent input fields.

---

## 2. User Experience & Interaction Flow

### 2.1 "Add Equipment Item" Mode (`item === null`)
1. User clicks the **"+ Add Item"** button in `InventoryHeaderKpis.tsx`.
2. `InventoryItemFormModal` opens with clean defaults (`name: ""`, `code: ""`, `category: EQUIPMENT_CATEGORIES[0]`, `totalUnits: 1`).
3. Under the **Category** label, user encounters a styled dropdown matching sibling inputs (`min-h-[36px]`, rounded corners, dark mode token support, and chevron indicator).
4. Clicking or focusing and pressing `Enter`/`Space` opens a floating popover listing all 8 canonical equipment categories without triggering OS-native dropdown chrome.
5. User selects a category; the dropdown displays the selected category and updates form state immediately.
6. The **Equipment Status** dropdown remains hidden (defaulting automatically to `"AVAILABLE"` upon record creation).

### 2.2 "Edit Equipment Item" Mode (`item !== null`)
1. User clicks the edit pencil icon on an equipment card or table row.
2. `InventoryItemFormModal` opens populated with existing item data.
3. The **Category** dropdown pre-selects the item's current category.
4. An **Equipment Status** section appears, presenting a styled `CustomDropdown<EquipmentStatus>` pre-selected with the item's current status (`AVAILABLE`, `BORROWED`, `MAINTENANCE`, `RETIRED`).
5. Selecting a status immediately reflects in form state without full page re-render.
6. When closing the dropdown or submitting the form, all selections pass cleanly into the `PUT /api/marcom/inventory/[id]` request payload.

---

## 3. Data Contracts & Architecture Invariants

### 3.1 SSOT Constants & Types
All values are strictly typed against domain constants:
- **Categories:** `EQUIPMENT_CATEGORIES` from `src/components/views/InventoryView/inventoryConstants.ts`
  ```typescript
  export const EQUIPMENT_CATEGORIES = [
    "Audio/Visual",
    "Staging/Booth",
    "Merchandising/Display",
    "Furniture/Logistics",
    "Electrical/Cables",
    "Promosi/POSM",
    "Kendaraan/Transportasi",
    "Lain-lain",
  ] as const;
  ```
- **Statuses:** `EQUIPMENT_STATUS_CONFIG` and `EquipmentStatus` from `src/types/index.ts`
  ```typescript
  export type EquipmentStatus = "AVAILABLE" | "BORROWED" | "MAINTENANCE" | "RETIRED";
  ```

### 3.2 Component Properties & Wiring
`CustomDropdown` instances in `InventoryItemFormModal.tsx` must adhere to these exact contracts:

#### Category Dropdown:
```tsx
<CustomDropdown<string>
  value={category}
  onChange={(val) => setCategory(val)}
  options={EQUIPMENT_CATEGORIES.map((cat) => ({ value: cat, label: cat }))}
  size="md"
  direction="auto"
  searchable={false}
  buttonClassName="w-full bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-xs text-left"
  menuClassName="w-full min-w-full max-h-60"
/>
```

#### Equipment Status Dropdown (Edit Mode Only):
```tsx
<CustomDropdown<EquipmentStatus>
  value={status}
  onChange={(val) => setStatus(val)}
  options={(Object.keys(EQUIPMENT_STATUS_CONFIG) as EquipmentStatus[]).map((st) => ({
    value: st,
    label: EQUIPMENT_STATUS_CONFIG[st].label,
  }))}
  size="md"
  direction="auto"
  searchable={false}
  buttonClassName="w-full bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-xs text-left"
  menuClassName="w-full min-w-full max-h-60"
/>
```

### 3.3 Z-Index & Stacking Invariants (ADR-0039 Compliance)
- Modal backdrop resides at `z-50` (`fixed inset-0 z-50 flex items-center justify-center`).
- Open `CustomDropdown` popover elevates to `z-50` relative to the modal dialog content, ensuring the menu always floats on top of form input fields below it without getting clipped.

---

## 4. Failure Modes & Resilience

1. **Submission Guard during Async Request:**
   - Existing `loading` state (`disabled={loading}`) must continue to disable submit buttons and prevent duplicate POST/PUT dispatches.
2. **Value Persistence & Fallback:**
   - If an item record possesses an unrecognized category or status from legacy data, `CustomDropdown` gracefully displays the value or falls back to `EQUIPMENT_CATEGORIES[0]` / `"AVAILABLE"`.
3. **Esc & Outside Click Dismissal:**
   - Pressing `Escape` while a dropdown is open closes only the dropdown popover, without inadvertently closing the entire modal dialog.

---

## 5. Acceptance Criteria & Non-Goals

### Acceptance Criteria
- [ ] Native `<select>` elements for Category and Status are completely removed from `InventoryItemFormModal.tsx`.
- [ ] Category dropdown is rendered using `CustomDropdown` with `size="md"`, mapping all 8 `EQUIPMENT_CATEGORIES`.
- [ ] Equipment Status dropdown is rendered using `CustomDropdown` in edit mode with `size="md"`, mapping all 4 statuses from `EQUIPMENT_STATUS_CONFIG`.
- [ ] Dropdowns render seamless visual styling with `bg-slate-50 dark:bg-slate-800/60`, matching adjacent text inputs.
- [ ] Form submission dispatches exact payload structure for both `POST /api/marcom/inventory` (add) and `PUT /api/marcom/inventory/[id]` (edit).
- [ ] Automated tests in `src/components/views/InventoryView/inventoryItemFormModal.test.ts` pass 100%.

### Non-Goals
- Modifying `BorrowRequestModal.tsx` or `ReturnProcessModal.tsx` in this pass.
- Modifying backend `/api/marcom/inventory` routes or database schema.
- Adding full-text search filtering to Category (since list contains only 8 fixed options).

---

## 6. Verification Plan

```bash
# Targeted test verifying CustomDropdown integration in InventoryItemFormModal
npx tsx --test src/components/views/InventoryView/inventoryItemFormModal.test.ts

# Architectural drift verification
npm run drift:check

# TypeScript type check
npm run build:check

# Full smoke and regression test suite
npm run test:smoke
npm test
```


