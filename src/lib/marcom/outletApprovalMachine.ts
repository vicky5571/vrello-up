import type { OutletStatus } from "@/types";

export type { OutletStatus };

export const OUTLET_STATUSES: readonly OutletStatus[] = [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "REJECTED",
];

const ALLOWED_TRANSITIONS: Record<OutletStatus, readonly OutletStatus[]> = {
  DRAFT: ["PENDING_APPROVAL"],
  PENDING_APPROVAL: ["APPROVED", "REJECTED", "DRAFT"],
  REJECTED: ["DRAFT", "PENDING_APPROVAL"],
  APPROVED: [],
};

/**
 * Pure transition validator for Outlet Approval state machine.
 * Enforces business logic:
 * - DRAFT can only be submitted to PENDING_APPROVAL.
 * - PENDING_APPROVAL can be APPROVED, REJECTED, or retracted to DRAFT.
 * - REJECTED can be amended to DRAFT or re-submitted to PENDING_APPROVAL.
 * - APPROVED is terminal (active master data).
 */
export function canTransitionOutletStatus(
  from: OutletStatus,
  to: OutletStatus
): boolean {
  if (!ALLOWED_TRANSITIONS[from]) return false;
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function isPendingApproval(status?: OutletStatus | string | null): boolean {
  return status === "PENDING_APPROVAL";
}

export function isApproved(status?: OutletStatus | string | null): boolean {
  return status === "APPROVED";
}
