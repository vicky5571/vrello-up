import type { MarcomPlacement } from "@/types";

export type WizardStepId = 1 | 2 | 3 | 4;

export interface WizardStepInfo {
  step: WizardStepId;
  label: string;
  shortLabel: string;
  description: string;
}

export const WIZARD_STEPS: WizardStepInfo[] = [
  { step: 1, label: "Pilih Outlet", shortLabel: "Toko", description: "Pencarian ID & Brand Toko" },
  { step: 2, label: "Material & Tema", shortLabel: "Materi", description: "Klasifikasi POSM & Kuartal" },
  { step: 3, label: "Foto Bukti Fisik", shortLabel: "Foto", description: "Unggah Dokumentasi Lapangan" },
  { step: 4, label: "Validasi Lokasi", shortLabel: "Lokasi", description: "Verifikasi GPS & OpenStreetMap" },
];

/**
 * Checks if the current step requirements are met to allow advancing forward.
 */
export function canAdvanceFromStep(
  step: WizardStepId,
  placement: Partial<MarcomPlacement>
): boolean {
  switch (step) {
    case 1:
      return Boolean(placement.outletId && placement.outletId.trim().length > 0);
    case 2:
      return Boolean(placement.materialId && placement.materialId.trim().length > 0);
    case 3:
      if (placement.status === "DONE") {
        return Boolean(placement.photoUrl && placement.photoUrl.trim().length > 0);
      }
      return true;
    case 4: {
      const hasCore = Boolean(placement.outletId && placement.materialId);
      if (!hasCore) return false;
      if (placement.status === "DONE") {
        return Boolean(placement.photoUrl && placement.photoUrl.trim().length > 0);
      }
      return true;
    }
    default:
      return false;
  }
}

/**
 * Auto-detects smart defaults when an outlet is picked in Step 1.
 */
export function applySmartDefaultsOnOutletSelect(
  outlet: {
    id: string;
    code?: string;
    name: string;
    brand?: string;
    picName?: string;
    latitude?: number | null;
    longitude?: number | null;
    address?: string;
  },
  prevPlacement: Partial<MarcomPlacement>,
  currentUserName?: string
): Partial<MarcomPlacement> {
  const rawBrand = (outlet.brand || "").toUpperCase();
  const detectedBrand = rawBrand === "3" || rawBrand === "TRI" ? "3" : "IM3";
  const today = new Date().toISOString().slice(0, 10);

  return {
    ...prevPlacement,
    outletId: outlet.id,
    brand: prevPlacement.brand || detectedBrand,
    picName: prevPlacement.picName || outlet.picName || currentUserName || "",
    quarter: prevPlacement.quarter || "Q3 2026",
    date: prevPlacement.date || today,
    status: prevPlacement.status || "NOT_STARTED",
    outlet: {
      id: outlet.id,
      code: outlet.code || "",
      name: outlet.name,
      brand: outlet.brand,
    },
  };
}

/**
 * Progressive disclosure logic for MOU contracts.
 * Free standard items (Rp 0 & non-permanent) are collapsed unless cost > 0,
 * high-value asset, existing MOU attached, or manually expanded by user.
 */
export function shouldShowMouSection(params: {
  cost?: number | null;
  isPermanentAsset: boolean;
  mouId?: string | null;
  isManuallyExpanded: boolean;
}): boolean {
  if (params.isManuallyExpanded) return true;
  if (params.mouId && params.mouId.trim().length > 0) return true;
  if (params.cost != null && params.cost > 0) return true;
  if (params.isPermanentAsset) return true;
  return false;
}

/**
 * Returns a map of completion booleans for all 4 steps.
 */
export function getStepCompletionStatus(
  placement: Partial<MarcomPlacement>
): Record<WizardStepId, boolean> {
  const step1 = Boolean(placement.outletId && placement.outletId.trim().length > 0);
  const step2 = Boolean(placement.materialId && placement.materialId.trim().length > 0);
  const hasPhoto = Boolean(placement.photoUrl && placement.photoUrl.trim().length > 0);
  const step3 = placement.status === "DONE" ? hasPhoto : Boolean(placement.status);
  const hasCoords = placement.latitude != null && placement.longitude != null;
  const step4 = hasCoords || Boolean(placement.shareLocationUrl);

  return {
    1: step1,
    2: step2,
    3: step3,
    4: step4,
  };
}
