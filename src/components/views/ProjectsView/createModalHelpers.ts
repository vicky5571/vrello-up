import type {
  MarcomWorkItemType,
  ProjectsColumn,
  MarcomPlacement,
  PlacementStatus,
} from "@/types";
import { mapColumnToStatus } from "@/lib/marcom/workItems";

export interface CreateWorkItemRequest {
  type: MarcomWorkItemType;
  date?: string;
  status?: string;
  branchId?: string;
  outletId?: string;
}

/**
 * Returns a clean YYYY-MM-DD date string. Falls back to today's ISO date.
 */
export function sanitizeDateInput(dateStr?: string | null): string {
  if (!dateStr) return new Date().toISOString().slice(0, 10);
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) {
      return new Date().toISOString().slice(0, 10);
    }
    return d.toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

/**
 * Resolves initial status for new work item based on target column or sensible default.
 */
export function resolveInitialStatus(
  type: MarcomWorkItemType,
  column?: ProjectsColumn,
): string {
  if (column) {
    const mapped = mapColumnToStatus(type, column);
    if (mapped) return mapped;
  }

  if (type === "content") return "SCHEDULED";
  if (type === "event") return "UPCOMING";
  return "NOT_STARTED";
}

/**
 * Prepares initial Partial<MarcomPlacement> ensuring status is strictly valid in the state machine.
 */
export function getInitialPlacementPayload(
  request: CreateWorkItemRequest,
): Partial<MarcomPlacement> {
  const validPlacementStatuses: PlacementStatus[] = [
    "NOT_STARTED",
    "ON_PROGRESS",
    "DONE",
    "ISSUE",
  ];

  const targetStatus =
    request.status && validPlacementStatuses.includes(request.status as PlacementStatus)
      ? (request.status as PlacementStatus)
      : "NOT_STARTED";

  return {
    status: targetStatus,
    date: sanitizeDateInput(request.date),
    outletId: request.outletId,
  };
}
