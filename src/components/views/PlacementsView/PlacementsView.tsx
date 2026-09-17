"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import {
  ClipboardList,
  Download,
  Plus,
  Edit2,
  CheckSquare,
  Store,
  X,
  MapPin,
  ExternalLink,
  TableProperties,
  Search,
  RefreshCw,
  Layers,
  Camera,
} from "lucide-react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useMarcomPermissions } from "@/lib/marcom/permissions";
import { cn, formatIDR } from "@/lib/utils";
import {
  MarcomTableShell,
  createMarcomColumnHelper,
} from "@/components/views/shared/MarcomTableShell";
import { LocationPicker } from "./LocationPicker";
import { PlacementPhotoUploader } from "./PlacementPhotoUploader";
import { parsePlacementPhotos } from "@/lib/marcom/photoUtils";
import { buildGoogleMapsUrl, isValidCoordinate } from "@/lib/marcom/locationUtils";
import { getBrandMeta, BRAND_CONFIG } from "@/lib/marcom/brandUtils";
import {
  buildPlacementTaskPayload,
  syncTaskOnPlacementStatusChange,
} from "@/lib/tasks/placementTaskSync";

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

export type PlacementStatus = "NOT_STARTED" | "ON_PROGRESS" | "DONE" | "ISSUE";

export interface MarcomPlacement {
  id: string;
  outletId: string;
  materialId: string;
  status: PlacementStatus;
  brand?: "IM3" | "3" | string;
  date: string | null;
  picName: string;
  photoUrl: string;
  dimensions: string;
  cost: number;
  notes: string;
  latitude?: number | null;
  longitude?: number | null;
  shareLocationUrl?: string;
  locationNotes?: string;
  outlet?: { id: string; code: string; name: string; brand?: string };
  material?: { id: string; type: string; name: string };
}

const columnHelper = createMarcomColumnHelper<MarcomPlacement>();

const BRAND_CHIPS: { label: string; value: string; color?: string }[] = [
  { label: "All Brands", value: "ALL" },
  { label: "IM3", value: "IM3", color: "#EAB308" },
  { label: "3 (Tri)", value: "3", color: "#EC4899" },
];

const PLACEMENT_STATUS_CHIPS: { label: string; value: string }[] = [
  { label: "All", value: "ALL" },
  { label: "To Do", value: "NOT_STARTED" },
  { label: "In Progress", value: "ON_PROGRESS" },
  { label: "Done", value: "DONE" },
];

const STATUS_STYLES: Record<PlacementStatus, string> = {
  NOT_STARTED: "bg-slate-500/10 text-slate-500 dark:text-slate-400",
  ON_PROGRESS: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  DONE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  ISSUE: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

export function PlacementsView() {
  const { can } = useMarcomPermissions();
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId) || "ws-main";
  const {
    tasks,
    createTask,
    setSelectedTaskId,
    workspaces,
    setExportCenterOpen,
    marcomFilters,
    setMarcomFilter,
    navigateToMarcom,
  } = useWorkspaceStore();

  const [placements, setPlacements] = useState<MarcomPlacement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedBrand, setSelectedBrand] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "map">("table");
  const [outletsList, setOutletsList] = useState<{ id: string; name: string; brand?: string }[]>([]);
  const [materialsList, setMaterialsList] = useState<{ id: string; name: string }[]>([]);
  const [modalPlacement, setModalPlacement] = useState<Partial<MarcomPlacement> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const canManage = can("CREATE_PLACEMENT");

  const filteredPlacements = useMemo(() => {
    const query = (marcomFilters["placements"] || "").toLowerCase().trim();
    return placements.filter((p) => {
      if (selectedBrand !== "ALL") {
        const pBrand = (p.brand || "IM3").toUpperCase();
        const target = selectedBrand.toUpperCase();
        if (target === "3" && pBrand !== "3" && pBrand !== "TRI") return false;
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
  }, [placements, marcomFilters, selectedBrand]);

  const handleTrackAsTask = (placement: MarcomPlacement) => {
    const existing = tasks.find((t) => t.relatedMarcomId === placement.id);
    if (existing) {
      setSelectedTaskId(existing.id);
      toast.info("Opened existing production task");
      return;
    }
    const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];
    const targetSpace =
      currentWorkspace?.spaces.find((s) => s.lists.some((l) => l.id === "list-field-ops")) ||
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

  const fetchPlacements = useCallback(
    async (statusFilter = selectedStatus, brandFilter = selectedBrand) => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("workspaceId", activeWorkspaceId);
        if (statusFilter && statusFilter !== "ALL") {
          params.set("status", statusFilter);
        }
        if (brandFilter && brandFilter !== "ALL") {
          params.set("brand", brandFilter);
        }
        const placementsUrl = `/api/marcom/placements?${params.toString()}`;
        const [resPlacements, resOutlets, resMaterials] = await Promise.all([
          fetch(placementsUrl),
          fetch("/api/marcom/outlets"),
          fetch("/api/marcom/materials"),
        ]);
        if (!resPlacements.ok) throw new Error(`Request failed (${resPlacements.status})`);
        const jsonPlacements = await resPlacements.json();
        setPlacements(Array.isArray(jsonPlacements.data) ? jsonPlacements.data : []);
        if (resOutlets.ok) {
          const jsonOutlets = await resOutlets.json();
          setOutletsList(Array.isArray(jsonOutlets.data) ? jsonOutlets.data : []);
        }
        if (resMaterials.ok) {
          const jsonMaterials = await resMaterials.json();
          setMaterialsList(Array.isArray(jsonMaterials.data) ? jsonMaterials.data : []);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load placements");
      } finally {
        setIsLoading(false);
      }
    },
    [selectedStatus, selectedBrand, activeWorkspaceId],
  );

  useEffect(() => {
    fetchPlacements(selectedStatus, selectedBrand);
  }, [fetchPlacements, selectedStatus, selectedBrand, activeWorkspaceId]);

  const handleStatusFilter = (status: string) => {
    const next = selectedStatus === status && status !== "ALL" ? "ALL" : status;
    setSelectedStatus(next);
    fetchPlacements(next, selectedBrand);
  };

  const handleBrandFilter = (brand: string) => {
    const next = selectedBrand === brand && brand !== "ALL" ? "ALL" : brand;
    setSelectedBrand(next);
    fetchPlacements(selectedStatus, next);
  };

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.display({
          id: "select",
          header: ({ table }) => (
            <div className="flex items-center justify-center">
              <input type="checkbox" aria-label="Select all placements" checked={table.getIsAllRowsSelected()} ref={(el) => { if (el) el.indeterminate = table.getIsSomeRowsSelected(); }} onChange={table.getToggleAllRowsSelectedHandler()} className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-teal-600 focus:ring-teal-500 cursor-pointer accent-teal-600" />
            </div>
          ),
          cell: ({ row }) => (
            <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <input type="checkbox" aria-label={`Select placement ${row.original.id}`} checked={row.getIsSelected()} disabled={!row.getCanSelect()} onChange={row.getToggleSelectedHandler()} className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-teal-600 focus:ring-teal-500 cursor-pointer accent-teal-600" />
            </div>
          ),
          size: 36, minSize: 36, maxSize: 36, enableSorting: false,
        }),
        columnHelper.display({
          id: "outlet",
          header: "Outlet",
          size: 220, minSize: 140,
          cell: ({ row }) => {
            const outletName = row.original.outlet?.name;
            return (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (outletName) {
                    navigateToMarcom("outlets", outletName);
                  }
                }}
                className="truncate font-semibold text-slate-900 dark:text-slate-100 hover:text-orange-600 dark:hover:text-orange-400 hover:underline cursor-pointer flex items-center gap-1.5 text-left"
                title={outletName ? `Jump to Outlets view for "${outletName}"` : undefined}
              >
                <Store className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <span className="truncate">{outletName ?? row.original.outletId}</span>
              </button>
            );
          },
        }),
        columnHelper.display({
          id: "brand",
          header: "Brand",
          size: 110,
          minSize: 90,
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
        columnHelper.display({
          id: "material",
          header: "Material",
          size: 200, minSize: 140, enableSorting: false,
          cell: ({ row }) => <span className="truncate text-slate-700 dark:text-slate-300">{row.original.material?.name ?? row.original.materialId}</span>,
        }),
        columnHelper.accessor("status", {
          id: "status",
          header: "Status",
          size: 130, minSize: 110,
          cell: ({ row }) => {
            const label =
              row.original.status === "NOT_STARTED"
                ? "To Do"
                : row.original.status === "ON_PROGRESS"
                ? "In Progress"
                : row.original.status === "DONE"
                ? "Done"
                : row.original.status.replaceAll("_", " ");
            return (
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold",
                  STATUS_STYLES[row.original.status] ?? STATUS_STYLES.NOT_STARTED,
                )}
              >
                {label}
              </span>
            );
          },
        }),
        columnHelper.display({
          id: "date",
          header: "Date",
          size: 120, minSize: 100, enableSorting: false,
          cell: ({ row }) => <span className="text-slate-500 dark:text-slate-400">{row.original.date ? new Date(row.original.date).toLocaleDateString() : "—"}</span>,
        }),
        columnHelper.accessor("cost", {
          id: "cost",
          header: "Cost",
          size: 140, minSize: 110,
          cell: ({ row }) => <span className="text-slate-700 dark:text-slate-300">{typeof row.original.cost === "number" ? formatIDR(row.original.cost) : "—"}</span>,
        }),
        columnHelper.display({
          id: "expander",
          header: () => null,
          size: 40, minSize: 40, maxSize: 40, enableSorting: false,
          cell: () => <div className="flex justify-end"><span className="w-4 h-4 text-slate-400 flex items-center justify-center">›</span></div>,
        }),
      ]),
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
      toast.success(`Placement ${isEdit ? "updated" : "created"} successfully`);
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
      await fetchPlacements();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save placement");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteOne = useCallback(async (id: string) => {
    const res = await fetch(`/api/marcom/placements/${id}`, { method: "DELETE" });
    return res.ok;
  }, []);

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
    </div>
  );

  return (
    <>
      {viewMode === "table" ? (
        <MarcomTableShell
          data={placements}
          columns={columns}
          getRowId={(row) => row.id}
          initialSorting={[{ id: "outlet", desc: false }]}
          title="Placements"
          titleIcon={ClipboardList}
          entityName="placement"
          entityPlural="placements"
          isLoading={isLoading}
          error={error}
          onRefresh={fetchPlacements}
          canDelete={canManage}
          deleteRequiresMessage="Delete requires staff or admin role"
          onDeleteOne={deleteOne}
          canAdd={canManage}
          onAdd={() =>
            setModalPlacement({
              outletId: outletsList[0]?.id || "",
              materialId: materialsList[0]?.id || "",
              status: "NOT_STARTED",
              brand:
                outletsList[0]?.brand &&
                (outletsList[0].brand.toUpperCase() === "3" ||
                  outletsList[0].brand.toUpperCase() === "TRI")
                  ? "3"
                  : "IM3",
              dimensions: "",
              cost: undefined,
              picName: "",
              notes: "",
              photoUrl: "",
              date: new Date().toISOString().slice(0, 10),
              latitude: null,
              longitude: null,
              shareLocationUrl: "",
              locationNotes: "",
            })
          }
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
          renderExpanded={(placement: MarcomPlacement) => {
            const hasCoords = isValidCoordinate(
              placement.latitude ?? Number.NaN,
              placement.longitude ?? Number.NaN,
            );
            return (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">Dimensions</div>
                    <div className="text-slate-700 dark:text-slate-300">{placement.dimensions || "—"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">PIC</div>
                    <div className="text-slate-700 dark:text-slate-300">{placement.picName || "—"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">Lokasi & GPS</div>
                    <div className="text-slate-700 dark:text-slate-300">
                      {hasCoords ? (
                        <div className="space-y-0.5">
                          <a
                            href={buildGoogleMapsUrl(placement.latitude as number, placement.longitude as number)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                          >
                            <MapPin className="w-3 h-3 text-emerald-500" />
                            <span>Lihat di Maps</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                          {placement.locationNotes && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                              {placement.locationNotes}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Belum ada titik GPS</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">Notes</div>
                    <div className="text-slate-700 dark:text-slate-300">{placement.notes || "—"}</div>
                  </div>
                </div>

                {/* Photo Proof Gallery in Expanded Row */}
                {(() => {
                  const proofPhotos = parsePlacementPhotos(placement.photoUrl);
                  if (proofPhotos.length === 0) return null;
                  return (
                    <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800">
                      <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Foto Bukti Pemasangan ({proofPhotos.length})</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {proofPhotos.map((url, i) => (
                          <a
                            key={`${url}-${i}`}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title={`Lihat Foto #${i + 1}`}
                            className="group relative w-14 h-14 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:scale-105 active:scale-95 transition-all shadow-2xs cursor-pointer"
                          >
                            <img
                              src={url}
                              alt={`Bukti #${i + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-0.5 right-0.5 px-1 rounded text-[8px] font-mono font-bold bg-black/60 text-white">
                              #{i + 1}
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Track installation checklist & operations in workspace:</span>
                  <div className="flex items-center gap-2">
                    {canManage && (
                      <button type="button" onClick={(e) => { e.stopPropagation(); setModalPlacement(placement); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-2xs cursor-pointer">
                        <Edit2 className="w-3.5 h-3.5 text-lime-600" />
                        <span>Edit Placement</span>
                      </button>
                    )}
                    <button type="button" onClick={(e) => { e.stopPropagation(); handleTrackAsTask(placement); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-2xs cursor-pointer">
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>Track as Task Progress</span>
                    </button>
                  </div>
                </div>
              </>
            );
          }}
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
      ) : (
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
                onClick={() => fetchPlacements()}
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
                  onClick={() =>
                    setModalPlacement({
                      outletId: outletsList[0]?.id || "",
                      materialId: materialsList[0]?.id || "",
                      status: "NOT_STARTED",
                      brand:
                        outletsList[0]?.brand &&
                        (outletsList[0].brand.toUpperCase() === "3" ||
                          outletsList[0].brand.toUpperCase() === "TRI")
                          ? "3"
                          : "IM3",
                      dimensions: "",
                      cost: undefined,
                      picName: "",
                      notes: "",
                      photoUrl: "",
                      date: new Date().toISOString().slice(0, 10),
                      latitude: null,
                      longitude: null,
                      shareLocationUrl: "",
                      locationNotes: "",
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-lime-600 hover:bg-lime-700 transition-colors shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Placement</span>
                </button>
              )}
            </div>
          </div>

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
      )}

      {modalPlacement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-lime-600" />
                {modalPlacement.id ? "Edit Placement" : "Add New Placement"}
              </h2>
              <button type="button" onClick={() => setModalPlacement(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSavePlacement} className="space-y-3">
              {/* Brand Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Brand *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setModalPlacement((prev) => (prev ? { ...prev, brand: "IM3" } : prev))}
                    className={cn(
                      "flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer",
                      (modalPlacement.brand || "IM3") === "IM3"
                        ? "bg-yellow-400/20 text-yellow-900 dark:text-yellow-200 border-yellow-400 shadow-xs ring-2 ring-yellow-400/30"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-yellow-50/50",
                    )}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-[#EAB308]" />
                    <span>IM3 (Kuning)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalPlacement((prev) => (prev ? { ...prev, brand: "3" } : prev))}
                    className={cn(
                      "flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer",
                      modalPlacement.brand === "3"
                        ? "bg-pink-500/20 text-pink-900 dark:text-pink-200 border-pink-500 shadow-xs ring-2 ring-pink-500/30"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-pink-50/50",
                    )}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-[#EC4899]" />
                    <span>3 (Pink)</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Outlet *</label>
                  <select
                    required
                    value={modalPlacement.outletId || ""}
                    onChange={(e) => {
                      const selId = e.target.value;
                      const selOutlet = outletsList.find((o) => o.id === selId);
                      const brandSuggestion =
                        selOutlet?.brand &&
                        (selOutlet.brand.toUpperCase() === "3" ||
                          selOutlet.brand.toUpperCase() === "TRI")
                          ? "3"
                          : "IM3";
                      setModalPlacement((prev) =>
                        prev
                          ? {
                              ...prev,
                              outletId: selId,
                              brand: prev.brand || brandSuggestion,
                            }
                          : prev,
                      );
                    }}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-lime-500 cursor-pointer"
                  >
                    <option value="">Select Outlet...</option>
                    {outletsList.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Material *</label>
                  <select
                    required
                    value={modalPlacement.materialId || ""}
                    onChange={(e) => setModalPlacement((prev) => (prev ? { ...prev, materialId: e.target.value } : prev))}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-lime-500 cursor-pointer"
                  >
                    <option value="">Select Material...</option>
                    {materialsList.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                  <select
                    value={modalPlacement.status || "NOT_STARTED"}
                    onChange={(e) => setModalPlacement((prev) => (prev ? { ...prev, status: e.target.value as PlacementStatus } : prev))}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-lime-500 cursor-pointer"
                  >
                    <option value="NOT_STARTED">To Do</option>
                    <option value="ON_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Dimensions</label>
                  <input
                    type="text"
                    placeholder="e.g. 2x1 meter"
                    value={modalPlacement.dimensions || ""}
                    onChange={(e) => setModalPlacement((prev) => (prev ? { ...prev, dimensions: e.target.value } : prev))}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-lime-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Cost (Rp)</label>
                  <input type="number" placeholder="e.g. 250000" value={modalPlacement.cost != null ? String(modalPlacement.cost) : ""} onChange={(e) => setModalPlacement({ ...modalPlacement, cost: e.target.value ? Number(e.target.value) : undefined })} className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-lime-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">PIC Name</label>
                  <input type="text" placeholder="e.g. Budi" value={modalPlacement.picName || ""} onChange={(e) => setModalPlacement({ ...modalPlacement, picName: e.target.value })} className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-lime-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 cursor-pointer">Date</label>
                <input type="date" value={modalPlacement.date ? modalPlacement.date.slice(0, 10) : ""} onClick={(e) => { try { e.currentTarget.showPicker(); } catch {} }} onFocus={(e) => { try { e.currentTarget.showPicker(); } catch {} }} onChange={(e) => setModalPlacement({ ...modalPlacement, date: e.target.value })} className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-lime-500 cursor-pointer" />
              </div>
              {/* Multi-Photo Field Proof Uploader (Camera, Gallery, Compress) */}
              <PlacementPhotoUploader
                photoUrl={modalPlacement.photoUrl || ""}
                placementId={modalPlacement.id}
                disabled={isSaving}
                onChange={(newPhotoUrl) =>
                  setModalPlacement((prev) =>
                    prev ? { ...prev, photoUrl: newPhotoUrl } : prev,
                  )
                }
              />
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Notes</label>
                <textarea rows={2} placeholder="Additional installation requirements..." value={modalPlacement.notes || ""} onChange={(e) => setModalPlacement({ ...modalPlacement, notes: e.target.value })} className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-lime-500" />
              </div>

              {/* Location & GPS Shareloc Picker */}
              <LocationPicker
                latitude={modalPlacement.latitude}
                longitude={modalPlacement.longitude}
                shareLocationUrl={modalPlacement.shareLocationUrl}
                locationNotes={modalPlacement.locationNotes}
                onChange={(loc) =>
                  setModalPlacement((prev) => (prev ? { ...prev, ...loc } : prev))
                }
              />

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setModalPlacement(null)} disabled={isSaving} className="px-3 py-1.5 text-xs rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">Cancel</button>
                <button type="submit" disabled={isSaving} className="px-4 py-1.5 text-xs rounded-xl font-bold text-white bg-lime-600 hover:bg-lime-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-50">{isSaving ? "Saving..." : modalPlacement.id ? "Update Placement" : "Create Placement"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
