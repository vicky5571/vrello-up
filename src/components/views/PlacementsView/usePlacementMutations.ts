"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useMarcomDataStore } from "@/lib/marcom/marcomDataStore";
import { isValidCoordinate } from "@/lib/marcom/locationUtils";
import { findOutletCoordinates } from "@/lib/marcom/outletInherit";
import { findAvailableMousForOutlet, type MouSummaryInfo } from "@/lib/marcom/placementMouBridge";
import { normalizeBrand } from "@/lib/marcom/brandUtils";
import {
  buildPlacementTaskPayload,
  syncTaskOnPlacementStatusChange,
} from "@/lib/tasks/placementTaskSync";
import { FIELD_OPS_LIST_ID } from "@/lib/marcom/marcomIds";
import type { MarcomPlacement, Brand } from "@/types";

interface UsePlacementMutationsProps {
  activeWorkspaceId: string;
  modalPlacement: Partial<MarcomPlacement> | null;
  setModalPlacement: React.Dispatch<React.SetStateAction<Partial<MarcomPlacement> | null>>;
  setSelectedPlacement: React.Dispatch<React.SetStateAction<MarcomPlacement | null>>;
  outletsList: { id: string; name: string; brand?: string; picName?: string; branchId?: string }[];
  materialsList: { id: string; name: string; type?: string; requiresMou?: boolean }[];
  placements: MarcomPlacement[];
  mousList: MouSummaryInfo[];
}

export function usePlacementMutations({
  activeWorkspaceId,
  modalPlacement,
  setModalPlacement,
  setSelectedPlacement,
  outletsList,
  materialsList,
  placements,
  mousList,
}: UsePlacementMutationsProps) {
  const [isSaving, setIsSaving] = useState(false);
  const tasks = useWorkspaceStore((s) => s.tasks);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const createTask = useWorkspaceStore((s) => s.createTask);
  const setSelectedTaskId = useWorkspaceStore((s) => s.setSelectedTaskId);

  const fetchPlacements = useMarcomDataStore((s) => s.fetchPlacements);
  const addCachedPlacement = useMarcomDataStore((s) => s.addCachedPlacement);
  const updateCachedPlacement = useMarcomDataStore((s) => s.updateCachedPlacement);
  const removeCachedPlacement = useMarcomDataStore((s) => s.removeCachedPlacement);
  const invalidateOutlets = useMarcomDataStore((s) => s.invalidateOutlets);
  const updateCachedOutlet = useMarcomDataStore((s) => s.updateCachedOutlet);
  const invalidateMous = useMarcomDataStore((s) => s.invalidateMous);

  const handleOpenAddPlacement = useCallback(() => {
    const firstOutlet = outletsList[0];
    const firstOutletId = firstOutlet?.id || "";
    const inherited = findOutletCoordinates(firstOutletId, placements);
    const matchingMous = findAvailableMousForOutlet(mousList, firstOutlet || firstOutletId);
    const defaultMou = matchingMous.find((m) => m.status === "APPROVED") || matchingMous[0];

    const brandSuggestion: Brand = normalizeBrand(firstOutlet?.brand);

    setModalPlacement({
      outletId: firstOutletId,
      materialId: materialsList[0]?.id || "",
      mouId: defaultMou?.id || "",
      status: "NOT_STARTED",
      brand: brandSuggestion,
      dimensions: "",
      cost: undefined,
      picName: firstOutlet?.picName || "",
      notes: "",
      photoUrl: "",
      date: new Date().toISOString().slice(0, 10),
      latitude: inherited?.latitude ?? null,
      longitude: inherited?.longitude ?? null,
      shareLocationUrl: inherited?.shareLocationUrl ?? "",
      locationNotes: inherited?.locationNotes ?? "",
    });

    if (inherited) {
      toast.info("Koordinat outlet otomatis diambil dari riwayat pemasangan sebelumnya", {
        duration: 3000,
      });
    }
  }, [outletsList, materialsList, placements, mousList, setModalPlacement]);

  const handleTrackAsTask = useCallback(
    (placement: MarcomPlacement) => {
      const existing = tasks.find((t) => t.relatedMarcomId === placement.id);
      if (existing) {
        setSelectedTaskId(existing.id);
        toast.info("Opened existing production task");
        return;
      }
      const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];
      const targetSpace =
        currentWorkspace?.spaces.find((s) => s.lists.some((l) => l.id === FIELD_OPS_LIST_ID)) ||
        currentWorkspace?.spaces[0];
      const members = currentWorkspace?.members || [];
      const taskPayload = buildPlacementTaskPayload(
        {
          id: placement.id,
          materialName: placement.material?.name,
          outletName: placement.outlet?.name,
          dimensions: placement.dimensions,
          picName: placement.picName,
          notes: placement.notes,
          photoUrl: placement.photoUrl,
          status: placement.status,
        },
        targetSpace,
      );

      const task = createTask({
        ...taskPayload,
        assignees: members[0] ? [members[0]] : [],
        tags: [],
        orderIndex:
          Math.max(
            -1,
            ...tasks
              .filter((t) => t.statusId === taskPayload.statusId)
              .map((t) => t.orderIndex),
          ) + 1,
      });
      toast.success("Production task created in Field Operations!");
      setSelectedTaskId(task.id);
    },
    [tasks, workspaces, activeWorkspaceId, createTask, setSelectedTaskId],
  );

  const handleSavePlacement = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!modalPlacement) return;
      const {
        id,
        outletId,
        materialId,
        status = "NOT_STARTED",
        brand = "IM3",
        dimensions = "",
        cost,
        picName = "",
        notes = "",
        photoUrl = "",
        date = new Date().toISOString(),
        latitude,
        longitude,
        shareLocationUrl = "",
        locationNotes = "",
        mouId,
      } = modalPlacement;

      if (!outletId || !materialId) {
        toast.error("Outlet and Material are required");
        return;
      }
      if (status === "DONE") {
        if (!photoUrl?.trim()) {
          toast.error("Bukti foto fisik wajib diunggah sebelum status diselesaikan (DONE)");
          return;
        }
        const hasValidCoords =
          typeof latitude === "number" &&
          typeof longitude === "number" &&
          isValidCoordinate(latitude, longitude);
        const hasValidShare = Boolean(shareLocationUrl?.trim());

        if (!hasValidCoords && !hasValidShare) {
          toast.error(
            "Verifikasi lokasi fisik (koordinat GPS atau URL share location) wajib disertakan sebelum status diselesaikan (DONE)",
          );
          return;
        }
      }

      setIsSaving(true);
      try {
        const isEdit = Boolean(id);
        const res = await fetch(isEdit ? `/api/marcom/placements/${id}` : "/api/marcom/placements", {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            outletId,
            materialId,
            mouId: mouId || null,
            status,
            brand,
            dimensions,
            cost: cost != null ? Number(cost) : undefined,
            picName,
            notes,
            photoUrl,
            date,
            workspaceId: activeWorkspaceId,
            latitude: typeof latitude === "number" ? latitude : null,
            longitude: typeof longitude === "number" ? longitude : null,
            shareLocationUrl,
            locationNotes,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Failed to save placement (${res.status})`);
        }
        const jsonRes = await res.json().catch(() => ({}));
        const savedPlacement: MarcomPlacement = jsonRes.data || jsonRes;

        if (jsonRes.backfilledOutlet) {
          updateCachedOutlet(jsonRes.backfilledOutlet);
          invalidateOutlets();
        } else if (status === "DONE" && (latitude != null || longitude != null || Boolean(shareLocationUrl))) {
          invalidateOutlets();
        }

        if (isEdit && id) {
          updateCachedPlacement(activeWorkspaceId, savedPlacement);
          setSelectedPlacement((prev) => (prev?.id === id ? savedPlacement : prev));
          const currentWs = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];
          syncTaskOnPlacementStatusChange(
            id,
            status,
            tasks,
            currentWs?.spaces || [],
            (taskId, updates) => useWorkspaceStore.getState().updateTask(taskId, updates),
          );
        } else {
          addCachedPlacement(activeWorkspaceId, savedPlacement);
        }

        fetchPlacements(activeWorkspaceId, true);
        toast.success(`Placement ${isEdit ? "updated" : "created"} successfully`);
        invalidateMous(activeWorkspaceId);
        setModalPlacement(null);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save placement");
      } finally {
        setIsSaving(false);
      }
    },
    [
      modalPlacement,
      activeWorkspaceId,
      workspaces,
      tasks,
      updateCachedOutlet,
      invalidateOutlets,
      updateCachedPlacement,
      addCachedPlacement,
      fetchPlacements,
      invalidateMous,
      setSelectedPlacement,
      setModalPlacement,
    ],
  );

  const deleteOne = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/marcom/placements/${id}`, { method: "DELETE" });
      if (res.ok) {
        removeCachedPlacement(activeWorkspaceId, id);
        invalidateMous(activeWorkspaceId);
        setSelectedPlacement((prev) => (prev?.id === id ? null : prev));
      }
      return res.ok;
    },
    [activeWorkspaceId, removeCachedPlacement, invalidateMous, setSelectedPlacement],
  );

  const deleteBatch = useCallback(
    async (ids: string[]) => {
      const res = await fetch("/api/marcom/placements", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, workspaceId: activeWorkspaceId }),
      });
      if (res.ok) {
        for (const id of ids) {
          removeCachedPlacement(activeWorkspaceId, id);
        }
        invalidateMous(activeWorkspaceId);
        setSelectedPlacement((prev) => (prev && ids.includes(prev.id) ? null : prev));
      }
      return res.ok;
    },
    [activeWorkspaceId, removeCachedPlacement, invalidateMous, setSelectedPlacement],
  );

  return {
    isSaving,
    handleSavePlacement,
    handleTrackAsTask,
    handleOpenAddPlacement,
    deleteOne,
    deleteBatch,
  };
}
