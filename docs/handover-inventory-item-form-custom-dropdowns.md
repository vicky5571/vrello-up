# Handover: Standardize Inventory Item Form CustomDropdowns

- **Status:** EXECUTION-READY
- **Date:** 2026-11-05
- **Spec:** `docs/superpowers/specs/2026-11-05-inventory-item-form-custom-dropdowns-design.md`
- **Plan:** `docs/superpowers/plans/2026-11-05-inventory-item-form-custom-dropdowns.md`
- **Refs:** `docs/adr/0041-inventory-item-form-custom-dropdowns.md` (ADR-0041)

---

## 1. Exact File Manifest & Purpose

| File Path | One-Line Purpose | Action |
|---|---|---|
| `src/components/views/InventoryView/InventoryItemFormModal.tsx` | Master modal dialog for adding and editing equipment catalog items | Modify |
| `src/components/views/InventoryView/inventoryItemFormModal.test.ts` | Unit and architectural invariant tests for Category & Status CustomDropdowns | Create |
| `CHANGELOG.md` | Chronological change history entry with ADR/Spec/Plan references | Modify |
| `docs/SESSION_STATE.md` | Session handoff state updating active feature status and verified gates | Modify |

---

## 2. Exact Current Code Snippets (Verbatim from Codebase)

### Snippet A: Imports in `InventoryItemFormModal.tsx` (Lines 1–7)
```tsx
"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import type { InventoryItem, EquipmentStatus } from "@/types";
import { EQUIPMENT_CATEGORIES, EQUIPMENT_STATUS_CONFIG } from "./inventoryConstants";
```

### Snippet B: Native Category `<select>` in `InventoryItemFormModal.tsx` (Lines 182–192)
```tsx
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {EQUIPMENT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
```

### Snippet C: Native Equipment Status `<select>` in `InventoryItemFormModal.tsx` (Lines 243–253)
```tsx
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EquipmentStatus)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {(Object.keys(EQUIPMENT_STATUS_CONFIG) as EquipmentStatus[]).map((st) => (
                  <option key={st} value={st}>
                    {EQUIPMENT_STATUS_CONFIG[st].label}
                  </option>
                ))}
              </select>
```

---

## 3. Exact Change Instructions

### Step 1: Add `CustomDropdown` Import to `InventoryItemFormModal.tsx`
Add after line 6:
```tsx
import { CustomDropdown } from "@/components/ui/CustomDropdown";
```

### Step 2: Replace Category `<select>` with `<CustomDropdown<string>>`
**DELETE:**
```tsx
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {EQUIPMENT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
```

**REPLACE WITH:**
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

### Step 3: Replace Equipment Status `<select>` with `<CustomDropdown<EquipmentStatus>>`
**DELETE:**
```tsx
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EquipmentStatus)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {(Object.keys(EQUIPMENT_STATUS_CONFIG) as EquipmentStatus[]).map((st) => (
                  <option key={st} value={st}>
                    {EQUIPMENT_STATUS_CONFIG[st].label}
                  </option>
                ))}
              </select>
```

**REPLACE WITH:**
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

---

## 4. Test Implementation (`inventoryItemFormModal.test.ts`)

Create file: `src/components/views/InventoryView/inventoryItemFormModal.test.ts`:
```typescript
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("Inventory Item Form Modal CustomDropdown Invariants (ADR-0041)", async (t) => {
  const filePath = path.join(
    process.cwd(),
    "src/components/views/InventoryView/InventoryItemFormModal.tsx"
  );
  assert.ok(fs.existsSync(filePath), "InventoryItemFormModal.tsx must exist");

  const content = fs.readFileSync(filePath, "utf-8");

  await t.test("verifies CustomDropdown import exists and native select is eliminated", () => {
    assert.match(
      content,
      /import\s*\{\s*CustomDropdown\s*\}\s*from\s*["']@\/components\/ui\/CustomDropdown["']/,
      "Must import canonical CustomDropdown"
    );
    assert.doesNotMatch(
      content,
      /<select[\s>]/,
      "Must completely eliminate raw HTML <select> tags from InventoryItemFormModal"
    );
  });

  await t.test("verifies Category dropdown maps EQUIPMENT_CATEGORIES with size='md'", () => {
    assert.match(
      content,
      /options=\{EQUIPMENT_CATEGORIES\.map\(/,
      "Category CustomDropdown must map EQUIPMENT_CATEGORIES options"
    );
    assert.match(
      content,
      /size="md"/,
      "Category CustomDropdown must use size='md' to match sibling inputs"
    );
  });

  await t.test("verifies Equipment Status dropdown maps EQUIPMENT_STATUS_CONFIG with size='md'", () => {
    assert.match(
      content,
      /EQUIPMENT_STATUS_CONFIG\[st\]\.label/,
      "Status CustomDropdown must map EQUIPMENT_STATUS_CONFIG labels"
    );
    assert.match(
      content,
      /<CustomDropdown<EquipmentStatus>/,
      "Status CustomDropdown must be strongly typed with EquipmentStatus"
    );
  });
});
```

---

## 5. Explicit "Do Not Touch" List

| File / Component | Reason to Preserve Without Modification |
|---|---|
| `src/components/views/InventoryView/BorrowRequestModal.tsx` | Non-goal for this ADR; borrow requests utilize a multi-step modal lifecycle that will be scheduled separately |
| `src/components/views/InventoryView/ReturnProcessModal.tsx` | Non-goal for this ADR; return condition selects operate on dynamic item array indices |
| `src/types/index.ts` | Single Source of Truth; domain interfaces `InventoryItem` and `EquipmentStatus` must remain unmodified |
| `/api/marcom/inventory/*` | Backend REST endpoints; request/response contract remains 100% identical |
| `src/components/ui/CustomDropdown.tsx` | Centralized primitive; already verified and compliant with ADR-0037 and ADR-0039 |

---

## 6. Numbered Execution Order (For Execution Session)

1. **Verify Baseline Gates:**
   ```bash
   npm run drift:check
   npm run build:check
   npx tsx --test src/components/views/InventoryView/inventoryViewMode.test.ts src/components/ui/confirmDialog.test.ts src/components/views/InventoryView/inventoryDeleteConfirm.test.ts
   ```
2. **Phase 1: Create Test Suite**
   - Write `src/components/views/InventoryView/inventoryItemFormModal.test.ts` (initially failing due to `<select>` assertions).
3. **Phase 2: Refactor `InventoryItemFormModal.tsx`**
   - Import `CustomDropdown`.
   - Replace Category `<select>` with `<CustomDropdown<string>>`.
   - Replace Status `<select>` with `<CustomDropdown<EquipmentStatus>>`.
4. **Phase 3: Run Verification Suite**
   - `npx tsx --test src/components/views/InventoryView/inventoryItemFormModal.test.ts` (all 3 assertions pass).
   - `npm run drift:check` (verify 68/68 spec-plan pairs valid).
   - `npm run build:check` (verify 0 TypeScript compiler errors).
   - `npm test` (full regression suite passes 100%).
5. **Phase 4: Session Handoff & Git Commit**
   - Update `CHANGELOG.md` under `## [2026-11-05]`.
   - Update `docs/SESSION_STATE.md` with active feature status and test results.
   - Commit with message:
     ```
     feat(inventory): standardize InventoryItemFormModal with CustomDropdown

     - Replace unstyled HTML select elements for Category and Status with canonical CustomDropdown
     - Align dropdown dimensions (size="md") with text inputs
     - Ensure strong typing for EquipmentStatus in edit mode
     - Add unit tests in inventoryItemFormModal.test.ts

     Spec: docs/superpowers/specs/2026-11-05-inventory-item-form-custom-dropdowns-design.md
     Plan: docs/superpowers/plans/2026-11-05-inventory-item-form-custom-dropdowns.md
     Refs: ADR-0041
     ```

---

## 7. Acceptance Criteria Checklist

- [x] `InventoryItemFormModal.tsx` contains 0 instances of raw `<select>` tags.
- [x] Category dropdown renders with `CustomDropdown<string>`, mapping `EQUIPMENT_CATEGORIES`.
- [x] Status dropdown renders with `CustomDropdown<EquipmentStatus>`, mapping `EQUIPMENT_STATUS_CONFIG`.
- [x] Form submit button retains loading spinner and double-submission lock (`disabled={loading}`).
- [x] `inventoryItemFormModal.test.ts` passes with 0 failures.
- [x] `npm run drift:check` passes with no drift detected.
- [x] `npm run build:check` passes with 0 errors.
- [x] `npm test` passes with 100% green tests.


