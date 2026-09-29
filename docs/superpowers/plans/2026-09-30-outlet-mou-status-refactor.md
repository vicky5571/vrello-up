# Outlets Table MoU Status & Expanded Row Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate redundant MoU status text in the Outlets table expanded row by replacing it with useful metadata (Tier & Brand), adding direct 1-click drilldown navigation buttons to MoUs in both the expanded footer and collapsed table column, and decomposing the inline expanded row into a modular component.

**Architecture:** 
1. Follow the codebase invariant (Strangler pattern on god views, like `MouExpandedRow.tsx` and `PlacementExpandedRow.tsx`) by extracting `OutletExpandedRow.tsx` and pure formatting helpers in `outletRowHelpers.ts`.
2. Replace static duplicate text with `Tier & Brand` in the 4th card of `OutletExpandedRow`.
3. Give MoU status feature parity with Placements by adding `navigateToMarcom("mous", outlet.name)` navigation triggers to both the collapsed table column badge and the expanded action buttons.
4. Keep the backend query lean—do NOT join heavy MoU entities to the `/api/marcom/outlets` master data query. Deep contract inspection remains isolated to `Outlet360Drawer`.

**Tech Stack:** Next.js 15, React 19, TypeScript 5, Tailwind CSS v4, Lucide React, Node test runner (`node --test`).

**Spec:** Option A from the architectural review discussion.

## Global Constraints
- All entity types (`OutletItem`, `OutletTier`, `Brand`, `ViewMode`) MUST be imported from `@/types`.
- Dual-persistence and zero-mutation discipline must be maintained.
- Node native test runner (`npm test -- <test-file>`) with 0 failures before marking tasks complete.
- All code, comments, test descriptions, and commits must be in English.

---

### Task 1: Create `outletRowHelpers.ts` and Unit Tests

**Files:**
- Create: `src/components/views/OutletsView/outletRowHelpers.ts`
- Create: `src/components/views/OutletsView/outletRowHelpers.test.ts`

**Interfaces:**
- Consumes: `OutletTier`, `Brand` from `@/types`
- Produces:
  - `formatTierAndBrand(tier?: OutletTier | string | null, brand?: Brand | string | null): string`
  - `formatOutletCoordinates(lat?: number | null, lng?: number | null): string`

- [ ] **Step 1: Write the failing unit tests for outlet row helpers**

```ts
// src/components/views/OutletsView/outletRowHelpers.test.ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatTierAndBrand, formatOutletCoordinates } from "./outletRowHelpers";

describe("outletRowHelpers", () => {
  describe("formatTierAndBrand", () => {
    it("formats TIER_1 and IM3 correctly", () => {
      const result = formatTierAndBrand("TIER_1", "IM3");
      assert.equal(result, "TIER 1 • IM3");
    });

    it("formats TIER_2 and TRI correctly", () => {
      const result = formatTierAndBrand("TIER_2", "TRI");
      assert.equal(result, "TIER 2 • TRI");
    });

    it("handles missing tier and brand by falling back to defaults", () => {
      const result = formatTierAndBrand(null, null);
      assert.equal(result, "TIER 1 • IM3");
    });

    it("handles undefined inputs gracefully", () => {
      const result = formatTierAndBrand(undefined, undefined);
      assert.equal(result, "TIER 1 • IM3");
    });
  });

  describe("formatOutletCoordinates", () => {
    it("formats numeric latitude and longitude to 5 decimal places", () => {
      const result = formatOutletCoordinates(-6.208763, 106.845599);
      assert.equal(result, "-6.20876, 106.84560");
    });

    it("returns 'Belum disetel' when coordinates are null or undefined", () => {
      assert.equal(formatOutletCoordinates(null, null), "Belum disetel");
      assert.equal(formatOutletCoordinates(undefined, undefined), "Belum disetel");
      assert.equal(formatOutletCoordinates(-6.2, null), "Belum disetel");
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/views/OutletsView/outletRowHelpers.test.ts`
Expected: FAIL with `Cannot find module './outletRowHelpers'`

- [ ] **Step 3: Implement `outletRowHelpers.ts`**

```ts
// src/components/views/OutletsView/outletRowHelpers.ts
import type { OutletTier, Brand } from "@/types";

/**
 * Formats outlet tier and brand into a clean display label (e.g. "TIER 1 • IM3").
 */
export function formatTierAndBrand(
  tier?: OutletTier | string | null,
  brand?: Brand | string | null,
): string {
  const cleanTier = (tier || "TIER_1").replaceAll("_", " ");
  const cleanBrand = brand || "IM3";
  return `${cleanTier} • ${cleanBrand}`;
}

/**
 * Formats GPS coordinates to 5 decimal places, or returns "Belum disetel" if missing.
 */
export function formatOutletCoordinates(
  latitude?: number | null,
  longitude?: number | null,
): string {
  if (typeof latitude === "number" && typeof longitude === "number") {
    return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  }
  return "Belum disetel";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/views/OutletsView/outletRowHelpers.test.ts`
Expected: PASS with 6 tests passing.

- [ ] **Step 5: Commit changes**

```bash
git add src/components/views/OutletsView/outletRowHelpers.ts src/components/views/OutletsView/outletRowHelpers.test.ts
git commit -m "feat(outlets): add outletRowHelpers for tier, brand and GPS formatting"
```

---

### Task 2: Create `OutletExpandedRow.tsx` Component

**Files:**
- Create: `src/components/views/OutletsView/OutletExpandedRow.tsx`
- Modify: `src/components/views/OutletsView/outletRowHelpers.test.ts` (add structural/component assertions)

**Interfaces:**
- Consumes:
  - `MarcomOutlet`, `ViewMode` from `@/types`
  - `formatTierAndBrand`, `formatOutletCoordinates` from `./outletRowHelpers`
- Produces:
  - `OutletExpandedRow`: React functional component for expanded table rows

- [ ] **Step 1: Write integration tests for `OutletExpandedRow` contracts**

Add to `src/components/views/OutletsView/outletRowHelpers.test.ts`:
```ts
import fs from "node:fs";
import path from "node:path";

describe("OutletExpandedRow structural contracts", () => {
  const filePath = path.resolve(
    process.cwd(),
    "src/components/views/OutletsView/OutletExpandedRow.tsx",
  );

  it("exports OutletExpandedRow component", () => {
    assert.ok(fs.existsSync(filePath), "OutletExpandedRow.tsx must exist");
    const content = fs.readFileSync(filePath, "utf-8");
    assert.ok(content.includes("export function OutletExpandedRow"), "Must export OutletExpandedRow");
  });

  it("replaces redundant Status MoU card with Tier & Brand", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    assert.ok(content.includes("Tier & Brand"), "Must display Tier & Brand card header");
    assert.ok(!content.includes("Status MoU"), "Must not display duplicate Status MoU card");
  });

  it("provides MoUs quick-jump action button with navigateToMarcom", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    assert.ok(content.includes('navigateToMarcom("mous", outlet.name)'), "Must trigger MoU navigation");
    assert.ok(content.includes("MoUs ("), "Must display MoU count in button label");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/views/OutletsView/outletRowHelpers.test.ts`
Expected: FAIL with `OutletExpandedRow.tsx must exist`

- [ ] **Step 3: Implement `OutletExpandedRow.tsx`**

```tsx
// src/components/views/OutletsView/OutletExpandedRow.tsx
"use client";

import {
  Store,
  Building2,
  ClipboardList,
  FileText,
  Edit2,
} from "lucide-react";
import type { OutletItem as MarcomOutlet, ViewMode } from "@/types";
import { formatTierAndBrand, formatOutletCoordinates } from "./outletRowHelpers";

export interface OutletExpandedRowProps {
  outlet: MarcomOutlet;
  canAddOutlet: boolean;
  onOpenDrawer: (outletId: string) => void;
  onSelectBranch: (branchId: string) => void;
  onEditOutlet: (outlet: MarcomOutlet) => void;
  navigateToMarcom: (view: ViewMode, search?: string) => void;
}

export function OutletExpandedRow({
  outlet,
  canAddOutlet,
  onOpenDrawer,
  onSelectBranch,
  onEditOutlet,
  navigateToMarcom,
}: OutletExpandedRowProps) {
  const mouCount = outlet.mouCount ?? 0;
  const placementCount = outlet.placementCount ?? 0;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">
            Address
          </div>
          <div className="text-slate-700 dark:text-slate-300">{outlet.address || "—"}</div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">
            PIC & Telepon
          </div>
          <div className="text-slate-700 dark:text-slate-300">
            {outlet.picName || "—"} {outlet.picPhone ? `(${outlet.picPhone})` : ""}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">
            Koordinat GPS
          </div>
          <div className="text-slate-700 dark:text-slate-300 font-mono text-[11px]">
            {formatOutletCoordinates(outlet.latitude, outlet.longitude)}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">
            Tier & Brand
          </div>
          <div className="text-slate-700 dark:text-slate-300 font-semibold">
            {formatTierAndBrand(outlet.tier, outlet.brand)}
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDrawer(outlet.id);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 transition-colors shadow-2xs cursor-pointer"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Buka Profil 360°</span>
          </button>

          {outlet.branch && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectBranch(outlet.branchId);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 dark:hover:bg-cyan-900/40 transition-colors shadow-2xs cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-cyan-500" />
              <span>Branch ({outlet.branch.name})</span>
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigateToMarcom("placements", outlet.name);
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-lime-700 dark:text-lime-300 bg-lime-50 dark:bg-lime-950/40 border border-lime-200 dark:border-lime-800 hover:bg-lime-100 dark:hover:bg-lime-900/40 transition-colors shadow-2xs cursor-pointer"
            title={`Buka daftar Placements untuk ${outlet.name}`}
          >
            <ClipboardList className="w-3.5 h-3.5 text-lime-500" />
            <span>Placements ({placementCount})</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigateToMarcom("mous", outlet.name);
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors shadow-2xs cursor-pointer"
            title={`Buka daftar MoU untuk ${outlet.name}`}
          >
            <FileText className="w-3.5 h-3.5 text-amber-500" />
            <span>MoUs ({mouCount})</span>
          </button>
        </div>

        {canAddOutlet && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEditOutlet(outlet);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-2xs cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5 text-orange-600" />
            <span>Edit Outlet</span>
          </button>
        )}
      </div>
    </>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/views/OutletsView/outletRowHelpers.test.ts`
Expected: PASS with 9 tests passing.

- [ ] **Step 5: Commit changes**

```bash
git add src/components/views/OutletsView/OutletExpandedRow.tsx src/components/views/OutletsView/outletRowHelpers.test.ts
git commit -m "feat(outlets): extract OutletExpandedRow with Tier & Brand card and MoUs navigation button"
```

---

### Task 3: Integrate `OutletExpandedRow` & Interactive MoU Column into `OutletsView.tsx`

**Files:**
- Modify: `src/components/views/OutletsView/OutletsView.tsx:249-271`
- Modify: `src/components/views/OutletsView/OutletsView.tsx:613-705`

**Interfaces:**
- Consumes:
  - `OutletExpandedRow` from `./OutletExpandedRow`
  - `navigateToMarcom` from `useWorkspaceStore`
- Produces: Updated `OutletsView` with interactive MoU column and decomposed expanded row

- [ ] **Step 1: Write integration test for `OutletsView.tsx` wiring**

Add to `src/components/views/OutletsView/outletRowHelpers.test.ts`:
```ts
describe("OutletsView integration contracts", () => {
  const outletsViewPath = path.resolve(
    process.cwd(),
    "src/components/views/OutletsView/OutletsView.tsx",
  );

  it("wires interactive button in MoU Status column", () => {
    const content = fs.readFileSync(outletsViewPath, "utf-8");
    assert.ok(
      content.includes('navigateToMarcom("mous", row.original.name)'),
      "MoU Status table cell must navigate to mous on click",
    );
  });

  it("uses OutletExpandedRow component in renderExpanded", () => {
    const content = fs.readFileSync(outletsViewPath, "utf-8");
    assert.ok(
      content.includes("<OutletExpandedRow"),
      "OutletsView must delegate renderExpanded to OutletExpandedRow",
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/views/OutletsView/outletRowHelpers.test.ts`
Expected: FAIL because `OutletsView.tsx` has not been updated yet.

- [ ] **Step 3: Update `OutletsView.tsx`**

1. Import `OutletExpandedRow`:
```tsx
import { OutletExpandedRow } from "./OutletExpandedRow";
```

2. Make the `mou` column interactive when `mouCount > 0`:
```tsx
        columnHelper.display({
          id: "mou",
          header: "MoU Status",
          size: 130,
          minSize: 100,
          enableSorting: false,
          cell: ({ row }) => {
            const mouCount = row.original.mouCount ?? 0;
            if (mouCount > 0) {
              return (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateToMarcom("mous", row.original.name);
                  }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors cursor-pointer"
                  title={`Lihat ${mouCount} MoU untuk ${row.original.name}`}
                >
                  <FileText className="w-3 h-3 text-amber-500" />
                  <span>{mouCount} MoU Aktif</span>
                </button>
              );
            }
            return (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-500/10 text-slate-400">
                Belum ada MoU
              </span>
            );
          },
        }),
```

3. Replace the inline `renderExpanded` with:
```tsx
            renderExpanded={(outlet) => (
              <OutletExpandedRow
                outlet={outlet}
                canAddOutlet={canAddOutlet}
                onOpenDrawer={(id) => setSelectedOutletIdForDrawer(id)}
                onSelectBranch={(branchId) => setSelectedBranchId(branchId)}
                onEditOutlet={(o) => setModalOutlet(o)}
                navigateToMarcom={navigateToMarcom}
              />
            )}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/views/OutletsView/outletRowHelpers.test.ts`
Expected: PASS with 11 tests passing.

- [ ] **Step 5: Run full test suite and TypeScript check**

Run: `npm test`
Expected: PASS with 0 failures across the whole test suite.

- [ ] **Step 6: Commit changes**

```bash
git add src/components/views/OutletsView/OutletsView.tsx src/components/views/OutletsView/outletRowHelpers.test.ts
git commit -m "refactor(outlets): wire interactive MoU column and decompose renderExpanded into OutletExpandedRow"
```

---

## Plan Self-Review Checklist
- [x] **Spec coverage**:
  - Replaces redundant "Status MoU" text with "Tier & Brand" $\rightarrow$ Task 1 & Task 2.
  - Adds direct MoU navigation button $\rightarrow$ Task 2 & Task 3.
  - Makes table column badge interactive $\rightarrow$ Task 3.
  - Maintains code health with modular extraction $\rightarrow$ Task 2.
- [x] **No Placeholders**: Zero instances of "TODO", "TBD", or unwritten code blocks.
- [x] **Type consistency**: Verified all entities against `@/types` (`MarcomOutlet`, `OutletTier`, `Brand`, `ViewMode`).
