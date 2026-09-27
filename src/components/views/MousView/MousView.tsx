"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useDropdown } from "@/components/ui/useDropdown";
import { FileText, Download, Plus, Edit2, CheckCircle, Upload, RefreshCw, Search, ChevronDown, Check, Store, Building2, Clock, Coins, X, Layers, AlertTriangle, ShieldAlert, Eye } from "lucide-react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useMarcomPermissions } from "@/lib/marcom/permissions";
import { useMarcomDataStore } from "@/lib/marcom/marcomDataStore";
import { cn, formatIDR } from "@/lib/utils";
import { MarcomTableShell } from "@/components/views/shared/MarcomTableShell";
import { KpiSummaryCards } from "@/components/views/shared/KpiSummaryCards";
import { calculateMouPlacementRealization } from "@/lib/marcom/placementMouBridge";
import { parseMouDocumentSource } from "./mouDocumentHelpers";
import { MouDocumentViewerModal } from "./MouDocumentViewerModal";
import { saveMou, transitionMouStatus, deleteMou, uploadMouDocument } from "./mouApi";
import { buildMouKpiItems } from "./mouKpi";
import { buildMouColumns } from "./mouColumns";
import { MouExpandedRow } from "./MouExpandedRow";

import type { MarcomMou, MouStatus } from "@/types";
export type { MarcomMou, MouStatus };

const EMPTY_MOUS: MarcomMou[] = [];

const MOU_STATUS_CHIPS: { label: string; value: string }[] = [
  { label: "All", value: "ALL" },
  { label: "Draft", value: "DRAFT" },
  { label: "Submitted", value: "SUBMITTED" },
  { label: "Approved", value: "APPROVED" },
  { label: "Done", value: "DONE" },
  { label: "Rejected", value: "REJECTED" },
];

export function MousView() {
  const { can } = useMarcomPermissions();
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId) || "ws-main";
  const marcomFilters = useWorkspaceStore((s) => s.marcomFilters);
  const setMarcomFilter = useWorkspaceStore((s) => s.setMarcomFilter);
  const navigateToMarcom = useWorkspaceStore((s) => s.navigateToMarcom);
  const setSelectedBranchId = useWorkspaceStore((s) => s.setSelectedBranchId);
  const setExportCenterOpen = useWorkspaceStore((s) => s.setExportCenterOpen);
  const mous = useMarcomDataStore(
    (s) => s.mousByWorkspace[activeWorkspaceId] ?? EMPTY_MOUS
  );
  const fetchMous = useMarcomDataStore((s) => s.fetchMous);
  const addCachedMou = useMarcomDataStore((s) => s.addCachedMou);
  const updateCachedMou = useMarcomDataStore((s) => s.updateCachedMou);
  const removeCachedMou = useMarcomDataStore((s) => s.removeCachedMou);
  const fetchBranches = useMarcomDataStore((s) => s.fetchBranches);
  const fetchOutlets = useMarcomDataStore((s) => s.fetchOutlets);
  const storeBranches = useMarcomDataStore((s) => s.branches);
  const storeOutlets = useMarcomDataStore((s) => s.outlets);
  const invalidatePlacements = useMarcomDataStore((s) => s.invalidatePlacements);

  const [isLoading, setIsLoading] = useState(
    () => !useMarcomDataStore.getState().mousByWorkspace[activeWorkspaceId]
  );
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const branches = useMemo(
    () => storeBranches.map((b) => ({ id: b.id, name: b.name, code: b.code })),
    [storeBranches]
  );
  const outletsList = useMemo(
    () => storeOutlets.map((o) => ({ id: o.id, name: o.name, code: o.code, branchId: o.branchId })),
    [storeOutlets]
  );
  const [branchSearch, setBranchSearch] = useState("");
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const [modalMou, setModalMou] = useState<Partial<MarcomMou> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [viewingDocMou, setViewingDocMou] = useState<MarcomMou | null>(null);

  const branchTriggerRef = useRef<HTMLButtonElement | null>(null);
  const branchDropdownRef = useDropdown<HTMLDivElement>({
    isOpen: isBranchDropdownOpen,
    onClose: () => setIsBranchDropdownOpen(false),
    triggerRef: branchTriggerRef,
    closeOnEscape: true,
  });
  const branchSearchInputRef = useRef<HTMLInputElement | null>(null);

  const MOU_TYPES = ["Compensation", "Exclusive Branding", "Event Sponsorship", "Space Rental", "Joint Promotion"] as const;

  const canManage = can("DELETE_MOU");
  const canCreate = can("CREATE_MOU");

  useEffect(() => {
    if (isBranchDropdownOpen) {
      setTimeout(() => {
        branchSearchInputRef.current?.focus();
      }, 50);
    }
  }, [isBranchDropdownOpen]);

  const filteredMous = useMemo(() => {
    if (selectedStatus === "ALL") return mous;
    return mous.filter((m) => m.status === selectedStatus);
  }, [mous, selectedStatus]);

  const loadMous = useCallback(async (force = false) => {
    if (!activeWorkspaceId) return;
    const hasCache = Boolean(useMarcomDataStore.getState().mousByWorkspace[activeWorkspaceId]);
    if (!hasCache) setIsLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchMous(activeWorkspaceId, force),
        fetchBranches(),
        fetchOutlets(),
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load MOUs");
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkspaceId, fetchMous, fetchBranches, fetchOutlets]);

  useEffect(() => {
    loadMous();
  }, [loadMous]);

  const handleStatusTransition = async (mou: MarcomMou, nextStatus: MouStatus) => {
    try {
      await transitionMouStatus(mou.id, nextStatus);
      toast.success(`MOU status updated to ${nextStatus}`);
      updateCachedMou(activeWorkspaceId, { id: mou.id, status: nextStatus });
      invalidatePlacements(activeWorkspaceId);
      if (nextStatus === "APPROVED") {
        const triggered = await useWorkspaceStore.getState().runAutomationsForTrigger("mou:approved", {
          mouId: mou.id,
          partnerName: mou.partnerName,
          branchId: mou.branchId,
        });
        if (triggered > 0) toast.info(`Automations triggered: created setup task for ${mou.partnerName}`);
      }
      fetchMous(activeWorkspaceId, true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const handleStatusFilter = (status: string) => {
    const next = selectedStatus === status && status !== "ALL" ? "ALL" : status;
    setSelectedStatus(next);
  };

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
      buildMouColumns({
        navigateToMarcom,
        setMarcomFilter,
        setSelectedBranchId,
        setViewingDocMou,
        can,
      }),
    [navigateToMarcom, setMarcomFilter, setSelectedBranchId, setViewingDocMou, can],
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile || !modalMou) return;
    setIsUploading(true);
    try {
      const filePath = await uploadMouDocument(rawFile, modalMou.id || "new");
      setModalMou((prev) => (prev ? { ...prev, docPath: filePath } : null));
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
      const savedMou = await saveMou(
        {
          branchId,
          outletId: modalMou.outletId || undefined,
          partnerName,
          mouType,
          outletName: outletName || "",
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          picName: picName || "",
          picPhone: picPhone || "",
          docPath: docPath || "",
          compensationValue: compensationValue != null ? Math.max(0, Number(compensationValue)) : 0,
          notes: notes || "",
          workspaceId: activeWorkspaceId,
        },
        isEdit ? id : undefined,
      );
      toast.success(`MOU ${isEdit ? "updated" : "created"} successfully`);
      if (isEdit && id) {
        updateCachedMou(activeWorkspaceId, savedMou);
      } else {
        addCachedMou(activeWorkspaceId, savedMou);
      }
      invalidatePlacements(activeWorkspaceId);
      setModalMou(null);
      setIsBranchDropdownOpen(false);
      setBranchSearch("");
      fetchMous(activeWorkspaceId, true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save MOU");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteOne = useCallback(
    async (id: string) => {
      const ok = await deleteMou(id);
      if (ok) {
        removeCachedMou(activeWorkspaceId, id);
        invalidatePlacements(activeWorkspaceId);
      }
      return ok;
    },
    [activeWorkspaceId, removeCachedMou, invalidatePlacements],
  );

  const kpiItems = useMemo(() => buildMouKpiItems(mous), [mous]);

  return (
    <>
      <MarcomTableShell
        data={filteredMous}
        columns={columns}
        getRowId={(row) => row.id}
        initialSorting={[{ id: "partner", desc: false }]}
        title="MOUs & Partnerships"
        titleIcon={FileText}
        countLabel={{ singular: "MOU", plural: "MOUs" }}
        entityName="MOU"
        entityPlural="MOUs"
        isLoading={isLoading}
        error={error}
        onRefresh={() => loadMous(true)}
        canDelete={canManage}
        deleteRequiresMessage="Delete requires admin role"
        onDeleteOne={deleteOne}
        canAdd={canCreate}
        onAdd={() => {
          setIsBranchDropdownOpen(false);
          setBranchSearch("");
          setModalMou({ branchId: branches[0]?.id || "", partnerName: "", mouType: "Compensation", outletName: "", startDate: new Date().toISOString().slice(0, 10), endDate: "", picName: "", picPhone: "", docPath: "", compensationValue: undefined, notes: "", status: "DRAFT" });
        }}
        addLabel="New MOU"
        addIcon={Plus}
        addClassName="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-fuchsia-600 hover:bg-fuchsia-700 transition-colors shadow-2xs cursor-pointer"
        headerExtra={
          <button type="button" onClick={() => setExportCenterOpen(true)} title="Open Export Center — PDF summaries & Excel sheets" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border shadow-xs bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        }
        kpiBar={<KpiSummaryCards items={kpiItems} />}
        renderExpanded={(mou) => (
          <MouExpandedRow
            mou={mou}
            can={can}
            onStatusTransition={handleStatusTransition}
            onEdit={(m) => {
              setIsBranchDropdownOpen(false);
              setBranchSearch("");
              setModalMou(m);
            }}
            onRenew={(m) => {
              setIsBranchDropdownOpen(false);
              setBranchSearch("");
              setModalMou({
                branchId: m.branchId,
                outletId: m.outletId,
                outletName: m.outletName,
                partnerName: m.partnerName,
                mouType: m.mouType,
                startDate: new Date().toISOString().slice(0, 10),
                endDate: "",
                picName: m.picName,
                picPhone: m.picPhone,
                compensationValue: m.compensationValue,
                notes: `Perpanjangan (Renewal) dari MOU ${m.partnerName} (berakhir ${m.endDate?.slice(0, 10)})`,
                status: "DRAFT",
              });
            }}
            onViewDoc={setViewingDocMou}
            navigateToMarcom={navigateToMarcom}
            setSelectedBranchId={setSelectedBranchId}
          />
        )}
        filterBar={
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">Status:</span>
            {MOU_STATUS_CHIPS.map((chip) => {
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
              <button type="button" onClick={() => { setModalMou(null); setIsBranchDropdownOpen(false); setBranchSearch(""); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1 rounded-lg">
                <X className="w-4 h-4" />
              </button>
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
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5"
                            >
                              <X className="w-3.5 h-3.5" />
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
                    onChange={(e) => {
                      const val = e.target.value;
                      const matched = availableOutlets.find(
                        (o) => o.name.toLowerCase() === val.toLowerCase()
                      );
                      setModalMou({
                        ...modalMou,
                        outletName: val,
                        outletId: matched ? matched.id : null,
                      });
                    }}
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
                  <label htmlFor="mou-start-date" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 cursor-pointer">
                    Start Date
                  </label>
                  <input
                    id="mou-start-date"
                    type="date"
                    value={modalMou.startDate ? modalMou.startDate.slice(0, 10) : ""}
                    onClick={(e) => {
                      try {
                        e.currentTarget.showPicker();
                      } catch {}
                    }}
                    onFocus={(e) => {
                      try {
                        e.currentTarget.showPicker();
                      } catch {}
                    }}
                    onChange={(e) => setModalMou({ ...modalMou, startDate: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-fuchsia-500 cursor-pointer"
                  />
                </div>
                <div>
                  <label htmlFor="mou-end-date" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 cursor-pointer">
                    End Date
                  </label>
                  <input
                    id="mou-end-date"
                    type="date"
                    min={modalMou.startDate ? modalMou.startDate.slice(0, 10) : undefined}
                    value={modalMou.endDate ? modalMou.endDate.slice(0, 10) : ""}
                    onClick={(e) => {
                      try {
                        e.currentTarget.showPicker();
                      } catch {}
                    }}
                    onFocus={(e) => {
                      try {
                        e.currentTarget.showPicker();
                      } catch {}
                    }}
                    onChange={(e) => setModalMou({ ...modalMou, endDate: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-fuchsia-500 cursor-pointer"
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
                {modalMou.docPath && (
                  <div className="mt-1.5 flex items-center gap-2">
                    {(() => {
                      const p = parseMouDocumentSource(modalMou.docPath, modalMou.partnerName);
                      return (
                        <>
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-fuchsia-50 dark:bg-fuchsia-950/40 text-fuchsia-700 dark:text-fuchsia-300 border border-fuchsia-200 dark:border-fuchsia-800 font-medium">
                            {p.label}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setViewingDocMou({
                                id: modalMou.id || "preview",
                                branchId: modalMou.branchId || "",
                                partnerName: modalMou.partnerName || "Pratinjau Dokumen",
                                mouType: modalMou.mouType || "Compensation",
                                outletName: modalMou.outletName || "",
                                submissionDate: null,
                                startDate: null,
                                endDate: null,
                                status: "DRAFT",
                                picName: "",
                                picPhone: "",
                                docPath: modalMou.docPath || "",
                                compensationValue: 0,
                                notes: "",
                              })
                            }
                            className="text-xs font-semibold text-fuchsia-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Test Pratinjau</span>
                          </button>
                        </>
                      );
                    })()}
                  </div>
                )}
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
      {/* Document Viewer Lightbox Modal */}
      <MouDocumentViewerModal
        isOpen={Boolean(viewingDocMou)}
        onClose={() => setViewingDocMou(null)}
        docPath={viewingDocMou?.docPath}
        partnerName={viewingDocMou?.partnerName}
        mouType={viewingDocMou?.mouType}
        outletName={viewingDocMou?.outletName}
        branchName={viewingDocMou?.branch?.name}
      />
    </>
  );
}
