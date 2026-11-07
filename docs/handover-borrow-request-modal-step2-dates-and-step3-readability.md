# Handover: BorrowRequestModal Step 2 Empty Initial Schedule Dates & Step 3 Mobile Catalog Card Readability

- **Status:** Execution-Ready
- **Date:** 2026-11-08
- **Author:** Critical Senior Software Engineer (Pair Programmer)
- **ADR Reference:** `docs/adr/0087-borrow-request-modal-step2-empty-dates-and-step3-catalog-readability.md` (alongside `docs/adr/0086-borrow-request-modal-hook-order-fix.md`)
- **Spec Reference:** `docs/superpowers/specs/2026-11-08-borrow-request-modal-step2-dates-and-step3-readability-design.md`
- **Plan Reference:** `docs/superpowers/plans/2026-11-08-borrow-request-modal-step2-dates-and-step3-readability.md`

---

## 1. Exact File Manifest & Purpose

| File Path | Purpose |
| :--- | :--- |
| `src/components/views/InventoryView/borrowRequestModal.test.ts` | Unit test suite verifying hook ordering (ADR-0086), empty initial schedule dates (ADR-0087), and Step 3 mobile catalog card readability invariants (ADR-0087) |
| `src/components/views/InventoryView/BorrowRequestModal.tsx` | 4-step Equipment Borrow Request wizard modal component |
| `docs/SESSION_STATE.md` | Session tracking and project status updates |

---

## 2. Exact Code Snippets & Modifications

### 2.1 File: `src/components/views/InventoryView/borrowRequestModal.test.ts`

#### Add Step 2 Empty Dates and Step 3 Readability Subtests (lines 188–207)
**Current Code (lines 188–207):**
```ts
  await t.test("verifies all React hooks are called before early return if (!isOpen) return null", () => {
    const modalContent = fs.readFileSync(modalPath, "utf-8");
    const earlyReturnIdx = modalContent.indexOf("if (!isOpen) return null;");
    const useMemoIdx = modalContent.indexOf("useMemo(");

    assert.ok(earlyReturnIdx !== -1, "BorrowRequestModal must have an early return guard for !isOpen");
    assert.ok(useMemoIdx !== -1, "BorrowRequestModal must memoize completionStatus with useMemo");
    assert.ok(
      useMemoIdx < earlyReturnIdx,
      "useMemo must be called before `if (!isOpen) return null;` to obey Rules of Hooks"
    );

    const codeAfterEarlyReturn = modalContent.slice(earlyReturnIdx);
    assert.doesNotMatch(
      codeAfterEarlyReturn,
      /\buse(State|Effect|Memo|Callback|Ref|Context|Reducer|SyncExternalStore|Session|MarcomDataStore)\s*\(/,
      "No React hooks may be called after `if (!isOpen) return null;`"
    );
  });
});
```

**Target Code:**
```ts
  await t.test("verifies all React hooks are called before early return if (!isOpen) return null", () => {
    const modalContent = fs.readFileSync(modalPath, "utf-8");
    const earlyReturnIdx = modalContent.indexOf("if (!isOpen) return null;");
    const useMemoIdx = modalContent.indexOf("useMemo(");

    assert.ok(earlyReturnIdx !== -1, "BorrowRequestModal must have an early return guard for !isOpen");
    assert.ok(useMemoIdx !== -1, "BorrowRequestModal must memoize completionStatus with useMemo");
    assert.ok(
      useMemoIdx < earlyReturnIdx,
      "useMemo must be called before `if (!isOpen) return null;` to obey Rules of Hooks"
    );

    const codeAfterEarlyReturn = modalContent.slice(earlyReturnIdx);
    assert.doesNotMatch(
      codeAfterEarlyReturn,
      /\buse(State|Effect|Memo|Callback|Ref|Context|Reducer|SyncExternalStore|Session|MarcomDataStore)\s*\(/,
      "No React hooks may be called after `if (!isOpen) return null;`"
    );
  });

  await t.test("verifies borrowDate and returnDueDate initialize to empty string so Step 2 is not prematurely completed (ADR-0087)", () => {
    const modalContent = fs.readFileSync(modalPath, "utf-8");
    assert.match(
      modalContent,
      /const\s*\[borrowDate,\s*setBorrowDate\]\s*=\s*useState\(["']["']\);/,
      "borrowDate must initialize to empty string"
    );
    assert.match(
      modalContent,
      /const\s*\[returnDueDate,\s*setReturnDueDate\]\s*=\s*useState\(["']["']\);/,
      "returnDueDate must initialize to empty string"
    );
    assert.match(
      modalContent,
      /setBorrowDate\(["']["']\);/,
      "useEffect must reset borrowDate to empty string when modal opens"
    );
    assert.match(
      modalContent,
      /setReturnDueDate\(["']["']\);/,
      "useEffect must reset returnDueDate to empty string when modal opens"
    );
  });

  await t.test("verifies Step 3 mobile catalog readability and 3-layer item card layout (ADR-0087)", () => {
    const modalContent = fs.readFileSync(modalPath, "utf-8");
    assert.match(
      modalContent,
      /flex-1\s+overflow-y-auto\s+p-4\s+sm:p-6\s+text-xs/,
      "Modal body must use responsive p-4 sm:p-6 padding"
    );
    assert.match(
      modalContent,
      /overflow-x-auto\s+pb-1\s+no-scrollbar/,
      "Step 3 category filter rail must use no-scrollbar"
    );
    assert.match(
      modalContent,
      /p-3\s+flex\s+flex-col\s+gap-2\s+transition-colors/,
      "Step 3 catalog item row must use 3-layer vertical flex-col card layout"
    );
    assert.match(
      modalContent,
      /shrink-0\s+whitespace-nowrap\s+font-mono\s+text-\[10px\]/,
      "Item code badge must use shrink-0 whitespace-nowrap so codes never fracture across lines"
    );
    assert.match(
      modalContent,
      /line-clamp-2\s+break-words/,
      "Item name must span full card width with line-clamp-2 break-words"
    );
  });
});
```

---

### 2.2 File: `src/components/views/InventoryView/BorrowRequestModal.tsx`

#### Change 1: Initialize `borrowDate` & `returnDueDate` to `""` and Reset in `useEffect` (lines 58–92)
**Current Code (lines 58–92):**
```tsx
  const [eventId, setEventId] = useState<string>(defaultEventId || "");
  const [eventLocation, setEventLocation] = useState("");
  const [borrowDate, setBorrowDate] = useState(new Date().toISOString().slice(0, 10));
  const [returnDueDate, setReturnDueDate] = useState(
    new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10)
  );

  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [itemSearch, setItemSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store data
  const events = useMarcomDataStore((s) => s.events);
  const fetchEvents = useMarcomDataStore((s) => s.fetchEvents);
  const inventoryItems = useMarcomDataStore((s) => s.inventoryItems);
  const fetchInventory = useMarcomDataStore((s) => s.fetchInventory);

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

**Target Code:**
```tsx
  const [eventId, setEventId] = useState<string>(defaultEventId || "");
  const [eventLocation, setEventLocation] = useState("");
  const [borrowDate, setBorrowDate] = useState("");
  const [returnDueDate, setReturnDueDate] = useState("");

  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [itemSearch, setItemSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store data
  const events = useMarcomDataStore((s) => s.events);
  const fetchEvents = useMarcomDataStore((s) => s.fetchEvents);
  const inventoryItems = useMarcomDataStore((s) => s.inventoryItems);
  const fetchInventory = useMarcomDataStore((s) => s.fetchInventory);

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

---

#### Change 2: Update Modal Body Padding (line 264)
**Current Code (lines 263–265):**
```tsx
        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 text-xs">
```

**Target Code:**
```tsx
        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-xs">
```

---

#### Change 3: Step 3 Category Rail & 3-Layer Catalog Item Card Layout (lines 438–558)
**Current Code (lines 438–558):**
```tsx
              {/* Horizontal Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("ALL")}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    selectedCategory === "ALL"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  All Categories
                </button>
                {EQUIPMENT_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      selectedCategory === cat
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 max-h-[280px] overflow-y-auto">
                {filteredCatalog.length === 0 ? (
                  <div className="p-6 text-center text-slate-400">
                    No equipment found matching criteria.
                  </div>
                ) : (
                  filteredCatalog.map((item) => {
                    const isAvailable = item.availableUnits > 0;
                    const selected = selectedItems.find((p) => p.inventoryItemId === item.id);
                    const currentQty = selected?.quantity || 0;

                    return (
                      <div
                        key={item.id}
                        className={`p-3 flex items-center justify-between gap-3 transition-colors ${
                          !isAvailable
                            ? "opacity-50 bg-slate-50 dark:bg-slate-900/50 cursor-not-allowed"
                            : "hover:bg-slate-50/70 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                              {item.code}
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {item.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                            <span>{item.category}</span>
                            <span>·</span>
                            <span
                              className={
                                isAvailable
                                  ? "text-emerald-600 dark:text-emerald-400 font-medium"
                                  : "text-rose-500 font-medium"
                              }
                            >
                              {isAvailable
                                ? `${item.availableUnits} available (${item.totalUnits} total)`
                                : "Not Available"}
                            </span>
                          </div>
                        </div>

                        {/* Steppers + input */}
                        <div className="flex items-center gap-2">
                          {isAvailable ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleSelectItem(item, Math.max(0, currentQty - 1))}
                                disabled={currentQty === 0}
                                className="p-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
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
                                className="w-12 px-1 py-1 text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  handleSelectItem(item, Math.min(item.availableUnits, currentQty + 1))
                                }
                                disabled={currentQty >= item.availableUnits}
                                className="p-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
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
                    );
                  })
                )}
              </div>
```

**Target Code:**
```tsx
              {/* Horizontal Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("ALL")}
                  className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    selectedCategory === "ALL"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  All Categories
                </button>
                {EQUIPMENT_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      selectedCategory === cat
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 max-h-[280px] overflow-y-auto">
                {filteredCatalog.length === 0 ? (
                  <div className="p-6 text-center text-slate-400">
                    No equipment found matching criteria.
                  </div>
                ) : (
                  filteredCatalog.map((item) => {
                    const isAvailable = item.availableUnits > 0;
                    const selected = selectedItems.find((p) => p.inventoryItemId === item.id);
                    const currentQty = selected?.quantity || 0;

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

                          {/* Steppers + input */}
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
                  })
                )}
              </div>
```

---

## 3. Explicit "Do Not Touch" List

| File / Module | Reason |
| :--- | :--- |
| `src/components/views/InventoryView/wizard/BorrowStepperHeader.tsx` | Stepper UI presentation is already tested and works accurately once `borrowDate` and `returnDueDate` start empty |
| `src/components/views/InventoryView/wizard/borrowWizardHelpers.ts` | Pure step validation logic (`canAdvanceFromBorrowStep`, `getBorrowStepCompletionStatus`) is already complete |
| `src/components/views/InventoryView/InventoryViewModals.tsx` | Parent modal coordinator props and mounting contract remain unchanged |
| `src/app/api/marcom/inventory/borrow/route.ts` | Backend API route is unaffected |

---

## 4. Numbered Execution Order

1. **Step 1 (TDD Red):** Edit `src/components/views/InventoryView/borrowRequestModal.test.ts` to add the 3 new subtests (ADR-0086 hook ordering, ADR-0087 empty initial dates, and ADR-0087 Step 3 3-layer catalog card readability).
2. **Step 2 (Verify Red):** Run `node --test --import ./test/register-alias.mjs src/components/views/InventoryView/borrowRequestModal.test.ts` and confirm the 3 new subtests fail.
3. **Step 3 (Implement Fix):** Edit `src/components/views/InventoryView/BorrowRequestModal.tsx` with Changes 1, 2, and 3 above.
4. **Step 4 (Verify Green):** Re-run `node --test --import ./test/register-alias.mjs src/components/views/InventoryView/borrowRequestModal.test.ts` and confirm all subtests pass.
5. **Step 5 (Quality Gates):** Run `npm run drift:check`, `npm run build:check`, and `npm run test:smoke`.
6. **Step 6 (Session State):** Update `docs/SESSION_STATE.md`.

---

## 5. Acceptance Criteria Checklist

- [x] `BorrowRequestModal.tsx` invokes `useMemo` for `completionStatus` strictly above `if (!isOpen) return null;` (ADR-0086).
- [x] `borrowDate` and `returnDueDate` initialize to `""` and reset to `""` on modal open so Step 2 is not prematurely marked complete (ADR-0087).
- [x] Step 3 catalog cards use the 3-layer layout with `shrink-0 whitespace-nowrap` on `item.code` and full-width `line-clamp-2 break-words` on `item.name` (ADR-0087).
- [x] `node --test --import ./test/register-alias.mjs src/components/views/InventoryView/borrowRequestModal.test.ts` passes with 0 failures.
- [x] `npm run drift:check` passes with 0 drift (114/114 spec-plan pairs).
- [x] `npm run build:check` passes with 0 TypeScript errors.
- [x] `npm run test:smoke` passes with 0 failures.



