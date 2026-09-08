"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Store, Plus, Edit2, Building2, ClipboardList, Filter } from "lucide-react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useMarcomPermissions } from "@/lib/marcom/permissions";
import { cn } from "@/lib/utils";
import {
  MarcomTableShell,
  createMarcomColumnHelper,
} from "@/components/views/shared/MarcomTableShell";

export type OutletType = "TRADITIONAL" | "MODERN_RETAIL" | "EXCLUSIVE" | "CAMPUS_OUTLET";
export type OutletTier = "TIER_1" | "TIER_2" | "TIER_3";

export interface MarcomOutlet {
  id: string;
  code: string;
  name: string;
  type: OutletType;
  tier?: OutletTier;
  address: string;
  city: string;
  picName: string;
  picPhone: string;
  active: boolean;
  branchId: string;
  branch?: { id: string; code: string; name: string };
  placementCount?: number;
}

const columnHelper = createMarcomColumnHelper<MarcomOutlet>();

const TYPE_STYLES: Record<OutletType, string> = {
  TRADITIONAL: "bg-slate-500/10 text-slate-500 dark:text-slate-400",
  MODERN_RETAIL: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  EXCLUSIVE: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  CAMPUS_OUTLET: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
};

export function OutletsView() {
  const { can, role } = useMarcomPermissions();
  const { marcomFilters, setMarcomFilter, navigateToMarcom, setSelectedBranchId } = useWorkspaceStore();

  const [outlets, setOutlets] = useState<MarcomOutlet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [branches, setBranches] = useState<{ id: string; name: string; code: string }[]>([]);
  const [modalOutlet, setModalOutlet] = useState<Partial<MarcomOutlet> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

        const [resOutlets, resBranches] = await Promise.all([
          fetch(outletsUrl),
          fetch("/api/marcom/branches"),
        ]);
        if (!resOutlets.ok) throw new Error(`Request failed (${resOutlets.status})`);
        const jsonOutlets = await resOutlets.json();
        setOutlets(Array.isArray(jsonOutlets.data) ? jsonOutlets.data : []);
        if (resBranches.ok) {
          const jsonBranches = await resBranches.json();
          setBranches(Array.isArray(jsonBranches.data) ? jsonBranches.data : []);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load outlets");
      } finally {
        setIsLoading(false);
      }
    },
    [selectedBranch, selectedType],
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
                className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-teal-600 focus:ring-teal-500 cursor-pointer accent-teal-600"
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
                className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-teal-600 focus:ring-teal-500 cursor-pointer accent-teal-600"
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
          size: 100,
          minSize: 80,
          cell: ({ row }) => <span className="font-semibold text-slate-900 dark:text-slate-100">{row.original.code}</span>,
        }),
        columnHelper.accessor("name", {
          id: "name",
          header: "Outlet Name",
          size: 220,
          minSize: 140,
          cell: ({ row }) => <span className="truncate text-slate-700 dark:text-slate-300">{row.original.name}</span>,
        }),
        columnHelper.accessor("type", {
          id: "type",
          header: "Type",
          size: 150,
          minSize: 120,
          cell: ({ row }) => (
            <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold", TYPE_STYLES[row.original.type] ?? TYPE_STYLES.TRADITIONAL)}>
              {row.original.type.replaceAll("_", " ")}
            </span>
          ),
        }),
        columnHelper.accessor("city", { id: "city", header: "City", size: 140, minSize: 100 }),
        columnHelper.display({
          id: "branch",
          header: "Branch",
          size: 190,
          minSize: 130,
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
          id: "active",
          header: "Active",
          size: 90,
          minSize: 70,
          enableSorting: false,
          cell: ({ row }) => (
            <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold", row.original.active ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-slate-500/10 text-slate-500 dark:text-slate-400")}>
              {row.original.active ? "Active" : "Inactive"}
            </span>
          ),
        }),
        columnHelper.display({
          id: "expander",
          header: () => null,
          size: 40,
          minSize: 40,
          maxSize: 40,
          enableSorting: false,
          cell: () => <div className="flex justify-end"><span className="w-4 h-4 text-slate-400 flex items-center justify-center">›</span></div>,
        }),
      ]),
    [navigateToMarcom, setSelectedBranchId],
  );

  const handleSaveOutlet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalOutlet) return;
    const { id, code, name, type, tier, branchId, city, address, picName, picPhone } = modalOutlet;
    if (!code || !name || !type || !tier || !branchId) {
      toast.error("Code, name, type, tier, and branch are required");
      return;
    }
    setIsSaving(true);
    try {
      const isEdit = Boolean(id);
      const url = isEdit ? `/api/marcom/outlets/${id}` : "/api/marcom/outlets";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, name, type, tier: modalOutlet.tier || "TIER_1", branchId, city: city || "", address: address || "", picName: picName || "", picPhone: picPhone || "" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to save outlet (${res.status})`);
      }
      toast.success(`Outlet ${isEdit ? "updated" : "created"} successfully`);
      setModalOutlet(null);
      await fetchOutlets();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save outlet");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteOne = useCallback(async (id: string) => {
    const res = await fetch(`/api/marcom/outlets/${id}`, { method: "DELETE" });
    return res.ok;
  }, []);

  return (
    <>
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
        canAdd={canAddOutlet}
        onAdd={() => setModalOutlet({ code: "", name: "", type: "TRADITIONAL", branchId: branches[0]?.id || "", city: "", address: "", picName: "", picPhone: "" })}
        addLabel="Add Outlet"
        addIcon={Plus}
        addClassName="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 transition-colors shadow-2xs cursor-pointer"
        filterBar={
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Branch:</span>
              <select
                value={selectedBranch}
                onChange={(e) => handleBranchChange(e.target.value)}
                aria-label="Filter by branch"
                className="max-w-[190px] sm:max-w-[240px] px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500 truncate cursor-pointer"
              >
                <option value="ALL">All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Store Type:</span>
              <select
                value={selectedType}
                onChange={(e) => handleTypeChange(e.target.value)}
                aria-label="Filter by store type"
                className="px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500 cursor-pointer"
              >
                <option value="ALL">All Store Types</option>
                <option value="TRADITIONAL">Traditional</option>
                <option value="MODERN_RETAIL">Modern Retail</option>
                <option value="EXCLUSIVE">Official Store / Exclusive</option>
                <option value="CAMPUS_OUTLET">Campus Outlet</option>
              </select>
            </div>
            {(selectedBranch !== "ALL" || selectedType !== "ALL") && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-orange-600 hover:text-orange-700 dark:text-orange-400 underline font-medium cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        }
        renderExpanded={(outlet) => (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">Address</div>
                <div className="text-slate-700 dark:text-slate-300">{outlet.address || "—"}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">PIC</div>
                <div className="text-slate-700 dark:text-slate-300">{outlet.picName || "—"}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">PIC Phone</div>
                <div className="text-slate-700 dark:text-slate-300">{outlet.picPhone || "—"}</div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {outlet.branch && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBranchId(outlet.branchId);
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 dark:hover:bg-cyan-900/40 transition-colors shadow-2xs cursor-pointer"
                    >
                      <Building2 className="w-3.5 h-3.5 text-cyan-500" />
                      <span>Branch Details ({outlet.branch.name})</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBranchChange(outlet.branchId);
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
                    >
                      <Filter className="w-3.5 h-3.5 text-slate-500" />
                      <span>Filter by this Branch</span>
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateToMarcom("placements", outlet.name);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-lime-700 dark:text-lime-300 bg-lime-50 dark:bg-lime-950/40 border border-lime-200 dark:border-lime-800 hover:bg-lime-100 dark:hover:bg-lime-900/40 transition-colors shadow-2xs cursor-pointer"
                >
                  <ClipboardList className="w-3.5 h-3.5 text-lime-500" />
                  <span>View Placements ({outlet.placementCount ?? 0})</span>
                </button>
              </div>
              {canAddOutlet && (
                <button type="button" onClick={(e) => { e.stopPropagation(); setModalOutlet(outlet); }} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-2xs cursor-pointer">
                  <Edit2 className="w-3.5 h-3.5 text-orange-600" />
                  <span>Edit Outlet</span>
                </button>
              )}
            </div>
          </>
        )}
        searchTerm={marcomFilters["outlets"] || ""}
        onSearchChange={(q) => setMarcomFilter("outlets", q)}
        emptyLabel="No outlets found."
      />

      {modalOutlet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Store className="w-4 h-4 text-orange-600" />
                {modalOutlet.id ? "Edit Outlet" : "Add New Outlet"}
              </h2>
              <button type="button" onClick={() => setModalOutlet(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleSaveOutlet} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Outlet Code *</label>
                  <input type="text" required placeholder="e.g. OUT-001" value={modalOutlet.code || ""} onChange={(e) => setModalOutlet({ ...modalOutlet, code: e.target.value })} className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Parent Branch *</label>
                  <select required value={modalOutlet.branchId || ""} onChange={(e) => setModalOutlet({ ...modalOutlet, branchId: e.target.value })} className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500 cursor-pointer">
                    <option value="">Select Branch...</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Outlet Name *</label>
                  <input type="text" required placeholder="e.g. Toko Berkah Mandiri" value={modalOutlet.name || ""} onChange={(e) => setModalOutlet({ ...modalOutlet, name: e.target.value })} className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Type *</label>
                  <select value={modalOutlet.type || "TRADITIONAL"} onChange={(e) => setModalOutlet({ ...modalOutlet, type: e.target.value as OutletType })} className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500 cursor-pointer">
                    <option value="TRADITIONAL">Traditional</option>
                    <option value="MODERN_RETAIL">Modern Retail</option>
                    <option value="EXCLUSIVE">Exclusive</option>
                    <option value="CAMPUS_OUTLET">Campus Outlet</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">City</label>
                  <input type="text" placeholder="e.g. Jakarta" value={modalOutlet.city || ""} onChange={(e) => setModalOutlet({ ...modalOutlet, city: e.target.value })} className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">PIC Name</label>
                  <input type="text" placeholder="e.g. Andi" value={modalOutlet.picName || ""} onChange={(e) => setModalOutlet({ ...modalOutlet, picName: e.target.value })} className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">PIC Phone</label>
                  <input type="text" placeholder="e.g. +62 812 9999 8888" value={modalOutlet.picPhone || ""} onChange={(e) => setModalOutlet({ ...modalOutlet, picPhone: e.target.value })} className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Address</label>
                  <input type="text" placeholder="e.g. Pasar Minggu Blok B" value={modalOutlet.address || ""} onChange={(e) => setModalOutlet({ ...modalOutlet, address: e.target.value })} className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setModalOutlet(null)} disabled={isSaving} className="px-3 py-1.5 text-xs rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">Cancel</button>
                <button type="submit" disabled={isSaving} className="px-4 py-1.5 text-xs rounded-xl font-bold text-white bg-orange-600 hover:bg-orange-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-50">{isSaving ? "Saving..." : modalOutlet.id ? "Update Outlet" : "Create Outlet"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
