"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { FileText, Download, Plus } from "lucide-react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useMarcomPermissions } from "@/lib/marcom/permissions";
import { useMarcomDataStore } from "@/lib/marcom/marcomDataStore";
import { cn } from "@/lib/utils";
import { MarcomTableShell } from "@/components/views/shared/MarcomTableShell";
import { KpiSummaryCards } from "@/components/views/shared/KpiSummaryCards";
import { MouDocumentViewerModal } from "./MouDocumentViewerModal";
import { transitionMouStatus, deleteMou } from "./mouApi";
import { buildMouKpiItems } from "./mouKpi";
import { buildMouColumns } from "./mouColumns";
import { MOU_SEARCH_KEYS } from "./mouSortingHelpers";
import { MouExpandedRow } from "./MouExpandedRow";
import { MouFormModal } from "./MouFormModal";

import { calculateMouValidity } from "./mouDateHelpers";

import type { MarcomMou, MouStatus } from "@/types";
export type { MarcomMou, MouStatus };

const EMPTY_MOUS: MarcomMou[] = [];

const MOU_TYPES = [
  "Compensation",
  "Exclusive Branding",
  "Event Sponsorship",
  "Space Rental",
  "Joint Promotion",
] as const;

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
  const [filterBranchId, setFilterBranchId] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [urgencyFilter, setUrgencyFilter] = useState<"ALL" | "EXPIRING" | "EXPIRED">("ALL");

  const branches = useMemo(
    () => storeBranches.map((b) => ({ id: b.id, name: b.name, code: b.code })),
    [storeBranches]
  );
  const outletsList = useMemo(
    () => storeOutlets.map((o) => ({ id: o.id, name: o.name, code: o.code, branchId: o.branchId })),
    [storeOutlets]
  );
  const [modalMou, setModalMou] = useState<Partial<MarcomMou> | null>(null);
  const [viewingDocMou, setViewingDocMou] = useState<MarcomMou | null>(null);

  const canManage = can("DELETE_MOU");
  const canCreate = can("CREATE_MOU");

  const filteredMous = useMemo(() => {
    return mous.filter((m) => {
      if (selectedStatus !== "ALL" && m.status !== selectedStatus) return false;
      if (filterBranchId !== "ALL" && m.branchId !== filterBranchId) return false;
      if (selectedType !== "ALL" && m.mouType !== selectedType) return false;
      if (urgencyFilter !== "ALL") {
        const validity = calculateMouValidity(m.startDate, m.endDate);
        if (urgencyFilter === "EXPIRING" && !validity.isExpiringSoon) return false;
        if (urgencyFilter === "EXPIRED" && !validity.isExpired) return false;
      }
      return true;
    });
  }, [mous, selectedStatus, filterBranchId, selectedType, urgencyFilter]);

  const isFiltered =
    selectedStatus !== "ALL" ||
    filterBranchId !== "ALL" ||
    selectedType !== "ALL" ||
    urgencyFilter !== "ALL";

  const handleResetFilters = () => {
    setSelectedStatus("ALL");
    setFilterBranchId("ALL");
    setSelectedType("ALL");
    setUrgencyFilter("ALL");
  };

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

  const deleteBatch = useCallback(
    async (ids: string[]) => {
      const res = await fetch("/api/marcom/mous", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, workspaceId: activeWorkspaceId }),
      });
      if (res.ok) {
        for (const id of ids) {
          removeCachedMou(activeWorkspaceId, id);
        }
        invalidatePlacements(activeWorkspaceId);
      }
      return res.ok;
    },
    [activeWorkspaceId, removeCachedMou, invalidatePlacements],
  );

  const kpiItems = useMemo(() => buildMouKpiItems(mous), [mous]);

  return (
    <>
      <MarcomTableShell
        fixedViewport
        searchKeys={MOU_SEARCH_KEYS}
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
        onDeleteBatch={deleteBatch}
        canAdd={canCreate}
        onAdd={() => {
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
        kpiBar={<KpiSummaryCards items={kpiItems} mobileStrip />}
        renderExpanded={(mou) => (
          <MouExpandedRow
            mou={mou}
            can={can}
            onStatusTransition={handleStatusTransition}
            onEdit={(m) => setModalMou(m)}
            onRenew={(m) => {
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
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-slate-500 dark:text-slate-400 mr-1">Status:</span>
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

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Branch:</span>
              <select
                value={filterBranchId}
                onChange={(e) => setFilterBranchId(e.target.value)}
                aria-label="Filter by branch"
                className="px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-fuchsia-500 cursor-pointer"
              >
                <option value="ALL">All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code} - {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Type:</span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                aria-label="Filter by MOU type"
                className="px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-fuchsia-500 cursor-pointer"
              >
                <option value="ALL">All Types</option>
                {MOU_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setUrgencyFilter(urgencyFilter === "EXPIRING" ? "ALL" : "EXPIRING")}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1",
                  urgencyFilter === "EXPIRING"
                    ? "bg-amber-500 text-white shadow-xs ring-1 ring-amber-600/30"
                    : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40 hover:bg-amber-100 dark:hover:bg-amber-900/50",
                )}
              >
                <span>⚠️</span>
                <span>Expiring Soon</span>
              </button>
              <button
                type="button"
                onClick={() => setUrgencyFilter(urgencyFilter === "EXPIRED" ? "ALL" : "EXPIRED")}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1",
                  urgencyFilter === "EXPIRED"
                    ? "bg-rose-500 text-white shadow-xs ring-1 ring-rose-600/30"
                    : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40 hover:bg-rose-100 dark:hover:bg-rose-900/50",
                )}
              >
                <span>🔴</span>
                <span>Expired</span>
              </button>
            </div>

            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-fuchsia-600 hover:text-fuchsia-700 dark:text-fuchsia-400 underline font-medium cursor-pointer ml-1"
              >
                Reset Filters
              </button>
            )}
          </div>
        }
        searchTerm={marcomFilters["mous"] || ""}
        onSearchChange={(q) => setMarcomFilter("mous", q)}
        emptyLabel="No MOUs found."
      />

      {modalMou && (
        <MouFormModal
          mou={modalMou}
          branches={branches}
          outlets={outletsList}
          activeWorkspaceId={activeWorkspaceId}
          isLoading={isLoading}
          onSaved={(savedMou, isEdit) => {
            if (isEdit) {
              updateCachedMou(activeWorkspaceId, savedMou);
            } else {
              addCachedMou(activeWorkspaceId, savedMou);
            }
            invalidatePlacements(activeWorkspaceId);
            fetchMous(activeWorkspaceId, true);
          }}
          onClose={() => setModalMou(null)}
          onTestPreview={setViewingDocMou}
        />
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
