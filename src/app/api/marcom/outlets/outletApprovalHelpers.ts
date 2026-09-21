import { canTransitionOutletStatus } from "@/lib/marcom/outletApprovalMachine";
import type { OutletStatus } from "@/types";

export interface ApprovalActionPayload {
  action?: "APPROVE" | "REJECT";
  code?: string;
  rejectionReason?: string;
}

export interface ApprovalValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateApprovalActionPayload(payload: ApprovalActionPayload): ApprovalValidationResult {
  const errors: string[] = [];

  if (payload.action !== "APPROVE" && payload.action !== "REJECT") {
    errors.push("Aksi harus berupa APPROVE atau REJECT (action).");
  }

  if (payload.action === "REJECT") {
    if (!payload.rejectionReason || payload.rejectionReason.trim().length === 0) {
      errors.push("Alasan penolakan wajib diisi ketika menolak toko (rejectionReason).");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export interface BuildApprovalParams {
  action: "APPROVE" | "REJECT";
  currentStatus: OutletStatus;
  newCode?: string;
  rejectionReason?: string;
  approverName: string;
}

export interface ApprovalTransitionOutput {
  data: {
    status: OutletStatus;
    active: boolean;
    code?: string;
    approvedBy?: string;
    approvedAt?: Date;
    rejectionReason?: string;
  };
}

export function buildApprovalTransitionData(params: BuildApprovalParams): ApprovalTransitionOutput {
  const targetStatus: OutletStatus = params.action === "APPROVE" ? "APPROVED" : "REJECTED";

  if (!canTransitionOutletStatus(params.currentStatus, targetStatus)) {
    throw new Error(
      `Cannot transition outlet status from ${params.currentStatus} to ${targetStatus}.`
    );
  }

  if (params.action === "APPROVE") {
    const data: ApprovalTransitionOutput["data"] = {
      status: "APPROVED",
      active: true,
      approvedBy: params.approverName,
      approvedAt: new Date(),
    };
    if (params.newCode && params.newCode.trim().length > 0) {
      data.code = params.newCode.trim();
    }
    return { data };
  }

  // Action is REJECT
  return {
    data: {
      status: "REJECTED",
      active: false,
      rejectionReason: params.rejectionReason?.trim() || "",
    },
  };
}
