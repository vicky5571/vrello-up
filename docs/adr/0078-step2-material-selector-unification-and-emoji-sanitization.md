# ADR-0078: Step 2 POSM Material Selector Unification with CustomDropdown and Emoji Sanitization

- **Status:** ACCEPTED
- **Date:** 2026-11-07
- **Deciders:** Senior Software Engineer, Lead Developer

## Context & Business Problem

*vrello-up* is an enterprise field marketing management platform for Indosat Ooredoo Hutchison (IM3 & Tri brands). In the POSM placement workflow (`PlacementFormModal.tsx`), operators and installers configure the material type, campaign theme, and financial scheme in Step 2 (`Step2MaterialTheme.tsx`).

Two visual and architectural flaws impede Step 2 usability:

1. **Redundant Dual Material Selection Controls:**
   - In `Step2MaterialTheme.tsx`, 7 hardcoded category pills (`Poster`, `Shopblind`, `Stiker Etalase`, `Bottom Etalase`, `Shop Sign / Neonbox`, `Banner`, `Other`) are stacked immediately above a native HTML `<select>` dropdown.
   - Both controls manipulate `placement.materialId`. This redundancy confuses operators, wastes ~80px of vertical viewport space inside the modal, and creates potential sync drift between hardcoded pill labels and live catalog master data.
   - The native HTML `<select>` lacks live search filtering, active-item checkmarks, and theme alignment with the platform's dark/light design system.

2. **Raw Unicode Emoji Clutter:**
   - In the "Skema Biaya & Legalitas" section, buttons display raw emojis: `"🏷️ Bebas Biaya (Rp 0)"` and `"💰 Pemasangan Berbayar"`.
   - Raw emojis render inconsistently across Android, iOS, Windows, and macOS, clashing with the polished Lucide SVG icon design system used everywhere else in the application.

## Options Considered

### Option 1: Unify with `CustomDropdown` Across All Viewports & Sanitize Emojis (Chosen)
- **Eliminate Material Chips:** Remove the redundant `POSM_MATERIALS.map(...)` chip buttons completely from `Step2MaterialTheme.tsx`.
- **Adopt `CustomDropdown` on All Viewports:** Replace the native HTML `<select>` with the platform's standard [`CustomDropdown`](file:///Users/mac/Web%20Development/vrello-up/src/components/ui/CustomDropdown.tsx) on both mobile and desktop:
  ```tsx
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
  />
  ```
- **Sanitize Emojis:** Replace raw emojis on costing buttons with Lucide SVG icons:
  - `"🏷️ Bebas Biaya (Rp 0)"` -> `<Tag className="w-3.5 h-3.5 shrink-0" /> <span>Bebas Biaya (Rp 0)</span>`
  - `"💰 Pemasangan Berbayar"` -> `<CreditCard className="w-3.5 h-3.5 shrink-0" /> <span>Pemasangan Berbayar</span>`
- *Trade-Offs:*
  - *Pros:* Eradicates redundancy 100%; reclaims ~80px of vertical modal space; empowers operators to search through long material catalogs instantly; delivers consistent, high-contrast dark/light styling on all viewports; professional, emoji-free typography.
  - *Cons:* None. Zero database or backend impact.

### Option 2: Keep Native `<select>` and Remove Only Chips
- Remove the chips but keep the native HTML `<select>`.
- *Trade-Offs:*
  - *Pros:* Minimal code edits.
  - *Cons:* Native select lacks search/filtering for catalogs with 15+ items and looks outdated on mobile and desktop.

## Decision

We adopt **Option 1: Unify with `CustomDropdown` Across All Viewports & Sanitize Emojis**.

Specifically:
1. In `src/components/views/PlacementsView/wizard/Step2MaterialTheme.tsx`:
   - Import `CustomDropdown` from `@/components/ui/CustomDropdown`.
   - Import `Tag` and `CreditCard` from `lucide-react`.
   - Remove the `POSM_MATERIALS.map(...)` container and associated chip selection handlers.
   - Replace native `<select>` with `<CustomDropdown searchable ... />` across all viewports.
   - Replace raw emojis `🏷️` and `💰` with `<Tag />` and `<CreditCard />`.

## Consequences

### Positive Consequences
1. **Vertical Space Optimization:** Removing the redundant chips saves ~80px of vertical height in Step 2, ensuring that Quarters, Campaign Themes, Costing, and MoU sections are immediately visible without excessive scrolling.
2. **Instant Searchability:** Field teams can quickly type to filter materials (e.g. "Neon", "Shopblind", "Poster") instead of scrolling through raw select option lists.
3. **Cross-Platform Consistency:** Consistent dropdown popovers with solid borders, active checkmarks, and responsive collision detection on all viewports.
4. **Professional Visual Polish:** Replacing emojis with Lucide SVG icons restores a cohesive enterprise aesthetic.

### Negative Consequences / Accepted Technical Debt
1. None. No schema, store, or state mutations.

## Verification Strategy
- **Unit & Structural Test:** `src/components/views/PlacementsView/step2MaterialResponsiveness.test.ts` to assert:
  - `Step2MaterialTheme.tsx` utilizes `CustomDropdown` for material selection.
  - Redundant chip container is absent.
  - Costing buttons use `<Tag />` and `<CreditCard />` without raw emojis (`🏷️`, `💰`).
- **Regression Suite:** `npm run drift:check`, `npm run build:check`, and `npm test`.



