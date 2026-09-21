import type { Prisma, OutletType, OutletTier, OutletStatus } from "@prisma/client";

export const VALID_TYPES = ["TRADITIONAL", "MODERN_RETAIL", "EXCLUSIVE", "CAMPUS_OUTLET"] as const;
export const VALID_TIERS = ["TIER_1", "TIER_2", "TIER_3"] as const;
export const VALID_STATUSES = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED"] as const;

export interface OutletSearchFilterOptions {
  q?: string | null;
  branchId?: string | null;
  type?: string | OutletType | null;
  tier?: string | OutletTier | null;
  status?: string | OutletStatus | null;
}

/**
 * Parses and bounds the limit parameter for outlet search queries.
 * Defaults to 15 when search query is active.
 * Enforces a safe default fallback of 100 when neither limit nor search query is provided.
 * Hard-capped at 100 to protect database performance with large outlet directories (~25k records).
 */
export function parseOutletSearchLimit(
  limitParam: string | null | undefined,
  queryParam: string | null | undefined
): number {
  const hasLimit = limitParam !== null && limitParam !== undefined && limitParam.trim() !== "";
  const hasQuery = queryParam !== null && queryParam !== undefined && queryParam.trim() !== "";

  if (hasLimit) {
    const parsed = parseInt(limitParam, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.min(parsed, 100);
    }
    return hasQuery ? 15 : 100;
  }

  if (hasQuery) {
    return 15;
  }

  return 100;
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
  let status: string | OutletStatus | null | undefined = undefined;

  if (typeof queryOrOptions === "object" && queryOrOptions !== null) {
    q = queryOrOptions.q;
    branchId = queryOrOptions.branchId;
    type = queryOrOptions.type;
    tier = queryOrOptions.tier;
    status = queryOrOptions.status;
  } else {
    q = queryOrOptions;
    if (typeof workspaceIdOrOptions === "object" && workspaceIdOrOptions !== null) {
      branchId = workspaceIdOrOptions.branchId;
      type = workspaceIdOrOptions.type;
      tier = workspaceIdOrOptions.tier;
      status = workspaceIdOrOptions.status;
    } else if (typeof extraOptions === "object" && extraOptions !== null) {
      branchId = extraOptions.branchId;
      type = extraOptions.type;
      tier = extraOptions.tier;
      status = extraOptions.status;
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

  if (
    status &&
    status !== "ALL" &&
    VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])
  ) {
    where.status = status as OutletStatus;
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
