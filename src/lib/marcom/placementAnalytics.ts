export interface PlacementAnalyticsKPIs {
  totalCount: number;
  totalCost: number;
  doneCount: number;
  inProgressCount: number;
  notStartedCount: number;
  pendingCount: number;
  completionRate: number; // 0 to 100
  im3Count: number;
  triCount: number;
}

/**
 * Pure calculation function for Placement KPIs.
 * Computes financial totals, completion rates, brand ratio (IM3 vs Tri),
 * and pending vs completed breakdowns.
 */
export function calculatePlacementKPIs<
  T extends {
    status: string;
    brand?: string | null;
    cost?: number | null;
  },
>(placements: T[]): PlacementAnalyticsKPIs {
  if (!Array.isArray(placements) || placements.length === 0) {
    return {
      totalCount: 0,
      totalCost: 0,
      doneCount: 0,
      inProgressCount: 0,
      notStartedCount: 0,
      pendingCount: 0,
      completionRate: 0,
      im3Count: 0,
      triCount: 0,
    };
  }

  let totalCost = 0;
  let doneCount = 0;
  let inProgressCount = 0;
  let notStartedCount = 0;
  let im3Count = 0;
  let triCount = 0;

  for (const p of placements) {
    // Accumulate cost
    if (typeof p.cost === "number" && !Number.isNaN(p.cost) && p.cost > 0) {
      totalCost += p.cost;
    }

    // Status counts
    const st = p.status ? p.status.toUpperCase() : "NOT_STARTED";
    if (st === "DONE") {
      doneCount++;
    } else if (st === "ON_PROGRESS") {
      inProgressCount++;
    } else {
      notStartedCount++;
    }

    // Brand counts
    const b = (p.brand || "IM3").toUpperCase();
    if (b === "3" || b === "TRI") {
      triCount++;
    } else {
      im3Count++;
    }
  }

  const totalCount = placements.length;
  const pendingCount = notStartedCount + inProgressCount;
  const completionRate = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return {
    totalCount,
    totalCost,
    doneCount,
    inProgressCount,
    notStartedCount,
    pendingCount,
    completionRate,
    im3Count,
    triCount,
  };
}
