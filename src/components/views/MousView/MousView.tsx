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
import { MouExpandedRow } from "./MouExpandedRow";
import { MouFormModal } from "./MouFormModal";

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
  const [modalMou, setModalMou] = useState<Partial<MarcomMou> | null>(null);
  const [viewingDocMou, setViewingDocMou] = useState<MarcomMou | null>(null);

  const canManage = can("DELETE_MOU");
  const canCreate = can("CREATE_MOU");

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
