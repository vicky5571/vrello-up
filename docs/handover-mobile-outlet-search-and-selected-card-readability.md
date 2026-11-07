# Execution Handover: Mobile Outlet Search and Selected Outlet Card Readability

- **Target ADR:** `docs/adr/0075-mobile-outlet-search-and-selected-card-readability.md`
- **Target Spec:** `docs/superpowers/specs/2026-11-07-mobile-outlet-search-and-selected-card-readability-design.md`
- **Target Plan:** `docs/superpowers/plans/2026-11-07-mobile-outlet-search-and-selected-card-readability.md`
- **Status:** EXECUTION-READY

## 1. File Manifest

| File Path | Purpose |
| :--- | :--- |
| `src/components/views/PlacementsView/outletSearchResponsiveness.test.ts` | Unit & responsiveness regression test suite verifying mobile layout contracts |
| `src/components/views/PlacementsView/OutletSearchCombobox.tsx` | Component governing outlet search, autocomplete dropdown, and selected target card |
| `src/components/views/PlacementsView/wizard/Step1Outlet.tsx` | Step 1 wrapper containing step header, brand filters, and subtitle |


---

## 2. Current Code Snippets

From `src/components/views/PlacementsView/OutletSearchCombobox.tsx`:

### Snippet A: Selected Card Header Actions (Lines 396–418)
```tsx
            {/* Action Buttons: Ganti Outlet and Remove */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleChangeClick}
                disabled={disabled}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer disabled:opacity-50"
                title="Ganti outlet lain"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Ganti Outlet</span>
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={disabled}
                className="p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer disabled:opacity-50"
                title="Hapus pilihan"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
```

### Snippet B: Search Result List Item Top Lines (Lines 699–735)
```tsx
                        {/* First line: Code, Name, Brand */}
                        <div className="flex items-center gap-1.5 min-w-0">
                          {outlet.code && (
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 shrink-0">
                              {outlet.code}
                            </span>
                          )}
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                            {outlet.name}
                          </span>
                          {renderBrandBadge(outlet.brand)}
                        </div>

                        {/* Second line: Address / City / GPS */}
                        <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-1 truncate min-w-0">
                            <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                            <span className="truncate">
                              {[outlet.address, outlet.city]
                                .filter(Boolean)
                                .join(", ") || "Alamat belum ada"}
                              {outlet.branch?.name ? ` (${outlet.branch.name})` : ""}
                            </span>
                          </div>

                          {hasCoordinates ? (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 shrink-0 font-semibold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>GPS Ada</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 shrink-0 font-medium">
                              Titik GPS Kosong
                            </span>
                          )}
                        </div>
```

### Snippet C: Search Result Panel Header Hint in `OutletSearchCombobox.tsx` (Lines 623–626)
```tsx
                <span className="text-[10px] text-slate-400 font-normal">
                  Gunakan ↑↓ lalu Enter atau klik outlet
                </span>
```

### Snippet D: Step 1 Header Subtitle in `src/components/views/PlacementsView/wizard/Step1Outlet.tsx` (Lines 61–65)
```tsx
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {selectedOutlet
              ? "Outlet terverifikasi untuk pelaksanaan materi promosi lapangan"
              : "Cari toko berdasarkan nama, ID outlet, atau alamat lapangan"}
          </p>
```

---

## 3. Exact Change Instructions


### Change 1: Selected Card Header Actions & Bottom Mobile Button

In `src/components/views/PlacementsView/OutletSearchCombobox.tsx`:

**A. Lines 397–417 (Header Action Buttons):**
Change `inline-flex` on the `[🔄 Ganti Outlet]` button to `hidden sm:inline-flex`:

```tsx
            {/* Action Buttons: Ganti Outlet (Desktop only in header) and Remove */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleChangeClick}
                disabled={disabled}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer disabled:opacity-50"
                title="Ganti outlet lain"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Ganti Outlet</span>
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={disabled}
                className="p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer disabled:opacity-50"
                title="Hapus pilihan"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
```

**B. Line 514 (Below the Bottom Verified GPS & Brand Selector bar, before Riwayat or at card bottom):**
Add dedicated mobile full-width `Ganti Outlet Lain` button:

```tsx
          {/* Mobile Action: Ganti Outlet Button (Full-width, thumb-friendly) */}
          <button
            type="button"
            onClick={handleChangeClick}
            disabled={disabled}
            className="w-full sm:hidden py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-200/80 dark:border-slate-600 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Ganti Outlet Lain</span>
          </button>
```

### Change 2: Search Result Dropdown List Item (`results.map`)

In `src/components/views/PlacementsView/OutletSearchCombobox.tsx`, wrap the top section in responsive containers:

```tsx
                        {/* Mobile Layout (< 640px): Stacked and clear without aggressive truncation */}
                        <div className="flex flex-col gap-1 sm:hidden">
                          {/* Badges Row: Code + Brand on left, GPS Status on right */}
                          <div className="flex items-center justify-between gap-1.5 min-w-0">
                            <div className="flex items-center gap-1.5 shrink-0">
                              {outlet.code && (
                                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                                  {outlet.code}
                                </span>
                              )}
                              {renderBrandBadge(outlet.brand)}
                            </div>
                            {hasCoordinates ? (
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span>GPS Ada</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium shrink-0">
                                Titik GPS Kosong
                              </span>
                            )}
                          </div>

                          {/* Outlet Name: Full-width, break-words, up to 2 lines */}
                          <div className="font-bold text-xs text-slate-900 dark:text-slate-100 leading-snug break-words line-clamp-2">
                            {outlet.name}
                          </div>

                          {/* Address: Full-width, line-clamp-2, natural text flow */}
                          <div className="flex items-start gap-1 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                            <MapPin className="w-3 h-3 shrink-0 text-slate-400 mt-0.5" />
                            <span className="line-clamp-2 leading-normal">
                              {[outlet.address, outlet.city].filter(Boolean).join(", ") || "Alamat belum ada"}
                              {outlet.branch?.name ? ` (${outlet.branch.name})` : ""}
                            </span>
                          </div>
                        </div>

                        {/* Desktop Layout (>= 640px): Exact legacy single-row layout */}
                        <div className="hidden sm:flex sm:flex-col sm:gap-1.5">
                          {/* First line: Code, Name, Brand */}
                          <div className="flex items-center gap-1.5 min-w-0">
                            {outlet.code && (
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 shrink-0">
                                {outlet.code}
                              </span>
                            )}
                            <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                              {outlet.name}
                            </span>
                            {renderBrandBadge(outlet.brand)}
                          </div>

                          {/* Second line: Address / City / GPS */}
                          <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-1 truncate min-w-0">
                              <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                              <span className="truncate">
                                {[outlet.address, outlet.city]
                                  .filter(Boolean)
                                  .join(", ") || "Alamat belum ada"}
                                {outlet.branch?.name ? ` (${outlet.branch.name})` : ""}
                              </span>
                            </div>

                            {hasCoordinates ? (
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 shrink-0 font-semibold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span>GPS Ada</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 shrink-0 font-medium">
                                Titik GPS Kosong
                              </span>
                            )}
                          </div>
                        </div>
```

### Change 3: Search Result Panel Header Keyboard Hint

In `src/components/views/PlacementsView/OutletSearchCombobox.tsx`, line 623:

DELETE:
```tsx
                <span className="text-[10px] text-slate-400 font-normal">
                  Gunakan ↑↓ lalu Enter atau klik outlet
                </span>
```

REPLACE WITH:
```tsx
                <span className="hidden sm:inline text-[10px] text-slate-400 font-normal">
                  Gunakan ↑↓ lalu Enter atau klik outlet
                </span>
```

### Change 4: Step 1 Header Subtitle Relief

In `src/components/views/PlacementsView/wizard/Step1Outlet.tsx`, lines 61–65:

DELETE:
```tsx
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {selectedOutlet
              ? "Outlet terverifikasi untuk pelaksanaan materi promosi lapangan"
              : "Cari toko berdasarkan nama, ID outlet, atau alamat lapangan"}
          </p>
```

REPLACE WITH:
```tsx
          <p
            className={cn(
              "text-[11px] text-slate-500 dark:text-slate-400 mt-0.5",
              selectedOutlet && "hidden sm:block"
            )}
          >
            {selectedOutlet
              ? "Outlet terverifikasi untuk pelaksanaan materi promosi lapangan"
              : "Cari toko berdasarkan nama, ID outlet, atau alamat lapangan"}
          </p>
```

---

## 4. Do Not Touch List

| File / Component | Reason |
| :--- | :--- |
| `src/app/api/marcom/outlets/outletsSearchFilter.ts` | Pure ranking helper; working as expected |
| `src/components/views/PlacementsView/wizard/Step1Outlet.tsx` Segmented Brand Filter | Brand filter pills (`Semua`, `IM3`, `3/Tri`) intact |
| `src/components/views/PlacementsView/wizard/Step4LocationVerification.tsx` | Step 4 verification logic; outside scope |
| Desktop CSS breakpoints (`sm:`, `md:`, `lg:`) | Desktop visual layout must remain 100% byte-for-byte unaffected |

---

## 5. Numbered Execution Order

1. **Create Test File:**
   - Create `src/components/views/PlacementsView/outletSearchResponsiveness.test.ts`.
   - Implement test assertions verifying presence of `sm:hidden` mobile stacked containers, `hidden sm:inline-flex` for header button, `w-full sm:hidden` for mobile bottom button, `hidden sm:inline` for keyboard hint, and `hidden sm:block` for selected subtitle.
   - Run `npx tsx --test src/components/views/PlacementsView/outletSearchResponsiveness.test.ts` (verify RED / baseline failure).
2. **Apply OutletSearchCombobox & Step1Outlet Refactors:**
   - Update `src/components/views/PlacementsView/OutletSearchCombobox.tsx`:
     - Apply Change 1 (Header `hidden sm:inline-flex` and bottom `w-full sm:hidden` button).
     - Apply Change 2 (Search list items responsive separation).
     - Apply Change 3 (Search header hint `hidden sm:inline`).
   - Update `src/components/views/PlacementsView/wizard/Step1Outlet.tsx`:
     - Apply Change 4 (Subtitle `selectedOutlet && "hidden sm:block"`).
3. **Verify Tests & Build:**
   - Run `npx tsx --test src/components/views/PlacementsView/outletSearchResponsiveness.test.ts` (verify GREEN).
   - Run `npm run drift:check` (verify 102/102 spec-plan pairs).
   - Run `npm run build:check` (verify 0 TypeScript errors).
   - Run `npm test` (verify full test suite passes).
4. **Update Session Documentation:**
   - Update `CHANGELOG.md` with ADR-0075 entry.
   - Update `docs/SESSION_STATE.md`.

---

## 6. Acceptance Criteria Checklist

- [ ] Mobile search result items display outlet code, brand badge, and GPS status on line 1.
- [ ] Mobile search result items display full outlet name with `break-words line-clamp-2` on line 2 without truncation.
- [ ] Mobile search result items display address with `line-clamp-2` on line 3.
- [ ] Mobile selected card removes `Ganti Outlet` from top row, expanding store name & address width from ~92px to ~230px (+148% wider).
- [ ] Mobile selected card store name flows naturally without 5-line vertical fragmentation.
- [ ] Mobile selected card address flows naturally without 8-line vertical fragmentation.
- [ ] Mobile selected card renders dedicated full-width `Ganti Outlet Lain` button at bottom.
- [ ] Mobile search panel header hides keyboard navigation hint (`hidden sm:inline`).
- [ ] Step 1 header subtitle hides on mobile when outlet is selected (`hidden sm:block`) to conserve vertical space.
- [ ] Desktop viewport ($\ge 640\text{px}$) remains 100% byte-for-byte unaffected.




