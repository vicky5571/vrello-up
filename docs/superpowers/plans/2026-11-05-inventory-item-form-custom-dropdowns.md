# Implementation Plan: Standardize Inventory Item Form CustomDropdowns

- **Status:** READY FOR IMPLEMENTATION
- **Date:** 2026-11-05
- **Spec:** `docs/superpowers/specs/2026-11-05-inventory-item-form-custom-dropdowns-design.md`
- **Refs:** `docs/adr/0041-inventory-item-form-custom-dropdowns.md`

---

## 1. Executive Summary

This plan outlines the atomic, test-driven steps to migrate `Category` and `Equipment Status` dropdown selectors in `InventoryItemFormModal.tsx` from raw HTML `<select>` elements to the canonical `CustomDropdown` primitive (`src/components/ui/CustomDropdown.tsx`). This completely eliminates OS-native popover chrome (macOS Aqua) on master catalog entry and editing, while strictly preserving form serialization and submission invariants.

---

## 2. File Manifest & Estimated Surface Area

| Action | File Path | Estimated LOC | Responsibility |
|---|---|---|---|
| Create | `src/components/views/InventoryView/inventoryItemFormModal.test.ts` | ~65 LOC | Invariant tests verifying elimination of `<select>` and canonical `CustomDropdown` usage |
| Modify | `src/components/views/InventoryView/InventoryItemFormModal.tsx` | ~30 LOC modified | Replace Category and Status `<select>` with `<CustomDropdown>` |
| Create | `docs/handover-inventory-item-form-custom-dropdowns.md` | ~120 LOC | Execution-ready handover guide with verbatim code diffs and safety rules |
| Modify | `CHANGELOG.md` | ~15 LOC | Chronological feature change record |
| Modify | `docs/SESSION_STATE.md` | ~25 LOC | Session handoff state update |

---

## 3. Phased Implementation Roadmap

### Phase 1: Test Scaffold & Invariant Suite (Test-First)
- [x] Create `src/components/views/InventoryView/inventoryItemFormModal.test.ts` using Node.js native test runner (`node:test`, `node:assert/strict`).
- [x] Write Test 1: Assert `InventoryItemFormModal.tsx` imports `CustomDropdown` from `@/components/ui/CustomDropdown`.
- [x] Write Test 2: Assert `InventoryItemFormModal.tsx` completely eliminates raw `<select>` tags.
- [x] Write Test 3: Assert `CustomDropdown` for Category maps all 8 `EQUIPMENT_CATEGORIES` with `size="md"`.
- [x] Write Test 4: Assert `CustomDropdown` for Status in edit mode maps all `EQUIPMENT_STATUS_CONFIG` keys with `size="md"`.

### Phase 2: Refactor `InventoryItemFormModal.tsx`
- [x] Add import: `import { CustomDropdown } from "@/components/ui/CustomDropdown";`.
- [x] Replace native `<select>` in Category block (lines 182-192) with `<CustomDropdown<string>>`:
  ```tsx
  <CustomDropdown<string>
    value={category}
    onChange={(val) => setCategory(val)}
    options={EQUIPMENT_CATEGORIES.map((cat) => ({ value: cat, label: cat }))}
    size="md"
    direction="auto"
    searchable={false}
    className="w-full"
    menuClassName="w-full min-w-full max-h-60"
  />
  ```
- [x] Replace native `<select>` in Equipment Status block (lines 243-253) with `<CustomDropdown<EquipmentStatus>>`:
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
    className="w-full"
    menuClassName="w-full min-w-full max-h-60"
  />
  ```
- [x] Verify form submit button loading guard (`disabled={loading}`) remains intact.

### Phase 3: Non-Negotiable Verification & Handover
- [x] Run targeted tests: `npx tsx --test src/components/views/InventoryView/inventoryItemFormModal.test.ts`.
- [x] Run invariant drift check: `npm run drift:check` (must report 68/68 spec-plan pairs valid).
- [x] Run TypeScript type check: `npm run build:check` (0 errors required).
- [x] Run smoke test suite: `npm run test:smoke` (0 failures required).
- [x] Run full test suite: `npm test` (0 failures required).
- [x] Author execution-ready handover document `docs/handover-inventory-item-form-custom-dropdowns.md`.
- [x] Update `CHANGELOG.md` and `docs/SESSION_STATE.md`.

---

## 4. Risks & Mitigations

| Risk | Impact | Mitigation Strategy |
|---|---|---|
| Menu clipping inside scrollable modal body | Visual glitch when opening Category dropdown near bottom | Set `direction="auto"` and `menuClassName="w-full min-w-full max-h-60"`. ADR-0039 guarantees Layer 5 z-index on open popover. |
| Form payload type divergence | Runtime 400 on `POST`/`PUT /api/marcom/inventory` | Explicitly type status as `EquipmentStatus` and ensure `category` is a string matching `EQUIPMENT_CATEGORIES`. |
| Unintended scope creep into borrow/return modals | Regression in borrow request or return workflow | Strictly restrict modifications to `InventoryItemFormModal.tsx`. Keep `BorrowRequestModal.tsx` and `ReturnProcessModal.tsx` untouched. |

