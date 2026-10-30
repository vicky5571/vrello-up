"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  Store,
  Plus,
  Edit2,
  Building2,
  ClipboardList,
  Layers,
  MapPin,
  Compass,
  FileText,
  Eye,
} from "lucide-react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useMarcomPermissions } from "@/lib/marcom/permissions";
import { useMarcomDataStore } from "@/lib/marcom/marcomDataStore";
import { cn } from "@/lib/utils";
import type { OutletItem as MarcomOutlet, OutletType } from "@/types";
export type { OutletType, MarcomOutlet };
import {
  MarcomTableShell,
  createMarcomColumnHelper,
} from "@/components/views/shared/MarcomTableShell";
import { OutletsHeader } from "./OutletsHeader";
import { calculateEnhancedOutletKPIs } from "@/lib/marcom/outletAnalytics";
import { Outlet360Drawer } from "./Outlet360Drawer";
import { OutletApprovalQueueTab } from "./OutletApprovalQueueTab";
import { SubmitDraftOutletModal } from "./SubmitDraftOutletModal";
import { OutletFormModal } from "./OutletFormModal";
import { filterPendingOutlets } from "./outletApprovalQueueHelpers";
import { OutletExpandedRow } from "./OutletExpandedRow";

const OutletMapView = dynamic(
  () => import("./OutletMapView").then((mod) => mod.OutletMapView),
  {
    ssr: false,
    loading: () => (
      <div className="h-[650px] w-full rounded-2xl bg-slate-100 dark:bg-slate-900 animate-pulse flex flex-col items-center justify-center gap-2 text-xs text-slate-400 border border-slate-200 dark:border-slate-800">
        <Compass className="w-8 h-8 text-orange-500 animate-spin" />
        <span>Memuat peta sebaran outlet & koordinat GPS...</span>
      </div>
    ),
  },
);

const columnHelper = createMarcomColumnHelper<MarcomOutlet>();

const TYPE_STYLES: Record<OutletType, string> = {
  TRADITIONAL: "bg-slate-500/10 text-slate-500 dark:text-slate-400",
  MODERN_RETAIL: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  EXCLUSIVE: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  CAMPUS_OUTLET: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
};

export function OutletsView() {
  const { can, role } = useMarcomPermissions();
  const marcomFilters = useWorkspaceStore((s) => s.marcomFilters);
  const setMarcomFilter = useWorkspaceStore((s) => s.setMarcomFilter);
  const navigateToMarcom = useWorkspaceStore((s) => s.navigateToMarcom);
  const setSelectedBranchId = useWorkspaceStore((s) => s.setSelectedBranchId);
  const {
    fetchBranches,
    setOutlets: setStoreOutlets,
    branches: storeBranches,
    invalidateOutlets,
    invalidatePlacements,
    invalidateMous,
  } = useMarcomDataStore();

  const [viewMode, setViewMode] = useState<"table" | "map" | "approval">("table");
  const [selectedOutletIdForDrawer, setSelectedOutletIdForDrawer] = useState<string | null>(null);
  const [outlets, setOutlets] = useState<MarcomOutlet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [branches, setBranches] = useState<{ id: string; name: string; code: string }[]>(() =>
    storeBranches.length > 0
      ? storeBranches.map((b) => ({ id: b.id, name: b.name, code: b.code }))
      : []
  );
  const [modalOutlet, setModalOutlet] = useState<Partial<MarcomOutlet> | null>(null);
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);

  const pendingCount = useMemo(() => filterPendingOutlets(outlets).length, [outlets]);

  const canManage = can("MANAGE_MASTER_DATA");
  const canAddOutlet = canManage || role !== "viewer";

  const fetchOutlets = useCallback(
    async (branchFilter = selectedBranch, typeFilter = selectedType) => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (branchFilter && branchFilter !== "ALL") params.set("branchId", branchFilter);
        if (typeFilter && typeFilter !== "ALL") params.set("type", typeFilter);
        const outletsUrl = `/api/marcom/outlets${params.toString() ? `?${params.toString()}` : ""}`;

        const [resOutlets, branchList] = await Promise.all([
          fetch(outletsUrl),
          fetchBranches(),
        ]);
        if (!resOutlets.ok) throw new Error(`Request failed (${resOutlets.status})`);
        const jsonOutlets = await resOutlets.json();
        const outletItems = Array.isArray(jsonOutlets.data) ? jsonOutlets.data : [];
        setOutlets(outletItems);
        if (branchFilter === "ALL" && typeFilter === "ALL") {
          setStoreOutlets(outletItems);
        }
        if (Array.isArray(branchList) && branchList.length > 0) {
          setBranches(branchList.map((b) => ({ id: b.id, name: b.name, code: b.code })));
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load outlets");
      } finally {
        setIsLoading(false);
      }
    },
    [selectedBranch, selectedType, fetchBranches, setStoreOutlets],
  );

  useEffect(() => {
    fetchOutlets(selectedBranch, selectedType);
  }, [fetchOutlets, selectedBranch, selectedType]);

  const handleBranchChange = (newBranch: string) => {
    setSelectedBranch(newBranch);
    fetchOutlets(newBranch, selectedType);
  };

  const handleTypeChange = (newType: string) => {
    setSelectedType(newType);
    fetchOutlets(selectedBranch, newType);
  };

  const handleResetFilters = () => {
    setSelectedBranch("ALL");
    setSelectedType("ALL");
    setMarcomFilter("outlets", "");
    fetchOutlets("ALL", "ALL");
  };

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.display({
          id: "select",
          header: ({ table }) => (
            <div className="flex items-center justify-center">
              <input
                type="checkbox"
                aria-label="Select all outlets"
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
                aria-label={`Select outlet ${row.original.name}`}
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
        columnHelper.accessor("code", {
          id: "code",
          header: "Code",
          size: 95,
          minSize: 80,
          cell: ({ row }) => <span className="font-semibold text-slate-900 dark:text-slate-100">{row.original.code}</span>,
        }),
        columnHelper.accessor("name", {
          id: "name",
          header: "Outlet Name",
          size: 240,
          minSize: 160,
          cell: ({ row }) => (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedOutletIdForDrawer(row.original.id);
              }}
              className="group text-left font-semibold text-slate-800 dark:text-slate-100 hover:text-orange-600 dark:hover:text-orange-400 flex items-center gap-1.5 cursor-pointer"
              title="Klik untuk membuka Profil 360°"
            >
              <span className="truncate">{row.original.name}</span>
              <Eye className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-orange-500 transition-opacity shrink-0" />
            </button>
          ),
        }),
        columnHelper.accessor("type", {
          id: "type",
          header: "Type",
          size: 140,
          minSize: 110,
          cell: ({ row }) => (
            <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold", TYPE_STYLES[row.original.type] ?? TYPE_STYLES.TRADITIONAL)}>
              {row.original.type.replaceAll("_", " ")}
            </span>
          ),
        }),
        columnHelper.accessor("city", { id: "city", header: "City", size: 120, minSize: 90 }),
        columnHelper.display({
          id: "branch",
          header: "Branch",
          size: 180,
          minSize: 120,
          enableSorting: false,
          cell: ({ row }) => {
            const branch = row.original.branch;
            if (!branch) return <span className="text-slate-400">—</span>;
            return (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedBranchId(row.original.branchId);
                }}
                className="truncate font-semibold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 hover:underline cursor-pointer flex items-center gap-1.5 text-left"
                title={`Open ${branch.name} detail drawer`}
              >
                <Building2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{branch.name}</span>
              </button>
            );
          },
        }),
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
        columnHelper.display({
          id: "placements",
          header: "Placements",
          size: 110,
          minSize: 80,
          enableSorting: false,
          cell: ({ row }) => {
            const count = row.original.placementCount ?? 0;
            return (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateToMarcom("placements", row.original.name);
                }}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-semibold text-xs text-lime-600 dark:text-lime-400 bg-lime-500/10 hover:bg-lime-500/20 transition-colors cursor-pointer"
                title={`Jump to Placements view for ${row.original.name}`}
              >
                <ClipboardList className="w-3 h-3" />
                <span>{count}</span>
              </button>
            );
          },
        }),
        columnHelper.display({
          id: "gps",
          header: "GPS",
          size: 90,
          minSize: 70,
          enableSorting: false,
          cell: ({ row }) => {
            const hasGPS =
              typeof row.original.latitude === "number" &&
              typeof row.original.longitude === "number";
            return (
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold",
                  hasGPS
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                    : "bg-slate-500/10 text-slate-400",
                )}
              >
                <MapPin className="w-2.5 h-2.5" />
                <span>{hasGPS ? "Mapped" : "None"}</span>
              </span>
            );
          },
        }),
        columnHelper.display({
          id: "active",
          header: "Active",
          size: 85,
          minSize: 65,
          enableSorting: false,
          cell: ({ row }) => (
            <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold", row.original.active ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-slate-500/10 text-slate-500 dark:text-slate-400")}>
              {row.original.active ? "Active" : "Inactive"}
            </span>
          ),
        }),
        columnHelper.display({
          id: "actions",
          header: () => null,
          size: 90,
          minSize: 75,
          maxSize: 110,
          enableSorting: false,
          cell: ({ row }) => (
            <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setSelectedOutletIdForDrawer(row.original.id)}
                className="p-1 rounded-md text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40 transition-colors"
                title="Buka Profil 360°"
              >
                <Store className="w-4 h-4" />
              </button>
              {canManage && (
                <button
                  type="button"
                  onClick={() => setModalOutlet(row.original)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  title="Edit Outlet"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ),
        }),
      ]),
    [navigateToMarcom, setSelectedBranchId, canManage],
  );

  const deleteOne = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/marcom/outlets/${id}`, { method: "DELETE" });
      if (res.ok) {
        invalidateOutlets();
        invalidatePlacements();
        invalidateMous();
      }
      return res.ok;
    },
    [invalidateOutlets, invalidatePlacements, invalidateMous],
  );

  const deleteBatch = useCallback(
    async (ids: string[]) => {
      const res = await fetch("/api/marcom/outlets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (res.ok) {
        invalidateOutlets();
        invalidatePlacements();
        invalidateMous();
      }
      return res.ok;
    },
    [invalidateOutlets, invalidatePlacements, invalidateMous],
  );

  const kpiItems = useMemo(() => {
    const kpis = calculateEnhancedOutletKPIs(outlets);

    return [
      {
        label: "Total Outlets",
        value: kpis.totalOutlets,
        helper: `${kpis.activeCount} Aktif (${kpis.activePercentage}%)`,
        icon: Store,
        color: "orange" as const,
      },
      {
        label: "Active Branches",
        value: kpis.branchCoverage,
        helper: "Regional hub coverage",
        icon: Building2,
        color: "teal" as const,
      },
      {
        label: "Brand Portfolio",
        value: `${kpis.im3Count} : ${kpis.triCount}`,
        helper: "IM3 vs 3 (Tri) distribution",
        icon: Compass,
        color: "amber" as const,
      },
      {
        label: "MoU Partnerships",
        value: kpis.withMouCount,
        helper: "Toko dengan kontrak MoU aktif",
        icon: FileText,
        color: "violet" as const,
      },
      {
        label: "Placements Installed",
        value: outlets.reduce((acc, o) => acc + (o.placementCount || 0), 0),
        helper: `${kpis.withPlacementCount} toko ber-material fisik`,
        icon: Layers,
        color: "emerald" as const,
      },
    ];
  }, [outlets]);

  return (
    <div className="flex flex-col h-full bg-[#FAFBFC] dark:bg-[#121316] overflow-y-auto">
      {/* Unified Inventory-Style Header */}
      <OutletsHeader
        totalOutlets={outlets.length}
        kpiItems={kpiItems}
        isLoading={isLoading}
        onRefresh={() => fetchOutlets(selectedBranch, selectedType)}
        canAddOutlet={canAddOutlet}
        canManage={canManage}
        onAddOutlet={() => {
          if (canManage) {
            setModalOutlet({
              code: "",
              name: "",
              type: "TRADITIONAL",
              brand: "IM3",
              branchId: branches[0]?.id || "",
              city: "",
              address: "",
              picName: "",
              picPhone: "",
            });
          } else {
            setIsDraftModalOpen(true);
          }
        }}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        pendingCount={pendingCount}
        selectedBranch={selectedBranch}
        onBranchChange={handleBranchChange}
        branches={branches}
        selectedType={selectedType}
        onTypeChange={handleTypeChange}
        onResetFilters={handleResetFilters}
        searchQuery={marcomFilters["outlets"] || ""}
        onSearchChange={(q) => setMarcomFilter("outlets", q)}
      />

      {/* Main Stage Content */}
      <div className="p-4 sm:p-6 flex-1 min-h-0 space-y-4">
        {viewMode === "approval" ? (
          <OutletApprovalQueueTab
            outlets={outlets}
            branches={branches}
            onRefresh={fetchOutlets}
          />
        ) : viewMode === "map" ? (
          <OutletMapView
            outlets={outlets}
            onSelectOutlet={(id) => setSelectedOutletIdForDrawer(id)}
            onEditOutlet={(o) => setModalOutlet(o)}
            canManage={canManage}
          />
        ) : (
          <MarcomTableShell
            data={outlets}
            columns={columns}
            getRowId={(row) => row.id}
            initialSorting={[{ id: "code", desc: false }]}
            title="Outlets"
            titleIcon={Store}
            entityName="outlet"
            entityPlural="outlets"
            isLoading={isLoading}
            error={error}
            onRefresh={fetchOutlets}
            canDelete={canManage}
            deleteRequiresMessage="Delete requires admin role"
            onDeleteOne={deleteOne}
            onDeleteBatch={deleteBatch}
            hideHeader
            noPadding
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
            searchTerm={marcomFilters["outlets"] || ""}
            onSearchChange={(q) => setMarcomFilter("outlets", q)}
            emptyLabel="No outlets found."
          />
        )}
      </div>

      {/* Outlet 360 Degree Profile Drawer */}
      <Outlet360Drawer
        outletId={selectedOutletIdForDrawer}
        onClose={() => setSelectedOutletIdForDrawer(null)}
        onEditOutlet={(o) => {
          setSelectedOutletIdForDrawer(null);
          setModalOutlet(o);
        }}
        canManage={canManage}
        onDataChange={() => {
          fetchOutlets();
        }}
      />

      {/* Modal Add / Edit Outlet */}
      <OutletFormModal
        outlet={modalOutlet}
        onClose={() => setModalOutlet(null)}
        branches={branches}
        onSuccess={fetchOutlets}
      />

      <SubmitDraftOutletModal
        isOpen={isDraftModalOpen}
        onClose={() => setIsDraftModalOpen(false)}
        branches={branches}
        onSuccess={() => {
          fetchOutlets();
        }}
      />
    </div>
  );
}
