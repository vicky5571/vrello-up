export interface MouSummaryInfo {
  id: string;
  partnerName?: string;
  outletId?: string | null;
  outletName?: string;
  branchId?: string | null;
  status: string;
  mouType?: string;
  compensationValue?: number;
}

export interface OutletSearchCriteria {
  id?: string | null;
  name?: string | null;
  branchId?: string | null;
}

export interface PlacementSummaryInfo {
  id: string;
  mouId?: string | null;
  status: string;
  cost?: number;
  material?: {
    name?: string;
    type?: string;
    requiresMou?: boolean;
  };
}

const PERMANENT_KEYWORDS = [
  "signboard",
  "shop sign",
  "shop-sign",
  "shopsign",
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

export interface MaterialIdentifier {
  name?: string | null;
  type?: string | null;
  requiresMou?: boolean | null;
}

/**
 * Checks if a promotional material is considered permanent / rental branding
 * that requires an active legal MoU agreement.
 *
 * 3-Tier Resolution:
 * Tier 1 (DB SSOT): Explicit material.requiresMou boolean flag.
 * Tier 2 (Domain Taxonomy): MaterialType enum mapping (BRANDING_SIGNBOARD, SHOPBLIND, PERMANENT -> true; POSTER, BANNER, TEMPORARY -> false).
 * Tier 3 (Legacy Substring Heuristic): Substring matching on material name for unclassified/freeform items.
 */
export function isPermanentMaterial(
  material?: MaterialIdentifier | string | null,
): boolean {
  if (!material) return false;

  let requiresMou: boolean | undefined;
  let explicitType: string | undefined;
  let materialName: string | undefined;

  if (typeof material === "object") {
    if (typeof material.requiresMou === "boolean") {
      requiresMou = material.requiresMou;
    }
    explicitType = material.type?.trim().toUpperCase();
    materialName = material.name?.trim();
  } else if (typeof material === "string") {
    const trimmed = material.trim().toUpperCase();
    if (trimmed === "PERMANENT") return true;
    if (trimmed === "TEMPORARY") return false;
    materialName = material.trim();
  }

  // Tier 1: Explicit DB governance flag takes absolute precedence (Single Source of Truth)
  if (typeof requiresMou === "boolean") {
    return requiresMou;
  }

  // Tier 2: Domain Taxonomy mapping (Prisma MaterialType enum + legacy PERMANENT/TEMPORARY tokens)
  if (explicitType) {
    if (
      explicitType === "BRANDING_SIGNBOARD" ||
      explicitType === "SHOPBLIND" ||
      explicitType === "PERMANENT"
    ) {
      return true;
    }
    if (
      explicitType === "POSTER" ||
      explicitType === "BANNER" ||
      explicitType === "TEMPORARY"
    ) {
      return false;
    }
  }

  // Tier 3: Fallback heuristic keyword matching on material name (legacy / unclassified items)
  if (!materialName) return false;
  const lower = materialName.toLowerCase();
  return PERMANENT_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Finds all MoUs associated with a given outlet, matching by outletId first,
 * or falling back to a normalized outletName match with anti-name-collision guards.
 */
export function findAvailableMousForOutlet<T extends MouSummaryInfo>(
  mous: T[],
  outletIdOrCriteria?: string | OutletSearchCriteria | null,
  outletName?: string | null,
  branchId?: string | null,
): T[] {
  if (!Array.isArray(mous) || mous.length === 0) return [];

  let targetId: string | null | undefined;
  let targetName: string | null | undefined;
  let targetBranchId: string | null | undefined;

  if (typeof outletIdOrCriteria === "object" && outletIdOrCriteria !== null) {
    targetId = outletIdOrCriteria.id;
    targetName = outletIdOrCriteria.name;
    targetBranchId = outletIdOrCriteria.branchId;
  } else {
    targetId = outletIdOrCriteria;
    targetName = outletName;
    targetBranchId = branchId;
  }

  const normalizedName = targetName?.trim().toLowerCase();

  return mous.filter((mou) => {
    // 1. Direct Primary Key Match (Single Source of Truth)
    if (targetId && mou.outletId && mou.outletId === targetId) {
      return true;
    }

    // 2. Strict Anti-Collision Guard:
    // If the MoU is explicitly linked to a specific outlet ID, it belongs exclusively to that outlet.
    // It must NEVER be matched by another outlet ID or loose name fallback.
    if (mou.outletId) {
      return false;
    }

    // 3. Fallback for unlinked/legacy MoUs (where mou.outletId is null or missing)
    if (normalizedName && mou.outletName && mou.outletName.trim().toLowerCase() === normalizedName) {
      // If branch info is present on both, reject if branches differ (e.g. Semarang vs Solo)
      if (targetBranchId && mou.branchId && targetBranchId !== mou.branchId) {
        return false;
      }
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
  requiresMou?: boolean | null;
  selectedMou?: MouSummaryInfo | null;
  outletMousCount?: number;
  cost?: number | null;
}): MouValidationResult {
  const isPermanent = isPermanentMaterial({
    name: params.materialName,
    type: params.materialType,
    requiresMou: params.requiresMou,
  });

  const cost = typeof params.cost === "number" && !Number.isNaN(params.cost) ? params.cost : 0;
  const isPaid = cost > 0;
  const requiresMou = isPermanent || isPaid;

  if (!requiresMou) {
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

  // Placement requires MoU due to permanent/high-value asset material or rental compensation cost > 0
  if (!params.selectedMou) {
    const hasAvailableMous = typeof params.outletMousCount === "number" && params.outletMousCount > 0;
    const desc = isPaid && isPermanent
      ? "Material permanen & berbayar"
      : isPaid
      ? "Penempatan berbayar"
      : "Material permanen (Signboard/Shopblind)";

    return {
      severity: "warning",
      message: hasAvailableMous
        ? `${desc} memerlukan dasar MoU aktif. Tersedia MoU untuk outlet ini, silakan tautkan.`
        : `Peringatan: ${desc} memerlukan perjanjian sewa/MoU APPROVED. Belum ada MoU terdaftar untuk outlet ini.`,
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
    message: `Status MoU terkait masih ${params.selectedMou.status}. ${
      isPaid ? "Penempatan berbayar" : "Pemasangan permanen"
    } disarankan setelah MoU berstatus APPROVED.`,
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
