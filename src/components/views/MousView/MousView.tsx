"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { FileText, Download, Plus, Edit2, CheckCircle, Upload, RefreshCw, Search, ChevronDown, Check, Store, Building2 } from "lucide-react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useMarcomPermissions } from "@/lib/marcom/permissions";
import { cn, formatIDR } from "@/lib/utils";
import {
  MarcomTableShell,
  createMarcomColumnHelper,
} from "@/components/views/shared/MarcomTableShell";

export type MouStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "DONE";

export interface MarcomMou {
  id: string;
  branchId: string;
  outletName: string;
  partnerName: string;
  mouType: string;
  submissionDate: string | null;
  startDate: string | null;
  endDate: string | null;
  status: MouStatus;
  picName: string;
  picPhone: string;
  docPath: string;
  compensationValue: number;
  notes: string;
  branch?: { id: string; code: string; name: string };
}

const columnHelper = createMarcomColumnHelper<MarcomMou>();

const STATUS_STYLES: Record<MouStatus, string> = {
  DRAFT: "bg-slate-500/10 text-slate-500 dark:text-slate-400",
  SUBMITTED: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  APPROVED: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  REJECTED: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  DONE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

export function MousView() {
  const { can } = useMarcomPermissions();
  const { marcomFilters, setMarcomFilter, navigateToMarcom, setSelectedBranchId, setExportCenterOpen } = useWorkspaceStore();

  const [mous, setMous] = useState<MarcomMou[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [branches, setBranches] = useState<{ id: string; name: string; code: string }[]>([]);
  const [outletsList, setOutletsList] = useState<{ id: string; name: string; code?: string; branchId: string }[]>([]);
  const [branchSearch, setBranchSearch] = useState("");
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const [modalMou, setModalMou] = useState<Partial<MarcomMou> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const branchDropdownRef = useRef<HTMLDivElement | null>(null);
  const branchTriggerRef = useRef<HTMLButtonElement | null>(null);
  const branchSearchInputRef = useRef<HTMLInputElement | null>(null);

  const MOU_TYPES = ["Compensation", "Exclusive Branding", "Event Sponsorship", "Space Rental", "Joint Promotion"] as const;

  const canManage = can("DELETE_MOU");
  const canCreate = can("CREATE_MOU");
  const canApprove = can("APPROVE_MOU");

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(event.target as Node)) {
        setIsBranchDropdownOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isBranchDropdownOpen) {
        setIsBranchDropdownOpen(false);
        branchTriggerRef.current?.focus();
      }
    }
    if (isBranchDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isBranchDropdownOpen]);

  useEffect(() => {
    if (isBranchDropdownOpen) {
      setTimeout(() => {
        branchSearchInputRef.current?.focus();
      }, 50);
    }
  }, [isBranchDropdownOpen]);

  const handleStatusTransition = async (mou: MarcomMou, nextStatus: MouStatus) => {
    try {
      const res = await fetch(`/api/marcom/mous/${mou.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to transition MOU to ${nextStatus}`);
      }
      toast.success(`MOU status updated to ${nextStatus}`);
      if (nextStatus === "APPROVED") {
        const triggered = await useWorkspaceStore.getState().runAutomationsForTrigger("mou:approved", {
          mouId: mou.id,
          partnerName: mou.partnerName,
          branchId: mou.branchId,
        });
        if (triggered > 0) toast.info(`Automations triggered: created setup task for ${mou.partnerName}`);
      }
      await fetchMous();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const fetchMous = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [resMous, resBranches, resOutlets] = await Promise.all([
        fetch("/api/marcom/mous"),
        fetch("/api/marcom/branches"),
        fetch("/api/marcom/outlets"),
      ]);
      if (!resMous.ok) throw new Error(`Request failed (${resMous.status})`);
      const jsonMous = await resMous.json();
      setMous(Array.isArray(jsonMous.data) ? jsonMous.data : []);
      if (resBranches.ok) {
        const jsonBranches = await resBranches.json();
        setBranches(Array.isArray(jsonBranches.data) ? jsonBranches.data : []);
      }
      if (resOutlets.ok) {
        const jsonOutlets = await resOutlets.json();
        setOutletsList(Array.isArray(jsonOutlets.data) ? jsonOutlets.data : []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load MOUs");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMous();
  }, [fetchMous]);

  const filteredBranches = useMemo(() => {
    if (!branchSearch.trim()) return branches;
    const q = branchSearch.toLowerCase();
    return branches.filter((b) => b.name.toLowerCase().includes(q) || b.code.toLowerCase().includes(q));
  }, [branches, branchSearch]);

  const selectedBranch = useMemo(() => {
    return branches.find((b) => b.id === modalMou?.branchId);
  }, [branches, modalMou?.branchId]);

  const availableOutlets = useMemo(() => {
    if (!modalMou?.branchId) return outletsList;
    const branchOutlets = outletsList.filter((o) => o.branchId === modalMou.branchId);
    return branchOutlets.length > 0 ? branchOutlets : outletsList;
  }, [outletsList, modalMou?.branchId]);

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.display({
          id: "select",
          header: ({ table }) => (
            <div className="flex items-center justify-center">
              <input type="checkbox" aria-label="Select all MOUs" checked={table.getIsAllRowsSelected()} ref={(el) => { if (el) el.indeterminate = table.getIsSomeRowsSelected(); }} onChange={table.getToggleAllRowsSelectedHandler()} className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-teal-600 focus:ring-teal-500 cursor-pointer accent-teal-600" />
            </div>
          ),
          cell: ({ row }) => (
            <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <input type="checkbox" aria-label={`Select MOU ${row.original.id}`} checked={row.getIsSelected()} disabled={!row.getCanSelect()} onChange={row.getToggleSelectedHandler()} className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-teal-600 focus:ring-teal-500 cursor-pointer accent-teal-600" />
            </div>
          ),
          size: 36, minSize: 36, maxSize: 36, enableSorting: false,
        }),
        columnHelper.display({
          id: "partner",
          header: "Partner",
          size: 190, minSize: 130,
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
          size: 170, minSize: 120,
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
          size: 170, minSize: 120, enableSorting: false,
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
          size: 130, minSize: 110,
          cell: ({ row }) => <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold", STATUS_STYLES[row.original.status] ?? STATUS_STYLES.DRAFT)}>{row.original.status.replaceAll("_", " ")}</span>,
        }),
        columnHelper.accessor("compensationValue", {
          id: "value",
          header: "Value",
          size: 150, minSize: 120,
          cell: ({ row }) => <span className="text-slate-700 dark:text-slate-300">{typeof row.original.compensationValue === "number" ? formatIDR(row.original.compensationValue) : "—"}</span>,
        }),
        columnHelper.display({
          id: "expander",
          header: () => null,
          size: 40, minSize: 40, maxSize: 40, enableSorting: false,
          cell: () => <div className="flex justify-end"><span className="w-4 h-4 text-slate-400 flex items-center justify-center">›</span></div>,
        }),
      ]),
    [navigateToMarcom, setMarcomFilter, setSelectedBranchId],
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !modalMou) return;
    setIsUploading(true);
    try {
      const uploadId = modalMou.id || "new";
      const fd = new FormData();
      fd.append("kind", "documents");
      fd.append("id", uploadId);
      fd.append("file", file);
      const res = await fetch("/api/marcom/uploads", { method: "POST", body: fd });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to upload file");
      }
      const data = await res.json();
      setModalMou((prev) => (prev ? { ...prev, docPath: data.filePath } : null));
      toast.success("Document uploaded successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveMou = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalMou) return;
    const { id, branchId, partnerName, mouType, outletName, startDate, endDate, picName, picPhone, docPath, compensationValue, notes } = modalMou;
    if (!branchId || !partnerName || !mouType) {
      toast.error("Branch, Partner Name, and MOU Type are required");
      return;
    }
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      toast.error("End date must be on or after start date");
      return;
    }
    setIsSaving(true);
    try {
      const isEdit = Boolean(id);
      const url = isEdit ? `/api/marcom/mous/${id}` : "/api/marcom/mous";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branchId, partnerName, mouType, outletName: outletName || "", startDate: startDate || undefined, endDate: endDate || undefined, picName: picName || "", picPhone: picPhone || "", docPath: docPath || "", compensationValue: compensationValue != null ? Math.max(0, Number(compensationValue)) : 0, notes: notes || "" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to save MOU (${res.status})`);
      }
      toast.success(`MOU ${isEdit ? "updated" : "created"} successfully`);
      setModalMou(null);
      setIsBranchDropdownOpen(false);
      setBranchSearch("");
      await fetchMous();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save MOU");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteOne = useCallback(async (id: string) => {
    const res = await fetch(`/api/marcom/mous/${id}`, { method: "DELETE" });
    return res.ok;
  }, []);

  return (
    <>
      <MarcomTableShell
        data={mous}
        columns={columns}
        getRowId={(row) => row.id}
        initialSorting={[{ id: "partner", desc: false }]}
        title="MOUs"
        titleIcon={FileText}
        entityName="MOU"
        entityPlural="MOUs"
        isLoading={isLoading}
        error={error}
        onRefresh={fetchMous}
        canDelete={canManage}
        deleteRequiresMessage="Delete requires admin role"
        onDeleteOne={deleteOne}
        canAdd={canCreate}
        onAdd={() => {
          setIsBranchDropdownOpen(false);
          setBranchSearch("");
          setModalMou({ branchId: branches[0]?.id || "", partnerName: "", mouType: "Compensation", outletName: "", startDate: new Date().toISOString().slice(0, 10), endDate: "", picName: "", picPhone: "", docPath: "", compensationValue: undefined, notes: "" });
        }}
        addLabel="Add MOU"
        addIcon={Plus}
        addClassName="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-fuchsia-600 hover:bg-fuchsia-700 transition-colors shadow-2xs cursor-pointer"
        headerExtra={
          <button type="button" onClick={() => setExportCenterOpen(true)} title="Open Export Center — PDF summaries & Excel sheets" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border shadow-xs bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        }
        renderExpanded={(mou) => (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">PIC Name</div>
                <div className="font-medium text-slate-900 dark:text-slate-100">{mou.picName || "—"}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">PIC Phone</div>
                <div className="text-slate-700 dark:text-slate-300">{mou.picPhone || "—"}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">Period</div>
                <div className="text-slate-700 dark:text-slate-300">
                  {mou.startDate ? mou.startDate.slice(0, 10) : "—"} to {mou.endDate ? mou.endDate.slice(0, 10) : "—"}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">Outlet</div>
                {mou.outletName ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateToMarcom("outlets", mou.outletName);
                    }}
                    className="inline-flex items-center gap-1 font-semibold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer text-xs"
                    title={`Jump to Outlets view for "${mou.outletName}"`}
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>{mou.outletName} →</span>
                  </button>
                ) : (
                  <div className="text-slate-400">—</div>
                )}
              </div>
              <div className="sm:col-span-2">
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">Document</div>
                <div className="text-slate-700 dark:text-slate-300">{mou.docPath || "—"}</div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">Notes</div>
                <div className="text-slate-700 dark:text-slate-300">{mou.notes || "—"}</div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {mou.outletName && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateToMarcom("outlets", mou.outletName);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Store className="w-3.5 h-3.5 text-orange-500" />
                    <span>View Outlet</span>
                  </button>
                )}
                {mou.branch && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBranchId(mou.branchId);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 dark:hover:bg-cyan-900/40 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Building2 className="w-3.5 h-3.5 text-cyan-500" />
                    <span>Branch Details</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {mou.status === "DRAFT" && canCreate && (
                  <button type="button" onClick={(e) => { e.stopPropagation(); handleStatusTransition(mou, "SUBMITTED"); }} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors shadow-2xs cursor-pointer">
                    <span>Submit for Approval</span>
                  </button>
                )}
                {mou.status === "SUBMITTED" && canApprove && (
                  <button type="button" onClick={(e) => { e.stopPropagation(); handleStatusTransition(mou, "APPROVED"); }} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Approve MOU</span>
                  </button>
                )}
                {mou.status === "APPROVED" && canCreate && (
                  <button type="button" onClick={(e) => { e.stopPropagation(); handleStatusTransition(mou, "DONE"); }} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors shadow-2xs cursor-pointer">
                    <span>Mark Done</span>
                  </button>
                )}
                {canCreate && (
                  <button type="button" onClick={(e) => { e.stopPropagation(); setIsBranchDropdownOpen(false); setBranchSearch(""); setModalMou(mou); }} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-2xs cursor-pointer">
                    <Edit2 className="w-3.5 h-3.5 text-fuchsia-600" />
                    <span>Edit MOU</span>
                  </button>
                )}
              </div>
            </div>
          </>
        )}
        searchTerm={marcomFilters["mous"] || ""}
        onSearchChange={(q) => setMarcomFilter("mous", q)}
        emptyLabel="No MOUs found."
      />

      {modalMou && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-fuchsia-600" />
                {modalMou.id ? "Edit MOU" : "Add New MOU"}
              </h2>
              <button type="button" onClick={() => { setModalMou(null); setIsBranchDropdownOpen(false); setBranchSearch(""); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleSaveMou} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="relative" ref={branchDropdownRef}>
                  <label htmlFor="mou-branch-trigger" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Branch <span className="text-rose-500 ml-0.5" aria-hidden="true">*</span>
                  </label>
                  <button
                    id="mou-branch-trigger"
                    ref={branchTriggerRef}
                    type="button"
                    onClick={() => setIsBranchDropdownOpen((prev) => !prev)}
                    disabled={isLoading || branches.length === 0}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-fuchsia-500 cursor-pointer disabled:opacity-50 text-left"
                    aria-haspopup="listbox"
                    aria-expanded={isBranchDropdownOpen}
                  >
                    <span className={cn("truncate flex items-center gap-1.5", !selectedBranch && "text-slate-400")}>
                      {selectedBranch ? (
                        <>
                          <span className="truncate font-medium">{selectedBranch.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 shrink-0">
                            {selectedBranch.code}
                          </span>
                        </>
                      ) : isLoading ? (
                        "Loading branches..."
                      ) : (
                        "Select Branch..."
                      )}
                    </span>
                    <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200", isBranchDropdownOpen && "rotate-180")} />
                  </button>

                  <input
                    type="text"
                    tabIndex={-1}
                    required
                    aria-required="true"
                    value={modalMou.branchId || ""}
                    onChange={() => {}}
                    className="sr-only"
                    onFocus={() => branchTriggerRef.current?.focus()}
                  />

                  {isBranchDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1 w-full rounded-xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 py-1.5 z-50">
                      <div className="px-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                          <input
                            ref={branchSearchInputRef}
                            type="text"
                            placeholder="Search branch name or code..."
                            value={branchSearch}
                            onChange={(e) => setBranchSearch(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                if (filteredBranches.length > 0) {
                                  setModalMou((prev) => (prev ? { ...prev, branchId: filteredBranches[0].id } : null));
                                  setIsBranchDropdownOpen(false);
                                  setBranchSearch("");
                                  branchTriggerRef.current?.focus();
                                }
                              }
                            }}
                            className="w-full pl-8 pr-7 py-1 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-fuchsia-500"
                          />
                          {branchSearch && (
                            <button
                              type="button"
                              onClick={() => setBranchSearch("")}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer text-xs p-0.5"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="max-h-48 overflow-y-auto p-1 space-y-0.5" role="listbox">
                        {filteredBranches.length === 0 ? (
                          <div className="px-3 py-3 text-xs text-slate-400 text-center">
                            No branches matching &ldquo;{branchSearch}&rdquo;
                          </div>
                        ) : (
                          filteredBranches.map((b) => {
                            const isSelected = modalMou.branchId === b.id;
                            return (
                              <button
                                key={b.id}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => {
                                  setModalMou((prev) => (prev ? { ...prev, branchId: b.id } : null));
                                  setIsBranchDropdownOpen(false);
                                  setBranchSearch("");
                                  branchTriggerRef.current?.focus();
                                }}
                                className={cn(
                                  "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors cursor-pointer",
                                  isSelected
                                    ? "bg-fuchsia-50 dark:bg-fuchsia-950/50 text-fuchsia-700 dark:text-fuchsia-300 font-semibold"
                                    : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                                )}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <span className="truncate">{b.name}</span>
                                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 shrink-0">
                                    {b.code}
                                  </span>
                                </div>
                                {isSelected && <Check className="w-3.5 h-3.5 text-fuchsia-600 shrink-0 ml-2" />}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                  {branches.length === 0 && !isLoading && <p className="mt-1 text-[10px] text-amber-600 dark:text-amber-400">No branches available — create a branch first.</p>}
                </div>
                <div>
                  <label htmlFor="mou-type" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    MOU Type <span className="text-rose-500 ml-0.5" aria-hidden="true">*</span>
                  </label>
                  <select
                    id="mou-type"
                    required
                    aria-required="true"
                    value={modalMou.mouType || "Compensation"}
                    onChange={(e) => setModalMou({ ...modalMou, mouType: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-fuchsia-500 cursor-pointer"
                  >
                    {MOU_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="mou-partner-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Partner Name <span className="text-rose-500 ml-0.5" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="mou-partner-name"
                    type="text"
                    required
                    aria-required="true"
                    placeholder="e.g. PT Kemitraan Jaya"
                    value={modalMou.partnerName || ""}
                    onChange={(e) => setModalMou({ ...modalMou, partnerName: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-fuchsia-500"
                  />
                </div>
                <div>
                  <label htmlFor="mou-outlet-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Outlet Name
                  </label>
                  <input
                    id="mou-outlet-name"
                    type="text"
                    list="mou-outlets-list"
                    placeholder="e.g. Toko Berkah"
                    value={modalMou.outletName || ""}
                    onChange={(e) => setModalMou({ ...modalMou, outletName: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-fuchsia-500"
                  />
                  <datalist id="mou-outlets-list">
                    {availableOutlets.map((o) => (
                      <option key={o.id} value={o.name} />
                    ))}
                  </datalist>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="mou-start-date" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Date
                  </label>
                  <input
                    id="mou-start-date"
                    type="date"
                    value={modalMou.startDate ? modalMou.startDate.slice(0, 10) : ""}
                    onChange={(e) => setModalMou({ ...modalMou, startDate: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-fuchsia-500"
                  />
                </div>
                <div>
                  <label htmlFor="mou-end-date" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    End Date
                  </label>
                  <input
                    id="mou-end-date"
                    type="date"
                    min={modalMou.startDate ? modalMou.startDate.slice(0, 10) : undefined}
                    value={modalMou.endDate ? modalMou.endDate.slice(0, 10) : ""}
                    onChange={(e) => setModalMou({ ...modalMou, endDate: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-fuchsia-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="mou-pic-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    PIC Name
                  </label>
                  <input
                    id="mou-pic-name"
                    type="text"
                    placeholder="e.g. Hendra"
                    value={modalMou.picName || ""}
                    onChange={(e) => setModalMou({ ...modalMou, picName: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-fuchsia-500"
                  />
                </div>
                <div>
                  <label htmlFor="mou-pic-phone" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    PIC Phone
                  </label>
                  <input
                    id="mou-pic-phone"
                    type="text"
                    placeholder="e.g. +62 812 3456 7890"
                    value={modalMou.picPhone || ""}
                    onChange={(e) => setModalMou({ ...modalMou, picPhone: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-fuchsia-500"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="mou-compensation" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Compensation (Rp)
                  </label>
                  {typeof modalMou.compensationValue === "number" && !isNaN(modalMou.compensationValue) ? (
                    <span className="text-[11px] font-mono font-medium text-fuchsia-600 dark:text-fuchsia-400">
                      {formatIDR(modalMou.compensationValue)}
                    </span>
                  ) : null}
                </div>
                <input
                  id="mou-compensation"
                  type="number"
                  min="0"
                  placeholder="e.g. 5000000"
                  value={modalMou.compensationValue != null ? String(modalMou.compensationValue) : ""}
                  onChange={(e) => {
                    const num = Number(e.target.value);
                    const val = e.target.value ? Math.max(0, isNaN(num) ? 0 : num) : undefined;
                    setModalMou({ ...modalMou, compensationValue: val });
                  }}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-fuchsia-500"
                />
              </div>
              <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-3 bg-slate-50/50 dark:bg-slate-800/50 space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="mou-file-upload" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-fuchsia-600" />
                    <span>Upload Document (PDF, Images, up to 25MB)</span>
                  </label>
                  {isUploading && (
                    <span className="text-xs text-fuchsia-600 flex items-center gap-1 font-medium">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Uploading...
                    </span>
                  )}
                </div>
                <input
                  id="mou-file-upload"
                  type="file"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-fuchsia-50 dark:file:bg-fuchsia-950/40 file:text-fuchsia-700 dark:file:text-fuchsia-300 hover:file:bg-fuchsia-100 cursor-pointer disabled:opacity-50"
                />
              </div>
              <div>
                <label htmlFor="mou-doc-path" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Document URL / Path
                </label>
                <input
                  id="mou-doc-path"
                  type="text"
                  placeholder="Auto-filled from upload, or enter /api/... or Google Drive URL"
                  value={modalMou.docPath || ""}
                  onChange={(e) => setModalMou({ ...modalMou, docPath: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-fuchsia-500"
                />
              </div>
              <div>
                <label htmlFor="mou-notes" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes
                </label>
                <textarea
                  id="mou-notes"
                  rows={2}
                  placeholder="Additional partnership commitments..."
                  value={modalMou.notes || ""}
                  onChange={(e) => setModalMou({ ...modalMou, notes: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-fuchsia-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => { setModalMou(null); setIsBranchDropdownOpen(false); setBranchSearch(""); }} disabled={isSaving || isUploading} className="px-3 py-1.5 text-xs rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">Cancel</button>
                <button type="submit" disabled={isSaving || isUploading || isLoading || branches.length === 0} title={branches.length === 0 ? "Loading branches..." : isUploading ? "Uploading document..." : undefined} className="px-4 py-1.5 text-xs rounded-xl font-bold text-white bg-fuchsia-600 hover:bg-fuchsia-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">{isSaving ? "Saving..." : isUploading ? "Uploading..." : modalMou.id ? "Update MOU" : "Create MOU"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
