"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Building2, Plus, Edit2 } from "lucide-react";
import { useMarcomPermissions } from "@/lib/marcom/permissions";
import { cn } from "@/lib/utils";
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
  status: BranchStatus;
  picName: string;
  picPhone: string;
  address: string;
  outletCount?: number;
  progress?: number;
}

const columnHelper = createMarcomColumnHelper<MarcomBranch>();

const STATUS_STYLES: Record<BranchStatus, string> = {
  DONE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  ON_PROGRESS: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  PENDING: "bg-slate-500/10 text-slate-500 dark:text-slate-400",
};

export function BranchesView() {
  const { can } = useMarcomPermissions();

  const [branches, setBranches] = useState<MarcomBranch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalBranch, setModalBranch] = useState<Partial<MarcomBranch> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const canManage = can("MANAGE_MASTER_DATA");

  const fetchBranches = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/marcom/branches");
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const json = await res.json();
      setBranches(Array.isArray(json.data) ? json.data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load branches");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

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
            <span className="font-semibold text-slate-900 dark:text-slate-100">{row.original.code}</span>
          ),
        }),
        columnHelper.accessor("name", {
          id: "name",
          header: "Branch Name",
          size: 220,
          minSize: 140,
          cell: ({ row }) => (
            <span className="truncate text-slate-700 dark:text-slate-300">{row.original.name}</span>
          ),
        }),
        columnHelper.accessor("region", { id: "region", header: "Region", size: 140, minSize: 100 }),
        columnHelper.accessor("city", { id: "city", header: "City", size: 140, minSize: 100 }),
        columnHelper.accessor("status", {
          id: "status",
          header: "Status",
          size: 130,
          minSize: 110,
          cell: ({ row }) => (
            <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold", STATUS_STYLES[row.original.status] ?? STATUS_STYLES.PENDING)}>
              {row.original.status.replaceAll("_", " ")}
            </span>
          ),
        }),
        columnHelper.display({
          id: "outlets",
          header: "Outlets",
          size: 90,
          minSize: 70,
          enableSorting: false,
          cell: ({ row }) => <span className="text-slate-500 dark:text-slate-400">{row.original.outletCount ?? "—"}</span>,
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
    [],
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
        canAdd={canManage}
        onAdd={() => setModalBranch({ code: "", name: "", region: "", city: "", status: "PENDING", picName: "", picPhone: "", address: "" })}
        addLabel="Add Branch"
        addIcon={Plus}
        addClassName="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 transition-colors shadow-2xs cursor-pointer"
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
            {canManage && (
              <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-end">
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
              </div>
            )}
          </>
        )}
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
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                  <select value={modalBranch.status || "PENDING"} onChange={(e) => setModalBranch({ ...modalBranch, status: e.target.value as BranchStatus })} className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 cursor-pointer">
                    <option value="PENDING">Pending</option>
                    <option value="ON_PROGRESS">On Progress</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Branch Name *</label>
                <input type="text" required placeholder="e.g. Jakarta Pusat Hub" value={modalBranch.name || ""} onChange={(e) => setModalBranch({ ...modalBranch, name: e.target.value })} className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-cyan-500" />
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
