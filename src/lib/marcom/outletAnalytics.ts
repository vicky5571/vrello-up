export interface OutletSummaryInfo {
  id: string;
  code: string;
  name: string;
  type: string;
  tier?: string;
  brand?: string;
  active: boolean;
  branchId: string;
  city?: string;
  latitude?: number | null;
  longitude?: number | null;
  placementCount?: number;
  mouCount?: number;
}

export interface OutletKPIs {
  totalOutlets: number;
  activeCount: number;
  activePercentage: number;
  branchCoverage: number;
  im3Count: number;
  triCount: number;
  tier1Count: number;
  tier2Count: number;
  tier3Count: number;
  withMouCount: number;
  withPlacementCount: number;
}

/**
 * Calculates comprehensive executive KPIs for the store / outlet network.
 */
export function calculateEnhancedOutletKPIs(outlets: OutletSummaryInfo[]): OutletKPIs {
  if (!Array.isArray(outlets) || outlets.length === 0) {
    return {
      totalOutlets: 0,
      activeCount: 0,
      activePercentage: 0,
      branchCoverage: 0,
      im3Count: 0,
      triCount: 0,
      tier1Count: 0,
      tier2Count: 0,
      tier3Count: 0,
      withMouCount: 0,
      withPlacementCount: 0,
    };
  }

  const total = outlets.length;
  let activeCount = 0;
  let im3Count = 0;
  let triCount = 0;
  let tier1Count = 0;
  let tier2Count = 0;
  let tier3Count = 0;
  let withMouCount = 0;
  let withPlacementCount = 0;
  const branchIds = new Set<string>();

  for (const o of outlets) {
    if (o.active) activeCount++;
    if (o.branchId) branchIds.add(o.branchId);

    const brand = (o.brand || "IM3").toUpperCase();
    if (brand === "3" || brand === "TRI") {
      triCount++;
    } else {
      im3Count++;
    }

    const tier = (o.tier || "TIER_1").toUpperCase();
    if (tier === "TIER_1") tier1Count++;
    else if (tier === "TIER_2") tier2Count++;
    else if (tier === "TIER_3") tier3Count++;

    if (typeof o.mouCount === "number" && o.mouCount > 0) withMouCount++;
    if (typeof o.placementCount === "number" && o.placementCount > 0) withPlacementCount++;
  }

  const activePercentage = Math.round((activeCount / total) * 100);

  return {
    totalOutlets: total,
    activeCount,
    activePercentage,
    branchCoverage: branchIds.size,
    im3Count,
    triCount,
    tier1Count,
    tier2Count,
    tier3Count,
    withMouCount,
    withPlacementCount,
  };
}

/**
 * Resolves effective coordinates for an outlet, prioritizing its own coordinates,
 * or falling back to the coordinates recorded in its latest placement.
 */
export function resolveOutletCoordinates(
  outlet: { latitude?: number | null; longitude?: number | null },
  latestPlacement?: { latitude?: number | null; longitude?: number | null } | null,
): { latitude: number | null; longitude: number | null; isInherited: boolean } {
  if (
    typeof outlet.latitude === "number" &&
    !Number.isNaN(outlet.latitude) &&
    typeof outlet.longitude === "number" &&
    !Number.isNaN(outlet.longitude)
  ) {
    return {
      latitude: outlet.latitude,
      longitude: outlet.longitude,
      isInherited: false,
    };
  }

  if (
    latestPlacement &&
    typeof latestPlacement.latitude === "number" &&
    !Number.isNaN(latestPlacement.latitude) &&
    typeof latestPlacement.longitude === "number" &&
    !Number.isNaN(latestPlacement.longitude)
  ) {
    return {
      latitude: latestPlacement.latitude,
      longitude: latestPlacement.longitude,
      isInherited: true,
    };
  }

  return {
    latitude: null,
    longitude: null,
    isInherited: false,
  };
}

export interface OutletMarkerMeta {
  brandLabel: string;
  brandColor: string;
  badgeBg: string;
  badgeText: string;
  tierLabel: string;
  typeLabel: string;
}

/**
 * Returns consistent visual presentation styles for an outlet marker.
 */
export function getOutletMarkerMeta(outlet: {
  brand?: string;
  type?: string;
  tier?: string;
}): OutletMarkerMeta {
  const brand = (outlet.brand || "IM3").toUpperCase();
  const isTri = brand === "3" || brand === "TRI";

  const tier = (outlet.tier || "TIER_1").toUpperCase();
  const tierLabel = tier === "TIER_1" ? "Tier 1" : tier === "TIER_2" ? "Tier 2" : "Tier 3";

  const type = (outlet.type || "TRADITIONAL").toUpperCase();
  const typeLabel = type.replaceAll("_", " ");

  if (isTri) {
    return {
      brandLabel: "3 (Tri)",
      brandColor: "#EC4899",
      badgeBg: "bg-pink-500/10",
      badgeText: "text-pink-600 dark:text-pink-400 border-pink-500/20",
      tierLabel,
      typeLabel,
    };
  }

  return {
    brandLabel: "IM3",
    brandColor: "#EAB308",
    badgeBg: "bg-yellow-500/10",
    badgeText: "text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
    tierLabel,
    typeLabel,
  };
}
