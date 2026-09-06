export type MouStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "DONE";

// Terminal-wins, same reconciliation as the placement machine:
// DONE and REJECTED are terminal; the only legal moves are the
// four approval-flow edges below.
const ALLOWED_TRANSITIONS: Record<MouStatus, readonly MouStatus[]> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["APPROVED", "REJECTED"],
  APPROVED: ["DONE"],
  REJECTED: [],
  DONE: [],
};

export function canTransitionMou(from: MouStatus, to: MouStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}
