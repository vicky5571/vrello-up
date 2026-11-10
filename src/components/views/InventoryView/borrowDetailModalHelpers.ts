export interface CancelBorrowDecisionParams {
  status: string;
  borrowerName: string;
  sessionUserName?: string | null;
  canManage: boolean;
  canCancelOwn: boolean;
}

export function canCancelBorrowRecord({
  status,
  borrowerName,
  sessionUserName,
  canManage,
  canCancelOwn,
}: CancelBorrowDecisionParams): { canCancelPending: boolean; canCancelLoan: boolean } {
  const isOwner = Boolean(
    sessionUserName &&
      borrowerName.trim().toLowerCase() === sessionUserName.trim().toLowerCase()
  );
  const canCancelPending = status === "PENDING" && (canManage || (canCancelOwn && isOwner));
  const canCancelLoan = status === "APPROVED" && canManage;

  return { canCancelPending, canCancelLoan };
}
