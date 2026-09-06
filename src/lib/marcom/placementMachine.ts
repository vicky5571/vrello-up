export type PlacementStatus = "NOT_STARTED" | "ON_PROGRESS" | "DONE" | "ISSUE";

// Placements move NOT_STARTED → ON_PROGRESS → DONE. ISSUE is reachable from
// any non-terminal state (a broken install can be flagged at any point) and
// routes back through ON_PROGRESS for rework. DONE is terminal.
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
