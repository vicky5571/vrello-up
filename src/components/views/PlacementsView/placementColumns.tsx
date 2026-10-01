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
}

export function buildPlacementColumns({
  navigateToMarcom,
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
              <span title="Verifikasi fisik lengkap">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
              </span>
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
      sortFn: (rowA: { original: MarcomPlacement }, rowB: { original: MarcomPlacement }) => comparePlacementStatus(rowA.original.status, rowB.original.status),
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
      sortFn: (rowA: { original: MarcomPlacement }, rowB: { original: MarcomPlacement }) => comparePlacementDates(rowA.original.date, rowB.original.date),
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
