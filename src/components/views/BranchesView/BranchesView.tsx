"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Building2, Plus, Edit2, Store, FileText } from "lucide-react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useMarcomPermissions } from "@/lib/marcom/permissions";
import {
  MarcomTableShell,
  createMarcomColumnHelper,
} from "@/components/views/shared/MarcomTableShell";

export type BranchStatus = "DONE" | "ON_PROGRESS" | "PENDING";

export interface MarcomBranch {
  id: string;
  code: string;
  name: string;
  region: string;
  city: string;
  status?: BranchStatus;
  picName: string;
  picPhone: string;
  address: string;
  outletCount?: number;
  mouCount?: number;
  progress?: number;
}

const columnHelper = createMarcomColumnHelper<MarcomBranch>();

export function BranchesView() {
  const { can, role } = useMarcomPermissions();
  const { marcomFilters, setMarcomFilter, navigateToMarcom, setSelectedBranchId } = useWorkspaceStore();

  const [branches, setBranches] = useState<MarcomBranch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>("ALL");
  const [availableRegions, setAvailableRegions] = useState<string[]>([
    "Banten",
    "Central Java",
    "DI Yogyakarta",
    "DKI Jakarta",
    "East Java",
    "West Java",
  ]);
  const [modalBranch, setModalBranch] = useState<Partial<MarcomBranch> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const canManage = can("MANAGE_MASTER_DATA");
  const canAddBranch = canManage || role !== "viewer";

  const fetchBranches = useCallback(async (regionFilter = selectedRegion) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (regionFilter && regionFilter !== "ALL") {
        params.set("region", regionFilter);
      }
      const url = `/api/marcom/branches${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const json = await res.json();
      const list = Array.isArray(json.data) ? json.data : [];
      setBranches(list);
      if (regionFilter === "ALL") {
        const found = Array.from(new Set(list.map((b: MarcomBranch) => b.region).filter(Boolean))) as string[];
        if (found.length > 0) {
          setAvailableRegions((prev) => Array.from(new Set([...prev, ...found])).sort());
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load branches");
    } finally {
      setIsLoading(false);
    }
  }, [selectedRegion]);

  useEffect(() => {
    fetchBranches(selectedRegion);
  }, [fetchBranches, selectedRegion]);

  const handleRegionChange = (newRegion: string) => {
    setSelectedRegion(newRegion);
    fetchBranches(newRegion);
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
                aria-label="Select all branches"
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
                aria-label={`Select branch ${row.original.name}`}
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
          cell: ({ row }) => (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedBranchId(row.original.id);
              }}
              className="font-semibold text-slate-900 dark:text-slate-100 hover:text-cyan-600 dark:hover:text-cyan-400 hover:underline cursor-pointer text-left"
              title="View branch drawer"
            >
              {row.original.code}
            </button>
          ),
        }),
        columnHelper.accessor("name", {
          id: "name",
          header: "Branch Name",
          size: 220,
          minSize: 140,
          cell: ({ row }) => (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedBranchId(row.original.id);
              }}
              className="truncate text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 font-medium hover:underline cursor-pointer text-left"
              title="View branch drawer"
            >
              {row.original.name}
            </button>
          ),
        }),
        columnHelper.accessor("region", { id: "region", header: "Region", size: 140, minSize: 100 }),
        columnHelper.accessor("city", { id: "city", header: "City", size: 140, minSize: 100 }),
        columnHelper.display({
          id: "outlets",
          header: "Outlets",
          size: 95,
          minSize: 75,
          enableSorting: false,
          cell: ({ row }) => {
            const count = row.original.outletCount ?? 0;
            return (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateToMarcom("outlets", row.original.name);
                }}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-semibold text-xs text-orange-600 dark:text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 transition-colors cursor-pointer"
                title={`Jump to Outlets view filtered to ${row.original.name}`}
              >
                <Store className="w-3 h-3" />
                <span>{count}</span>
              </button>
            );
          },
        }),
        columnHelper.display({
          id: "mous",
          header: "MOUs",
          size: 90,
          minSize: 70,
          enableSorting: false,
          cell: ({ row }) => {
            const count = row.original.mouCount ?? 0;
            return (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateToMarcom("mous", row.original.name);
                }}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-semibold text-xs text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 transition-colors cursor-pointer"
                title={`Jump to MOUs view filtered to ${row.original.name}`}
              >
                <FileText className="w-3 h-3" />
                <span>{count}</span>
              </button>
            );
          },
        }),
        columnHelper.display({
          id: "progress",
          header: "Progress",
          size: 150,
          minSize: 120,
          enableSorting: false,
          cell: ({ row }) => {
            const progress = row.original.progress;
            if (progress == null) return <span className="text-slate-400">—</span>;
            const pct = Math.round(Math.min(100, Math.max(0, progress)));
            return (
              <div className="flex items-center gap-2">
                <div
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Progress ${pct}%`}
                  className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"
                >
                  <div className="h-full rounded-full bg-teal-500" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 shrink-0">{pct}%</span>
              </div>
            );
          },
        }),
        columnHelper.display({
          id: "expander",
          header: () => null,
          size: 40,
          minSize: 40,
          maxSize: 40,
          enableSorting: false,
          cell: () => (
            <div className="flex justify-end">
              <span className="w-4 h-4 text-slate-400 flex items-center justify-center">›</span>
            </div>
          ),
        }),
      ]),
    [navigateToMarcom, setSelectedBranchId],
  );

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalBranch) return;
    const { id, code, name, region, city, status, picName, picPhone, address } = modalBranch;
    if (!code || !name || !region || !city) {
      toast.error("Code, name, region, and city are required");
      return;
    }
    setIsSaving(true);
    try {
      const isEdit = Boolean(id);
      const url = isEdit ? `/api/marcom/branches/${id}` : "/api/marcom/branches";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code, name, region, city,
          status: status || "PENDING",
          picName: picName || "",
          picPhone: picPhone || "",
          address: address || "",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to save branch (${res.status})`);
      }
      toast.success(`Branch ${isEdit ? "updated" : "created"} successfully`);
      setModalBranch(null);
      await fetchBranches();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save branch");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteOne = useCallback(async (id: string) => {
    const res = await fetch(`/api/marcom/branches/${id}`, { method: "DELETE" });
    return res.ok;
  }, []);

  return (
    <>
      <MarcomTableShell
        data={branches}
        columns={columns}
        getRowId={(row) => row.id}
        initialSorting={[{ id: "code", desc: false }]}
        title="Branches"
        titleIcon={Building2}
        entityName="branch"
        entityPlural="branches"
        isLoading={isLoading}
        error={error}
        onRefresh={fetchBranches}
        canDelete={canManage}
        deleteRequiresMessage="Delete requires admin role"
        onDeleteOne={deleteOne}
        canAdd={canAddBranch}
        onAdd={() => setModalBranch({ code: "", name: "", region: "", city: "", picName: "", picPhone: "", address: "" })}
        addLabel="Add Branch"
        addIcon={Plus}
        addClassName="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 transition-colors shadow-2xs cursor-pointer"
        filterBar={
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Region:</span>
              <select
                value={selectedRegion}
                onChange={(e) => handleRegionChange(e.target.value)}
                aria-label="Filter by region"
                className="px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 cursor-pointer"
              >
                <option value="ALL">All Regions</option>
                {availableRegions.map((reg) => (
                  <option key={reg} value={reg}>
                    {reg}
                  </option>
                ))}
              </select>
            </div>
            {selectedRegion !== "ALL" && (
              <button
                type="button"
                onClick={() => handleRegionChange("ALL")}
                className="text-xs text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 underline font-medium cursor-pointer"
              >
                Reset Region
              </button>
            )}
          </div>
        }
        renderExpanded={(branch) => (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">Address</div>
                <div className="text-slate-700 dark:text-slate-300">{branch.address || "—"}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">PIC</div>
                <div className="text-slate-700 dark:text-slate-300">{branch.picName || "—"}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">PIC Phone</div>
                <div className="text-slate-700 dark:text-slate-300">{branch.picPhone || "—"}</div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateToMarcom("outlets", branch.name);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors shadow-2xs cursor-pointer"
                >
                  <Store className="w-3.5 h-3.5 text-orange-500" />
                  <span>View Outlets ({branch.outletCount ?? 0})</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateToMarcom("mous", branch.name);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-fuchsia-700 dark:text-fuchsia-300 bg-fuchsia-50 dark:bg-fuchsia-950/40 border border-fuchsia-200 dark:border-fuchsia-800 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900/40 transition-colors shadow-2xs cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-fuchsia-500" />
                  <span>View MOUs ({branch.mouCount ?? 0})</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedBranchId(branch.id);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 dark:hover:bg-cyan-900/40 transition-colors shadow-2xs cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Branch Details Drawer</span>
                </button>
              </div>
              {canAddBranch && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setModalBranch(branch);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-2xs cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Edit Branch</span>
                </button>
              )}
            </div>
          </>
        )}
        searchTerm={marcomFilters["branches"] || ""}
        onSearchChange={(q) => setMarcomFilter("branches", q)}
        emptyLabel="No branches found."
      />

      {modalBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-cyan-600" />
                {modalBranch.id ? "Edit Branch" : "Add New Branch"}
              </h2>
              <button type="button" onClick={() => setModalBranch(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleSaveBranch} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Branch Code *</label>
                  <input type="text" required placeholder="e.g. BR-JKT-01" value={modalBranch.code || ""} onChange={(e) => setModalBranch({ ...modalBranch, code: e.target.value })} className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Branch Name *</label>
                  <input type="text" required placeholder="e.g. Jakarta Pusat Hub" value={modalBranch.name || ""} onChange={(e) => setModalBranch({ ...modalBranch, name: e.target.value })} className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-cyan-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Region *</label>
                  <input type="text" required placeholder="e.g. DKI Jakarta" value={modalBranch.region || ""} onChange={(e) => setModalBranch({ ...modalBranch, region: e.target.value })} className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">City *</label>
                  <input type="text" required placeholder="e.g. Jakarta" value={modalBranch.city || ""} onChange={(e) => setModalBranch({ ...modalBranch, city: e.target.value })} className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-cyan-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">PIC Name</label>
                  <input type="text" placeholder="e.g. Budi Santoso" value={modalBranch.picName || ""} onChange={(e) => setModalBranch({ ...modalBranch, picName: e.target.value })} className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">PIC Phone</label>
                  <input type="text" placeholder="e.g. +62 812 3456 7890" value={modalBranch.picPhone || ""} onChange={(e) => setModalBranch({ ...modalBranch, picPhone: e.target.value })} className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-cyan-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Address</label>
                <textarea rows={2} placeholder="e.g. Jl. Sudirman No. 12" value={modalBranch.address || ""} onChange={(e) => setModalBranch({ ...modalBranch, address: e.target.value })} className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-cyan-500" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setModalBranch(null)} disabled={isSaving} className="px-3 py-1.5 text-xs rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">Cancel</button>
                <button type="submit" disabled={isSaving} className="px-4 py-1.5 text-xs rounded-xl font-bold text-white bg-cyan-600 hover:bg-cyan-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-50">{isSaving ? "Saving..." : modalBranch.id ? "Update Branch" : "Create Branch"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
