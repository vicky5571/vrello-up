import type { Prisma, OutletType, OutletTier } from "@prisma/client";

export const VALID_TYPES = ["TRADITIONAL", "MODERN_RETAIL", "EXCLUSIVE", "CAMPUS_OUTLET"] as const;
export const VALID_TIERS = ["TIER_1", "TIER_2", "TIER_3"] as const;

export interface OutletSearchFilterOptions {
  q?: string | null;
  branchId?: string | null;
  type?: string | OutletType | null;
  tier?: string | OutletTier | null;
}

/**
 * Parses and bounds the limit parameter for outlet search queries.
 * Defaults to 15 when search query is active or an explicit limit is provided.
 * Hard-capped at 100 to protect database performance with large outlet directories (~25k records).
 * Returns undefined when neither limit nor search query is given (unrestricted default view).
 */
export function parseOutletSearchLimit(
  limitParam: string | null | undefined,
  queryParam: string | null | undefined
): number | undefined {
  const hasLimit = limitParam !== null && limitParam !== undefined && limitParam.trim() !== "";
  const hasQuery = queryParam !== null && queryParam !== undefined && queryParam.trim() !== "";

  if (hasLimit) {
    const parsed = parseInt(limitParam, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.min(parsed, 100);
    }
    return 15;
  }

  if (hasQuery) {
    return 15;
  }

  return undefined;
}

/**
 * Pure Prisma where-clause builder for debounced outlet search and filtering.
 * Supports both object-based options and positional parameters.
 * Constructs case-insensitive OR matching across code, name, city, and picName.
 */
export function buildOutletSearchWhere(
  queryOrOptions?: string | OutletSearchFilterOptions | null,
  workspaceIdOrOptions?: string | Omit<OutletSearchFilterOptions, "q"> | null,
  extraOptions?: Omit<OutletSearchFilterOptions, "q">
): Prisma.OutletWhereInput {
  let q: string | null | undefined = undefined;
  let branchId: string | null | undefined = undefined;
  let type: string | OutletType | null | undefined = undefined;
  let tier: string | OutletTier | null | undefined = undefined;

  if (typeof queryOrOptions === "object" && queryOrOptions !== null) {
    q = queryOrOptions.q;
    branchId = queryOrOptions.branchId;
    type = queryOrOptions.type;
    tier = queryOrOptions.tier;
  } else {
    q = queryOrOptions;
    if (typeof workspaceIdOrOptions === "object" && workspaceIdOrOptions !== null) {
      branchId = workspaceIdOrOptions.branchId;
      type = workspaceIdOrOptions.type;
      tier = workspaceIdOrOptions.tier;
    } else if (typeof extraOptions === "object" && extraOptions !== null) {
      branchId = extraOptions.branchId;
      type = extraOptions.type;
      tier = extraOptions.tier;
    }
  }

  const where: Prisma.OutletWhereInput = {};

  if (branchId && branchId !== "ALL") {
    where.branchId = branchId;
  }

  const normalizedType = type === "OFFICIAL_STORE" ? "EXCLUSIVE" : type;
  if (
    normalizedType &&
    normalizedType !== "ALL" &&
    VALID_TYPES.includes(normalizedType as (typeof VALID_TYPES)[number])
  ) {
    where.type = normalizedType as OutletType;
  }

  if (tier && tier !== "ALL" && VALID_TIERS.includes(tier as (typeof VALID_TIERS)[number])) {
    where.tier = tier as OutletTier;
  }

  const trimmedQuery = typeof q === "string" ? q.trim() : "";
  if (trimmedQuery.length > 0) {
    const contains = { contains: trimmedQuery, mode: "insensitive" as const };
    where.OR = [
      { code: contains },
      { name: contains },
      { city: contains },
      { picName: contains },
    ];
  }

  return where;
}
