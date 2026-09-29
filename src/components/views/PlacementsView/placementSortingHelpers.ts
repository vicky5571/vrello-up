import type { PlacementStatus } from "@/types";

export const PLACEMENT_STATUS_ORDER: Record<PlacementStatus, number> = {
  NOT_STARTED: 1,
  ON_PROGRESS: 2,
  ISSUE: 3,
  DONE: 4,
};

export function comparePlacementStatus(a: PlacementStatus, b: PlacementStatus): number {
  const orderA = PLACEMENT_STATUS_ORDER[a] ?? 99;
  const orderB = PLACEMENT_STATUS_ORDER[b] ?? 99;
  return orderA - orderB;
}

export function comparePlacementDates(a?: string | null, b?: string | null): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  const timeA = new Date(a).getTime();
  const timeB = new Date(b).getTime();
  if (Number.isNaN(timeA)) return 1;
  if (Number.isNaN(timeB)) return -1;
  return timeA - timeB;
}
