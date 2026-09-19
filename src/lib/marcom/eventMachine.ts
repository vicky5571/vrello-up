import type { EventStatus } from "@/types";

export type { EventStatus };

export const EVENT_STATUSES: readonly EventStatus[] = [
  "UPCOMING",
  "ON_PROGRESS",
  "COMPLETED",
  "CANCELLED",
] as const;

// Transition rules:
// - UPCOMING can transition to ON_PROGRESS (event kicks off) or CANCELLED (event cancelled before start)
// - ON_PROGRESS can transition to COMPLETED (event successfully finished) or CANCELLED (aborted during execution)
// - COMPLETED is terminal (historical record preserved for KPI and footfall audits)
// - CANCELLED can transition back to UPCOMING (if event is rescheduled or reactivated)
const ALLOWED_TRANSITIONS: Record<EventStatus, readonly EventStatus[]> = {
  UPCOMING: ["ON_PROGRESS", "CANCELLED"],
  ON_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: ["UPCOMING"],
};

export function canTransitionEvent(from: EventStatus, to: EventStatus): boolean {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

