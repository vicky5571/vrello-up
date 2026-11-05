# Implementation Plan: Comprehensive UX Polish and CustomDropdown Integration for BorrowRequestModal

- **Status:** IMPLEMENTATION COMPLETE
- **Date:** 2026-11-05
- **Spec:** `docs/superpowers/specs/2026-11-05-borrow-request-modal-comprehensive-polish-design.md`
- **Refs:** `docs/adr/0042-borrow-request-modal-comprehensive-polish.md` (ADR-0042)

---

## 1. Executive Summary & Objective

This implementation plan defines the step-by-step engineering roadmap to modernize and elevate the 4-step equipment borrow request wizard (`src/components/views/InventoryView/BorrowRequestModal.tsx`). The primary objectives are:
1. Standardize the Step 2 event link picker with canonical `CustomDropdown<string>`, adding instant event/branch search and a "Clear link" action.
2. Auto-populate `borrowerName` from session credentials on Step 1 while cleanly eliminating the redundant `borrowerDivision` input field.
3. Add Category quick-filter chips and stepper buttons (`-` / `+`) on Step 3 for rapid item selection.
4. Redesign Step 4 confirmation into a structured 2-column modular recap with double-submission protection.

---

## 2. File Manifest & Estimated Surface Area

| Action | File Path | Estimated LOC | Responsibility |
|---|---|---|---|
| Create | `src/components/views/InventoryView/borrowRequestModal.test.ts` | ~90 LOC | Automated invariant test suite for BorrowRequestModal UX, CustomDropdown, and payload contract |
| Modify | `src/components/views/InventoryView/BorrowRequestModal.tsx` | ~160 LOC modified | Comprehensive polish of Steps 1–4, CustomDropdown integration, and category chips |
| Create | `docs/handover-borrow-request-modal-comprehensive-polish.md` | ~220 LOC | Execution-ready handover guide with verbatim code diffs and safety rules |
| Modify | `CHANGELOG.md` | ~15 LOC | Chronological feature change record |
| Modify | `docs/SESSION_STATE.md` | ~30 LOC | Session handoff state update |

---

## 3. Phased Implementation Roadmap

### Phase 1: Test Scaffold & Invariant Suite (Test-First)
- [x] Create `src/components/views/InventoryView/borrowRequestModal.test.ts` using Node.js native test runner (`node:test`, `node:assert/strict`).
- [x] Test 1: Assert `BorrowRequestModal.tsx` completely eliminates raw HTML `<select>` tags.
- [x] Test 2: Assert `CustomDropdown` is imported and mounted for Field Event with `searchable={true}` and size `size="md"`.
- [x] Test 3: Assert `borrowerDivision` input field is removed from form markup while payload passes `borrowerDivision: ""`.
- [x] Test 4: Assert Category filter chips (`EQUIPMENT_CATEGORIES`) and quantity stepper buttons exist in Step 3.
- [x] Test 5: Assert structured 2-column review layout and loading state button guard on Step 4.

### Phase 2: Refactor `BorrowRequestModal.tsx` (Steps 1–4)
- [x] **Imports & Setup:**
  - Import `useSession` from `"next-auth/react"`.
  - Import `CustomDropdown` from `"@/components/ui/CustomDropdown"`.
  - Import `EQUIPMENT_CATEGORIES` from `"./inventoryConstants"`.
  - Import icons: `Plus, Minus, Calendar, MapPin, Building, User, Phone, FileText, CheckCircle2`.
- [x] **State Additions:**
  - `const [selectedCategory, setSelectedCategory] = useState<string>("ALL");`
  - In `useEffect([isOpen])`: auto-fill `borrowerName` from `session?.user?.name` if empty.
- [x] **Step 1 Polish:**
  - Remove `borrowerDivision` input container.
  - Add input field icons and tidy layout.
- [x] **Step 2 CustomDropdown Integration:**
  - Replace native `<select>` with `<CustomDropdown<string>>`:
  - Add adjacent *"Clear link"* button in label row when `Boolean(eventId)`.
  - Add duration badge computed dynamically from `borrowDate` and `returnDueDate`.
- [x] **Step 3 Category Chips & Stepper Controls:**
  - Add horizontal category chip selector: `"ALL"` + `EQUIPMENT_CATEGORIES`.
  - Filter `filteredCatalog` by both `itemSearch` query AND `selectedCategory`.
  - Add stepper buttons:
    - Decrement (`-`): `handleSelectItem(item, Math.max(0, currentQty - 1))`
    - Increment (`+`): `handleSelectItem(item, Math.min(item.availableUnits, currentQty + 1))`
- [x] **Step 4 Review Card 2-Column Redesign:**
  - Left card: Requester name, contact, duration, location, linked event badge.
  - Right card: Itemized items with unit counts and total items tally.
  - Ensure payload dispatches `borrowerDivision: ""`.
  - Verify submit button loading spinner and disabled guard.

### Phase 3: Non-Negotiable Verification & Handover
- [x] Run targeted test: `node --test --import ./test/register-alias.mjs src/components/views/InventoryView/borrowRequestModal.test.ts`.
- [x] Run invariant drift check: `npm run drift:check` (must report 69/69 spec-plan pairs valid).
- [x] Run TypeScript type check: `npm run build:check` (0 errors required).
- [x] Run full smoke test suite: `npm run test:smoke` (0 failures required).
- [x] Run complete regression test suite: `npm test` (0 failures required).
- [x] Author execution-ready handover guide `docs/handover-borrow-request-modal-comprehensive-polish.md`.
- [x] Update `CHANGELOG.md` and `docs/SESSION_STATE.md`.

---

## 4. Risks & Mitigations

| Risk | Impact | Mitigation Strategy |
|---|---|---|
| Broken API contract due to missing division | HTTP 400 or null field in database | Payload explicitly sends `borrowerDivision: ""` to preserve full backward compatibility. |
| Stepper exceeds available units | Negative or over-subscribed warehouse inventory | Stepper increment and input onChange strictly bounded by `Math.min(qty, item.availableUnits)`. |
| Event dropdown clipping inside modal body | Popover clipped by modal overflow | Use `direction="auto"` and `menuClassName="w-full min-w-full max-h-60"`. Guaranteed Layer 5 z-index by ADR-0039. |

