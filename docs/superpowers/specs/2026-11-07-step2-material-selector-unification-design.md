# Step 2 Material Selector Unification and Emoji Sanitization Design Spec

- **Status:** APPROVED
- **Date:** 2026-11-07
- **Author:** Senior Software Engineer
- **ADR Reference:** `docs/adr/0078-step2-material-selector-unification-and-emoji-sanitization.md`

## 1. Executive Summary & Problem Diagnosis

In the POSM Placement workflow (`PlacementFormModal.tsx`), operators and installers configure the material type, campaign theme, and financial scheme in Step 2 (`Step2MaterialTheme.tsx`).

Two visual and architectural flaws degrade Step 2 usability across viewports:

1. **Redundant Material Selection Controls:**
   - 7 hardcoded category pills (`Poster`, `Shopblind`, `Stiker Etalase`, `Bottom Etalase`, `Shop Sign / Neonbox`, `Banner`, `Other`) are stacked immediately above a native HTML `<select>` dropdown.
   - Both controls manipulate `placement.materialId`. Having both creates operator confusion, consumes ~80px of vertical space, and duplicates selection logic.
   - The native HTML `<select>` lacks live search filtering, active-item checkmarks, and theme alignment with the platform's design system.

2. **Raw Unicode Emoji Clutter:**
   - In the "Skema Biaya & Legalitas" section, buttons display raw emojis: `"🏷️ Bebas Biaya (Rp 0)"` and `"💰 Pemasangan Berbayar"`.
   - Raw emojis clash with the professional Lucide SVG icon design system used across all other views.

## 2. Component Architecture & Implementation Contracts

All modifications are strictly localized to `src/components/views/PlacementsView/wizard/Step2MaterialTheme.tsx`.

### 2.1 Material Selector Unification Contract
Replace the entire duplicate chip section (`POSM_MATERIALS.map(...)`) and native `<select>` with the unified platform [`CustomDropdown`](file:///Users/mac/Web%20Development/vrello-up/src/components/ui/CustomDropdown.tsx):

```tsx
{/* Material POSM Catalog Master Data Dropdown */}
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

### 2.2 Emoji Sanitization Contract
In the "Skema Biaya & Legalitas" section, sanitize both buttons by removing raw emojis and rendering Lucide SVG icons:

1. **Bebas Biaya (Rp 0):**
   ```tsx
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
     <Tag className="w-3.5 h-3.5 shrink-0" />
     <span>Bebas Biaya (Rp 0)</span>
   </button>
   ```

2. **Pemasangan Berbayar:**
   ```tsx
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
     <CreditCard className="w-3.5 h-3.5 shrink-0" />
     <span>Pemasangan Berbayar</span>
   </button>
   ```

### 2.3 Unused Helper Code Pruning
Remove obsolete local state and helper bindings from `Step2MaterialTheme.tsx`:
- `activeChipLabel`
- `handleSelectPosmChip`
- Unused imports: `POSM_MATERIALS`, `resolvePosmChipMaterial`, `getActivePosmChipLabel`, `PosmMaterialChip`.

## 3. Acceptance Criteria & Invariants

1. **AC-1 (Zero Selection Redundancy):** The redundant material chip container (`POSM_MATERIALS.map(...)`) is completely eliminated from Step 2.
2. **AC-2 (Platform CustomDropdown Integration):** Material POSM selection uses `CustomDropdown` across all viewports (mobile and desktop).
3. **AC-3 (Live Search Functionality):** `CustomDropdown` has `searchable={true}` enabled with `searchPlaceholder="Cari material POSM..."`.
4. **AC-4 (Emoji Sanitization):** Step 2 contains 0 raw Unicode emojis (`🏷️`, `💰`). Costing scheme buttons render `<Tag />` and `<CreditCard />`.
5. **AC-5 (MoU & State Invariants):** Selecting a material via `CustomDropdown` updates `placement.materialId` identically to previous behavior, seamlessly updating MoU requirement detection and auto-expansion rules.
6. **AC-6 (Vertical Space Relief):** Eliminating the chip bar reclaims ~80px of vertical height in Step 2 across all devices.

## 4. Explicit Non-Goals
- No changes to MoU verification logic or `effectiveMaterials` fetching.
- No changes to Quarters or Campaign Themes selection logic.

## 5. Verification Checklist
- [ ] Create unit & structural test `src/components/views/PlacementsView/step2MaterialResponsiveness.test.ts`.
- [ ] Run test suite (`npm test`).
- [ ] Run architectural drift verification (`npm run drift:check`).
- [ ] Run build check (`npm run build:check`).



