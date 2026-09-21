import type {
  MarcomPlacement,
  Branch,
  PosmMatrixCell,
  PosmMatrixRow,
  PosmQuarterlyMatrix,
  PosmBranchBreakdown,
  PosmQuarterlyKpis,
  QuarterlyTargetMap,
} from "@/types";

export const DEFAULT_THEME_FALLBACK = "Reguler / Tanpa Tema";
export const DEFAULT_QUARTER_FALLBACK = "Q3 2026";

/**
 * Parses quarter string like "Q3 2026" into a sortable numeric weight (20263).
 */
function parseQuarterWeight(q: string): number {
  const match = q.match(/Q([1-4])\s*(\d{4})/i);
  if (match) {
    const qNum = parseInt(match[1], 10);
    const year = parseInt(match[2], 10);
    return year * 10 + qNum;
  }
  return 0;
}

/**
 * Extracts unique quarters from placements sorted chronologically,
 * ensuring fallbackQuarter is present.
 */
export function getAvailableQuarters(
  placements: MarcomPlacement[],
  fallbackQuarter = DEFAULT_QUARTER_FALLBACK
): string[] {
  const set = new Set<string>();
  if (fallbackQuarter) set.add(fallbackQuarter);

  for (const p of placements) {
    const q = p.quarter?.trim();
    if (q) set.add(q);
  }

  return Array.from(set).sort((a, b) => {
    const wA = parseQuarterWeight(a);
    const wB = parseQuarterWeight(b);
    if (wA !== wB) return wA - wB;
    return a.localeCompare(b);
  });
}

/**
 * Calculates high-level KPIs for a specified quarter and optional branch.
 */
export function calculateQuarterKpis(
  placements: MarcomPlacement[],
  quarter: string,
  targets?: QuarterlyTargetMap,
  branchId?: string
): PosmQuarterlyKpis {
  const targetQuarter = quarter.trim().toLowerCase();

  const matching = placements.filter((p) => {
    const q = (p.quarter || "").trim().toLowerCase();
    if (q !== targetQuarter) return false;
    if (branchId && p.outlet?.branchId && p.outlet.branchId !== branchId) return false;
    return true;
  });

  const totalActual = matching.length;

  // Sum targets if provided
  let totalTarget = 0;
  if (targets) {
    for (const theme of Object.keys(targets)) {
      for (const matId of Object.keys(targets[theme] || {})) {
        totalTarget += targets[theme][matId] || 0;
      }
    }
  }

  const completionRate = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;

  let validLocationCount = 0;
  const deviations: number[] = [];
  const uniqueOutlets = new Set<string>();

  for (const p of matching) {
    if (p.isLocationValid) validLocationCount++;
    if (typeof p.locationDeviation === "number" && !isNaN(p.locationDeviation)) {
      deviations.push(p.locationDeviation);
    }
    if (p.outletId) uniqueOutlets.add(p.outletId);
  }

  const validLocationPercentage =
    totalActual > 0 ? Math.round((validLocationCount / totalActual) * 100) : 0;

  const averageDeviationMeters =
    deviations.length > 0
      ? Math.round(deviations.reduce((acc, curr) => acc + curr, 0) / deviations.length)
      : 0;

  return {
    totalActual,
    totalTarget,
    completionRate,
    validLocationCount,
    validLocationPercentage,
    averageDeviationMeters,
    activeOutletsCount: uniqueOutlets.size,
  };
}

/**
 * Builds the 2D Matrix: Themes (rows) × Materials (columns) with safe percentages.
 */
export function buildQuarterlyMatrix(
  placements: MarcomPlacement[],
  materials: { id: string; name: string }[],
  quarter: string,
  targets?: QuarterlyTargetMap,
  branchId?: string
): PosmQuarterlyMatrix {
  const targetQuarter = quarter.trim().toLowerCase();

  const matching = placements.filter((p) => {
    const q = (p.quarter || "").trim().toLowerCase();
    if (q !== targetQuarter) return false;
    if (branchId && p.outlet?.branchId && p.outlet.branchId !== branchId) return false;
    return true;
  });

  // Collect all unique themes from placements + targets
  const themeSet = new Set<string>();
  for (const p of matching) {
    const rawTheme = (p.campaignTheme || "").trim();
    themeSet.add(rawTheme.length > 0 ? rawTheme : DEFAULT_THEME_FALLBACK);
  }
  if (targets) {
    for (const theme of Object.keys(targets)) {
      if (theme) themeSet.add(theme);
    }
  }

  // If completely empty, provide fallback
  if (themeSet.size === 0) {
    themeSet.add(DEFAULT_THEME_FALLBACK);
  }

  const themeList = Array.from(themeSet).sort((a, b) => {
    if (a === DEFAULT_THEME_FALLBACK) return 1;
    if (b === DEFAULT_THEME_FALLBACK) return -1;
    return a.localeCompare(b);
  });

  // Build matrix rows
  const rows: PosmMatrixRow[] = [];
  const columnTotals: Record<string, { actual: number; target: number; percentage: number }> = {};

  for (const mat of materials) {
    columnTotals[mat.id] = { actual: 0, target: 0, percentage: 0 };
  }

  let grandTotalActual = 0;
  let grandTotalTarget = 0;

  for (const theme of themeList) {
    const cells: Record<string, PosmMatrixCell> = {};
    let rowActual = 0;
    let rowTarget = 0;

    for (const mat of materials) {
      const actualCount = matching.filter((p) => {
        const pTheme = (p.campaignTheme || "").trim() || DEFAULT_THEME_FALLBACK;
        return pTheme.toLowerCase() === theme.toLowerCase() && p.materialId === mat.id;
      }).length;

      const targetCount = targets?.[theme]?.[mat.id] || 0;
      const percentage = targetCount > 0 ? Math.round((actualCount / targetCount) * 100) : 0;

      cells[mat.id] = {
        materialId: mat.id,
        materialName: mat.name,
        actual: actualCount,
        target: targetCount,
        percentage,
      };

      rowActual += actualCount;
      rowTarget += targetCount;

      columnTotals[mat.id].actual += actualCount;
      columnTotals[mat.id].target += targetCount;
    }

    const rowPercentage = rowTarget > 0 ? Math.round((rowActual / rowTarget) * 100) : 0;

    rows.push({
      theme,
      cells,
      totalActual: rowActual,
      totalTarget: rowTarget,
      totalPercentage: rowPercentage,
    });

    grandTotalActual += rowActual;
    grandTotalTarget += rowTarget;
  }

  // Finalize column percentages
  for (const mat of materials) {
    const col = columnTotals[mat.id];
    col.percentage = col.target > 0 ? Math.round((col.actual / col.target) * 100) : 0;
  }

  const grandTotalPercentage =
    grandTotalTarget > 0 ? Math.round((grandTotalActual / grandTotalTarget) * 100) : 0;

  return {
    quarter,
    materials,
    rows,
    columnTotals,
    grandTotalActual,
    grandTotalTarget,
    grandTotalPercentage,
  };
}

/**
 * Calculates comparative regional performance breakdown across branches.
 */
export function calculateBranchBreakdown(
  placements: MarcomPlacement[],
  branches: Branch[],
  quarter: string,
  targets?: Record<string, number>
): PosmBranchBreakdown[] {
  const targetQuarter = quarter.trim().toLowerCase();

  const matching = placements.filter(
    (p) => (p.quarter || "").trim().toLowerCase() === targetQuarter
  );

  return branches.map((branch) => {
    const branchPlacements = matching.filter(
      (p) => p.outlet?.branchId === branch.id
    );

    const totalPlacements = branchPlacements.length;
    const targetPlacements = targets?.[branch.id] || 0;
    const percentage =
      targetPlacements > 0 ? Math.round((totalPlacements / targetPlacements) * 100) : 0;

    let validGpsCount = 0;
    const themeCounts: Record<string, number> = {};

    for (const p of branchPlacements) {
      if (p.isLocationValid) validGpsCount++;
      const theme = (p.campaignTheme || "").trim() || DEFAULT_THEME_FALLBACK;
      themeCounts[theme] = (themeCounts[theme] || 0) + 1;
    }

    const gpsIntegrityRate =
      totalPlacements > 0 ? Math.round((validGpsCount / totalPlacements) * 100) : 0;

    // Determine top theme
    let topTheme = "—";
    let maxThemeCount = 0;
    for (const [theme, count] of Object.entries(themeCounts)) {
      if (count > maxThemeCount) {
        maxThemeCount = count;
        topTheme = theme;
      }
    }

    return {
      branchId: branch.id,
      branchName: branch.name,
      totalPlacements,
      targetPlacements,
      percentage,
      validGpsCount,
      gpsIntegrityRate,
      topTheme,
    };
  });
}
