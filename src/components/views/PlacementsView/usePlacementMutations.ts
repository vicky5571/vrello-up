"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useMarcomDataStore } from "@/lib/marcom/marcomDataStore";
import { isValidCoordinate } from "@/lib/marcom/locationUtils";
import { type MouSummaryInfo } from "@/lib/marcom/placementMouBridge";
import type { MarcomPlacement } from "@/types";

interface UsePlacementMutationsProps {
  modalPlacement: Partial<MarcomPlacement> | null;
  setModalPlacement: React.Dispatch<React.SetStateAction<Partial<MarcomPlacement> | null>>;
  setSelectedPlacement: React.Dispatch<React.SetStateAction<MarcomPlacement | null>>;
  outletsList?: { id: string; name: string; brand?: string; picName?: string; branchId?: string }[];
  materialsList?: { id: string; name: string; type?: string; requiresMou?: boolean }[];
  placements?: MarcomPlacement[];
  mousList?: MouSummaryInfo[];
}

export function usePlacementMutations({
  modalPlacement,
  setModalPlacement,
  setSelectedPlacement,
}: UsePlacementMutationsProps) {
  const [isSaving, setIsSaving] = useState(false);

  const fetchPlacements = useMarcomDataStore((s) => s.fetchPlacements);
  const addCachedPlacement = useMarcomDataStore((s) => s.addCachedPlacement);
  const updateCachedPlacement = useMarcomDataStore((s) => s.updateCachedPlacement);
  const removeCachedPlacement = useMarcomDataStore((s) => s.removeCachedPlacement);
  const invalidateOutlets = useMarcomDataStore((s) => s.invalidateOutlets);
  const updateCachedOutlet = useMarcomDataStore((s) => s.updateCachedOutlet);
  const invalidateMous = useMarcomDataStore((s) => s.invalidateMous);

  const handleOpenAddPlacement = useCallback(() => {
    setModalPlacement({
      outletId: "",
      materialId: "",
      mouId: "",
      status: "NOT_STARTED",
      brand: "IM3",
      dimensions: "",
      cost: undefined,
      picName: "",
      notes: "",
      photoUrl: "",
      date: new Date().toISOString().slice(0, 10),
      latitude: null,
      longitude: null,
      shareLocationUrl: "",
      locationNotes: "",
    });
  }, [setModalPlacement]);

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
          updateCachedPlacement(savedPlacement);
          setSelectedPlacement((prev) => (prev?.id === id ? savedPlacement : prev));
        } else {
          addCachedPlacement(savedPlacement);
        }

        fetchPlacements(true);
        toast.success(`Placement ${isEdit ? "updated" : "created"} successfully`);
        invalidateMous();
        setModalPlacement(null);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save placement");
      } finally {
        setIsSaving(false);
      }
    },
    [
      modalPlacement,
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
        removeCachedPlacement(id);
        invalidateMous();
        setSelectedPlacement((prev) => (prev?.id === id ? null : prev));
      }
      return res.ok;
    },
    [removeCachedPlacement, invalidateMous, setSelectedPlacement],
  );

  const deleteBatch = useCallback(
    async (ids: string[]) => {
      const res = await fetch("/api/marcom/placements", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (res.ok) {
        for (const id of ids) {
          removeCachedPlacement(id);
        }
        invalidateMous();
        setSelectedPlacement((prev) => (prev && ids.includes(prev.id) ? null : prev));
      }
      return res.ok;
    },
    [removeCachedPlacement, invalidateMous, setSelectedPlacement],
  );

  return {
    isSaving,
    handleSavePlacement,
    handleOpenAddPlacement,
    deleteOne,
    deleteBatch,
  };
}
