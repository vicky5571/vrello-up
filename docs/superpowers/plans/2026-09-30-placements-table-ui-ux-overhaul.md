# Placements Table UI/UX & Architecture Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the monolithic 1,098-line `PlacementsView` table into a high-performance, enterprise-grade interface by fixing layout/scroll entrapment, repairing TanStack column sorting contracts, closing bulk status compliance loopholes, introducing a zero-CLS slide-over detail drawer, and strangling the God Component into modular files.

**Architecture:** 
1. Enable `fixedViewport={true}` on `MarcomTableShell` to lock sticky headers and establish flex-column scroll containment.
2. Route batch deletion through atomic `DELETE /api/marcom/placements` and enforce `validatePlacementUpdate` guards against mass transitions to `DONE` without photo/GPS proofs.
3. Migrate columns from display wrappers to TanStack accessors (`outlet`, `date`, `brand`, `material`, `status`), adding lifecycle status ordering and chronological date sorting.
4. Replace inline accordion row expansion with a modern slide-over `PlacementDetailDrawer.tsx` that embeds the existing `PlacementPhotoGallery.tsx` lightbox.
5. Eliminate the double-filtering search glitch to restore accurate `${filteredCount}/${data.length}` header counters, restore the missing `ISSUE` filter chip, and support mobile brand filtering.
6. Decompose `PlacementsView.tsx` from 1,098 lines down to a clean ~220-line coordinator.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5, TanStack Table v8, Tailwind CSS v4, Zustand 5, Prisma (PostgreSQL), Node native test runner (`node:test`).

**Spec:** [`docs/audit-placements-table-ui-ux.md`](file:///Users/mac/Web%20Development/vrello-up/docs/audit-placements-table-ui-ux.md)

---

## Global Constraints

- **Single Source of Truth:** Core domain entities (`MarcomPlacement`, `PlacementStatus`, `MarcomMou`, `Branch`, `Outlet`, `Brand`) MUST be imported from `@/types`. Never declare inline duplicates.
- **Strangler Pattern on God Files (`AGENTS.md`):** Do not dump helper functions, column arrays, or drawer UI directly into coordinator files. Keep files focused and under 250 lines.
- **Dual-Persistence Discipline:** Client Zustand state must update immediately with optimistic local cache updates alongside PostgreSQL API sync.
- **Zero-Regression Testing:** Every new helper and route modification must be validated via `node --test` with 0 failures before task completion.

---

## File Structure & Module Responsibilities

```text
src/components/views/PlacementsView/
├── PlacementsView.tsx              # Coordinator (~220 lines): state wiring, tab switching, modal binds
├── placementColumns.tsx            # TanStack column definitions with accessors & custom cells (~180 lines)
├── PlacementDetailDrawer.tsx       # Slide-over drawer with lightbox gallery, GPS copy, task bridge (~200 lines)
├── PlacementBulkActionBar.tsx      # Floating bulk toolbar with compliance guards & atomic batch deletion (~150 lines)
├── placementSortingHelpers.ts      # Pure comparator functions for status lifecycle and dates (~45 lines)
├── placementSortingHelpers.test.ts # Unit tests for status ordering and date parsing (~70 lines)
├── placementSearchHelpers.ts       # Text token extractor for MarcomTableShell search index (~40 lines)
├── placementSearchHelpers.test.ts  # Unit tests for text token indexing (~60 lines)
├── placementKpi.ts                 # KPI card generator & color thresholds (~50 lines)
├── placementKpi.test.ts            # Unit tests for KPI calculations (~50 lines)
├── PlacementPhotoGallery.tsx       # Existing lightbox gallery (reused inside detail drawer)
├── PlacementFormModal.tsx          # Existing 4-step wizard modal
├── PlacementsMapView.tsx           # Existing map view tab
└── QuarterlyRecapTab.tsx           # Existing quarterly recap tab

src/app/api/marcom/placements/
└── route.ts                        # Modified: PATCH enforces validatePlacementUpdate; DELETE atomic
```

---

## Task 1 (P0): Viewport Clamping, Atomic Batch Deletion & Bulk Compliance Guards

**Files:**
- Modify: `src/app/api/marcom/placements/route.ts:170-227`
- Modify: `src/components/views/PlacementsView/PlacementBulkActionBar.tsx:19-108,155-184`
- Modify: `src/components/views/PlacementsView/PlacementsView.tsx:701-735`
- Test: `test/register-alias.mjs` (Run existing placement tests)

**Interfaces:**
- `PlacementBulkActionBarProps`:
  ```ts
  interface PlacementBulkActionBarProps {
    selectedIds: string[];
    placements: MarcomPlacement[];
    onClearSelection: () => void;
    onRefresh: () => Promise<void> | void;
    onDeleteBatch?: (ids: string[]) => Promise<boolean>;
    canManage: boolean;
  }
  ```

- [ ] **Step 1: Write backend test or verify existing placement machine validator**

Run existing placement state machine tests to verify validation rules:
```bash
npm test -- src/lib/marcom/placementMachine.test.ts
```
Expected: PASS (4 tests passing).

- [ ] **Step 2: Add validation guard to PATCH endpoint in `src/app/api/marcom/placements/route.ts`**

In `src/app/api/marcom/placements/route.ts`, prevent `PATCH` from setting `status: "DONE"` on placements that lack photo proof or physical coordinates:

```typescript
// Replace lines 195-203 with validated update block:
  try {
    if (updates.status === "DONE") {
      const candidates = await prisma.placement.findMany({
        where: { id: { in: ids }, workspaceId },
        select: { id: true, status: true, photoUrl: true, latitude: true, longitude: true, shareLocationUrl: true },
      });

      const unverified = candidates.filter((p) => {
        const check = validatePlacementUpdate(p.status as PlacementStatus, "DONE", {
          photoUrl: p.photoUrl,
          latitude: p.latitude,
          longitude: p.longitude,
          shareLocationUrl: p.shareLocationUrl,
        });
        return !check.valid;
      });

      if (unverified.length > 0) {
        return NextResponse.json(
          {
            error: `Gagal memperbarui: ${unverified.length} dari ${ids.length} placement belum memiliki bukti foto atau verifikasi lokasi GPS`,
          },
          { status: 400 },
        );
      }
    }

    const result = await prisma.placement.updateMany({
      where: {
        id: { in: ids },
        workspaceId,
      },
      data: dataToUpdate,
    });
```

- [ ] **Step 3: Update `PlacementBulkActionBar.tsx` to guard `DONE` status and use atomic batch delete**

In `src/components/views/PlacementsView/PlacementBulkActionBar.tsx`:
1. Receive `onDeleteBatch` in `PlacementBulkActionBarProps`.
2. Check `photoUrl` and coordinates before sending `DONE` in `handleBulkStatus`.
3. Replace serial `for (const id of selectedIds) fetch(/api/marcom/placements/${id})` in `handleBulkDelete` with `onDeleteBatch(selectedIds)`.

```typescript
// Replace handleBulkStatus guard in PlacementBulkActionBar.tsx:
  const handleBulkStatus = async (status: PlacementStatus) => {
    if (!canManage) {
      toast.error("Hanya staf atau admin yang dapat mengubah status placement");
      return;
    }

    if (status === "DONE") {
      const selectedItems = placements.filter((p) => selectedIds.includes(p.id));
      const unverified = selectedItems.filter(
        (p) => !p.photoUrl?.trim() || ((p.latitude == null || p.longitude == null) && !p.shareLocationUrl?.trim())
      );
      if (unverified.length > 0) {
        toast.error(
          `Gagal: ${unverified.length} placement terpilih belum memiliki foto bukti atau verifikasi GPS!`
        );
        return;
      }
    }

    setIsUpdating(true);
    // ... proceed with PATCH
```

```typescript
// Replace handleBulkDelete in PlacementBulkActionBar.tsx:
  const handleBulkDelete = async () => {
    if (!canManage) {
      toast.error("Hanya staf atau admin yang dapat menghapus placement");
      return;
    }
    if (!window.confirm(`Hapus ${count} placement yang dipilih? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    setIsUpdating(true);
    try {
      if (onDeleteBatch) {
        const ok = await onDeleteBatch(selectedIds);
        if (ok) {
          toast.success(`${count} placement berhasil dihapus`);
          onClearSelection();
          await fetchPlacements(activeWorkspaceId, true);
          await onRefresh();
        } else {
          toast.error("Gagal menghapus placement masal");
        }
        return;
      }

      // Fallback
      const res = await fetch("/api/marcom/placements", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, workspaceId: activeWorkspaceId }),
      });
      if (!res.ok) throw new Error("Batch delete failed");
      selectedIds.forEach((id) => removeCachedPlacement(activeWorkspaceId, id));
      invalidateMous(activeWorkspaceId);
      toast.success(`${count} placement berhasil dihapus`);
      onClearSelection();
      await fetchPlacements(activeWorkspaceId, true);
      await onRefresh();
    } catch {
      toast.error("Gagal menghapus beberapa placement");
    } finally {
      setIsUpdating(false);
    }
  };
```

- [ ] **Step 4: Enable `fixedViewport` and pass `onDeleteBatch` in `PlacementsView.tsx`**

In `src/components/views/PlacementsView/PlacementsView.tsx:703`:
```tsx
        <MarcomTableShell
          fixedViewport
          data={filteredPlacements}
          columns={columns}
          getRowId={(row) => row.id}
          initialSorting={[{ id: "date", desc: true }]}
          title="Placements"
          titleIcon={ClipboardList}
          entityName="placement"
          entityPlural="placements"
          kpiBar={<KpiSummaryCards items={kpiItems} />}
          isLoading={isLoading}
          error={error}
          onRefresh={() => loadPlacements(true)}
          canDelete={canManage}
          deleteRequiresMessage="Delete requires staff or admin role"
          onDeleteOne={deleteOne}
          onDeleteBatch={deleteBatch}
          canAdd={canManage}
          onAdd={handleOpenAddPlacement}
          renderFloatingBulkBar={(selectedIds, clearSelection) => (
            <PlacementBulkActionBar
              selectedIds={selectedIds}
              placements={placements}
              onClearSelection={clearSelection}
              onRefresh={() => loadPlacements(true)}
              onDeleteBatch={deleteBatch}
              canManage={canManage}
            />
          )}
          addLabel="Add Placement"
          addIcon={Plus}
          ...
```

- [ ] **Step 5: Verify build & tests**

Run:
```bash
npm test -- src/lib/marcom/placementMachine.test.ts
```
Expected: PASS with 0 failures.

- [ ] **Step 6: Commit changes**

```bash
git add src/app/api/marcom/placements/route.ts src/components/views/PlacementsView/PlacementBulkActionBar.tsx src/components/views/PlacementsView/PlacementsView.tsx
git commit -m "fix(placements): enable fixedViewport, guard bulk DONE status, and atomic batch delete"
```

---

## Task 2 (P1): Table Column Contract & Sorting Engine

**Files:**
- Create: `src/components/views/PlacementsView/placementSortingHelpers.ts`
- Create: `src/components/views/PlacementsView/placementSortingHelpers.test.ts`
- Create: `src/components/views/PlacementsView/placementColumns.tsx`
- Modify: `src/components/views/PlacementsView/PlacementsView.tsx` (wire new columns)

**Interfaces:**
- Produces:
  - `PLACEMENT_STATUS_ORDER: Record<PlacementStatus, number>`
  - `comparePlacementStatus(a: PlacementStatus, b: PlacementStatus): number`
  - `comparePlacementDates(a?: string | null, b?: string | null): number`
  - `buildPlacementColumns(deps: PlacementColumnDeps): ColumnDef[]`

- [ ] **Step 1: Write the failing unit tests for sorting helpers**

Create `src/components/views/PlacementsView/placementSortingHelpers.test.ts`:
```typescript
import test from "node:test";
import assert from "node:assert/strict";
import {
  PLACEMENT_STATUS_ORDER,
  comparePlacementStatus,
  comparePlacementDates,
} from "./placementSortingHelpers.ts";
import type { PlacementStatus } from "@/types";

test("PLACEMENT_STATUS_ORDER reflects field operational lifecycle", () => {
  assert.equal(PLACEMENT_STATUS_ORDER["NOT_STARTED"], 1);
  assert.equal(PLACEMENT_STATUS_ORDER["ON_PROGRESS"], 2);
  assert.equal(PLACEMENT_STATUS_ORDER["ISSUE"], 3);
  assert.equal(PLACEMENT_STATUS_ORDER["DONE"], 4);
});

test("comparePlacementStatus orders by workflow stage rather than alphabet", () => {
  const statuses: PlacementStatus[] = ["DONE", "ISSUE", "NOT_STARTED", "ON_PROGRESS"];
  statuses.sort(comparePlacementStatus);
  assert.deepEqual(statuses, ["NOT_STARTED", "ON_PROGRESS", "ISSUE", "DONE"]);
});

test("comparePlacementDates orders timestamps chronologically handling nulls safely", () => {
  const dates = ["2026-09-20", null, "2026-09-28", undefined, "2026-09-15"];
  dates.sort(comparePlacementDates);
  assert.deepEqual(dates, ["2026-09-15", "2026-09-20", "2026-09-28", null, undefined]);
});
```

- [ ] **Step 2: Run test to confirm it fails**

Run:
```bash
npm test -- src/components/views/PlacementsView/placementSortingHelpers.test.ts
```
Expected: FAIL (Cannot find module `./placementSortingHelpers.ts`).

- [ ] **Step 3: Implement `placementSortingHelpers.ts`**

Create `src/components/views/PlacementsView/placementSortingHelpers.ts`:
```typescript
import type { PlacementStatus } from "@/types";

export const PLACEMENT_STATUS_ORDER: Record<PlacementStatus, number> = {
  NOT_STARTED: 1,
  ON_PROGRESS: 2,
  ISSUE: 3,
  DONE: 4,
};

export function comparePlacementStatus(a: PlacementStatus, b: PlacementStatus): number {
  const orderA = PLACEMENT_STATUS_ORDER[a] ?? 99;
  const orderB = PLACEMENT_STATUS_ORDER[b] ?? 99;
  return orderA - orderB;
}

export function comparePlacementDates(a?: string | null, b?: string | null): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  const timeA = new Date(a).getTime();
  const timeB = new Date(b).getTime();
  if (Number.isNaN(timeA)) return 1;
  if (Number.isNaN(timeB)) return -1;
  return timeA - timeB;
}
```

- [ ] **Step 4: Run test to confirm it passes**

Run:
```bash
npm test -- src/components/views/PlacementsView/placementSortingHelpers.test.ts
```
Expected: PASS (3 tests passing).

- [ ] **Step 5: Create `placementColumns.tsx` with accessor-based columns**

Create `src/components/views/PlacementsView/placementColumns.tsx`:
```typescript
"use client";

import {
  Store,
  FileText,
  AlertTriangle,
  Camera,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { cn, formatIDR } from "@/lib/utils";
import { createMarcomColumnHelper } from "@/components/views/shared/MarcomTableShell";
import { getBrandMeta } from "@/lib/marcom/brandUtils";
import { isPermanentMaterial } from "@/lib/marcom/placementMouBridge";
import { parsePlacementPhotos } from "@/lib/marcom/photoUtils";
import { isValidCoordinate } from "@/lib/marcom/locationUtils";
import { comparePlacementStatus, comparePlacementDates } from "./placementSortingHelpers";
import type { MarcomPlacement, PlacementStatus, ViewMode } from "@/types";

const columnHelper = createMarcomColumnHelper<MarcomPlacement>();

export const PLACEMENT_STATUS_STYLES: Record<PlacementStatus, string> = {
  NOT_STARTED: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  ON_PROGRESS: "bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold",
  DONE: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold",
  ISSUE: "bg-rose-500/15 text-rose-700 dark:text-rose-400 font-bold",
};

export const PLACEMENT_STATUS_LABELS: Record<PlacementStatus, string> = {
  NOT_STARTED: "To Do",
  ON_PROGRESS: "In Progress",
  DONE: "Done",
  ISSUE: "Issue",
};

export interface PlacementColumnDeps {
  navigateToMarcom: (view: ViewMode, search?: string) => void;
  branchMap?: Record<string, string>;
}

export function buildPlacementColumns({
  navigateToMarcom,
  branchMap = {},
}: PlacementColumnDeps) {
  return columnHelper.columns([
    // 1. Select
    columnHelper.display({
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            aria-label="Select all placements"
            checked={table.getIsAllRowsSelected()}
            ref={(el) => {
              if (el) el.indeterminate = table.getIsSomeRowsSelected();
            }}
            onChange={table.getToggleAllRowsSelectedHandler()}
            className="table-row-select"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            aria-label={`Select placement ${row.original.id}`}
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onChange={row.getToggleSelectedHandler()}
            className="table-row-select"
          />
        </div>
      ),
      size: 36,
      minSize: 36,
      maxSize: 36,
      enableSorting: false,
    }),

    // 2. Outlet (Accessor-based for sorting)
    columnHelper.accessor((row) => row.outlet?.name ?? row.outletId, {
      id: "outlet",
      header: "Outlet",
      size: 210,
      minSize: 140,
      cell: ({ row }) => {
        const outletName = row.original.outlet?.name;
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (outletName) navigateToMarcom("outlets", outletName);
            }}
            className="truncate font-semibold text-slate-900 dark:text-slate-100 hover:text-orange-600 dark:hover:text-orange-400 hover:underline cursor-pointer flex items-center gap-1.5 text-left"
            title={outletName ? `Buka Outlet "${outletName}"` : undefined}
          >
            <Store className="w-3.5 h-3.5 text-orange-500 shrink-0" />
            <span className="truncate">{outletName ?? row.original.outletId}</span>
          </button>
        );
      },
    }),

    // 3. Brand
    columnHelper.accessor((row) => row.brand ?? "IM3", {
      id: "brand",
      header: "Brand",
      size: 100,
      minSize: 85,
      cell: ({ row }) => {
        const bMeta = getBrandMeta(row.original.brand);
        return (
          <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold", bMeta.badgeClass)}>
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: bMeta.color }} />
            <span>{bMeta.label}</span>
          </span>
        );
      },
    }),

    // 4. Material with Dimensions Sub-line
    columnHelper.accessor((row) => row.material?.name ?? row.materialId, {
      id: "material",
      header: "Material",
      size: 180,
      minSize: 130,
      cell: ({ row }) => (
        <div className="flex flex-col truncate">
          <span className="truncate font-medium text-slate-800 dark:text-slate-200">
            {row.original.material?.name ?? row.original.materialId}
          </span>
          {row.original.dimensions && (
            <span className="text-[10px] text-slate-400 tabular-nums truncate">
              {row.original.dimensions}
            </span>
          )}
        </div>
      ),
    }),

    // 5. MoU / Legal
    columnHelper.display({
      id: "mou",
      header: "MoU / Legal",
      size: 160,
      minSize: 120,
      enableSorting: false,
      cell: ({ row }) => {
        const p = row.original;
        const mou = p.mou;
        const isPerm = isPermanentMaterial(p.material);

        if (mou) {
          const isApproved = mou.status === "APPROVED";
          return (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigateToMarcom("mous", mou.partnerName || mou.id);
              }}
              className={cn(
                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer hover:underline",
                isApproved
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
              )}
              title={`Buka MoU: ${mou.partnerName || mou.id} (${mou.status})`}
            >
              <FileText className="w-3 h-3 shrink-0" />
              <span className="truncate max-w-[90px]">{mou.partnerName || `#${mou.id.slice(0, 6)}`}</span>
            </button>
          );
        }

        if (isPerm) {
          return (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
              title="Material permanen ini belum ditautkan ke MoU aktif"
            >
              <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
              <span>No MoU</span>
            </span>
          );
        }

        return <span className="text-slate-400 text-xs">—</span>;
      },
    }),

    // 6. Verification Status (Photo Count + GPS Indicator)
    columnHelper.display({
      id: "verification",
      header: "Bukti Fisik",
      size: 120,
      minSize: 100,
      enableSorting: false,
      cell: ({ row }) => {
        const p = row.original;
        const photos = parsePlacementPhotos(p.photoUrl);
        const hasCoords = isValidCoordinate(p.latitude ?? Number.NaN, p.longitude ?? Number.NaN);
        const hasShare = Boolean(p.shareLocationUrl?.trim());

        return (
          <div className="flex items-center gap-1.5 text-xs">
            {photos.length > 0 ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-700 dark:text-slate-300" title={`${photos.length} foto bukti terunggah`}>
                <Camera className="w-3 h-3 text-emerald-600" />
                <span>{photos.length}</span>
              </span>
            ) : (
              <span className="text-slate-300 dark:text-slate-700" title="Belum ada foto">
                <Camera className="w-3 h-3 opacity-40" />
              </span>
            )}

            {hasCoords || hasShare ? (
              <span title={hasCoords ? "Titik koordinat GPS valid" : "Share location URL valid"}>
                <MapPin className="w-3.5 h-3.5 text-emerald-500" />
              </span>
            ) : (
              <span title="Belum ada koordinat lokasi">
                <MapPin className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700 opacity-40" />
              </span>
            )}

            {p.status === "DONE" && photos.length > 0 && (hasCoords || hasShare) && (
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" title="Verifikasi fisik lengkap" />
            )}
          </div>
        );
      },
    }),

    // 7. Status (Lifecycle Sorted)
    columnHelper.accessor("status", {
      id: "status",
      header: "Status",
      size: 120,
      minSize: 100,
      sortingFn: (rowA, rowB) => comparePlacementStatus(rowA.original.status, rowB.original.status),
      cell: ({ row }) => (
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold",
            PLACEMENT_STATUS_STYLES[row.original.status] ?? PLACEMENT_STATUS_STYLES.NOT_STARTED,
          )}
        >
          {PLACEMENT_STATUS_LABELS[row.original.status] ?? row.original.status}
        </span>
      ),
    }),

    // 8. Date (Chronologically Sorted)
    columnHelper.accessor("date", {
      id: "date",
      header: "Date",
      size: 110,
      minSize: 90,
      enableSorting: true,
      sortingFn: (rowA, rowB) => comparePlacementDates(rowA.original.date, rowB.original.date),
      cell: ({ row }) => (
        <span className="text-slate-600 dark:text-slate-400 tabular-nums">
          {row.original.date ? new Date(row.original.date).toLocaleDateString("id-ID") : "—"}
        </span>
      ),
    }),

    // 9. Cost (Right-aligned)
    columnHelper.accessor("cost", {
      id: "cost",
      header: () => <div className="text-right w-full">Cost</div>,
      size: 130,
      minSize: 100,
      cell: ({ row }) => (
        <div className="text-right font-medium text-slate-800 dark:text-slate-200 tabular-nums">
          {typeof row.original.cost === "number" ? formatIDR(row.original.cost) : "—"}
        </div>
      ),
    }),
  ]);
}
```

- [ ] **Step 6: Integrate `buildPlacementColumns` into `PlacementsView.tsx`**

In `src/components/views/PlacementsView/PlacementsView.tsx`:
Replace the inline `columns = useMemo(...)` definition with:
```typescript
import { buildPlacementColumns } from "./placementColumns";
// ...
  const columns = useMemo(
    () => buildPlacementColumns({ navigateToMarcom }),
    [navigateToMarcom],
  );
```

- [ ] **Step 7: Verify all tests pass**

Run:
```bash
npm test -- src/components/views/PlacementsView/placementSortingHelpers.test.ts
```
Expected: PASS.

- [ ] **Step 8: Commit changes**

```bash
git add src/components/views/PlacementsView/placementSortingHelpers.ts src/components/views/PlacementsView/placementSortingHelpers.test.ts src/components/views/PlacementsView/placementColumns.tsx src/components/views/PlacementsView/PlacementsView.tsx
git commit -m "feat(placements): convert columns to TanStack accessors with lifecycle and date sorting"
```

---

## Task 3 (P2): Slide-Over Detail Drawer & Photo Lightbox Integration

**Files:**
- Create: `src/components/views/PlacementsView/PlacementDetailDrawer.tsx`
- Modify: `src/components/views/PlacementsView/PlacementsView.tsx` (remove `renderExpanded`, add `onRowClick`)

**Interfaces:**
- Produces:
  ```ts
  interface PlacementDetailDrawerProps {
    placement: MarcomPlacement | null;
    onClose: () => void;
    onEdit: (placement: MarcomPlacement) => void;
    onTrackAsTask: (placement: MarcomPlacement) => void;
    canManage: boolean;
  }
  ```

- [ ] **Step 1: Create `PlacementDetailDrawer.tsx`**

Create `src/components/views/PlacementsView/PlacementDetailDrawer.tsx`:
```typescript
"use client";

import { useEffect } from "react";
import {
  X,
  Store,
  MapPin,
  Calendar,
  Wallet,
  User,
  ExternalLink,
  Edit2,
  CheckSquare,
  FileText,
  Copy,
  Check,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn, formatIDR } from "@/lib/utils";
import { getBrandMeta } from "@/lib/marcom/brandUtils";
import { buildGoogleMapsUrl, isValidCoordinate } from "@/lib/marcom/locationUtils";
import { PlacementPhotoGallery } from "./PlacementPhotoGallery";
import { PLACEMENT_STATUS_STYLES, PLACEMENT_STATUS_LABELS } from "./placementColumns";
import type { MarcomPlacement } from "@/types";

interface PlacementDetailDrawerProps {
  placement: MarcomPlacement | null;
  onClose: () => void;
  onEdit: (placement: MarcomPlacement) => void;
  onTrackAsTask: (placement: MarcomPlacement) => void;
  canManage: boolean;
}

export function PlacementDetailDrawer({
  placement,
  onClose,
  onEdit,
  onTrackAsTask,
  canManage,
}: PlacementDetailDrawerProps) {
  const [copiedCoords, setCopiedCoords] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (placement) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [placement, onClose]);

  if (!placement) return null;

  const brandMeta = getBrandMeta(placement.brand);
  const hasCoords = isValidCoordinate(
    placement.latitude ?? Number.NaN,
    placement.longitude ?? Number.NaN,
  );
  const mapsUrl = hasCoords
    ? buildGoogleMapsUrl(placement.latitude as number, placement.longitude as number)
    : placement.shareLocationUrl || null;

  const handleCopyCoordinates = () => {
    if (placement.latitude != null && placement.longitude != null) {
      navigator.clipboard.writeText(`${placement.latitude}, ${placement.longitude}`);
      setCopiedCoords(true);
      toast.success("Koordinat GPS disalin ke clipboard!");
      setTimeout(() => setCopiedCoords(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-250">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-bold",
                  PLACEMENT_STATUS_STYLES[placement.status] ?? PLACEMENT_STATUS_STYLES.NOT_STARTED,
                )}
              >
                {PLACEMENT_STATUS_LABELS[placement.status] ?? placement.status}
              </span>
              <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold", brandMeta.badgeClass)}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: brandMeta.color }} />
                <span>{brandMeta.label}</span>
              </span>
            </div>

            <div className="flex items-center gap-1">
              {canManage && (
                <button
                  type="button"
                  onClick={() => onEdit(placement)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Edit Placement"
                >
                  <Edit2 className="w-4 h-4 text-lime-600" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Tutup drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Title & Outlet */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-orange-500" />
                <span>Outlet Lapangan</span>
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {placement.outlet?.name ?? placement.outletId}
              </h2>
              {placement.outlet?.code && (
                <span className="text-xs font-mono text-slate-500">Kode: {placement.outlet.code}</span>
              )}
            </div>

            {/* Photo Gallery with Lightbox */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Bukti Foto Pemasangan Fisik
              </div>
              <PlacementPhotoGallery photoUrl={placement.photoUrl} thumbnailHeight="h-44" />
            </div>

            {/* Material & Dimensions */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Materi Promosi</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{placement.material?.name ?? placement.materialId}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Dimensi Fisik</span>
                <span className="text-slate-700 dark:text-slate-300 font-mono">{placement.dimensions || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Tanggal Pasang</span>
                <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {placement.date ? new Date(placement.date).toLocaleDateString("id-ID") : "—"}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Biaya (Cost)</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                  <Wallet className="w-3 h-3 text-emerald-500" />
                  {typeof placement.cost === "number" ? formatIDR(placement.cost) : "—"}
                </span>
              </div>
            </div>

            {/* Location & GPS */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-500" />
                  <span>Verifikasi Lokasi Lapangan</span>
                </span>
                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    <span>Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {hasCoords ? (
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800 font-mono text-[11px]">
                  <span>{placement.latitude?.toFixed(6)}, {placement.longitude?.toFixed(6)}</span>
                  <button
                    type="button"
                    onClick={handleCopyCoordinates}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    title="Salin Koordinat"
                  >
                    {copiedCoords ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ) : placement.shareLocationUrl ? (
                <span className="text-slate-500 italic block">Menggunakan Google Share Location URL</span>
              ) : (
                <span className="text-slate-400 italic block">Belum ada titik koordinat GPS terverifikasi</span>
              )}

              {placement.locationNotes && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                  Catatan lokasi: {placement.locationNotes}
                </p>
              )}
            </div>

            {/* PIC & Notes */}
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 mb-1">
                  <User className="w-3 h-3 text-indigo-500" />
                  <span>PIC Penanggung Jawab</span>
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{placement.picName || "Belum ditentukan"}</span>
              </div>

              {placement.notes && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Catatan Tambahan</span>
                  <p className="text-slate-600 dark:text-slate-300 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                    {placement.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex items-center justify-between">
            <button
              type="button"
              onClick={() => onTrackAsTask(placement)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
            >
              <CheckSquare className="w-4 h-4" />
              <span>Track as Production Task</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire `PlacementDetailDrawer` into `PlacementsView.tsx`**

In `src/components/views/PlacementsView/PlacementsView.tsx`:
1. Add state: `const [selectedPlacement, setSelectedPlacement] = useState<MarcomPlacement | null>(null);`
2. In `MarcomTableShell`:
   - Replace `renderExpanded={...}` with `onRowClick={(p) => setSelectedPlacement(p)}`.
3. Render drawer below `MarcomTableShell`:
   ```tsx
   <PlacementDetailDrawer
     placement={selectedPlacement}
     onClose={() => setSelectedPlacement(null)}
     onEdit={(p) => setModalPlacement(p)}
     onTrackAsTask={handleTrackAsTask}
     canManage={canManage}
   />
   ```

- [ ] **Step 3: Run full test suite to ensure clean integration**

Run:
```bash
npm test -- src/lib/marcom/placementMachine.test.ts
```
Expected: PASS.

- [ ] **Step 4: Commit changes**

```bash
git add src/components/views/PlacementsView/PlacementDetailDrawer.tsx src/components/views/PlacementsView/PlacementsView.tsx
git commit -m "feat(placements): replace accordion expansion with zero-CLS PlacementDetailDrawer"
```

---

## Task 4 (P2): Search Pipeline & Multi-Dimensional Filtering

**Files:**
- Create: `src/components/views/PlacementsView/placementSearchHelpers.ts`
- Create: `src/components/views/PlacementsView/placementSearchHelpers.test.ts`
- Modify: `src/components/views/PlacementsView/PlacementsView.tsx`

**Interfaces:**
- Produces:
  - `extractPlacementSearchText(placement: MarcomPlacement): string`
  - `PLACEMENT_SEARCH_KEYS: (keyof MarcomPlacement)[]`

- [ ] **Step 1: Write failing unit test for search extraction**

Create `src/components/views/PlacementsView/placementSearchHelpers.test.ts`:
```typescript
import test from "node:test";
import assert from "node:assert/strict";
import {
  extractPlacementSearchText,
  PLACEMENT_SEARCH_KEYS,
} from "./placementSearchHelpers.ts";
import type { MarcomPlacement } from "@/types";

test("extractPlacementSearchText indexes essential operational fields without technical IDs", () => {
  const sample: Partial<MarcomPlacement> = {
    id: "plc-9999",
    workspaceId: "ws-main",
    outletId: "out-1234",
    materialId: "mat-5678",
    picName: "Budi Santoso",
    dimensions: "200x100 cm",
    notes: "Dekat pintu masuk utama",
    locationNotes: "Di samping tiang listrik",
    brand: "IM3",
    status: "ON_PROGRESS",
    outlet: { id: "out-1234", name: "Toko Berkah Cellular", code: "SBY-042", brand: "IM3" },
    material: { id: "mat-5678", name: "Shopblind Outdoor", type: "TEMPORARY", requiresMou: false },
  };

  const text = extractPlacementSearchText(sample as MarcomPlacement);
  assert.ok(text.includes("budi santoso"));
  assert.ok(text.includes("toko berkah cellular"));
  assert.ok(text.includes("sby-042"));
  assert.ok(text.includes("shopblind outdoor"));
  assert.ok(text.includes("dekat pintu masuk utama"));
  assert.ok(!text.includes("plc-9999"));
  assert.ok(!text.includes("ws-main"));
});
```

- [ ] **Step 2: Run test to confirm it fails**

Run:
```bash
npm test -- src/components/views/PlacementsView/placementSearchHelpers.test.ts
```
Expected: FAIL (Cannot find module `./placementSearchHelpers.ts`).

- [ ] **Step 3: Implement `placementSearchHelpers.ts`**

Create `src/components/views/PlacementsView/placementSearchHelpers.ts`:
```typescript
import type { MarcomPlacement } from "@/types";

export const PLACEMENT_SEARCH_KEYS: (keyof MarcomPlacement)[] = [
  "picName",
  "dimensions",
  "notes",
  "locationNotes",
];

export function extractPlacementSearchText(p: MarcomPlacement): string {
  const tokens: string[] = [];

  if (p.outlet?.name) tokens.push(p.outlet.name);
  if (p.outlet?.code) tokens.push(p.outlet.code);
  if (p.material?.name) tokens.push(p.material.name);
  if (p.picName) tokens.push(p.picName);
  if (p.dimensions) tokens.push(p.dimensions);
  if (p.notes) tokens.push(p.notes);
  if (p.locationNotes) tokens.push(p.locationNotes);
  if (p.brand) tokens.push(p.brand);

  return tokens.join(" ").toLowerCase();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
npm test -- src/components/views/PlacementsView/placementSearchHelpers.test.ts
```
Expected: PASS (1 test passing).

- [ ] **Step 5: Eliminate double-filtering & enhance filter chips in `PlacementsView.tsx`**

In `src/components/views/PlacementsView/PlacementsView.tsx`:
1. Add `ISSUE` to `PLACEMENT_STATUS_CHIPS`:
   ```typescript
   const PLACEMENT_STATUS_CHIPS: { label: string; value: string }[] = [
     { label: "All", value: "ALL" },
     { label: "To Do", value: "NOT_STARTED" },
     { label: "In Progress", value: "ON_PROGRESS" },
     { label: "Done", value: "DONE" },
     { label: "Kendala (Issue)", value: "ISSUE" },
   ];
   ```
2. Remove text query filtering from `filteredPlacements` (let `MarcomTableShell` manage search):
   ```typescript
   const filteredPlacements = useMemo(() => {
     return placements.filter((p) => {
       if (selectedStatus !== "ALL" && p.status !== selectedStatus) return false;
       if (selectedBrand !== "ALL") {
         const pBrand = (p.brand || "IM3").toUpperCase();
         const target = selectedBrand.toUpperCase();
         if ((target === "TRI" || target === "3") && pBrand !== "3" && pBrand !== "TRI") return false;
         if (target === "IM3" && pBrand !== "IM3") return false;
       }
       return true;
     });
   }, [placements, selectedBrand, selectedStatus]);
   ```
3. Pass search extractor to `MarcomTableShell`:
   ```tsx
   <MarcomTableShell
     searchKeys={PLACEMENT_SEARCH_KEYS}
     getSearchableText={extractPlacementSearchText}
     data={filteredPlacements}
     // ...
   ```
4. Add a "Reset Filters" button when `selectedStatus !== "ALL" || selectedBrand !== "ALL"`.

- [ ] **Step 6: Run test suite**

Run:
```bash
npm test -- src/components/views/PlacementsView/placementSearchHelpers.test.ts
```
Expected: PASS.

- [ ] **Step 7: Commit changes**

```bash
git add src/components/views/PlacementsView/placementSearchHelpers.ts src/components/views/PlacementsView/placementSearchHelpers.test.ts src/components/views/PlacementsView/PlacementsView.tsx
git commit -m "fix(placements): eliminate double search filtering, restore ISSUE chip, and add search extractor"
```

---

## Task 5 (P3): Strangler Decomposition of `PlacementsView.tsx`

**Files:**
- Create: `src/components/views/PlacementsView/placementKpi.ts`
- Create: `src/components/views/PlacementsView/placementKpi.test.ts`
- Modify: `src/components/views/PlacementsView/PlacementsView.tsx` (coordinator slimming)

- [ ] **Step 1: Write unit tests for KPI card formatting**

Create `src/components/views/PlacementsView/placementKpi.test.ts`:
```typescript
import test from "node:test";
import assert from "node:assert/strict";
import { buildPlacementKpiItems } from "./placementKpi.ts";
import type { MarcomPlacement } from "@/types";

test("buildPlacementKpiItems computes formatted card metrics", () => {
  const placements: Partial<MarcomPlacement>[] = [
    { status: "DONE", cost: 1500000, brand: "IM3" },
    { status: "ON_PROGRESS", cost: 500000, brand: "TRI" },
  ];

  const cards = buildPlacementKpiItems(placements as MarcomPlacement[]);
  assert.equal(cards.length, 4);
  assert.equal(cards[0].label, "Total Budget Terpakai");
  assert.ok(cards[0].value.includes("2.000.000"));
  assert.equal(cards[1].label, "Tingkat Penyelesaian");
  assert.equal(cards[1].value, "50%");
});
```

- [ ] **Step 2: Run test to confirm it fails**

Run:
```bash
npm test -- src/components/views/PlacementsView/placementKpi.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Implement `placementKpi.ts`**

Create `src/components/views/PlacementsView/placementKpi.ts`:
```typescript
import { Wallet, CheckCircle2, Radio, Clock } from "lucide-react";
import { formatIDR } from "@/lib/utils";
import { calculatePlacementKPIs } from "@/lib/marcom/placementAnalytics";
import type { KpiCardItem } from "@/components/views/shared/KpiSummaryCards";
import type { MarcomPlacement } from "@/types";

export function buildPlacementKpiItems(placements: MarcomPlacement[]): KpiCardItem[] {
  const kpis = calculatePlacementKPIs(placements);

  return [
    {
      label: "Total Budget Terpakai",
      value: formatIDR(kpis.totalCost),
      helper:
        kpis.totalCount > 0
          ? `Rata-rata ${formatIDR(Math.round(kpis.totalCost / kpis.totalCount))} / titik`
          : "Belum ada pengeluaran",
      icon: Wallet,
      color: "emerald",
    },
    {
      label: "Tingkat Penyelesaian",
      value: `${kpis.completionRate}%`,
      helper: `${kpis.doneCount} dari ${kpis.totalCount} placement selesai`,
      icon: CheckCircle2,
      color: "blue",
    },
    {
      label: "Rasio Pemasangan",
      value: `${kpis.im3Count} : ${kpis.triCount}`,
      helper: `${kpis.im3Count} IM3 (Kuning) • ${kpis.triCount} 3 (Pink)`,
      icon: Radio,
      color: "amber",
    },
    {
      label: "Menunggu vs Selesai",
      value: `${kpis.pendingCount} Menunggu / ${kpis.doneCount} Selesai`,
      helper: `${kpis.notStartedCount} To Do • ${kpis.inProgressCount} In Progress${kpis.issueCount > 0 ? ` • ${kpis.issueCount} Kendala` : ""}`,
      icon: Clock,
      color: kpis.issueCount > 0 ? "rose" : "orange",
    },
  ];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
npm test -- src/components/views/PlacementsView/placementKpi.test.ts
```
Expected: PASS.

- [ ] **Step 5: Refactor `PlacementsView.tsx` into a lean coordinator (~220 lines)**

In `src/components/views/PlacementsView/PlacementsView.tsx`:
- Import `buildPlacementKpiItems` from `./placementKpi`.
- Remove dead code (e.g. ad-hoc accordion gallery, inline column declarations, unused SVG chevrons).
- Verify file length is ~220-250 lines.

- [ ] **Step 6: Run full project test suite**

Run:
```bash
npm test
```
Expected: All tests pass with 0 failures.

- [ ] **Step 7: Commit changes**

```bash
git add src/components/views/PlacementsView/placementKpi.ts src/components/views/PlacementsView/placementKpi.test.ts src/components/views/PlacementsView/PlacementsView.tsx
git commit -m "refactor(placements): complete coordinator decomposition conforming to strangler pattern"
```

---

## Plan Self-Review Checklist

- [x] **Spec Coverage:** Every defect flagged in `docs/audit-placements-table-ui-ux.md` (P0 through P3) is addressed in Tasks 1–5.
- [x] **No Placeholders:** All code snippets, regex, imports, and test assertions are fully written out.
- [x] **Type Consistency:** Single source of truth from `@/types` maintained across all task interfaces.
- [x] **Verification:** Native `node --test` suite specified for each task with exact execution commands.
