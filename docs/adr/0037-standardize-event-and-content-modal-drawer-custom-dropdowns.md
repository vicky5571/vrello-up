# ADR-0037: Standardize Event & Content Modal/Drawer Form CustomDropdowns

- **Status:** APPROVED
- **Date:** 2026-11-05
- **Deciders:** Senior Software Engineer, Principal Systems Architect, Product Owner
- **Consulted:** Marcom Lead, Operations Coordinator
- **Informed:** Core Development Team

## 1. Context & Business Problem

While table headers, filter bars, and bulk actions across Vrello Up have been standardized to use the centralized `CustomDropdown` component (`src/components/ui/CustomDropdown.tsx`), modal dialogs and slide-out edit drawers have lagged behind and still contain raw HTML `<select>` elements:

1. **`EventDrawer.tsx` (Field Event Edit Drawer):** Contains 4 unstyled `<select>` elements (`eventType`, `eventBranchName`, `eventOutletId`, `picMemberId`).
2. **`EventCreateModal.tsx` (New Field Event Form):** Contains 4 unstyled `<select>` elements (`eventType`, `eventBranchName`, `eventOutletId`, `picMemberId`).
3. **`ContentPostModal.tsx` (Schedule New Post Form):** Contains 4 unstyled `<select>` elements (`platform`, `format`, `status`, `outletId`).

### Operational Friction & Visual Defect:
- **Platform OS Popover Inconsistency:** On macOS, native `<select>` opens the unstyled blue Aqua popover overlay that completely clashes with the platform's custom dark/light theme tokens and rounded card design.
- **Lack of Searchability in Critical Fields:** As the number of operational outlets (`outlets`) and team members (`members`) grows, selecting an outlet in `EventDrawer` or `ContentPostModal` becomes tedious because users must manually scroll through unsearchable native select option lists.
- **Inconsistent UX Across Forms:** The disparity between standardized filter bars and native form inputs diminishes the perceived quality and enterprise polish of the application.

## 2. Options Considered

### Option 1: Full Form CustomDropdown Standardization (Field Event Forms + Schedule Post Modal) — [CHOSEN]
- **Concept:** Replace native `<select>` tags in `EventDrawer.tsx`, `EventCreateModal.tsx`, and `ContentPostModal.tsx` with `CustomDropdown<T>`. Configure `size="md"` to align with standard form input height, `searchable={true}` on outlet and PIC pickers, and responsive popover positioning (`direction="auto"`, `align="auto"`, `menuClassName="w-full min-w-full max-w-md"`). Defer `ContentDrawer.tsx` as requested.
- **Pros:**
  - 100% consistent look and feel across modal and drawer forms.
  - Search filtering for outlets and PICs speeds up operational entry.
  - Full keyboard navigation and dark-mode styling with zero new external dependencies.
- **Cons:** Requires updating form wiring in 3 components.

### Option 2: Edit Form Only (`EventDrawer.tsx`)
- **Concept:** Only replace dropdowns in `EventDrawer.tsx`.
- **Pros:** Minimal LOC change.
- **Cons:** Leaves `EventCreateModal` and `ContentPostModal` with raw OS Aqua select menus, causing immediate visual inconsistency when creating vs. editing.

### Option 3: Minimalist CSS-Only Native Select Restyling
- **Concept:** Apply custom Tailwind appearance reset (`appearance-none`) and custom ChevronDown background to native `<select>`.
- **Pros:** Zero JavaScript component changes.
- **Cons:** Fails to solve the core UX problem: native macOS dropdown popovers cannot be styled with CSS, and native `<select>` cannot provide search filtering.

## 3. Decision

We adopt **Option 1: Full Form CustomDropdown Standardization across `EventDrawer.tsx`, `EventCreateModal.tsx`, and `ContentPostModal.tsx`**.

### Architectural Directives:
1. **SSOT Component Usage:** All dropdowns must import and use the canonical `CustomDropdown` component from `@/components/ui/CustomDropdown`.
2. **Form Height Harmony:** Specify `size="md"` on all form `CustomDropdown` instances to match the 36px line height of sibling text inputs (`min-h-[36px]`).
3. **Searchability Activation:**
   - Outlet selection in `EventDrawer`, `EventCreateModal`, and `ContentPostModal` must set `searchable={true}` and appropriate `searchPlaceholder`.
   - PIC selection in `EventDrawer` and `EventCreateModal` must set `searchable={members.length >= 6}`.
4. **Z-Index & Scroll Container Safety:**
   - Popovers inside scrollable drawer bodies (`overflow-y-auto`) must use `menuClassName="w-full min-w-full max-w-md"` to prevent clipping and enable smooth keyboard navigation.
5. **Human-in-the-Loop Clear Link:** Retain existing "Hapus tautan" / "Clear link" buttons for optional outlet associations.
6. **Explicit Deferral:** `ContentDrawer.tsx` is deferred to a future session as instructed by the user.

## 4. Consequences & Risks

### Positive:
- Total elimination of unstyled OS native dropdown menus on field event and schedule post creation/editing.
- Real-time search filtering on outlet lists drastically reduces friction when linking events or posts to stores.
- Consistent visual language matching the dark/light design system.

### Negative / Accepted Debt:
- Form state is controlled via component state rather than native HTML form serialization (already standard pattern across Vrello Up).
- `ContentDrawer.tsx` remains on native `<select>` until scheduled for update.


