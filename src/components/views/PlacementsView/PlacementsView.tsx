"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ClipboardList } from "lucide-react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useMarcomPermissions } from "@/lib/marcom/permissions";
import { useMarcomDataStore } from "@/lib/marcom/marcomDataStore";
import { MarcomTableShell } from "@/components/views/shared/MarcomTableShell";
import { buildPlacementKpiItems } from "./placementKpi";
import { PlacementBulkActionBar } from "./PlacementBulkActionBar";
import { PlacementFormModal } from "./PlacementFormModal";
import { PlacementDetailDrawer } from "./PlacementDetailDrawer";
import { PlacementsMapTab } from "./PlacementsMapTab";
import { PlacementsRecapTab } from "./PlacementsRecapTab";
import { usePlacementMutations } from "./usePlacementMutations";
import { buildPlacementColumns } from "./placementColumns";
import { extractPlacementSearchText, PLACEMENT_SEARCH_KEYS } from "./placementSearchHelpers";
import { PlacementBrandChips, PlacementStatusChips } from "./PlacementFilterControls";
import { PlacementsHeader } from "./PlacementsHeader";
import type { PlacementStatus, MarcomPlacement } from "@/types";

export type { PlacementStatus, MarcomPlacement };


export function PlacementsView() {
  const { can } = useMarcomPermissions();
  const canManage = can("CREATE_PLACEMENT");
  const searchTerm = useWorkspaceStore((s) => s.marcomFilters["placements"] || "");
  const setExportCenterOpen = useWorkspaceStore((s) => s.setExportCenterOpen);
  const setMarcomFilter = useWorkspaceStore((s) => s.setMarcomFilter);
  const navigateToMarcom = useWorkspaceStore((s) => s.navigateToMarcom);

  const storeOutlets = useMarcomDataStore((s) => s.outlets);
  const storeMaterials = useMarcomDataStore((s) => s.materials);
  const storeBranches = useMarcomDataStore((s) => s.branches);
  const fetchOutlets = useMarcomDataStore((s) => s.fetchOutlets);
  const fetchMaterials = useMarcomDataStore((s) => s.fetchMaterials);
  const fetchBranches = useMarcomDataStore((s) => s.fetchBranches);
  const placements = useMarcomDataStore((s) => s.placements);
  const fetchPlacements = useMarcomDataStore((s) => s.fetchPlacements);
  const storeMous = useMarcomDataStore((s) => s.mous);

  const [isLoading, setIsLoading] = useState(() => useMarcomDataStore.getState().placements.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedBrand, setSelectedBrand] = useState("ALL");
  const [viewMode, setViewMode] = useState<"table" | "map" | "recap">("table");
  const [modalPlacement, setModalPlacement] = useState<Partial<MarcomPlacement> | null>(null);
  const [selectedPlacement, setSelectedPlacement] = useState<MarcomPlacement | null>(null);

  const outletsList = useMemo(
    () =>
      storeOutlets.map((o) => ({
        id: o.id,
        name: o.name,
        code: o.code,
        brand: o.brand,
        address: o.address,
        city: o.city,
        latitude: o.latitude,
        longitude: o.longitude,
        picName: o.picName,
        picPhone: o.picPhone,
        branchId: o.branchId,
      })),
    [storeOutlets]
  );
  const materialsList = useMemo(() => storeMaterials.map((m) => ({ id: m.id, name: m.name, type: m.type, requiresMou: m.requiresMou })), [storeMaterials]);

  const { isSaving, handleSavePlacement, handleOpenAddPlacement, deleteOne, deleteBatch } =
    usePlacementMutations({ modalPlacement, setModalPlacement, setSelectedPlacement, outletsList, materialsList, placements, mousList: storeMous });

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

  const mapPlacements = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return q ? filteredPlacements.filter((p) => extractPlacementSearchText(p).includes(q)) : filteredPlacements;
  }, [filteredPlacements, searchTerm]);

  const kpiItems = useMemo(() => buildPlacementKpiItems(filteredPlacements), [filteredPlacements]);
  const columns = useMemo(() => buildPlacementColumns({ navigateToMarcom }), [navigateToMarcom]);

  const loadPlacements = useCallback(async (force = false) => {
    const hasCache = useMarcomDataStore.getState().placements.length > 0;
    if (!hasCache) setIsLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchPlacements(force),
        fetchOutlets(force),
        fetchMaterials(force),
        fetchBranches(force),
        useMarcomDataStore.getState().fetchMous(force),
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load placements");
    } finally {
      setIsLoading(false);
    }
  }, [fetchPlacements, fetchOutlets, fetchMaterials, fetchBranches]);

  useEffect(() => { loadPlacements(); }, [loadPlacements]);

  const handleDrillDown = useCallback((filter: { quarter: string; campaignTheme?: string; materialName?: string }) => {
    setViewMode("table");
    if (filter.campaignTheme) setMarcomFilter("placements", filter.campaignTheme);
    else if (filter.materialName) setMarcomFilter("placements", filter.materialName);
    toast.info(`Menampilkan outlet dengan materi: ${filter.campaignTheme || filter.materialName || "Semua"} (${filter.quarter})`);
  }, [setMarcomFilter]);

  const brandChips = <PlacementBrandChips selectedBrand={selectedBrand} onBrandChange={(b) => setSelectedBrand((prev) => (prev === b && b !== "ALL" ? "ALL" : b))} />;
  const statusFilterChips = (
    <PlacementStatusChips
      selectedStatus={selectedStatus}
      onStatusChange={(s) => setSelectedStatus((prev) => (prev === s && s !== "ALL" ? "ALL" : s))}
      onReset={() => { setSelectedStatus("ALL"); setSelectedBrand("ALL"); }}
      isFiltered={selectedStatus !== "ALL" || selectedBrand !== "ALL"}
    />
  );
  return (
    <div className="flex flex-col h-full bg-[#FAFBFC] dark:bg-[#121316] overflow-y-auto">
      {/* 1. Unified Top Header Zone (Equipment Inventory Style) */}
      <PlacementsHeader
        totalPlacements={filteredPlacements.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        isLoading={isLoading}
        onRefresh={() => loadPlacements(true)}
        onExport={() => setExportCenterOpen(true)}
        canManage={canManage}
        onAddPlacement={handleOpenAddPlacement}
        kpiItems={kpiItems}
      />

      {/* 2. Dynamic Content Area */}
      <div className="p-4 sm:p-6 flex-1 min-h-0">
        {viewMode === "table" ? (
          <MarcomTableShell
            noPadding
            hideTitle
            hideRefreshButton
            data={filteredPlacements}
            columns={columns}
            getRowId={(row) => row.id}
            initialSorting={[{ id: "date", desc: true }]}
            title="Placements"
            titleIcon={ClipboardList}
            entityName="placement"
            entityPlural="placements"
            isLoading={isLoading}
            error={error}
            onRefresh={() => loadPlacements(true)}
            canDelete={canManage}
            deleteRequiresMessage="Delete requires staff or admin role"
            onDeleteOne={deleteOne}
            onDeleteBatch={deleteBatch}
            canAdd={false}
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
            headerExtra={brandChips}
            onRowClick={(p) => setSelectedPlacement(p)}
            filterBar={statusFilterChips}
            searchKeys={PLACEMENT_SEARCH_KEYS}
            getSearchableText={extractPlacementSearchText}
            searchTerm={searchTerm}
            onSearchChange={(q) => setMarcomFilter("placements", q)}
            emptyLabel="No placements found."
          />
        ) : viewMode === "map" ? (
        <PlacementsMapTab
          placements={mapPlacements}
          brandChips={brandChips}
          statusFilterChips={statusFilterChips}
          searchTerm={searchTerm}
          onSearchChange={(q) => setMarcomFilter("placements", q)}
          onEditPlacement={setModalPlacement}
          canManage={canManage}
        />
      ) : (
        <PlacementsRecapTab
          placements={placements}
          branches={storeBranches}
          materials={materialsList}
          onDrillDown={handleDrillDown}
          onRecordPlacement={canManage ? handleOpenAddPlacement : undefined}
        />
      )}
      </div>

      <PlacementDetailDrawer
        placement={selectedPlacement}
        onClose={() => setSelectedPlacement(null)}
        onEdit={setModalPlacement}
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
        mousList={storeMous}
        placements={placements}
      />
    </div>
  );
}
