"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ClipboardList, Download, Plus, Edit2, CheckSquare } from "lucide-react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useMarcomPermissions } from "@/lib/marcom/permissions";
import { cn } from "@/lib/utils";
import {
  MarcomTableShell,
  createMarcomColumnHelper,
} from "@/components/views/shared/MarcomTableShell";

export type PlacementStatus = "NOT_STARTED" | "ON_PROGRESS" | "DONE" | "ISSUE";

export interface MarcomPlacement {
  id: string;
  outletId: string;
  materialId: string;
  status: PlacementStatus;
  date: string | null;
  picName: string;
  photoUrl: string;
  dimensions: string;
  cost: number;
  notes: string;
  outlet?: { id: string; code: string; name: string };
  material?: { id: string; type: string; name: string };
}

const columnHelper = createMarcomColumnHelper<MarcomPlacement>();

const STATUS_STYLES: Record<PlacementStatus, string> = {
  NOT_STARTED: "bg-slate-500/10 text-slate-500 dark:text-slate-400",
  ON_PROGRESS: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  DONE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  ISSUE: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

export function PlacementsView() {
  const { can } = useMarcomPermissions();
  const { tasks, createTask, setSelectedTaskId, workspaces, activeWorkspaceId, setExportCenterOpen } = useWorkspaceStore();

  const [placements, setPlacements] = useState<MarcomPlacement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [outletsList, setOutletsList] = useState<{ id: string; name: string }[]>([]);
  const [materialsList, setMaterialsList] = useState<{ id: string; name: string }[]>([]);
  const [modalPlacement, setModalPlacement] = useState<Partial<MarcomPlacement> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const canManage = can("CREATE_PLACEMENT");

  const handleTrackAsTask = (placement: MarcomPlacement) => {
    const existing = tasks.find((t) => t.relatedMarcomId === placement.id);
    if (existing) {
      setSelectedTaskId(existing.id);
      toast.info("Opened existing production task");
      return;
    }
    const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];
    const members = currentWorkspace?.members || [];
    const task = createTask({
      listId: "list-field-ops",
      title: `[Placement] ${placement.material?.name || "Branding"} - ${placement.outlet?.name || "Outlet"}`,
      description: `<p><strong>Material:</strong> ${placement.material?.name || "N/A"}</p><p><strong>Dimensions:</strong> ${placement.dimensions || "To be measured"}</p><p><strong>PIC:</strong> ${placement.picName || "Unassigned"}</p><p>${placement.notes || ""}</p>`,
      statusId: "status-in-progress",
      priority: placement.status === "ISSUE" ? "urgent" : "normal",
      assignees: members[0] ? [members[0]] : [],
      relatedMarcomId: placement.id,
      mediaUrl: placement.photoUrl || undefined,
      tags: [],
      subtasks: [
        { id: `st-place-${Date.now()}-1`, title: `Survey outlet site & confirm dimensions: ${placement.dimensions || "N/A"}`, completed: false, createdAt: new Date().toISOString() },
        { id: `st-place-${Date.now()}-2`, title: "Artwork design & print vendor proof approval", completed: false, createdAt: new Date().toISOString() },
        { id: `st-place-${Date.now()}-3`, title: "Logistics dispatch & on-site installation", completed: false, createdAt: new Date().toISOString() },
        { id: `st-place-${Date.now()}-4`, title: "Upload verified installation photo proof", completed: false, createdAt: new Date().toISOString() },
      ],
      orderIndex: tasks.length,
    });
    toast.success("Production task created in Field Operations!");
    setSelectedTaskId(task.id);
  };

  const fetchPlacements = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [resPlacements, resOutlets, resMaterials] = await Promise.all([
        fetch("/api/marcom/placements"),
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
  }, []);

  useEffect(() => {
    fetchPlacements();
  }, [fetchPlacements]);

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
          cell: ({ row }) => <span className="truncate font-semibold text-slate-900 dark:text-slate-100">{row.original.outlet?.name ?? row.original.outletId}</span>,
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
          cell: ({ row }) => <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold", STATUS_STYLES[row.original.status] ?? STATUS_STYLES.NOT_STARTED)}>{row.original.status.replaceAll("_", " ")}</span>,
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
          size: 120, minSize: 90,
          cell: ({ row }) => <span className="text-slate-700 dark:text-slate-300">{typeof row.original.cost === "number" ? row.original.cost.toLocaleString() : "—"}</span>,
        }),
        columnHelper.display({
          id: "expander",
          header: () => null,
          size: 40, minSize: 40, maxSize: 40, enableSorting: false,
          cell: () => <div className="flex justify-end"><span className="w-4 h-4 text-slate-400 flex items-center justify-center">›</span></div>,
        }),
      ]),
    [],
  );

  const handleSavePlacement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalPlacement) return;
    const { id, outletId, materialId, status, dimensions, cost, picName, notes, photoUrl, date } = modalPlacement;
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
        body: JSON.stringify({ outletId, materialId, status: status || "NOT_STARTED", dimensions: dimensions || "", cost: cost != null ? Number(cost) : undefined, picName: picName || "", notes: notes || "", photoUrl: photoUrl || "", date: date || new Date().toISOString() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to save placement (${res.status})`);
      }
      toast.success(`Placement ${isEdit ? "updated" : "created"} successfully`);
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

  return (
    <>
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
        onAdd={() => setModalPlacement({ outletId: outletsList[0]?.id || "", materialId: materialsList[0]?.id || "", status: "NOT_STARTED", dimensions: "", cost: undefined, picName: "", notes: "", photoUrl: "", date: new Date().toISOString().slice(0, 10) })}
        addLabel="Add Placement"
        addIcon={Plus}
        addClassName="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-lime-600 hover:bg-lime-700 transition-colors shadow-2xs cursor-pointer"
        headerExtra={
          <button type="button" onClick={() => setExportCenterOpen(true)} title="Open Export Center — PDF summaries & Excel sheets" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border shadow-xs bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        }
        renderExpanded={(placement) => (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">Dimensions</div>
                <div className="text-slate-700 dark:text-slate-300">{placement.dimensions || "—"}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">PIC</div>
                <div className="text-slate-700 dark:text-slate-300">{placement.picName || "—"}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">Notes</div>
                <div className="text-slate-700 dark:text-slate-300">{placement.notes || "—"}</div>
              </div>
            </div>
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
        )}
        emptyLabel="No placements found."
      />

      {modalPlacement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-lime-600" />
                {modalPlacement.id ? "Edit Placement" : "Add New Placement"}
              </h2>
              <button type="button" onClick={() => setModalPlacement(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleSavePlacement} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Outlet *</label>
                  <select required value={modalPlacement.outletId || ""} onChange={(e) => setModalPlacement({ ...modalPlacement, outletId: e.target.value })} className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-lime-500 cursor-pointer">
                    <option value="">Select Outlet...</option>
                    {outletsList.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Material *</label>
                  <select required value={modalPlacement.materialId || ""} onChange={(e) => setModalPlacement({ ...modalPlacement, materialId: e.target.value })} className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-lime-500 cursor-pointer">
                    <option value="">Select Material...</option>
                    {materialsList.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                  <select value={modalPlacement.status || "NOT_STARTED"} onChange={(e) => setModalPlacement({ ...modalPlacement, status: e.target.value as PlacementStatus })} className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-lime-500 cursor-pointer">
                    <option value="NOT_STARTED">Not Started</option>
                    <option value="ON_PROGRESS">On Progress</option>
                    <option value="DONE">Done</option>
                    <option value="ISSUE">Issue</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Dimensions</label>
                  <input type="text" placeholder="e.g. 2x1 meter" value={modalPlacement.dimensions || ""} onChange={(e) => setModalPlacement({ ...modalPlacement, dimensions: e.target.value })} className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-lime-500" />
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
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Photo / Proof URL (optional)</label>
                <input type="url" placeholder="https://..." value={modalPlacement.photoUrl || ""} onChange={(e) => setModalPlacement({ ...modalPlacement, photoUrl: e.target.value })} className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-lime-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Notes</label>
                <textarea rows={2} placeholder="Additional installation requirements..." value={modalPlacement.notes || ""} onChange={(e) => setModalPlacement({ ...modalPlacement, notes: e.target.value })} className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-lime-500" />
              </div>
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
