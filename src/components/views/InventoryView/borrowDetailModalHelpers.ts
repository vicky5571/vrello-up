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

export interface SettleBorrowDecisionParams {
  compensationStatus?: string;
  borrowerName: string;
  sessionUserName?: string | null;
  canManage: boolean;
}

export function getSettlementUiState({
  compensationStatus,
  borrowerName,
  sessionUserName,
  canManage,
}: SettleBorrowDecisionParams) {
  const isOwner = Boolean(
    sessionUserName &&
      borrowerName.trim().toLowerCase() === sessionUserName.trim().toLowerCase()
  );

  const canDirectSettle = compensationStatus === "PENDING_SETTLEMENT" && canManage;
  const canStaffSubmit = compensationStatus === "PENDING_SETTLEMENT" && !canManage && isOwner;
  const isPendingVerification = compensationStatus === "PENDING_VERIFICATION";
  const canVerify = isPendingVerification && canManage;
  const isStaffWaiting = isPendingVerification && !canManage;

  return {
    isOwner,
    canDirectSettle,
    canStaffSubmit,
    isPendingVerification,
    canVerify,
    isStaffWaiting,
  };
}
