export type MouStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "DONE";

// The only statuses the API accepts. Deliberately excludes the Prisma
// MouStatus.ON_PROGRESS value: the machine has no edges to/from it, so a
// row created with ON_PROGRESS could never change status again.
export const MOU_STATUSES: readonly MouStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
  "DONE",
];

// Reconciled transitions with revision loop:
// - SUBMITTED can be APPROVED, REJECTED, or pulled back to DRAFT for corrections
// - REJECTED can transition back to DRAFT so field staff can amend documents/details and resubmit
// - DONE is terminal
const ALLOWED_TRANSITIONS: Record<MouStatus, readonly MouStatus[]> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["APPROVED", "REJECTED", "DRAFT"],
  APPROVED: ["DONE"],
  REJECTED: ["DRAFT"],
  DONE: [],
};

export function canTransitionMou(from: MouStatus, to: MouStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}
