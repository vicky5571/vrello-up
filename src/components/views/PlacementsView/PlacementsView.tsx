"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import {
  ClipboardList,
  Download,
  Plus,
  X,
  MapPin,
  TableProperties,
  Search,
  RefreshCw,
  Wallet,
  CheckCircle2,
  Radio,
  Clock,
  Sparkles,
} from "lucide-react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useShallow } from "zustand/react/shallow";
import { useMarcomPermissions } from "@/lib/marcom/permissions";
import { useMarcomDataStore } from "@/lib/marcom/marcomDataStore";
import { cn, formatIDR } from "@/lib/utils";
import { MarcomTableShell } from "@/components/views/shared/MarcomTableShell";
import { KpiSummaryCards, type KpiCardItem } from "@/components/views/shared/KpiSummaryCards";
import { calculatePlacementKPIs } from "@/lib/marcom/placementAnalytics";
import {
  findAvailableMousForOutlet,
  type MouSummaryInfo,
} from "@/lib/marcom/placementMouBridge";
import { PlacementBulkActionBar } from "./PlacementBulkActionBar";
import { PlacementFormModal } from "./PlacementFormModal";
import { PlacementDetailDrawer } from "./PlacementDetailDrawer";
import { findOutletCoordinates } from "@/lib/marcom/outletInherit";
import { isValidCoordinate } from "@/lib/marcom/locationUtils";
import { normalizeBrand } from "@/lib/marcom/brandUtils";
import {
  buildPlacementTaskPayload,
  syncTaskOnPlacementStatusChange,
} from "@/lib/tasks/placementTaskSync";
import { FIELD_OPS_LIST_ID } from "@/lib/marcom/marcomIds";
import { QuarterlyRecapTab } from "./QuarterlyRecapTab";
import { buildPlacementColumns } from "./placementColumns";
import type { PlacementStatus, MarcomPlacement, MarcomMou, Brand } from "@/types";

export type { PlacementStatus, MarcomPlacement };

const PlacementsMapView = dynamic(
  () => import("./PlacementsMapView").then((mod) => mod.PlacementsMapView),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[500px] flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
        <span className="inline-flex items-center gap-2">
          <MapPin className="w-4 h-4 animate-bounce text-emerald-500" />
          Memuat Peta Placements...
        </span>
      </div>
    ),
  },
);

const BRAND_CHIPS: { label: string; value: string; color?: string }[] = [
  { label: "All Brands", value: "ALL" },
  { label: "IM3", value: "IM3", color: "#EAB308" },
  { label: "3 (Tri)", value: "TRI", color: "#EC4899" },
];

const PLACEMENT_STATUS_CHIPS: { label: string; value: string }[] = [
  { label: "All", value: "ALL" },
  { label: "To Do", value: "NOT_STARTED" },
  { label: "In Progress", value: "ON_PROGRESS" },
  { label: "Done", value: "DONE" },
];

const EMPTY_PLACEMENTS: MarcomPlacement[] = [];
const EMPTY_MOUS: MarcomMou[] = [];

export function PlacementsView() {
  const { can } = useMarcomPermissions();
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId) || "ws-main";
  const { tasks, workspaces, marcomFilters } = useWorkspaceStore(
    useShallow((s) => ({
      tasks: s.tasks,
      workspaces: s.workspaces,
      marcomFilters: s.marcomFilters,
    })),
  );

  const createTask = useWorkspaceStore((s) => s.createTask);
  const setSelectedTaskId = useWorkspaceStore((s) => s.setSelectedTaskId);
  const setExportCenterOpen = useWorkspaceStore((s) => s.setExportCenterOpen);
  const setMarcomFilter = useWorkspaceStore((s) => s.setMarcomFilter);
  const navigateToMarcom = useWorkspaceStore((s) => s.navigateToMarcom);

  const {
    fetchOutlets,
    fetchMaterials,
    fetchBranches,
    outlets: storeOutlets,
    materials: storeMaterials,
    branches: storeBranches,
    invalidateMous,
  } = useMarcomDataStore();

  const placements = useMarcomDataStore(
    (s) => s.placementsByWorkspace[activeWorkspaceId] ?? EMPTY_PLACEMENTS,
  );
  const fetchPlacements = useMarcomDataStore((s) => s.fetchPlacements);
  const addCachedPlacement = useMarcomDataStore((s) => s.addCachedPlacement);
  const updateCachedPlacement = useMarcomDataStore((s) => s.updateCachedPlacement);
  const removeCachedPlacement = useMarcomDataStore((s) => s.removeCachedPlacement);
  const invalidateOutlets = useMarcomDataStore((s) => s.invalidateOutlets);
  const updateCachedOutlet = useMarcomDataStore((s) => s.updateCachedOutlet);

  const [isLoading, setIsLoading] = useState(
    () => !Boolean(useMarcomDataStore.getState().placementsByWorkspace[activeWorkspaceId]),
  );
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedBrand, setSelectedBrand] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "map" | "recap">("table");
  const storeMous = useMarcomDataStore(
    (s) => s.mousByWorkspace[activeWorkspaceId] ?? EMPTY_MOUS,
  );
  const outletsList = useMemo(
    () => storeOutlets.map((o) => ({ id: o.id, name: o.name, brand: o.brand, picName: o.picName, branchId: o.branchId })),
    [storeOutlets]
  );
  const materialsList = useMemo(
    () => storeMaterials.map((m) => ({ id: m.id, name: m.name, type: m.type, requiresMou: m.requiresMou })),
    [storeMaterials]
  );
  const mousList: MouSummaryInfo[] = storeMous;
  const [modalPlacement, setModalPlacement] = useState<Partial<MarcomPlacement> | null>(null);
  const [selectedPlacement, setSelectedPlacement] = useState<MarcomPlacement | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const canManage = can("CREATE_PLACEMENT");

  const filteredPlacements = useMemo(() => {
    const query = (marcomFilters["placements"] || "").toLowerCase().trim();
    return placements.filter((p) => {
      if (selectedStatus !== "ALL" && p.status !== selectedStatus) {
        return false;
      }
      if (selectedBrand !== "ALL") {
        const pBrand = (p.brand || "IM3").toUpperCase();
        const target = selectedBrand.toUpperCase();
        if ((target === "TRI" || target === "3") && pBrand !== "3" && pBrand !== "TRI") return false;
        if (target === "IM3" && pBrand !== "IM3") return false;
      }
      if (!query) return true;
      const outlet = p.outlet?.name?.toLowerCase() || "";
      const code = p.outlet?.code?.toLowerCase() || "";
      const material = p.material?.name?.toLowerCase() || "";
      const pic = p.picName?.toLowerCase() || "";
      const notes = p.notes?.toLowerCase() || "";
      const locNotes = p.locationNotes?.toLowerCase() || "";
      const brand = (p.brand || "").toLowerCase();
      return (
        outlet.includes(query) ||
        code.includes(query) ||
        material.includes(query) ||
        pic.includes(query) ||
        notes.includes(query) ||
        locNotes.includes(query) ||
        brand.includes(query)
      );
    });
  }, [placements, marcomFilters, selectedBrand, selectedStatus]);

  const kpiItems: KpiCardItem[] = useMemo(() => {
    const kpis = calculatePlacementKPIs(filteredPlacements);
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
  }, [filteredPlacements]);

  const handleTrackAsTask = (placement: MarcomPlacement) => {
    const existing = tasks.find((t) => t.relatedMarcomId === placement.id);
    if (existing) {
      setSelectedTaskId(existing.id);
      toast.info("Opened existing production task");
      return;
    }
    const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];
    const targetSpace =
      currentWorkspace?.spaces.find((s) => s.lists.some((l) => l.id === FIELD_OPS_LIST_ID)) ||
      currentWorkspace?.spaces[0];
    const members = currentWorkspace?.members || [];
    const taskPayload = buildPlacementTaskPayload(
      {
        id: placement.id,
        materialName: placement.material?.name,
        outletName: placement.outlet?.name,
        dimensions: placement.dimensions,
        picName: placement.picName,
        notes: placement.notes,
        photoUrl: placement.photoUrl,
        status: placement.status,
      },
      targetSpace,
    );

    const task = createTask({
      ...taskPayload,
      assignees: members[0] ? [members[0]] : [],
      tags: [],
      orderIndex:
        Math.max(
          -1,
          ...tasks
            .filter((t) => t.statusId === taskPayload.statusId)
            .map((t) => t.orderIndex),
        ) + 1,
    });
    toast.success("Production task created in Field Operations!");
    setSelectedTaskId(task.id);
  };

  const loadPlacements = useCallback(
    async (force = false) => {
      if (!activeWorkspaceId) return;
      const hasCache = Boolean(useMarcomDataStore.getState().placementsByWorkspace[activeWorkspaceId]);
      if (!hasCache) setIsLoading(true);
      setError(null);
      try {
        await Promise.all([
          fetchPlacements(activeWorkspaceId, force),
          fetchOutlets(force),
          fetchMaterials(),
          fetchBranches(),
          useMarcomDataStore.getState().fetchMous(activeWorkspaceId),
        ]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load placements");
      } finally {
        setIsLoading(false);
      }
    },
    [activeWorkspaceId, fetchPlacements, fetchOutlets, fetchMaterials, fetchBranches]
  );

  useEffect(() => {
    loadPlacements();
  }, [loadPlacements]);

  const handleStatusFilter = (status: string) => {
    const next = selectedStatus === status && status !== "ALL" ? "ALL" : status;
    setSelectedStatus(next);
  };

  const handleBrandFilter = (brand: string) => {
    const next = selectedBrand === brand && brand !== "ALL" ? "ALL" : brand;
    setSelectedBrand(next);
  };

  const handleOpenAddPlacement = useCallback(() => {
    const firstOutlet = outletsList[0];
    const firstOutletId = firstOutlet?.id || "";
    const inherited = findOutletCoordinates(firstOutletId, placements);
    const matchingMous = findAvailableMousForOutlet(mousList, firstOutlet || firstOutletId);
    const defaultMou = matchingMous.find((m) => m.status === "APPROVED") || matchingMous[0];

    const brandSuggestion: Brand = normalizeBrand(firstOutlet?.brand);

    setModalPlacement({
      outletId: firstOutletId,
      materialId: materialsList[0]?.id || "",
      mouId: defaultMou?.id || "",
      status: "NOT_STARTED",
      brand: brandSuggestion,
      dimensions: "",
      cost: undefined,
      picName: firstOutlet?.picName || "",
      notes: "",
      photoUrl: "",
      date: new Date().toISOString().slice(0, 10),
      latitude: inherited?.latitude ?? null,
      longitude: inherited?.longitude ?? null,
      shareLocationUrl: inherited?.shareLocationUrl ?? "",
      locationNotes: inherited?.locationNotes ?? "",
    });

    if (inherited) {
      toast.info("Koordinat outlet otomatis diambil dari riwayat pemasangan sebelumnya", {
        duration: 3000,
      });
    }
  }, [outletsList, materialsList, placements, mousList]);

  const columns = useMemo(
    () => buildPlacementColumns({ navigateToMarcom }),
    [navigateToMarcom],
  );

  const handleSavePlacement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalPlacement) return;
    const {
      id,
      outletId,
      materialId,
      status,
      brand,
      dimensions,
      cost,
      picName,
      notes,
      photoUrl,
      date,
      latitude,
      longitude,
      shareLocationUrl,
      locationNotes,
    } = modalPlacement;
    if (!outletId || !materialId) {
      toast.error("Outlet and Material are required");
      return;
    }
    if (status === "DONE") {
      if (!photoUrl || !photoUrl.trim()) {
        toast.error("Bukti foto fisik wajib diunggah sebelum status diselesaikan (DONE)");
        return;
      }
      const hasValidCoords =
        typeof latitude === "number" &&
        typeof longitude === "number" &&
        isValidCoordinate(latitude, longitude);
      const hasValidShare =
        typeof shareLocationUrl === "string" && shareLocationUrl.trim().length > 0;

      if (!hasValidCoords && !hasValidShare) {
        toast.error(
          "Verifikasi lokasi fisik (koordinat GPS atau URL share location) wajib disertakan sebelum status diselesaikan (DONE)",
        );
        return;
      }
    }
    setIsSaving(true);
    try {
      const isEdit = Boolean(id);
      const url = isEdit ? `/api/marcom/placements/${id}` : "/api/marcom/placements";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outletId,
          materialId,
          mouId: modalPlacement.mouId ? modalPlacement.mouId : null,
          status: status || "NOT_STARTED",
          brand: brand || "IM3",
          dimensions: dimensions || "",
          cost: cost != null ? Number(cost) : undefined,
          picName: picName || "",
          notes: notes || "",
          photoUrl: photoUrl || "",
          date: date || new Date().toISOString(),
          workspaceId: activeWorkspaceId,
          latitude: typeof latitude === "number" ? latitude : null,
          longitude: typeof longitude === "number" ? longitude : null,
          shareLocationUrl: shareLocationUrl || "",
          locationNotes: locationNotes || "",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to save placement (${res.status})`);
      }
      const jsonRes = await res.json().catch(() => ({}));
      const savedPlacement: MarcomPlacement = jsonRes.data || jsonRes;
      const backfilledOutlet = jsonRes.backfilledOutlet;

      if (backfilledOutlet) {
        updateCachedOutlet(backfilledOutlet);
        invalidateOutlets();
      } else if (status === "DONE" && (latitude != null || longitude != null || Boolean(shareLocationUrl))) {
        invalidateOutlets();
      }

      if (isEdit && id) {
        updateCachedPlacement(activeWorkspaceId, savedPlacement);
        setSelectedPlacement((prev) => (prev?.id === id ? savedPlacement : prev));
      } else {
        addCachedPlacement(activeWorkspaceId, savedPlacement);
      }
      fetchPlacements(activeWorkspaceId, true);
      toast.success(`Placement ${isEdit ? "updated" : "created"} successfully`);
      invalidateMous(activeWorkspaceId);
      if (isEdit && id) {
        const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];
        syncTaskOnPlacementStatusChange(
          id,
          status || "NOT_STARTED",
          tasks,
          currentWorkspace?.spaces || [],
          (taskId, updates) => useWorkspaceStore.getState().updateTask(taskId, updates),
        );
      }
      setModalPlacement(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save placement");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteOne = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/marcom/placements/${id}`, { method: "DELETE" });
      if (res.ok) {
        removeCachedPlacement(activeWorkspaceId, id);
        invalidateMous(activeWorkspaceId);
        setSelectedPlacement((prev) => (prev?.id === id ? null : prev));
      }
      return res.ok;
    },
    [activeWorkspaceId, removeCachedPlacement, invalidateMous],
  );

  const deleteBatch = useCallback(
    async (ids: string[]) => {
      const res = await fetch("/api/marcom/placements", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, workspaceId: activeWorkspaceId }),
      });
      if (res.ok) {
        for (const id of ids) {
          removeCachedPlacement(activeWorkspaceId, id);
        }
        invalidateMous(activeWorkspaceId);
        setSelectedPlacement((prev) => (prev && ids.includes(prev.id) ? null : prev));
      }
      return res.ok;
    },
    [activeWorkspaceId, removeCachedPlacement, invalidateMous],
  );

  const viewSwitcherControls = (
    <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
      <button
        type="button"
        onClick={() => setViewMode("table")}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
          viewMode === "table"
            ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
        )}
      >
        <TableProperties className="w-3.5 h-3.5" />
        <span>Table</span>
      </button>
      <button
        type="button"
        onClick={() => setViewMode("map")}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
          viewMode === "map"
            ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
        )}
      >
        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
        <span>Map View</span>
      </button>
      <button
        type="button"
        onClick={() => setViewMode("recap")}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
          viewMode === "recap"
            ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
        )}
      >
        <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
        <span>Rekap Kuartal</span>
      </button>
    </div>
  );

  const handleDrillDown = useCallback(
    (filter: { quarter: string; campaignTheme?: string; materialName?: string }) => {
      setViewMode("table");
      if (filter.campaignTheme) {
        setMarcomFilter("placements", filter.campaignTheme);
      } else if (filter.materialName) {
        setMarcomFilter("placements", filter.materialName);
      }
      toast.info(
        `Menampilkan outlet dengan materi: ${filter.campaignTheme || filter.materialName || "Semua"} (${filter.quarter})`
      );
    },
    [setMarcomFilter],
  );

  return (
    <>
      {viewMode === "table" ? (
        <MarcomTableShell
          fixedViewport
          data={filteredPlacements}
          columns={columns}
          getRowId={(row) => row.id}
          initialSorting={[{ id: "outlet", desc: false }]}
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
          addClassName="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-lime-600 hover:bg-lime-700 transition-colors shadow-2xs cursor-pointer"
          headerExtra={
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                {BRAND_CHIPS.map((chip) => {
                  const isActive = selectedBrand === chip.value;
                  return (
                    <button
                      key={chip.value}
                      type="button"
                      onClick={() => handleBrandFilter(chip.value)}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                        isActive
                          ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
                      )}
                    >
                      {chip.color && (
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: chip.color }} />
                      )}
                      <span>{chip.label}</span>
                    </button>
                  );
                })}
              </div>
              {viewSwitcherControls}
              <button
                type="button"
                onClick={() => setExportCenterOpen(true)}
                title="Open Export Center — PDF summaries & Excel sheets"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border shadow-xs bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
            </div>
          }
          onRowClick={(p) => setSelectedPlacement(p)}
          filterBar={
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">Status:</span>
              {PLACEMENT_STATUS_CHIPS.map((chip) => {
                const isActive = selectedStatus === chip.value;
                return (
                  <button
                    key={chip.value}
                    type="button"
                    onClick={() => handleStatusFilter(chip.value)}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer",
                      isActive
                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs ring-1 ring-slate-900/10"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700",
                    )}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
          }
          searchTerm={marcomFilters["placements"] || ""}
          onSearchChange={(q) => setMarcomFilter("placements", q)}
          emptyLabel="No placements found."
        />
      ) : viewMode === "map" ? (
        <div className="space-y-4">
          {/* Header Bar in Map Mode */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-lime-500/10 text-lime-600 dark:text-lime-400">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Placements Map
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {filteredPlacements.length}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Visualisasi sebaran titik materi promosi di outlet lapangan
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {viewSwitcherControls}

              <button
                type="button"
                onClick={() => loadPlacements(true)}
                title="Refresh data"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
              </button>

              <button
                type="button"
                onClick={() => setExportCenterOpen(true)}
                title="Open Export Center"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border shadow-xs bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>

              {canManage && (
                <button
                  type="button"
                  onClick={handleOpenAddPlacement}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-lime-600 hover:bg-lime-700 transition-colors shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Placement</span>
                </button>
              )}
            </div>
          </div>

          {/* Mini KPI Bar in Map Mode */}
          <KpiSummaryCards items={kpiItems} />

          {/* Filter Bar in Map Mode */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex flex-wrap items-center gap-3">
              {/* Brand Chips */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">Brand:</span>
                {BRAND_CHIPS.map((chip) => {
                  const isActive = selectedBrand === chip.value;
                  return (
                    <button
                      key={chip.value}
                      type="button"
                      onClick={() => handleBrandFilter(chip.value)}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer",
                        isActive
                          ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs ring-1 ring-slate-900/10"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700",
                      )}
                    >
                      {chip.color && (
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: chip.color }} />
                      )}
                      <span>{chip.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Status Chips */}
              <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-800 pl-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">Status:</span>
                {PLACEMENT_STATUS_CHIPS.map((chip) => {
                  const isActive = selectedStatus === chip.value;
                  return (
                    <button
                      key={chip.value}
                      type="button"
                      onClick={() => handleStatusFilter(chip.value)}
                      className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer",
                        isActive
                          ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs ring-1 ring-slate-900/10"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700",
                      )}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari placement / outlet..."
                value={marcomFilters["placements"] || ""}
                onChange={(e) => setMarcomFilter("placements", e.target.value)}
                className="w-full pl-8 pr-8 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-lime-500"
              />
              {marcomFilters["placements"] && (
                <button
                  type="button"
                  onClick={() => setMarcomFilter("placements", "")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Interactive Map */}
          <PlacementsMapView
            placements={filteredPlacements}
            onEditPlacement={(p) => setModalPlacement(p)}
            onTrackAsTask={handleTrackAsTask}
            canManage={canManage}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  Rekapitulasi POSM Regional (Kuartal &amp; Tema)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Distribusi materi promosi per tema kampanye dan alokasi target kuartalan
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {viewSwitcherControls}
              <button
                type="button"
                onClick={() => loadPlacements(true)}
                title="Refresh data"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
              </button>
            </div>
          </div>

          <QuarterlyRecapTab
            placements={placements}
            branches={storeBranches}
            materials={materialsList}
            workspaceId={activeWorkspaceId}
            onDrillDown={handleDrillDown}
            onRecordPlacement={canManage ? handleOpenAddPlacement : undefined}
          />
        </div>
      )}

      <PlacementDetailDrawer
        placement={selectedPlacement}
        onClose={() => setSelectedPlacement(null)}
        onEdit={(p) => setModalPlacement(p)}
        onTrackAsTask={handleTrackAsTask}
        canManage={canManage}
      />

      <PlacementFormModal
        placement={modalPlacement}
        onClose={() => setModalPlacement(null)}
        onSave={handleSavePlacement}
        setPlacement={setModalPlacement}
        isSaving={isSaving}
        outletsList={outletsList}
        materialsList={materialsList}
        mousList={mousList}
        placements={placements}
      />
    </>
  );
}
