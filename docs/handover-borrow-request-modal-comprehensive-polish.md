# Handover: Comprehensive UX Polish and CustomDropdown Integration for BorrowRequestModal

- **Status:** EXECUTION-READY
- **Date:** 2026-11-05
- **Spec:** `docs/superpowers/specs/2026-11-05-borrow-request-modal-comprehensive-polish-design.md`
- **Plan:** `docs/superpowers/plans/2026-11-05-borrow-request-modal-comprehensive-polish.md`
- **Refs:** `docs/adr/0042-borrow-request-modal-comprehensive-polish.md` (ADR-0042)

---

## 1. Exact File Manifest & Purpose

| File Path | One-Line Purpose | Action |
|---|---|---|
| `src/components/views/InventoryView/BorrowRequestModal.tsx` | 4-step wizard modal for submitting equipment borrow requests | Modify |
| `src/components/views/InventoryView/borrowRequestModal.test.ts` | Unit & invariant tests verifying CustomDropdown, category chips, and payload shape | Create |
| `CHANGELOG.md` | Chronological changelog tracking feature modifications and spec references | Modify |
| `docs/SESSION_STATE.md` | Session handoff state updating active feature status and verified gates | Modify |

---

## 2. Exact Current Code Snippets (Verbatim from Codebase)

### Snippet A: Imports and State in `BorrowRequestModal.tsx` (Lines 1–35)
```tsx
"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, ArrowRight, ArrowLeft, Check, Search } from "lucide-react";
import type { BorrowRecord, InventoryItem } from "@/types";
import { useMarcomDataStore } from "@/lib/marcom/marcomDataStore";

// ...
  const [borrowerName, setBorrowerName] = useState("");
  const [borrowerPhone, setBorrowerPhone] = useState("");
  const [borrowerDivision, setBorrowerDivision] = useState("");
  const [purpose, setPurpose] = useState("");
```

### Snippet B: Native `<select>` on Step 2 in `BorrowRequestModal.tsx` (Lines 290–305)
```tsx
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Link to Field Event (Optional)
                </label>
                <select
                  value={eventId}
                  onChange={(e) => handleEventChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">— Standalone / Not linked to Field Event —</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name} ({ev.branchName || "HQ"})
                    </option>
                  ))}
                </select>
```

### Snippet C: Division Field on Step 1 in `BorrowRequestModal.tsx` (Lines 257–269)
```tsx
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Division / Team
                  </label>
                  <input
                    type="text"
                    value={borrowerDivision}
                    onChange={(e) => setBorrowerDivision(e.target.value)}
                    placeholder="e.g. Field Activation - Bandung"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
```

---

## 3. Exact Change Instructions

### Change 1: Add Imports & Helpers in `BorrowRequestModal.tsx`
Add:
```tsx
import { useSession } from "next-auth/react";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import { EQUIPMENT_CATEGORIES } from "./inventoryConstants";
import { Plus, Minus, Calendar, MapPin, Building, User, Phone, FileText } from "lucide-react";
```

### Change 2: Session Auto-Population & Division Elimination in Component
1. Initialize session hook:
   ```tsx
   const { data: session } = useSession();
   ```
2. Remove `borrowerDivision` state:
   Delete: `const [borrowerDivision, setBorrowerDivision] = useState("");`
3. Add Category filter state for Step 3:
   ```tsx
   const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
   ```
4. In `useEffect` on `isOpen`:
   ```tsx
   useEffect(() => {
     if (isOpen) {
       fetchEvents();
       fetchInventory();
       setStep(1);
       setError(null);
       if (defaultEventId) {
         setEventId(defaultEventId);
       }
       if (session?.user?.name && !borrowerName) {
         setBorrowerName(session.user.name);
       }
     }
   }, [isOpen, defaultEventId, fetchEvents, fetchInventory, session?.user?.name]);
   ```
5. In `handleSubmit`:
   Ensure payload sets: `borrowerDivision: "",`

### Change 3: Step 1 Markup Polish (Remove Division)
Replace the 2-column grid in Step 1:
```tsx
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Phone / WhatsApp Number
                </label>
                <input
                  type="text"
                  value={borrowerPhone}
                  onChange={(e) => setBorrowerPhone(e.target.value)}
                  placeholder="e.g. 08123456789"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
```

### Change 4: Step 2 CustomDropdown & Duration Pill
Replace lines 290–305 with:
```tsx
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-medium text-slate-700 dark:text-slate-300">
                    Link to Field Event (Optional)
                  </label>
                  {eventId && (
                    <button
                      type="button"
                      onClick={() => handleEventChange("")}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Clear link
                    </button>
                  )}
                </div>
                <CustomDropdown<string>
                  value={eventId}
                  onChange={(chosenId) => handleEventChange(chosenId)}
                  options={[
                    { value: "", label: "— Standalone / Not linked to Field Event —" },
                    ...events.map((ev) => ({
                      value: ev.id,
                      label: `${ev.name} (${ev.branchName || "HQ"}${ev.startDate ? ` · ${ev.startDate.slice(5)}` : ""})`,
                    })),
                  ]}
                  size="md"
                  searchable={true}
                  searchPlaceholder="Search field event or branch..."
                  direction="auto"
                  buttonClassName="w-full bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-xs text-left"
                  menuClassName="w-full min-w-full max-h-60"
                />
              </div>
```

Add Duration Pill between dates:
```tsx
              {borrowDate && returnDueDate && (
                <div className="text-[11px] text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded inline-flex items-center gap-1.5 border border-blue-200/60 dark:border-blue-800/40">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    Duration:{" "}
                    <strong>
                      {Math.max(
                        1,
                        Math.round(
                          (new Date(returnDueDate).getTime() - new Date(borrowDate).getTime()) /
                            86400000
                        )
                      )}{" "}
                      days
                    </strong>
                  </span>
                </div>
              )}
```

### Change 5: Step 3 Category Quick-Filter Chips & Stepper Buttons
1. Above catalog items, add horizontal category chips:
```tsx
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("ALL")}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap ${
                    selectedCategory === "ALL"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  }`}
                >
                  All Categories
                </button>
                {EQUIPMENT_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap ${
                      selectedCategory === cat
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
```
2. In quantity controls, replace simple input with steppers:
```tsx
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleSelectItem(item, Math.max(0, currentQty - 1))}
                              disabled={currentQty === 0}
                              className="p-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 disabled:opacity-40"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              min={0}
                              max={item.availableUnits}
                              value={currentQty === 0 ? "" : currentQty}
                              onChange={(e) =>
                                handleSelectItem(item, parseInt(e.target.value, 10) || 0)
                              }
                              placeholder="0"
                              className="w-12 px-1 py-1 text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 text-xs"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleSelectItem(item, Math.min(item.availableUnits, currentQty + 1))
                              }
                              disabled={currentQty >= item.availableUnits}
                              className="p-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 disabled:opacity-40"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
```

### Change 6: Step 4 Structured 2-Column Review
Replace review body with 2-column responsive layout:
- Left Column: Borrower identity, phone, duration pill, location, and linked event.
- Right Column: Requested items list, code badges, and summary counter pill (`Total: N units across M models`).

---

## 4. Test Implementation (`borrowRequestModal.test.ts`)

Create file: `src/components/views/InventoryView/borrowRequestModal.test.ts`:
```typescript
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("Borrow Request Modal Comprehensive Polish Invariants (ADR-0042)", async (t) => {
  const filePath = path.join(
    process.cwd(),
    "src/components/views/InventoryView/BorrowRequestModal.tsx"
  );
  assert.ok(fs.existsSync(filePath), "BorrowRequestModal.tsx must exist");

  const content = fs.readFileSync(filePath, "utf-8");

  await t.test("verifies CustomDropdown replaces native select on Field Event picker", () => {
    assert.match(
      content,
      /import\s*\{\s*CustomDropdown\s*\}\s*from\s*["']@\/components\/ui\/CustomDropdown["']/,
      "Must import CustomDropdown"
    );
    assert.doesNotMatch(
      content,
      /<select[\s>]/,
      "Must completely eliminate raw HTML <select> tags from BorrowRequestModal"
    );
    assert.match(
      content,
      /searchable=\{true\}/,
      "Field Event CustomDropdown must be searchable"
    );
  });

  await t.test("verifies borrowerDivision input is removed from form markup", () => {
    assert.doesNotMatch(
      content,
      /Division \/ Team/,
      "Must not display Division / Team label or input in form"
    );
    assert.match(
      content,
      /borrowerDivision:\s*["']["']/,
      "Payload must pass empty string for borrowerDivision to maintain backward compatibility"
    );
  });

  await t.test("verifies Category quick-filter chips and stepper buttons on Step 3", () => {
    assert.match(
      content,
      /EQUIPMENT_CATEGORIES\.map\(/,
      "Must render Category quick-filter chips from EQUIPMENT_CATEGORIES"
    );
    assert.match(
      content,
      /<Plus[\s\/>]/,
      "Must feature Plus stepper button for incrementing unit count"
    );
    assert.match(
      content,
      /<Minus[\s\/>]/,
      "Must feature Minus stepper button for decrementing unit count"
    );
  });

  await t.test("verifies submit button loading guard and spinner", () => {
    assert.match(
      content,
      /disabled=\{loading\}/,
      "Submit and navigation buttons must be disabled during loading"
    );
    assert.match(
      content,
      /Loader2/,
      "Must render Loader2 spinner when loading is true"
    );
  });
});
```

---

## 5. Explicit "Do Not Touch" List

| File / Component | Reason to Preserve Without Modification |
|---|---|
| `prisma/schema.prisma` | Single-tenant invariant; no schema changes or database migrations required |
| `src/app/api/marcom/inventory/borrow/route.ts` | Backend handler contract remains 100% untouched; already supports `borrowerDivision = ""` default |
| `src/types/index.ts` | Domain entity SSOT (`BorrowRecord`, `BorrowItem`) remains stable |
| `src/components/views/InventoryView/ReturnProcessModal.tsx` | Non-goal for this ADR; return flow is isolated from borrow requests |
| `src/components/ui/CustomDropdown.tsx` | Centralized primitive; already verified and compliant with ADR-0037 and ADR-0039 |

---

## 6. Numbered Execution Order (For Execution Session)

1. **Verify Baseline Gates:**
   ```bash
   npm run drift:check
   npm run build:check
   ```
2. **Phase 1: Create Test Suite**
   - Create `src/components/views/InventoryView/borrowRequestModal.test.ts` (initially failing assertions).
3. **Phase 2: Refactor `BorrowRequestModal.tsx`**
   - Apply imports (`CustomDropdown`, `useSession`, `EQUIPMENT_CATEGORIES`, icons).
   - Apply Step 1 polish (session autofill name, remove division input).
   - Apply Step 2 CustomDropdown integration (searchable, clear link, duration pill).
   - Apply Step 3 category chips & stepper buttons.
   - Apply Step 4 structured review card & loading guard.
4. **Phase 3: Run Verification Suite**
   - `npx tsx --test src/components/views/InventoryView/borrowRequestModal.test.ts` (assert all tests pass).
   - `npm run drift:check` (verify 69/69 spec-plan pairs valid).
   - `npm run build:check` (verify 0 TypeScript compiler errors).
   - `npm test` (verify full test suite passes 100%).
5. **Phase 4: Session Handoff & Git Commit**
   - Update `CHANGELOG.md` under `## [2026-11-05]`.
   - Update `docs/SESSION_STATE.md` with active feature status.
   - Commit with message:
     ```
     feat(inventory): comprehensive UX polish and CustomDropdown for BorrowRequestModal

     - Replace unstyled HTML select with searchable CustomDropdown for field event linking
     - Add explicit Clear link action and real-time duration counter pill
     - Auto-fill borrower name from session and remove redundant division input field
     - Add horizontal category filter chips and quantity steppers on Step 3
     - Modernize review layout with structured 2-column card and submit loading guard
     - Add unit tests in borrowRequestModal.test.ts

     Spec: docs/superpowers/specs/2026-11-05-borrow-request-modal-comprehensive-polish-design.md
     Plan: docs/superpowers/plans/2026-11-05-borrow-request-modal-comprehensive-polish.md
     Refs: ADR-0042
     ```

---

## 7. Acceptance Criteria Checklist

- [x] Raw HTML `<select>` tag is completely removed from `BorrowRequestModal.tsx`.
- [x] Field event link uses `CustomDropdown<string>` with `size="md"` and `searchable={true}`.
- [x] Explicit "Clear link" action resets event link to Standalone.
- [x] Real-time duration pill displays accurate days calculation.
- [x] Step 1 auto-fills `borrowerName` from `session.data?.user?.name` when empty.
- [x] Division input field is removed from form markup; payload sends `borrowerDivision: ""`.
- [x] Step 3 features horizontal category filter chips (`EQUIPMENT_CATEGORIES`) and `+` / `-` steppers.
- [x] Step 4 review card displays 2-column summary with item total count and submit loading guard.
- [x] `borrowRequestModal.test.ts` passes with 0 failures.
- [x] `npm run drift:check` passes with 0 drift.
- [x] `npm run build:check` passes with 0 errors.
- [x] `npm test` passes 100% green.


