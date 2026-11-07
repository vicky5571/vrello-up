# Execution Handover: Step 2 Material Selector Unification and Emoji Sanitization

- **Target ADR:** `docs/adr/0078-step2-material-selector-unification-and-emoji-sanitization.md`
- **Target Spec:** `docs/superpowers/specs/2026-11-07-step2-material-selector-unification-design.md`
- **Target Plan:** `docs/superpowers/plans/2026-11-07-step2-material-selector-unification.md`
- **Status:** EXECUTION-READY

## 1. File Manifest

| File Path | Purpose |
| :--- | :--- |
| `src/components/views/PlacementsView/step2MaterialResponsiveness.test.ts` | Unit & regression test suite verifying CustomDropdown integration and emoji sanitization |
| `src/components/views/PlacementsView/wizard/Step2MaterialTheme.tsx` | Wizard Step 2 component configuring material catalog, quarter, campaign, and cost |

---

## 2. Current Code Snippets

From `src/components/views/PlacementsView/wizard/Step2MaterialTheme.tsx`:

### Snippet A: Material Chips & Native Select (Lines 132–175)
```tsx
      {/* Dimensi 1: Material POSM Chips */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          Material POSM *
        </label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {POSM_MATERIALS.map((chip) => {
            const isActive = activeChipLabel === chip.label;
            return (
              <button
                key={chip.label}
                type="button"
                onClick={() => handleSelectPosmChip(chip)}
                className={cn(
                  "px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer",
                  isActive
                    ? "bg-lime-600 text-white border-lime-700 shadow-2xs ring-2 ring-lime-500/30"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                )}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Master Data Select */}
        <select
          required
          value={placement.materialId || ""}
          onChange={(e) =>
            setPlacement((prev) => (prev ? { ...prev, materialId: e.target.value } : prev))
          }
          className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-lime-500 cursor-pointer"
        >
          <option value="">Pilih Material Katalog Master Data...</option>
          {effectiveMaterials.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} {m.requiresMou ? "(Wajib MoU)" : ""}
            </option>
          ))}
        </select>
      </div>
```

### Snippet B: Costing Scheme Emojis (Lines 258–295)
```tsx
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setIsPaidMode(false);
              setPlacement((prev) => (prev ? togglePaidPlacement(prev, false) : prev));
            }}
            className={cn(
              "flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer",
              !isPaidMode
                ? "bg-lime-500/15 text-lime-900 dark:text-lime-200 border-lime-500/60 shadow-2xs ring-1 ring-lime-500/40"
                : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
            )}
          >
            <span>🏷️ Bebas Biaya (Rp 0)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsPaidMode(true);
              const defaultCost =
                selectedMou?.compensationValue && selectedMou.compensationValue > 0
                  ? selectedMou.compensationValue
                  : DEFAULT_PAID_PLACEMENT_COST;
              setPlacement((prev) => (prev ? togglePaidPlacement(prev, true, defaultCost) : prev));
              setIsMouManuallyExpanded(true);
            }}
            className={cn(
              "flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer",
              isPaidMode
                ? "bg-amber-500/15 text-amber-900 dark:text-amber-200 border-amber-500/60 shadow-2xs ring-1 ring-amber-500/40"
                : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
            )}
          >
            <span>💰 Pemasangan Berbayar</span>
          </button>
        </div>
```

---

## 3. Exact Change Instructions

### Change 1: `src/components/views/PlacementsView/wizard/Step2MaterialTheme.tsx`

**A. Imports Update:**

Add:
```tsx
import { Tag, CreditCard } from "lucide-react";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
```

Prune unused helper imports:
```tsx
// Remove: POSM_MATERIALS, resolvePosmChipMaterial, getActivePosmChipLabel, PosmMaterialChip
```

**B. Lines 99–111 (Prune Unused State & Handlers):**

DELETE:
```tsx
  const activeChipLabel = getActivePosmChipLabel(
    placement.materialId,
    effectiveMaterials,
    selectedMat
  );

  const handleSelectPosmChip = (chip: PosmMaterialChip) => {
    const matched = resolvePosmChipMaterial(chip, effectiveMaterials);
    if (matched) {
      setPlacement((prev) => (prev ? { ...prev, materialId: matched.id } : prev));
    }
  };
```

**C. Lines 132–175 (Material Selector Replacement):**

DELETE:
```tsx
      {/* Dimensi 1: Material POSM Chips */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          Material POSM *
        </label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {POSM_MATERIALS.map((chip) => {
            const isActive = activeChipLabel === chip.label;
            return (
              <button
                key={chip.label}
                type="button"
                onClick={() => handleSelectPosmChip(chip)}
                className={cn(
                  "px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer",
                  isActive
                    ? "bg-lime-600 text-white border-lime-700 shadow-2xs ring-2 ring-lime-500/30"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                )}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Master Data Select */}
        <select
          required
          value={placement.materialId || ""}
          onChange={(e) =>
            setPlacement((prev) => (prev ? { ...prev, materialId: e.target.value } : prev))
          }
          className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-lime-500 cursor-pointer"
        >
          <option value="">Pilih Material Katalog Master Data...</option>
          {effectiveMaterials.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} {m.requiresMou ? "(Wajib MoU)" : ""}
            </option>
          ))}
        </select>
      </div>
```

REPLACE WITH:
```tsx
      {/* Dimensi 1: Material POSM Catalog Master Data Selector */}
      <div>
        <label
          htmlFor="wizard-step2-material-select"
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
        >
          Material POSM *
        </label>
        <CustomDropdown
          id="wizard-step2-material-select"
          value={placement.materialId || ""}
          onChange={(val) =>
            setPlacement((prev) => (prev ? { ...prev, materialId: val } : prev))
          }
          options={effectiveMaterials.map((m) => ({
            value: m.id,
            label: `${m.name}${m.requiresMou ? " (Wajib MoU)" : ""}`,
          }))}
          placeholder="Pilih Material Katalog Master Data..."
          searchable
          searchPlaceholder="Cari material POSM..."
          size="sm"
          className="w-full"
        />
      </div>
```

**D. Lines 272 and 293 (Emoji Sanitization):**

Line 272 DELETE:
```tsx
            <span>🏷️ Bebas Biaya (Rp 0)</span>
```
REPLACE WITH:
```tsx
            <Tag className="w-3.5 h-3.5 shrink-0" />
            <span>Bebas Biaya (Rp 0)</span>
```

Line 293 DELETE:
```tsx
            <span>💰 Pemasangan Berbayar</span>
```
REPLACE WITH:
```tsx
            <CreditCard className="w-3.5 h-3.5 shrink-0" />
            <span>Pemasangan Berbayar</span>
```

---

## 4. Do Not Touch List

| File / Component | Reason |
| :--- | :--- |
| `src/lib/marcom/placementMouBridge.ts` | Core MoU requirement validation rules; intact |
| `src/components/views/PlacementsView/wizard/Step1Outlet.tsx` | Step 1 outlet picker; intact |
| Quarters & Campaign Themes Sections in Step 2 | Selection pills and inputs; intact |

---

## 5. Numbered Execution Order

1. **Create Test File:**
   - Create `src/components/views/PlacementsView/step2MaterialResponsiveness.test.ts`.
   - Implement test assertions verifying `CustomDropdown` presence for material selection, absence of `POSM_MATERIALS.map` chip container, and absence of raw Unicode emojis (`🏷️`, `💰`).
   - Run `npx tsx --test src/components/views/PlacementsView/step2MaterialResponsiveness.test.ts` (verify RED / baseline failure).
2. **Apply Step2MaterialTheme Refactor:**
   - In `src/components/views/PlacementsView/wizard/Step2MaterialTheme.tsx`:
     - Apply Change 1A (Imports update).
     - Apply Change 1B (Prune unused state/handlers).
     - Apply Change 1C (Replace chips & native select with `CustomDropdown`).
     - Apply Change 1D (Sanitize emojis with `Tag` and `CreditCard`).
3. **Verify Tests & Build:**
   - Run `npx tsx --test src/components/views/PlacementsView/step2MaterialResponsiveness.test.ts` (verify GREEN).
   - Run `npm run drift:check` (verify 105/105 spec-plan pairs).
   - Run `npm run build:check` (verify 0 TypeScript errors).
   - Run `npm test` (verify all placement tests pass).
4. **Update Session Documentation:**
   - Update `CHANGELOG.md` with ADR-0078 entry.
   - Update `docs/SESSION_STATE.md`.

---

## 6. Acceptance Criteria Checklist

- [ ] Redundant material chip bar (`POSM_MATERIALS.map`) is completely removed from Step 2.
- [ ] Material POSM catalog selection uses `CustomDropdown` across all viewports.
- [ ] `CustomDropdown` includes live search filtering (`searchable={true}`).
- [ ] Step 2 contains 0 raw Unicode emojis (`🏷️`, `💰`).
- [ ] Costing scheme buttons render Lucide `<Tag />` and `<CreditCard />`.
- [ ] Selecting a material via `CustomDropdown` updates `placement.materialId` and drives MoU logic identically to previous behavior.
- [ ] ~80px of vertical space is reclaimed in Step 2.



