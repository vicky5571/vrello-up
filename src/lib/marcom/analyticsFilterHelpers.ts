/**
 * Pure multi-dimensional filtering utilities for the Operational Analytics Hub.
 *
 * These helpers scope raw Marcom entities (placements, MOUs, events, content)
 * by branch territory, brand portfolio and temporal (quarter / year) horizons
 * BEFORE any aggregation or unit-economics calculation is executed.
 *
 * All functions are side-effect free and safe against missing / malformed dates.
 */

import type {
  MarcomPlacement,
  MarcomMou,
  FieldEventItem,
  ContentPostItem,
} from "@/types";

export type AnalyticsQuarter = "ALL" | "Q1" | "Q2" | "Q3" | "Q4";

export interface AnalyticsFilterState {
  /** "ALL" or a specific branchId. For events, a branch name is also accepted. */
  branchId: string;
  /** "ALL" | "IM3" | "TRI" */
  brand: string;
  /** "ALL" | "Q1" | "Q2" | "Q3" | "Q4" */
  quarter: AnalyticsQuarter | string;
  /** e.g. 2026 */
  year: number;
}

export const DEFAULT_ANALYTICS_FILTERS: AnalyticsFilterState = {
  branchId: "ALL",
  brand: "ALL",
  quarter: "ALL",
  year: new Date().getFullYear(),
};

/**
 * Returns true when the given date falls inside the requested calendar quarter.
 * A quarter of "ALL" always matches; a missing / invalid date never matches a
 * specific quarter.
 */
export function isDateInQuarter(
  dateVal: string | Date | null | undefined,
  quarter: string,
  year: number
): boolean {
  if (quarter === "ALL") return true;
  if (!dateVal) return false;

  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return false;
  if (d.getFullYear() !== year) return false;

  const month = d.getMonth(); // 0-11
  switch (quarter) {
    case "Q1":
      return month >= 0 && month <= 2;
    case "Q2":
      return month >= 3 && month <= 5;
    case "Q3":
      return month >= 6 && month <= 8;
    case "Q4":
      return month >= 9 && month <= 11;
    default:
      return true;
  }
}

/**
 * Type guard: whether any filter dimension is active (non-"ALL").
 */
export function isAnyFilterActive(filters: AnalyticsFilterState): boolean {
  return (
    filters.branchId !== "ALL" ||
    filters.brand !== "ALL" ||
    filters.quarter !== "ALL"
  );
}

function matchesBrand(entityBrand: string | null | undefined, filterBrand: string): boolean {
  if (filterBrand === "ALL") return true;
  const normalized = (entityBrand || "").toUpperCase();
  return normalized.includes(filterBrand.toUpperCase());
}

export function filterPlacementsByCriteria(
  placements: MarcomPlacement[],
  filters: AnalyticsFilterState
): MarcomPlacement[] {
  const safe = Array.isArray(placements) ? placements : [];
  return safe.filter((p) => {
    // 1. Branch filter
    if (filters.branchId !== "ALL") {
      const pBranchId = p.outlet?.branchId;
      if (pBranchId !== filters.branchId) return false;
    }

    // 2. Brand filter
    if (!matchesBrand(p.brand, filters.brand)) return false;

    // 3. Quarter / Year filter
    if (filters.quarter !== "ALL") {
      const dateVal = p.date ?? p.quarter ?? null;
      if (!isDateInQuarter(dateVal, filters.quarter, filters.year)) {
        return false;
      }
    }

    return true;
  });
}

export function filterMousByCriteria(
  mous: MarcomMou[],
  filters: AnalyticsFilterState
): MarcomMou[] {
  const safe = Array.isArray(mous) ? mous : [];
  return safe.filter((m) => {
    // 1. Branch filter
    if (filters.branchId !== "ALL" && m.branchId !== filters.branchId) {
      return false;
    }

    // 2. Quarter / Year filter (based on submissionDate, then startDate)
    if (filters.quarter !== "ALL") {
      const dateVal = m.submissionDate || m.startDate;
      if (!isDateInQuarter(dateVal, filters.quarter, filters.year)) {
        return false;
      }
    }

    return true;
  });
}

export function filterEventsByCriteria(
  events: FieldEventItem[],
  filters: AnalyticsFilterState,
  branchNameLookup?: string
): FieldEventItem[] {
  const safe = Array.isArray(events) ? events : [];
  return safe.filter((e) => {
    // 1. Branch filter:
    // FieldEvent stores a human-readable `branchName` rather than `branchId`.
    // Match either against filters.branchId directly (fallback for tests/fixtures)
    // or against the resolved `branchNameLookup`.
    if (filters.branchId !== "ALL") {
      const eventBranch = (e.branchName || "").trim().toLowerCase();
      const targetId = filters.branchId.trim().toLowerCase();
      const targetLookup = (branchNameLookup || "").trim().toLowerCase();

      const matchesDirect = eventBranch === targetId;
      const matchesLookup = targetLookup !== "" && eventBranch === targetLookup;

      if (!matchesDirect && !matchesLookup) return false;
    }

    // 2. Quarter / Year filter
    if (filters.quarter !== "ALL") {
      const dateVal = e.startDate || e.date || e.endDate;
      if (!isDateInQuarter(dateVal, filters.quarter, filters.year)) {
        return false;
      }
    }

    return true;
  });
}

export function filterContentByCriteria(
  contents: ContentPostItem[],
  filters: AnalyticsFilterState
): ContentPostItem[] {
  const safe = Array.isArray(contents) ? contents : [];
  return safe.filter((c) => {
    // 1. Quarter / Year filter (based on publishDate, then createdAt)
    if (filters.quarter !== "ALL") {
      const dateVal = c.publishDate || c.createdAt;
      if (!isDateInQuarter(dateVal, filters.quarter, filters.year)) {
        return false;
      }
    }

    return true;
  });
}
