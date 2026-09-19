export interface MouSummaryInfo {
  id: string;
  partnerName?: string;
  outletId?: string | null;
  outletName?: string;
  status: string;
  mouType?: string;
  compensationValue?: number;
}

export interface PlacementSummaryInfo {
  id: string;
  mouId?: string | null;
  status: string;
  cost?: number;
  material?: {
    name?: string;
    type?: string;
  };
}

const PERMANENT_KEYWORDS = [
  "signboard",
  "shopblind",
  "shop-blind",
  "shop blind",
  "neon box",
  "neonbox",
  "billboard",
  "pylon",
  "fascia",
  "sewa",
  "permanen",
  "permanent",
  "branding toko",
  "facade",
];

/**
 * Checks if a promotional material is considered permanent / rental branding
 * that requires an active legal MoU agreement.
 */
export function isPermanentMaterial(materialNameOrType?: string | null): boolean {
  if (!materialNameOrType || typeof materialNameOrType !== "string") return false;
  const lower = materialNameOrType.trim().toLowerCase();
  return PERMANENT_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Finds all MoUs associated with a given outlet, matching by outletId first,
 * or falling back to a normalized outletName match.
 */
export function findAvailableMousForOutlet<T extends MouSummaryInfo>(
  mous: T[],
  outletId?: string | null,
  outletName?: string | null,
): T[] {
  if (!Array.isArray(mous) || mous.length === 0) return [];
  const normalizedName = outletName?.trim().toLowerCase();

  return mous.filter((mou) => {
    if (outletId && mou.outletId === outletId) return true;
    if (normalizedName && mou.outletName && mou.outletName.trim().toLowerCase() === normalizedName) {
      return true;
    }
    return false;
  });
}

export interface MouValidationResult {
  severity: "none" | "warning" | "success";
  message: string;
  requiresMou: boolean;
}

/**
 * Validates whether a placement's selected material aligns with its linked MoU.
 */
export function validatePlacementMouRequirement(params: {
  materialName?: string | null;
  materialType?: string | null;
  selectedMou?: MouSummaryInfo | null;
  outletMousCount?: number;
}): MouValidationResult {
  const isPermanent =
    isPermanentMaterial(params.materialName) || isPermanentMaterial(params.materialType);

  if (!isPermanent) {
    if (params.selectedMou) {
      return {
        severity: "success",
        message: `Terhubung ke MoU: ${params.selectedMou.partnerName || params.selectedMou.id} (${params.selectedMou.status})`,
        requiresMou: false,
      };
    }
    return {
      severity: "none",
      message: "Materi umum/insidentil (tidak mensyaratkan MoU sewa)",
      requiresMou: false,
    };
  }

  // Material is permanent / rental branding
  if (!params.selectedMou) {
    const hasAvailableMous = typeof params.outletMousCount === "number" && params.outletMousCount > 0;
    return {
      severity: "warning",
      message: hasAvailableMous
        ? "Material permanen (Signboard/Shopblind) memerlukan dasar MoU aktif. Tersedia MoU untuk outlet ini, silakan tautkan."
        : "Peringatan: Material permanen (Signboard/Shopblind) memerlukan perjanjian sewa/MoU APPROVED. Belum ada MoU terdaftar untuk outlet ini.",
      requiresMou: true,
    };
  }

  const isApproved = params.selectedMou.status.toUpperCase() === "APPROVED";
  if (isApproved) {
    return {
      severity: "success",
      message: `MoU Terverifikasi (APPROVED) - Mitra: ${params.selectedMou.partnerName || params.selectedMou.id}`,
      requiresMou: true,
    };
  }

  return {
    severity: "warning",
    message: `Status MoU terkait masih ${params.selectedMou.status}. Pemasangan permanen disarankan setelah MoU berstatus APPROVED.`,
    requiresMou: true,
  };
}

export interface MouRealizationSummary {
  totalLinked: number;
  doneCount: number;
  inProgressCount: number;
  notStartedCount: number;
  totalCost: number;
  compensationValue: number;
  budgetUtilizationRate: number;
  isOverBudget: boolean;
}

/**
 * Calculates physical placement execution & cost realization for a specific MoU.
 */
export function calculateMouPlacementRealization(
  mou: { id: string; compensationValue?: number | null },
  placements: PlacementSummaryInfo[],
): MouRealizationSummary {
  if (!Array.isArray(placements)) {
    return {
      totalLinked: 0,
      doneCount: 0,
      inProgressCount: 0,
      notStartedCount: 0,
      totalCost: 0,
      compensationValue: mou.compensationValue || 0,
      budgetUtilizationRate: 0,
      isOverBudget: false,
    };
  }

  const linked = placements.filter((p) => p.mouId === mou.id);

  const totalLinked = linked.length;
  let doneCount = 0;
  let inProgressCount = 0;
  let notStartedCount = 0;
  let totalCost = 0;

  for (const p of linked) {
    if (p.status === "DONE") doneCount++;
    else if (p.status === "ON_PROGRESS") inProgressCount++;
    else notStartedCount++;

    const cost = typeof p.cost === "number" && !Number.isNaN(p.cost) && p.cost > 0 ? p.cost : 0;
    totalCost += cost;
  }

  const compensationValue =
    typeof mou.compensationValue === "number" && !Number.isNaN(mou.compensationValue) && mou.compensationValue > 0
      ? mou.compensationValue
      : 0;

  const budgetUtilizationRate =
    compensationValue > 0 ? Math.round((totalCost / compensationValue) * 100) : 0;

  const isOverBudget = compensationValue > 0 && totalCost > compensationValue;

  return {
    totalLinked,
    doneCount,
    inProgressCount,
    notStartedCount,
    totalCost,
    compensationValue,
    budgetUtilizationRate,
    isOverBudget,
  };
}
