import type { Prisma, OutletType, OutletStatus, Brand } from "@prisma/client";

export const VALID_TYPES = ["TRADITIONAL", "MODERN_RETAIL", "EXCLUSIVE", "CAMPUS_OUTLET"] as const;
export const VALID_STATUSES = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED"] as const;

export interface OutletSearchFilterOptions {
  q?: string | null;
  branchId?: string | null;
  type?: string | OutletType | null;
  status?: string | OutletStatus | null;
  brand?: string | Brand | null;
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
  let status: string | OutletStatus | null | undefined = undefined;
  let brand: string | Brand | null | undefined = undefined;

  if (typeof queryOrOptions === "object" && queryOrOptions !== null) {
    q = queryOrOptions.q;
    branchId = queryOrOptions.branchId;
    type = queryOrOptions.type;
    status = queryOrOptions.status;
    brand = queryOrOptions.brand;
  } else {
    q = queryOrOptions;
    if (typeof workspaceIdOrOptions === "object" && workspaceIdOrOptions !== null) {
      branchId = workspaceIdOrOptions.branchId;
      type = workspaceIdOrOptions.type;
      status = workspaceIdOrOptions.status;
      brand = workspaceIdOrOptions.brand;
    } else if (typeof extraOptions === "object" && extraOptions !== null) {
      branchId = extraOptions.branchId;
      type = extraOptions.type;
      status = extraOptions.status;
      brand = extraOptions.brand;
    }
  }

  const where: Prisma.OutletWhereInput = {};

  if (branchId && branchId !== "ALL") {
    where.branchId = branchId;
  }

  if (brand && brand !== "ALL") {
    const bStr = typeof brand === "string" ? brand.trim().toUpperCase() : "";
    if (bStr === "3" || bStr === "TRI") {
      where.brand = "TRI" as Brand;
    } else if (bStr === "IM3") {
      where.brand = "IM3" as Brand;
    }
  }

  const normalizedType = type === "OFFICIAL_STORE" ? "EXCLUSIVE" : type;
  if (
    normalizedType &&
    normalizedType !== "ALL" &&
    VALID_TYPES.includes(normalizedType as (typeof VALID_TYPES)[number])
  ) {
    where.type = normalizedType as OutletType;
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
    const tokens = trimmedQuery.split(/\s+/).filter(Boolean);
    if (tokens.length === 1) {
      const contains = { contains: tokens[0], mode: "insensitive" as const };
      where.OR = [
        { code: contains },
        { name: contains },
        { city: contains },
        { picName: contains },
      ];
    } else if (tokens.length > 1) {
      where.AND = tokens.map((token) => {
        const contains = { contains: token, mode: "insensitive" as const };
        return {
          OR: [
            { code: contains },
            { name: contains },
            { city: contains },
            { picName: contains },
          ],
        };
      });
    }
  }

  return where;
}

export function scoreOutletSearchRelevance(
  outlet: {
    code?: string | null;
    name?: string | null;
    city?: string | null;
    picName?: string | null;
  },
  query: string
): number {
  if (!query || typeof query !== "string") return 0;
  const q = query.trim().toLowerCase();
  if (!q) return 0;

  const code = (outlet.code || "").toLowerCase();
  const name = (outlet.name || "").toLowerCase();
  const city = (outlet.city || "").toLowerCase();
  const pic = (outlet.picName || "").toLowerCase();

  let score = 0;
  // Exact matches
  if (code === q) score += 100;
  if (name === q) score += 90;

  // Prefix matches
  if (code.startsWith(q)) score += 60;
  if (name.startsWith(q)) score += 50;

  // Substring matches
  if (name.includes(q)) score += 30;
  if (code.includes(q)) score += 20;
  if (city.includes(q)) score += 10;
  if (pic.includes(q)) score += 5;

  return score;
}

export function rankOutletsByRelevance<
  T extends {
    code?: string | null;
    name?: string | null;
    city?: string | null;
    picName?: string | null;
  },
>(outlets: T[], query: string): T[] {
  if (!query || !query.trim()) return outlets;
  return [...outlets].sort((a, b) => {
    const scoreA = scoreOutletSearchRelevance(a, query);
    const scoreB = scoreOutletSearchRelevance(b, query);
    return scoreB - scoreA;
  });
}

