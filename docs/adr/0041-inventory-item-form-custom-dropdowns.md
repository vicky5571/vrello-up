# ADR-0041: Standardize Inventory Item Form CustomDropdowns

- **Status:** APPROVED
- **Date:** 2026-11-05
- **Deciders:** Senior Software Engineer, Principal Systems Architect, Product Owner
- **Consulted:** Marcom Lead, Operations Coordinator, Warehouse Supervisor
- **Informed:** Core Development Team

## 1. Context & Business Problem

In the Equipment Inventory module (`src/components/views/InventoryView/`), the master modal used for both creating and modifying equipment items (`InventoryItemFormModal.tsx`) still relies on unstyled native HTML `<select>` elements for two key fields:

1. **`Category` field (`EQUIPMENT_CATEGORIES`):** Present in both Create and Edit modes (`Audio/Visual`, `Staging/Booth`, `Merchandising/Display`, `Furniture/Logistics`, `Electrical/Cables`, `Promosi/POSM`, `Kendaraan/Transportasi`, `Lain-lain`).
2. **`Equipment Status` field (`EQUIPMENT_STATUS_CONFIG`):** Present in Edit mode (`AVAILABLE`, `BORROWED`, `MAINTENANCE`, `RETIRED`).

### Operational Friction & Visual Defect:
- **Platform OS Popover Inconsistency:** On macOS, native `<select>` opens the unstyled blue Aqua popover overlay that completely clashes with the platform's custom dark/light theme tokens and rounded card design.
- **Form Component Divergence:** Following ADR-0037 (which standardized `CustomDropdown` across `EventDrawer`, `EventCreateModal`, and `ContentPostModal`), native `<select>` tags in `InventoryItemFormModal` create visual inconsistency and a jarring experience for marketing and operations coordinators.
- **Keyboard Navigation & Theming:** Native `<select>` elements do not respect custom focus rings or Dark Mode contrast variables as fluidly as the centralized `CustomDropdown` component.

## 2. Options Considered

### Option 1: Focused Scope — Add & Edit Equipment Item Modal Only (`InventoryItemFormModal.tsx`) — [CHOSEN]
- **Concept:** Replace the native `<select>` tags for `Category` and `Equipment Status` in `InventoryItemFormModal.tsx` with canonical `CustomDropdown<T>` instances. Retain exact form validation, typing, and submission payloads. Configure `size="md"` to align with adjacent text inputs, `direction="auto"`, and `menuClassName="w-full min-w-full max-h-60"`.
- **Trade-off Summary:**
  - *Business & Operational Continuity:* High. Immediate visual polish on master item catalog entry with zero impact on borrow/return workflows.
  - *Engineering Cost & Complexity:* Minimal (1 file, ~30 LOC modified). Clean unit test surface.
  - *Data Integrity & Performance:* Identical API contract (`POST` / `PUT` `/api/marcom/inventory`).
  - *Risk:* Zero regression risk to external components. Leaves `BorrowRequestModal` and `ReturnProcessModal` for separate roadmap consideration.

### Option 2: Full Inventory Module Suite (`InventoryItemFormModal` + `BorrowRequestModal` + `ReturnProcessModal`)
- **Concept:** Concurrently update all three inventory modals to `CustomDropdown`, adding real-time search for Field Events in borrow requests and custom condition select menus in returns.
- **Trade-off Summary:**
  - *Pros:* 100% elimination of native `<select>` across the entire inventory subsystem in a single pass.
  - *Cons:* Broadened blast radius across 3 separate files and state models, increasing review overhead and testing surface for non-item operations.

### Option 3: Minimalist CSS-Only Native Select Restyling
- **Concept:** Keep `<select>` and apply Tailwind `appearance-none` with background SVG chevrons.
- **Trade-off Summary:**
  - *Cons:* Fails to style the native OS popover menu (especially macOS Aqua), preserving the root visual defect.

## 3. Decision

We adopt **Option 1: Focused Scope — Standardize `InventoryItemFormModal.tsx` with canonical `CustomDropdown`**.

### Architectural Directives:
1. **SSOT Component Usage:** Import `CustomDropdown` from `@/components/ui/CustomDropdown`.
2. **Dimension & Height Alignment:** Specify `size="md"` (`min-h-[36px]`) to seamlessly match standard height and padding of sibling text inputs (`name`, `code`, `brand`, `totalUnits`).
3. **Category Field Mapping:**
   - Map `EQUIPMENT_CATEGORIES` strings directly to `{ value: cat, label: cat }`.
   - Set `direction="auto"` and `menuClassName="w-full min-w-full max-h-60"`.
4. **Status Field Mapping (Edit Mode):**
   - Strongly type value as `EquipmentStatus`.
   - Map `(Object.keys(EQUIPMENT_STATUS_CONFIG) as EquipmentStatus[])` to `{ value: st, label: EQUIPMENT_STATUS_CONFIG[st].label }`.
5. **Popover & Scroll Container Safety:**
   - Apply `buttonClassName="w-full bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-xs text-left"` to preserve form field appearance.
   - Utilize existing Z-Index Layer 5 promotion on open popovers (guaranteed by ADR-0039).
6. **Explicit Deferral:** `BorrowRequestModal.tsx` and `ReturnProcessModal.tsx` remain untouched in this scope.

## 4. Consequences & Risks

### Positive:
- Total elimination of unstyled native OS select menus when adding or updating equipment items.
- Unified dark/light design system adherence across modal forms.
- Full keyboard navigation and clean focus state indicators.

### Negative / Accepted Debt:
- `BorrowRequestModal` and `ReturnProcessModal` retain native `<select>` elements until explicitly scheduled for a dedicated pass.

