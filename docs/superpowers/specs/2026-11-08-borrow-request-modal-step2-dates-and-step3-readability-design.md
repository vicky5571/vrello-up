# Spec: BorrowRequestModal Step 2 Empty Initial Schedule Dates & Step 3 Mobile Catalog Card Readability Design

- **Status:** Approved
- **Date:** 2026-11-08
- **Author:** Critical Senior Software Engineer (Pair Programmer)
- **ADR Reference:** `docs/adr/0087-borrow-request-modal-step2-empty-dates-and-step3-catalog-readability.md`
- **Plan Reference:** `docs/superpowers/plans/2026-11-08-borrow-request-modal-step2-dates-and-step3-readability.md`

---

## 1. Executive Summary

In `src/components/views/InventoryView/BorrowRequestModal.tsx`, two UX regressions affect the 4-step Equipment Borrow Request wizard (`media_1794081110158_b30c3b2c.jpg` and `media_1794081342515_8e555662.jpg`):
1. **Premature Step 2 Completion Checkmark (`BorrowRequestModal.tsx` lines 60–63)**: `borrowDate` and `returnDueDate` are pre-populated with default dates (`today` and `+3 days`) on mount. Because `canAdvanceFromBorrowStep(2, data)` only checks that both dates are non-empty and `returnDueDate >= borrowDate`, Step 2 displays a completed green checkmark (`✓`) immediately when the modal opens at Step 1.
2. **Step 3 Catalog Mobile Readability Degradation (`BorrowRequestModal.tsx` lines 264, 467–557)**: Each catalog item row uses a single horizontal flex container (`p-3 flex items-center justify-between gap-3`) where the left metadata block competes with the right-hand quantity stepper (`[-] [0] [+]`). On a 375px screen, the item code badge lacks `shrink-0 whitespace-nowrap` and fractures into 3 vertical lines (`BTH-\nPOP-\n004`), the equipment name truncates to ~12 characters (`"Backdrop Pop..."`), and the category/availability line wraps into 4 cramped lines.

This specification defines the exact state initialization, reset behavior, and 3-layer responsive catalog card structure in `BorrowRequestModal.tsx`.

---

## 2. Visual Layout Models: Current vs Target

### 2.1 Step 1 Stepper Header (Initial Modal Open)
```text
CURRENT (Broken — Step 2 shows green checkmark before user visits Step 2):
  [ (1) 👤 ]   [ (✓) 📅 ]   [ (3) 📦 ]   [ (4) 📋 ]

TARGET (Fixed — Step 2 remains inactive until borrowDate & returnDueDate are filled):
  [ (1) 👤 ]   [ (2) 📅 ]   [ (3) 📦 ]   [ (4) 📋 ]
```

### 2.2 Step 3 Equipment Catalog Card (Mobile 375px)
```text
CURRENT (Broken — 3-line fractured code, 12-char truncated name, 4-line wrapped meta):
+--------------------------------------------------+
| [BTH-]  Backdrop Pop...        [ - ] [  0  ] [ + ]|
| [POP-]                                           |
| [004 ]  Booth &   . 3 available                  |
|         Staging     (4 total)                    |
+--------------------------------------------------+

TARGET (3-Layer Full-Width Card — single-line code, full-width name, clean bottom bar):
+--------------------------------------------------+
| [BTH-POP-004] · Booth & Staging                  |
| Backdrop Pop-Up Portable 3x2m                    |
| 3 available (4 total)          [ - ] [  0  ] [ + ]|
+--------------------------------------------------+
```

---

## 3. Exact Component & Style Specifications

### 3.1 File: `src/components/views/InventoryView/BorrowRequestModal.tsx`

#### 1. Empty Initial `borrowDate` and `returnDueDate` + Modal Open Reset (Lines 60–92)
```tsx
// BEFORE (lines 60–63):
  const [borrowDate, setBorrowDate] = useState(new Date().toISOString().slice(0, 10));
  const [returnDueDate, setReturnDueDate] = useState(
    new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10)
  );

// AFTER:
  const [borrowDate, setBorrowDate] = useState("");
  const [returnDueDate, setReturnDueDate] = useState("");
```

And inside `useEffect` when `isOpen` becomes `true` (lines 78–91):
```tsx
// BEFORE:
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

// AFTER:
  useEffect(() => {
    if (isOpen) {
      fetchEvents();
      fetchInventory();
      setStep(1);
      setError(null);
      setBorrowDate("");
      setReturnDueDate("");
      if (defaultEventId) {
        setEventId(defaultEventId);
      }
      if (session?.user?.name && !borrowerName) {
        setBorrowerName(session.user.name);
      }
    }
  }, [isOpen, defaultEventId, fetchEvents, fetchInventory, session?.user?.name]);
```

#### 2. Responsive Modal Body Padding (Line 264)
```tsx
// BEFORE:
<div className="flex-1 overflow-y-auto p-6 text-xs">

// AFTER:
<div className="flex-1 overflow-y-auto p-4 sm:p-6 text-xs">
```

#### 3. Step 3 Category Filter Chips Rail (Lines 439–465)
```tsx
// BEFORE:
<div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
  <button
    type="button"
    onClick={() => setSelectedCategory("ALL")}
    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer ${

// AFTER:
<div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
  <button
    type="button"
    onClick={() => setSelectedCategory("ALL")}
    className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
```
*(Apply `shrink-0` to the mapped `EQUIPMENT_CATEGORIES` buttons as well.)*

#### 4. Step 3 Catalog Item 3-Layer Card Structure (Lines 478–554)
```tsx
                    return (
                      <div
                        key={item.id}
                        className={`p-3 flex flex-col gap-2 transition-colors ${
                          !isAvailable
                            ? "opacity-50 bg-slate-50 dark:bg-slate-900/50 cursor-not-allowed"
                            : currentQty > 0
                            ? "bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/60 dark:hover:bg-blue-950/30"
                            : "hover:bg-slate-50/70 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        {/* Layer 1: Code Badge & Category */}
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="shrink-0 whitespace-nowrap font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                            {item.code}
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">·</span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {item.category}
                          </span>
                        </div>

                        {/* Layer 2: Full-Width Equipment Name */}
                        <div className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 leading-snug line-clamp-2 break-words">
                          {item.name}
                        </div>

                        {/* Layer 3: Stock Availability + Stepper Controls */}
                        <div className="flex items-center justify-between gap-2 pt-0.5">
                          <span
                            className={`text-[11px] font-medium shrink-0 ${
                              isAvailable
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-rose-500"
                            }`}
                          >
                            {isAvailable
                              ? `${item.availableUnits} available (${item.totalUnits} total)`
                              : "Not Available"}
                          </span>

                          <div className="flex items-center gap-2 shrink-0">
                            {isAvailable ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleSelectItem(item, Math.max(0, currentQty - 1))}
                                  disabled={currentQty === 0}
                                  className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
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
                                  className="w-12 px-1 py-1 text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSelectItem(item, Math.min(item.availableUnits, currentQty + 1))
                                  }
                                  disabled={currentQty >= item.availableUnits}
                                  className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-rose-500 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 px-2 py-1 rounded">
                                Out of Stock
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
```

---

## 4. Acceptance Criteria

1. **Step 2 Starts Incomplete on Modal Open**:
   - `borrowDate` and `returnDueDate` are initialized to `""` (`useState("")`) and reset to `""` inside the `isOpen` `useEffect`.
   - When the modal opens at Step 1, `completionStatus[2]` is `false` (Step 2 displays step number `2` rather than a green checkmark `✓`).
   - Step 2 transitions to `completed` (`✓`) only after the user enters both `borrowDate` and `returnDueDate` with `returnDueDate >= borrowDate`.
2. **Step 3 Item Code Badge Never Wraps**:
   - The `item.code` badge includes `shrink-0 whitespace-nowrap` so codes like `BTH-POP-004` always render on a single horizontal line.
3. **Step 3 Item Name Uses Full Card Width**:
   - Equipment names sit on their own dedicated full-width layer (`line-clamp-2 break-words`) rather than sharing horizontal space with the code badge and quantity stepper.
4. **Step 3 Stock Availability & Stepper Align Cleanly**:
   - Stock availability text (`X available (Y total)`) and stepper controls (`[-] [0] [+]`) share a dedicated bottom bar (`flex items-center justify-between gap-2 pt-0.5`).
5. **Responsive Modal Body & Category Rail**:
   - Modal body uses `p-4 sm:p-6` and Step 3 category filter rail uses `no-scrollbar` with `shrink-0` on each category pill button.

---

## 5. Non-Goals

- Modifying backend API routes (`POST /api/marcom/inventory/borrow`) or Prisma schemas.
- Changing Step 1 or Step 4 form fields.

---

## 6. Verification Checklist

- [ ] `node --test --import ./test/register-alias.mjs src/components/views/InventoryView/borrowRequestModal.test.ts` passes 100%
- [ ] `npm run drift:check` passes with 0 drift (114/114 spec-plan pairs)
- [ ] `npm run build:check` passes with 0 TypeScript errors
- [ ] `npm run test:smoke` passes with 0 failures


