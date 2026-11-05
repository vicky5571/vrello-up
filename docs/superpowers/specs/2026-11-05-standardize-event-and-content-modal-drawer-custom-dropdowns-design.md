# Design Specification: Standardize Event & Content Modal/Drawer Form CustomDropdowns

- **Date:** 2026-11-05
- **Status:** IMPLEMENTED
- **ADR Reference:** `docs/adr/0037-standardize-event-and-content-modal-drawer-custom-dropdowns.md`

## 1. Executive Summary & Goals

This specification details the standardized adoption of `CustomDropdown` (`src/components/ui/CustomDropdown.tsx`) across Field Event forms (`EventDrawer.tsx`, `EventCreateModal.tsx`) and Content Planner scheduling (`ContentPostModal.tsx`). The primary goal is to replace unstyled native `<select>` elements that render native OS popovers (e.g. macOS Aqua) with accessible, searchable, dark-mode-aware custom dropdowns.

### Core Objectives:
1. **Design System Consistency:** Align form dropdowns with the existing `CustomDropdown` design used in filter bars and headers.
2. **Searchability for Complex Master Data:** Enable search filtering for Outlets and PICs to allow rapid selection in operational forms.
3. **Form Alignment & Layout Stability:** Standardize on `size="md"` (`min-h-[36px]`) to match sibling inputs without layout shifts or height discrepancies.
4. **Collision & Stacking Safety:** Ensure popover menus stack above drawer contents (`overflow-y-auto`) and flip or reposition responsively using `direction="auto"` and `menuClassName="w-full min-w-full max-w-md"`.
5. **Zero API / Schema Drift:** Purely presentation-layer refactor. All form bindings, state updates, validation checks, and submission payloads remain identical.

## 2. Dropdown Inventory & Field Mapping

### 2.1 `EventDrawer.tsx` (Field Event Edit Drawer)
| Field | Value State | Setter | Searchable | Options Schema |
| :--- | :--- | :--- | :--- | :--- |
| **Tipe Aktivasi** | `eventType` (string) | `setEventType` (+ subtasks template init) | No | `Roadshow`, `Launch`, `Booth`, `Exhibition`, `Workshop`, `Community` |
| **Cabang Penyelenggara** | `eventBranchName` (string) | `setEventBranchName` | Auto ($\ge 6$) | `branches.map(b => ({ value: b.name, label: b.name }))` |
| **Outlet Terkait** | `eventOutletId` (string) | `setEventOutletId` (+ autofill location) | Yes | `""` (Tidak Terikat) + `filteredOutlets.map(o => ({ value: o.id, label: formatOutletSelectLabel(o) }))` |
| **Person in Charge (PIC)** | `picMemberId` (string) | `setPicMemberId` (+ update `eventPicName`) | Auto ($\ge 6$) | `members.map(m => ({ value: m.id, label: `${m.name} (${m.email})` }))` + `"custom"` |

### 2.2 `EventCreateModal.tsx` (New Field Event Form)
| Field | Value State | Setter | Searchable | Options Schema |
| :--- | :--- | :--- | :--- | :--- |
| **Activation Type** | `eventType` (string) | `setEventType` (+ subtasks template init) | No | `Roadshow`, `Launch`, `Booth`, `Exhibition`, `Workshop`, `Community` |
| **Organizing Branch** | `eventBranchName` (string) | `setEventBranchName` | Auto ($\ge 6$) | `branches.map(b => ({ value: b.name, label: b.name }))` |
| **Associated Outlet** | `eventOutletId` (string) | `setEventOutletId` (+ autofill location) | Yes | `""` (None) + `filteredOutlets.map(o => ({ value: o.id, label: formatOutletSelectLabel(o) }))` |
| **Person in Charge** | `picMemberId` (string) | `setPicMemberId` (+ update `eventPicName`) | Auto ($\ge 6$) | `members.map(m => ({ value: m.id, label: `${m.name} (${m.email})` }))` + `"custom"` |

### 2.3 `ContentPostModal.tsx` (Schedule New Post Form)
| Field | Value State | Setter | Searchable | Options Schema |
| :--- | :--- | :--- | :--- | :--- |
| **Platform** | `platform` (PostPlatform) | `setPlatform` | No | `Object.keys(PLATFORM_CONFIG).map(p => ({ value: p, label: PLATFORM_CONFIG[p].label }))` |
| **Format** | `format` (PostFormat) | `setFormat` | No | `reel`, `carousel`, `image`, `story`, `article`, `thread` |
| **Status** | `status` (PostStatus) | `setStatus` | No | `DRAFT`, `IN_REVIEW`, `REVISION`, `APPROVED`, `SCHEDULED`, `PUBLISHED`, `ARCHIVED` |
| **Associated Outlet** | `outletId` (string) | `setOutletId` | Yes | `""` (None) + `outlets.map(o => ({ value: o.id, label: formatOutletSelectLabel(o) }))` |

## 3. Implementation Details & Form Wiring

### 3.1 Styling & Sizing Standards
- All form instances will receive:
  ```tsx
  <CustomDropdown
    value={...}
    onChange={...}
    options={...}
    size="md"
    className="w-full"
    menuClassName="w-full min-w-full max-w-md"
    searchable={...}
    searchPlaceholder="..."
  />
  ```
- **Height Matching:** `size="md"` renders `min-h-[36px]` with `px-3 py-2 text-sm`, perfectly matching text inputs across `EventDrawer`, `EventCreateModal`, and `ContentPostModal`.
- **Placeholder Handling:** For optional outlet fields, an explicit empty string option (`{ value: "", label: "-- Tidak Terikat Outlet Khusus --" }` or `-- None --`) is positioned at index 0, allowing users to clear or select unassociated events/posts.

### 3.2 Human-in-the-Loop Side Effects Preservation
All existing side effects triggered upon changing dropdown selections must be preserved:
1. **Activation Type Change:** When `eventType` changes and `eventSubtasks` is empty, auto-populate checklist templates using `getEventChecklistTemplate(newType)`.
2. **Outlet Selection Autofill:** When an outlet is selected and `eventLocation` is currently blank, automatically populate `eventLocation` with `found.name`.
3. **Custom PIC Toggle:** When `picMemberId === "custom"`, the freeform text input for `eventPicName` is revealed. When a member is selected, `eventPicName` is automatically populated with `m.name`.
4. **Clear Link Button:** Clicking "Hapus tautan" / "Clear link" resets the outlet ID to `""` and triggers the appropriate component callback.

## 4. Invariants & Acceptance Criteria

### Invariants:
1. **No Any Types:** All component generics must strictly type values (`CustomDropdown<PostPlatform>`, `CustomDropdown<PostFormat>`, `CustomDropdown<PostStatus>`, or `CustomDropdown<string>`).
2. **SSOT Compliance:** Do not create duplicate option arrays outside their canonical constants (`PLATFORM_CONFIG`, `EVENT_STATUSES`, etc.).
3. **Drawer Scroll Safety:** Popover menus must not get trapped or hidden behind sticky drawer footers or boundaries.

### Acceptance Criteria Checklist:
- [ ] `EventDrawer.tsx` has 0 native `<select>` elements for Activation Type, Branch, Outlet, and PIC.
- [ ] `EventCreateModal.tsx` has 0 native `<select>` elements for Activation Type, Branch, Outlet, and PIC.
- [ ] `ContentPostModal.tsx` has 0 native `<select>` elements for Platform, Format, Status, and Outlet.
- [ ] Searching in Outlet dropdown dynamically filters matching store names and codes.
- [ ] Searching in PIC dropdown filters team members by name or email.
- [ ] Selecting "Custom PIC Name..." correctly exposes the custom PIC name text input.
- [ ] Clearing outlet via "Hapus tautan" or selecting the empty option resets the link to unassigned.
- [ ] All tests pass: `npm test` has 0 failures.
- [ ] `npm run build:check` has 0 TypeScript errors.
- [ ] `npm run drift:check` passes with all specs paired.


