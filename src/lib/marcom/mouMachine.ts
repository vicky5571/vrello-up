import type { MouStatus } from "@/types";

export type { MouStatus };

// The only statuses the API accepts. Deliberately excludes the Prisma
// MouStatus.ON_PROGRESS value: the machine has no edges to/from it, so a
// row created with ON_PROGRESS could never change status again.
export const MOU_STATUSES: readonly MouStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "REVISION",
  "APPROVED",
  "REJECTED",
  "DONE",
];

// Reconciled transitions with revision loop:
// - SUBMITTED can be APPROVED, REVISION, REJECTED, or pulled back to DRAFT for corrections
// - REVISION can transition back to SUBMITTED or DRAFT
// - REJECTED can transition back to DRAFT so field staff can amend documents/details and resubmit
// - DONE is terminal
const ALLOWED_TRANSITIONS: Record<MouStatus, readonly MouStatus[]> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["APPROVED", "REVISION", "REJECTED", "DRAFT"],
  REVISION: ["SUBMITTED", "DRAFT"],
  APPROVED: ["DONE"],
  REJECTED: ["DRAFT"],
  DONE: [],
};

export function canTransitionMou(from: MouStatus, to: MouStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}
