# Mobile Outlet Search and Selected Outlet Card Readability Design Spec

- **Status:** APPROVED
- **Date:** 2026-11-07
- **Author:** Senior Software Engineer
- **ADR Reference:** `docs/adr/0075-mobile-outlet-search-and-selected-card-readability.md`

## 1. Executive Summary & Problem Diagnosis

In the POSM Placement workflow (`PlacementFormModal.tsx`), field operators, installers, and supervisors select target retail partner outlets via `OutletSearchCombobox.tsx` in Step 1 (`Step1Outlet.tsx`).

On mobile viewports (< 640px, e.g. 360px - 390px widths), severe horizontal space contention causes severe text truncation and multi-line fragmentation across two core surfaces:

### 1.1 Search Results Dropdown List Item
- In `OutletSearchCombobox.tsx`, the top row places the outlet code badge, outlet name, and brand badge on a single row with `truncate`.
- Long retail names like `"Berkah Sinar Jaya Cellular (Gerai IM3 Pandanaran)"` are abruptly truncated after ~18 characters to `"Berkah Sinar Jaya ..."`, concealing the actual branch identifier.
- The address row also truncates early (`"Jl. Pandanaran No. 131, Mugassa..."`), preventing promoters from verifying the street and sub-district.

### 1.2 Selected Outlet Target POSM Card
- The card header uses `flex items-start justify-between gap-3`.
- The right action column (`[🔄 Ganti Outlet]` at ~105px and `[✕]` at ~28px) plus gap takes ~140px.
- The left store icon container takes 52px.
- In a ~360px mobile modal card, available horizontal space for the outlet name and address is constricted to approximately 92px.
- This creates an egregious vertical layout collapse:
  - The store name fragments across 5 vertical lines: `"Berkah Si"` \n `"Jaya"` \n `"Cellular"` \n `"(Gerai IM3"` \n `"Pandanaran)"`.
  - The address fragments across 8 vertical lines with 1–2 words per line.
- Desktop screens ($\ge 640\text{px}$) have abundant width and must remain 100% byte-for-byte unaffected.

## 2. Component Architecture & Responsive Contracts

All changes are strictly localized to `src/components/views/PlacementsView/OutletSearchCombobox.tsx`.

### 2.1 Search Results Dropdown List Item Contract (`results.map`)
Introduce a mobile-specific layout (`sm:hidden`) while preserving the existing desktop structure (`hidden sm:flex sm:flex-col`):

```tsx
{/* Mobile Layout (< 640px) */}
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

{/* Desktop Layout (>= 640px) */}
<div className="hidden sm:flex sm:flex-col sm:gap-1.5">
  {/* Unchanged legacy lines */}
</div>
```

### 2.2 Selected Outlet Target POSM Card Contract (`showCard && currentOutlet`)
1. **Header Action Split:**
   - In the card header, the `[🔄 Ganti Outlet]` button gains `hidden sm:inline-flex` so it only renders in the header on desktop.
   - The unselect button `[✕]` remains in the header on both mobile and desktop (`p-1.5 shrink-0`).
   - This expands the available middle column width on mobile from ~92px to ~230px (+148% wider), completely eliminating 5-line title and 8-line address wrapping.
2. **Dedicated Mobile Action Button:**
   - On mobile, render a full-width `[🔄 Ganti Outlet Lain]` button below the card content:
     ```tsx
     <button
       type="button"
       onClick={handleChangeClick}
       disabled={disabled}
       className="w-full sm:hidden py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-200/80 dark:border-slate-600 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs mt-1"
     >
       <RefreshCw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
       <span>Ganti Outlet Lain</span>
     </button>
     ```
3. **Desktop Invariance Contract:**
   - On desktop viewports ($\ge 640\text{px}$), the header displays `[🔄 Ganti Outlet]` and `[✕]` side-by-side. The mobile button is completely hidden (`sm:hidden`).

## 3. Acceptance Criteria & Invariants

1. **AC-1 (Search Item Mobile Legibility):** On mobile viewports (< 640px), search results allow outlet names to wrap cleanly up to 2 lines (`break-words line-clamp-2`), showing full branch/qualifier names without aggressive truncation.
2. **AC-2 (Search Address Mobile Legibility):** On mobile viewports (< 640px), street addresses render across up to 2 lines with `MapPin`, remaining legible without cutting off sub-districts prematurely.
3. **AC-3 (Selected Card Header Relief):** On mobile viewports (< 640px), removing the 105px `Ganti Outlet` button from the top row expands store title and address width by >140%, eliminating the 5-line title and 8-line address collapse.
4. **AC-4 (Dedicated Mobile Ganti Outlet Button):** On mobile viewports (< 640px), a full-width `Ganti Outlet Lain` button is rendered below the card content with high-contrast thumb ergonomics.
5. **AC-5 (Desktop Visual Invariant):** On desktop viewports ($\ge 640\text{px}$), both search results and selected card maintain their existing single-row header structures byte-for-byte.
6. **AC-6 (Behavioral Invariance):** Both desktop and mobile action buttons trigger `handleChangeClick`, clear unselect triggers `handleClear`, and keyboard navigation (`ArrowDown`, `ArrowUp`, `Enter`) remains fully functional.

## 4. Explicit Non-Goals
- No changes to API search parameters or endpoints.
- No modifications to search relevance scoring in `outletsSearchFilter.ts`.
- No styling modifications to desktop viewports.

## 5. Verification Checklist
- [ ] Create unit & structural test `src/components/views/PlacementsView/outletSearchResponsiveness.test.ts`.
- [ ] Run test suite (`npm test`).
- [ ] Run architectural drift verification (`npm run drift:check`).
- [ ] Run build check (`npm run build:check`).



