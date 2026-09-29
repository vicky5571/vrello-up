"use client";

import { Store, Building2, Layers, AlertTriangle, Eye, Download, Clock, Check, ChevronRight } from "lucide-react";
import { cn, formatIDR } from "@/lib/utils";
import {
  createMarcomColumnHelper,
} from "@/components/views/shared/MarcomTableShell";
import { calculateMouPlacementRealization } from "@/lib/marcom/placementMouBridge";
import { parseMouDocumentSource } from "./mouDocumentHelpers";
import { compareMouStatus } from "./mouSortingHelpers";
import { calculateMouValidity, formatMouDateRange } from "./mouDateHelpers";
import type { MarcomMou, MouStatus, ViewMode } from "@/types";
import type { PermissionAction } from "@/lib/marcom/guards";

const columnHelper = createMarcomColumnHelper<MarcomMou>();

export const STATUS_STYLES: Record<MouStatus, string> = {
  DRAFT: "bg-slate-500/10 text-slate-500 dark:text-slate-400",
  SUBMITTED: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  APPROVED: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  REJECTED: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  DONE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

export interface MouColumnDeps {
  navigateToMarcom: (view: ViewMode, search?: string) => void;
  setMarcomFilter: (view: string, query: string) => void;
  setSelectedBranchId: (id: string | null) => void;
  setViewingDocMou: (mou: MarcomMou) => void;
  onQuickApprove?: (mou: MarcomMou) => void;
  onOpenDrawer?: (mou: MarcomMou) => void;
  can: (action: PermissionAction, targetBranchId?: string) => boolean;
}

export function buildMouColumns({
  navigateToMarcom,
  setMarcomFilter,
  setSelectedBranchId,
  setViewingDocMou,
  onQuickApprove,
  onOpenDrawer,
  can,
}: MouColumnDeps) {
  return columnHelper.columns([
    columnHelper.display({
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            aria-label="Select all MOUs"
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
            aria-label={`Select MOU ${row.original.id}`}
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
    columnHelper.accessor("partnerName", {
      id: "partner",
      header: "Partner",
      size: 190,
      minSize: 130,
      cell: ({ row }) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setMarcomFilter("mous", row.original.partnerName);
          }}
          className="truncate font-semibold text-slate-900 dark:text-slate-100 hover:text-fuchsia-600 dark:hover:text-fuchsia-400 hover:underline cursor-pointer text-left"
          title={`Filter MOUs by partner "${row.original.partnerName}"`}
        >
          {row.original.partnerName}
        </button>
      ),
    }),
    columnHelper.display({
      id: "outlet",
      header: "Outlet",
      size: 170,
      minSize: 120,
      enableSorting: false,
      cell: ({ row }) => {
        const name = row.original.outletName;
        if (!name) return <span className="text-slate-400">—</span>;
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigateToMarcom("outlets", name);
            }}
            className="truncate font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 hover:underline cursor-pointer flex items-center gap-1.5 text-left"
            title={`Jump to Outlets view for "${name}"`}
          >
            <Store className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{name}</span>
          </button>
        );
      },
    }),
    columnHelper.display({
      id: "branch",
      header: "Branch",
      size: 170,
      minSize: 120,
      enableSorting: false,
      cell: ({ row }) => {
        const name = row.original.branch?.name ?? row.original.branchId;
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedBranchId(row.original.branchId);
            }}
            className="truncate text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:underline cursor-pointer flex items-center gap-1.5 text-left"
            title={`Open branch details for "${name}"`}
          >
            <Building2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{name}</span>
          </button>
        );
      },
    }),
    columnHelper.accessor("mouType", { id: "type", header: "Type", size: 160, minSize: 120 }),
    columnHelper.accessor("status", {
      id: "status",
      header: "Status",
      size: 140,
      minSize: 110,
      sortFn: (rowA: any, rowB: any) => compareMouStatus(rowA.original.status, rowB.original.status),
      cell: ({ row }) => {
        const isExpired = Boolean(
          row.original.endDate &&
          new Date(row.original.endDate).getTime() < Date.now() &&
          row.original.status !== "DONE" &&
          row.original.status !== "REJECTED"
        );
        return (
          <div className="flex flex-col items-start gap-1">
            <span
              className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold", STATUS_STYLES[row.original.status] ?? STATUS_STYLES.DRAFT)}
              title={
                row.original.status === "SUBMITTED" && !can("APPROVE_MOU", row.original.branchId)
                  ? "Menunggu persetujuan Admin atau PIC Cabang terkait"
                  : undefined
              }
            >
              {row.original.status.replaceAll("_", " ")}
            </span>
            {isExpired && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                title={`MOU kadaluwarsa pada ${row.original.endDate?.slice(0, 10)}. Butuh perpanjangan manual atau tandai selesai.`}
              >
                <AlertTriangle className="w-2.5 h-2.5 shrink-0 text-rose-500" />
                <span>Expired</span>
              </span>
            )}
          </div>
        );
      },
    }),
    columnHelper.accessor("endDate", {
      id: "validity",
      header: "Period & Validity",
      size: 195,
      minSize: 150,
      sortFn: (rowA: any, rowB: any) => {
        const timeA = rowA.original.endDate ? new Date(rowA.original.endDate).getTime() : 0;
        const timeB = rowB.original.endDate ? new Date(rowB.original.endDate).getTime() : 0;
        return timeA - timeB;
      },
      cell: ({ row }) => {
        const validity = calculateMouValidity(row.original.startDate, row.original.endDate);
        const periodStr = formatMouDateRange(row.original.startDate, row.original.endDate);

        const variantBadgeStyles: Record<string, string> = {
          emerald: "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
          amber: "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
          rose: "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800",
          blue: "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
          slate: "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
        };

        const badgeClass = variantBadgeStyles[validity.variant] || variantBadgeStyles.slate;

        return (
          <div className="flex flex-col gap-1 text-xs">
            <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate" title={periodStr}>
              {periodStr}
            </span>
            <div>
              <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border shadow-2xs", badgeClass)}>
                {validity.variant === "amber" || validity.variant === "rose" ? (
                  <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                ) : (
                  <Clock className="w-2.5 h-2.5 shrink-0" />
                )}
                <span>{validity.badgeText}</span>
              </span>
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor("compensationValue", {
      id: "value",
      header: "Value",
      size: 150,
      minSize: 120,
      cell: ({ row }) => (
        <span className="text-slate-700 dark:text-slate-300">
          {typeof row.original.compensationValue === "number" ? formatIDR(row.original.compensationValue) : "—"}
        </span>
      ),
    }),
    columnHelper.display({
      id: "placements",
      header: "Realisasi Fisik",
      size: 180,
      minSize: 140,
      enableSorting: false,
      cell: ({ row }) => {
        const pls = row.original.placements || [];
        if (pls.length === 0) {
          return (
            <span className="text-slate-400 text-xs italic">
              Belum ada materi
            </span>
          );
        }

        const realization = calculateMouPlacementRealization(row.original, pls);
        const comp = row.original.compensationValue || 0;
        const rate = realization.budgetUtilizationRate;
        const isOver = realization.isOverBudget;

        const progressColor = isOver
          ? "bg-rose-500"
          : rate >= 80
          ? "bg-amber-500"
          : "bg-emerald-500";

        const badgeClass = isOver
          ? "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800"
          : rate >= 80
          ? "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800"
          : "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800";

        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigateToMarcom("placements", row.original.partnerName || row.original.outletName || "");
            }}
            className="w-full inline-flex flex-col text-left group cursor-pointer space-y-1 py-0.5"
            title="Lihat titik pemasangan fisik di Placements"
          >
            <div className="flex items-center justify-between gap-1.5 w-full">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-lime-600 transition-colors">
                <Layers className="w-3 h-3 text-lime-500 shrink-0" />
                <span>{realization.totalLinked} Titik ({realization.doneCount} Done)</span>
              </span>
              {comp > 0 && (
                <span className={cn("text-[9px] font-bold px-1.5 py-0.2 rounded border shadow-2xs shrink-0", badgeClass)}>
                  {rate}%{isOver ? " Over" : ""}
                </span>
              )}
            </div>

            {comp > 0 && (
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-300", progressColor)}
                  style={{ width: `${Math.min(100, rate)}%` }}
                />
              </div>
            )}
          </button>
        );
      },
    }),
    columnHelper.accessor("docPath", {
      id: "document",
      header: "Dokumen MOU",
      size: 145,
      minSize: 125,
      enableSorting: false,
      cell: ({ row }) => {
        const doc = row.original.docPath;
        const parsed = parseMouDocumentSource(doc, row.original.partnerName);
        if (parsed.type === "EMPTY") {
          return (
            <span className="text-slate-400 text-xs italic">
              Tanpa Berkas
            </span>
          );
        }
        return (
          <div
            className="flex items-center gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setViewingDocMou(row.original)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-fuchsia-50 dark:bg-fuchsia-950/40 text-fuchsia-700 dark:text-fuchsia-300 border border-fuchsia-200 dark:border-fuchsia-800 hover:bg-fuchsia-100 transition-colors cursor-pointer shadow-2xs"
              title="Lihat Pratinjau Dokumen"
            >
              <Eye className="w-3 h-3 text-fuchsia-600 dark:text-fuchsia-400" />
              <span>{parsed.label}</span>
            </button>
            <a
              href={parsed.downloadUrl}
              download={parsed.filename || "dokumen-mou"}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Unduh Berkas Asli"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
          </div>
        );
      },
    }),
    columnHelper.display({
      id: "actions",
      header: () => null,
      size: 85,
      minSize: 70,
      maxSize: 110,
      enableSorting: false,
      cell: ({ row }) => {
        const isSubmitted = row.original.status === "SUBMITTED";
        const canApprove = isSubmitted && can("APPROVE_MOU", row.original.branchId);

        return (
          <div
            className="flex items-center justify-end gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            {canApprove && onQuickApprove && (
              <button
                type="button"
                onClick={() => onQuickApprove(row.original)}
                aria-label={`Quick Approve MOU ${row.original.partnerName}`}
                className="inline-flex items-center gap-1 px-2 py-1 min-h-[30px] rounded-md text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-2xs transition-colors cursor-pointer"
                title="Quick Approve MOU (PIC Cabang / Admin)"
              >
                <Check className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Approve</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onOpenDrawer?.(row.original)}
              aria-label={`Buka detail MOU ${row.original.partnerName}`}
              className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg text-slate-400 hover:text-fuchsia-600 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-950/40 transition-colors cursor-pointer"
              title="Buka Panel Detail MOU"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        );
      },
    }),
  ]);
}
