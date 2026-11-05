"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { FileText } from "lucide-react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useMarcomPermissions } from "@/lib/marcom/permissions";
import { useMarcomDataStore } from "@/lib/marcom/marcomDataStore";
import { MarcomTableShell } from "@/components/views/shared/MarcomTableShell";
import { MousHeader } from "./MousHeader";
import { MouDocumentViewerModal } from "./MouDocumentViewerModal";
import { transitionMouStatus, deleteMou } from "./mouApi";
import { buildMouKpiItems } from "./mouKpi";
import { buildMouColumns } from "./mouColumns";
import { MOU_SEARCH_KEYS } from "./mouSortingHelpers";
import { MouDetailDrawer } from "@/components/mous/MouDetailDrawer";
import { MouFormModal } from "./MouFormModal";

import { calculateMouValidity } from "./mouDateHelpers";

import type { MarcomMou, MouStatus } from "@/types";
export type { MarcomMou, MouStatus };


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
  const marcomFilters = useWorkspaceStore((s) => s.marcomFilters);
  const setMarcomFilter = useWorkspaceStore((s) => s.setMarcomFilter);
  const navigateToMarcom = useWorkspaceStore((s) => s.navigateToMarcom);
  const setSelectedBranchId = useWorkspaceStore((s) => s.setSelectedBranchId);
  const setExportCenterOpen = useWorkspaceStore((s) => s.setExportCenterOpen);
  const mous = useMarcomDataStore((s) => s.mous);
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
    () => useMarcomDataStore.getState().mous.length === 0
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
  const [selectedMou, setSelectedMou] = useState<MarcomMou | null>(null);
  const [approvingMouId, setApprovingMouId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedMou) {
      const fresh = mous.find((m) => m.id === selectedMou.id);
      if (fresh && fresh !== selectedMou) {
        setSelectedMou(fresh);
      }
    }
  }, [mous, selectedMou]);

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
    const hasCache = useMarcomDataStore.getState().mous.length > 0;
    if (!hasCache) setIsLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchMous(force),
        fetchBranches(),
        fetchOutlets(),
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load MOUs");
    } finally {
      setIsLoading(false);
    }
  }, [fetchMous, fetchBranches, fetchOutlets]);

  useEffect(() => {
    loadMous();
  }, [loadMous]);

  const handleStatusTransition = useCallback(
    async (mou: MarcomMou, nextStatus: MouStatus) => {
      if (nextStatus === "APPROVED") {
        setApprovingMouId(mou.id);
      }
      try {
        await transitionMouStatus(mou.id, nextStatus);
        toast.success(`MOU status updated to ${nextStatus}`);
        updateCachedMou({ id: mou.id, status: nextStatus });
        invalidatePlacements();
        if (nextStatus === "APPROVED") {
          const triggered = await useWorkspaceStore.getState().runAutomationsForTrigger("mou:approved", {
            mouId: mou.id,
            partnerName: mou.partnerName,
            branchId: mou.branchId,
          });
          if (triggered > 0) toast.info(`Automations triggered: created setup task for ${mou.partnerName}`);
        }
        fetchMous(true);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update status");
      } finally {
        setApprovingMouId(null);
      }
    },
    [updateCachedMou, invalidatePlacements, fetchMous],
  );

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
        onQuickApprove: (mou) => handleStatusTransition(mou, "APPROVED"),
        approvingMouId,
        onOpenDrawer: (mou) => setSelectedMou(mou),
        can,
      }),
    [navigateToMarcom, setMarcomFilter, setSelectedBranchId, setViewingDocMou, handleStatusTransition, approvingMouId, can],
  );
  const deleteOne = useCallback(
    async (id: string) => {
      const ok = await deleteMou(id);
      if (ok) {
        removeCachedMou(id);
        invalidatePlacements();
      }
      return ok;
    },
    [removeCachedMou, invalidatePlacements],
  );

  const deleteBatch = useCallback(
    async (ids: string[]) => {
      const res = await fetch("/api/marcom/mous", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (res.ok) {
        for (const id of ids) {
          removeCachedMou(id);
        }
        invalidatePlacements();
      }
      return res.ok;
    },
    [removeCachedMou, invalidatePlacements],
  );

  const kpiItems = useMemo(() => buildMouKpiItems(mous), [mous]);

  return (
    <div className="flex flex-col h-full bg-[#FAFBFC] dark:bg-[#121316] overflow-y-auto">
      {/* Unified Marcom-Style Header */}
      <MousHeader
        totalMous={mous.length}
        kpiItems={kpiItems}
        isLoading={isLoading}
        onRefresh={() => loadMous(true)}
        onExport={() => setExportCenterOpen(true)}
        canCreate={canCreate}
        onAddMou={() => {
          setModalMou({
            branchId: branches[0]?.id || "",
            partnerName: "",
            mouType: "Compensation",
            outletName: "",
            startDate: new Date().toISOString().slice(0, 10),
            endDate: "",
            picName: "",
            picPhone: "",
            docPath: "",
            compensationValue: undefined,
            notes: "",
            status: "DRAFT",
          });
        }}
        searchQuery={marcomFilters["mous"] || ""}
        onSearchChange={(q) => setMarcomFilter("mous", q)}
        selectedStatus={selectedStatus}
        onStatusChange={handleStatusFilter}
        statusChips={MOU_STATUS_CHIPS}
        selectedBranchId={filterBranchId}
        onBranchChange={setFilterBranchId}
        branches={branches}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        mouTypes={MOU_TYPES}
        urgencyFilter={urgencyFilter}
        onUrgencyChange={setUrgencyFilter}
        isFiltered={isFiltered}
        onResetFilters={handleResetFilters}
      />

      {/* Main Table Content */}
      <div className="p-4 sm:p-6 flex-1 min-h-0 space-y-4 isolate">
        <MarcomTableShell
          noPadding
          hideHeader
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
          canAdd={false}
          onRowClick={(mou) => setSelectedMou(mou)}
          searchTerm={marcomFilters["mous"] || ""}
          onSearchChange={(q) => setMarcomFilter("mous", q)}
          emptyLabel="No MOUs found."
        />
      </div>

      {/* Slide-over Detail Drawer */}
      <MouDetailDrawer
        mou={selectedMou}
        isOpen={Boolean(selectedMou)}
        onClose={() => setSelectedMou(null)}
        onStatusTransition={handleStatusTransition}
        onEdit={(m) => {
          setSelectedMou(null);
          setModalMou(m);
        }}
        onRenew={(m) => {
          setSelectedMou(null);
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
        onViewDoc={(m) => setViewingDocMou(m)}
        navigateToMarcom={navigateToMarcom}
        setSelectedBranchId={setSelectedBranchId}
      />

      {modalMou && (
        <MouFormModal
          mou={modalMou}
          branches={branches}
          outlets={outletsList}
          isLoading={isLoading}
          onSaved={(savedMou, isEdit) => {
            if (isEdit) {
              updateCachedMou(savedMou);
            } else {
              addCachedMou(savedMou);
            }
            invalidatePlacements();
            fetchMous(true);
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
    </div>
  );
}
