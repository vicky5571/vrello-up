"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Building2, Plus, Edit2, Store, FileText, X, Eye } from "lucide-react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useMarcomPermissions } from "@/lib/marcom/permissions";
import {
  MarcomTableShell,
  createMarcomColumnHelper,
} from "@/components/views/shared/MarcomTableShell";
import { KpiSummaryCards } from "@/components/views/shared/KpiSummaryCards";
import { cn } from "@/lib/utils";
import {
  calculateBranchKpis,
  getBranchProgressColor,
  getBranchStatusBadge,
} from "./branchesHelpers";

import type { BranchStatus, MarcomBranch } from "@/types";

export type { BranchStatus, MarcomBranch };

const columnHelper = createMarcomColumnHelper<MarcomBranch>();

export function BranchesView() {
  const { can, role } = useMarcomPermissions();
  const marcomFilters = useWorkspaceStore((s) => s.marcomFilters);
  const setMarcomFilter = useWorkspaceStore((s) => s.setMarcomFilter);
  const navigateToMarcom = useWorkspaceStore((s) => s.navigateToMarcom);
  const setSelectedBranchId = useWorkspaceStore((s) => s.setSelectedBranchId);

  const [branches, setBranches] = useState<MarcomBranch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
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

  const fetchBranches = useCallback(async (regionFilter = selectedRegion, statusFilter = selectedStatus) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (regionFilter && regionFilter !== "ALL") {
        params.set("region", regionFilter);
      }
      if (statusFilter && statusFilter !== "ALL") {
        params.set("status", statusFilter);
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
  }, [selectedRegion, selectedStatus]);

  useEffect(() => {
    fetchBranches(selectedRegion, selectedStatus);
  }, [fetchBranches, selectedRegion, selectedStatus]);

  const handleRegionChange = (newRegion: string) => {
    setSelectedRegion(newRegion);
    fetchBranches(newRegion, selectedStatus);
  };

  const handleStatusChange = (newStatus: string) => {
    setSelectedStatus(newStatus);
    fetchBranches(selectedRegion, newStatus);
  };

  const kpiItems = useMemo(() => calculateBranchKpis(branches), [branches]);

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
                className="table-row-select"
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
          cell: ({ row }) => (
            <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
              {row.original.code}
            </span>
          ),
        }),
        columnHelper.accessor("name", {
          id: "name",
          header: "Branch Name",
          size: 200,
          minSize: 140,
          cell: ({ row }) => (
            <span className="group font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1.5 truncate">
              <span className="truncate">{row.original.name}</span>
              <Eye className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-cyan-600 transition-opacity shrink-0" />
            </span>
          ),
        }),
        columnHelper.accessor("status", {
          id: "status",
          header: "Status",
          size: 110,
          minSize: 90,
          cell: ({ row }) => {
            const { label, badgeClass } = getBranchStatusBadge(row.original.status);
            return (
              <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold", badgeClass)}>
                {label}
              </span>
            );
          },
        }),
        columnHelper.accessor("region", { id: "region", header: "Region", size: 120, minSize: 100 }),
        columnHelper.accessor("city", { id: "city", header: "City", size: 120, minSize: 90 }),
        columnHelper.accessor("outletCount", {
          id: "outletCount",
          header: "Outlets",
          size: 105,
          minSize: 85,
          cell: ({ row }) => {
            const count = row.original.outletCount ?? 0;
            return (
              <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => navigateToMarcom("outlets", row.original.name)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold text-xs text-orange-600 dark:text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 transition-colors cursor-pointer"
                  title={`Jump to Outlets view filtered to ${row.original.name}`}
                >
                  <Store className="w-3 h-3" />
                  <span>{count}</span>
                </button>
              </div>
            );
          },
        }),
        columnHelper.accessor("mouCount", {
          id: "mouCount",
          header: "MOUs",
          size: 95,
          minSize: 75,
          cell: ({ row }) => {
            const count = row.original.mouCount ?? 0;
            return (
              <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => navigateToMarcom("mous", row.original.name)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold text-xs text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 transition-colors cursor-pointer"
                  title={`Jump to MOUs view filtered to ${row.original.name}`}
                >
                  <FileText className="w-3 h-3" />
                  <span>{count}</span>
                </button>
              </div>
            );
          },
        }),
        columnHelper.accessor("progress", {
          id: "progress",
          header: "Progress",
          size: 130,
          minSize: 110,
          cell: ({ row }) => {
            const progress = row.original.progress;
            if (progress == null) return <span className="text-slate-400">—</span>;
            const pct = Math.round(Math.min(100, Math.max(0, progress)));
            const { barClass, textClass } = getBranchProgressColor(pct);
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
                  <div className={cn("h-full rounded-full transition-all", barClass)} style={{ width: `${pct}%` }} />
                </div>
                <span className={cn("text-[11px] font-semibold shrink-0", textClass)}>{pct}%</span>
              </div>
            );
          },
        }),
        columnHelper.display({
          id: "actions",
          header: () => null,
          size: 75,
          minSize: 65,
          maxSize: 85,
          enableSorting: false,
          cell: ({ row }) => (
            <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setSelectedBranchId(row.original.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 transition-colors cursor-pointer"
                title="Open Branch Details Drawer"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              {canManage && (
                <button
                  type="button"
                  onClick={() => setModalBranch(row.original)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Edit Branch"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ),
        }),
      ]),
    [navigateToMarcom, setSelectedBranchId, canManage]
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
        fixedViewport
        kpiBar={<KpiSummaryCards items={kpiItems} mobileStrip />}
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
        onRowClick={(branch) => setSelectedBranchId(branch.id)}
        canDelete={canManage}
        deleteRequiresMessage="Delete requires admin role"
        onDeleteOne={deleteOne}
        canAdd={canAddBranch}
        onAdd={() => setModalBranch({ code: "", name: "", region: "", city: "", status: "PENDING", picName: "", picPhone: "", address: "" })}
        addLabel="Add Branch"
        addIcon={Plus}
        addClassName="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 transition-colors shadow-2xs cursor-pointer"
        filterBar={
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
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
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                aria-label="Filter by status"
                className="px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="DONE">Done</option>
                <option value="ON_PROGRESS">In Progress</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>
            {(selectedRegion !== "ALL" || selectedStatus !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSelectedRegion("ALL");
                  setSelectedStatus("ALL");
                  fetchBranches("ALL", "ALL");
                }}
                className="text-xs text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 underline font-medium cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        }
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
              <button type="button" onClick={() => setModalBranch(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1 rounded-lg">
                <X className="w-4 h-4" />
              </button>
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
