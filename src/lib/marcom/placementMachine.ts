export type PlacementStatus = "NOT_STARTED" | "ON_PROGRESS" | "DONE" | "ISSUE";

// Reconciled rule: ISSUE is reachable from any non-terminal state; DONE is terminal.
const ALLOWED_TRANSITIONS: Record<PlacementStatus, readonly PlacementStatus[]> = {
  NOT_STARTED: ["ON_PROGRESS", "ISSUE"],
  ON_PROGRESS: ["DONE", "ISSUE"],
  ISSUE: ["ON_PROGRESS"],
  DONE: [],
};

export function canTransitionPlacement(
  from: PlacementStatus,
  to: PlacementStatus,
): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}
