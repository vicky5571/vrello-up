import type { OutletPipelineRow } from "@/types";

export type { OutletPipelineRow };

export interface PipelineFilterState {
  search: string;
  branchId: string;
  tier: string;
  bottleneckOnly: boolean;
}

export const DEFAULT_PIPELINE_FILTERS: PipelineFilterState = {
  search: "",
  branchId: "ALL",
  tier: "ALL",
  bottleneckOnly: false,
};

export type PipelineSortField =
  | "name"
  | "tier"
  | "city"
  | "mou"
  | "placement"
  | "event"
  | "content";

export type PipelineSortOrder = "asc" | "desc";

export interface PipelineSortState {
  field: PipelineSortField;
  order: PipelineSortOrder;
}

export interface PipelineKpiMetrics {
  totalOutlets: number;
  healthyMouCount: number;
  healthyMouPercent: number;
  posmDoneCount: number;
  posmTotalCount: number;
  posmRealizationPercent: number;
  activeEventsCount: number;
  publishedContentCount: number;
  activeEventsAndContent: number;
  bottleneckCount: number;
}

export interface PipelineFilterBarProps {
  filters: PipelineFilterState;
  onChange: (next: PipelineFilterState) => void;
  branches: Array<{ id: string; name: string; code?: string }>;
  totalCount: number;
  filteredCount: number;
  bottleneckCount: number;
  isLoading?: boolean;
  onReset?: () => void;
}

export interface PipelineMatrixTableProps {
  data: OutletPipelineRow[];
  onSelectOutlet: (outletId: string) => void;
  sortField?: PipelineSortField;
  sortOrder?: PipelineSortOrder;
  onSortChange?: (field: PipelineSortField) => void;
}

export interface PipelineCockpitCardListProps {
  data: OutletPipelineRow[];
  onSelectOutlet: (outletId: string) => void;
}

export interface PipelineViewProps {
  workspaceId?: string;
  className?: string;
}

/**
 * Calculates executive KPI metrics from outlet pipeline rows.
 */
export function calculatePipelineKPIs(rows: OutletPipelineRow[]): PipelineKpiMetrics {
  const totalOutlets = rows.length;
  if (totalOutlets === 0) {
    return {
      totalOutlets: 0,
      healthyMouCount: 0,
      healthyMouPercent: 0,
      posmDoneCount: 0,
      posmTotalCount: 0,
      posmRealizationPercent: 0,
      activeEventsCount: 0,
      publishedContentCount: 0,
      activeEventsAndContent: 0,
      bottleneckCount: 0,
    };
  }

  let healthyMouCount = 0;
  let posmDoneCount = 0;
  let posmTotalCount = 0;
  let activeEventsCount = 0;
  let publishedContentCount = 0;
  let bottleneckCount = 0;

  for (const row of rows) {
    if (row.mouSummary?.isHealthy) {
      healthyMouCount++;
    }
    posmDoneCount += row.placementSummary?.doneCount || 0;
    posmTotalCount += row.placementSummary?.total || 0;
    activeEventsCount += row.eventSummary?.upcomingCount || 0;
    publishedContentCount += row.contentSummary?.publishedCount || 0;
    if (row.placementSummary?.hasBlockedItems) {
      bottleneckCount++;
    }
  }

  const healthyMouPercent = totalOutlets > 0 ? Math.round((healthyMouCount / totalOutlets) * 100) : 0;
  const posmRealizationPercent = posmTotalCount > 0 ? Math.round((posmDoneCount / posmTotalCount) * 100) : 0;

  return {
    totalOutlets,
    healthyMouCount,
    healthyMouPercent,
    posmDoneCount,
    posmTotalCount,
    posmRealizationPercent,
    activeEventsCount,
    publishedContentCount,
    activeEventsAndContent: activeEventsCount + publishedContentCount,
    bottleneckCount,
  };
}

/**
 * Pure client-side filtering for pipeline rows.
 */
export function filterPipelineData(
  rows: OutletPipelineRow[],
  filters: PipelineFilterState
): OutletPipelineRow[] {
  let result = rows;

  if (filters.branchId && filters.branchId.toUpperCase() !== "ALL") {
    result = result.filter((r) => r.branch?.id === filters.branchId);
  }

  if (filters.tier && filters.tier.toUpperCase() !== "ALL") {
    result = result.filter((r) => r.tier === filters.tier);
  }

  const q = filters.search.trim().toLowerCase();
  if (q) {
    result = result.filter(
      (r) =>
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.code && r.code.toLowerCase().includes(q)) ||
        (r.city && r.city.toLowerCase().includes(q)) ||
        (r.picName && r.picName.toLowerCase().includes(q)) ||
        (r.address && r.address.toLowerCase().includes(q))
    );
  }

  if (filters.bottleneckOnly) {
    result = result.filter((r) => r.placementSummary?.hasBlockedItems === true);
  }

  return result;
}

/**
 * Pure client-side sorting for pipeline rows.
 */
export function sortPipelineData(
  rows: OutletPipelineRow[],
  field: PipelineSortField,
  order: PipelineSortOrder
): OutletPipelineRow[] {
  const factor = order === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    switch (field) {
      case "name":
        return factor * (a.name || "").localeCompare(b.name || "");
      case "tier":
        return factor * (a.tier || "").localeCompare(b.tier || "");
      case "city":
        return factor * (a.city || "").localeCompare(b.city || "");
      case "mou": {
        const valA = a.mouSummary?.compensationValue || 0;
        const valB = b.mouSummary?.compensationValue || 0;
        if (valA !== valB) return factor * (valA - valB);
        return factor * (a.mouSummary?.latestStatus || "").localeCompare(b.mouSummary?.latestStatus || "");
      }
      case "placement": {
        const rateA = a.placementSummary?.total > 0 ? a.placementSummary.doneCount / a.placementSummary.total : 0;
        const rateB = b.placementSummary?.total > 0 ? b.placementSummary.doneCount / b.placementSummary.total : 0;
        if (rateA !== rateB) return factor * (rateA - rateB);
        return factor * ((a.placementSummary?.total || 0) - (b.placementSummary?.total || 0));
      }
      case "event": {
        const countA = a.eventSummary?.upcomingCount || 0;
        const countB = b.eventSummary?.upcomingCount || 0;
        return factor * (countA - countB);
      }
      case "content": {
        const countA = a.contentSummary?.publishedCount || 0;
        const countB = b.contentSummary?.publishedCount || 0;
        return factor * (countA - countB);
      }
      default:
        return 0;
    }
  });
}
