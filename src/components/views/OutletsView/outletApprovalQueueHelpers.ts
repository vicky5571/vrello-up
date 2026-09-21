import type { OutletItem, OutletStatus } from "@/types";

export function filterPendingOutlets(outlets?: OutletItem[] | null): OutletItem[] {
  if (!outlets || !Array.isArray(outlets)) return [];
  return outlets.filter((o) => o.status === "PENDING_APPROVAL");
}

function normalizeStoreName(name?: string | null): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/\b(toko|kios|konter|cell|cellular|selular|counter)\b/gi, "")
    .replace(/[^a-z0-9]/gi, "")
    .trim();
}

/**
 * Checks whether an incoming draft store might be a duplicate of an existing active store
 * in the same branch by comparing normalized core keywords.
 */
export function detectPotentialDuplicateOutlets(
  candidateName: string,
  candidateBranchId: string,
  allOutlets: OutletItem[],
  candidateId?: string
): OutletItem[] {
  if (!candidateName || !candidateBranchId || !allOutlets) return [];

  const normalizedCandidate = normalizeStoreName(candidateName);
  if (normalizedCandidate.length < 3) return [];

  return allOutlets.filter((existing) => {
    // Skip self or different branch
    if (existing.id === candidateId) return false;
    if (existing.branchId !== candidateBranchId) return false;
    // We only care about matching against approved/active or other outlets
    if (existing.status === "REJECTED") return false;

    const normalizedExisting = normalizeStoreName(existing.name);
    if (!normalizedExisting) return false;

    // Check substring inclusion or exact match
    return (
      normalizedExisting === normalizedCandidate ||
      normalizedExisting.includes(normalizedCandidate) ||
      normalizedCandidate.includes(normalizedExisting)
    );
  });
}

export interface ApprovalBadgeInfo {
  label: string;
  colorClass: string;
}

export function getApprovalStatusBadge(status?: OutletStatus | string | null): ApprovalBadgeInfo {
  switch (status) {
    case "PENDING_APPROVAL":
      return {
        label: "Menunggu ACC",
        colorClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
      };
    case "APPROVED":
      return {
        label: "Disetujui",
        colorClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
      };
    case "REJECTED":
      return {
        label: "Ditolak",
        colorClass: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
      };
    case "DRAFT":
    default:
      return {
        label: "Draft",
        colorClass: "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30",
      };
  }
}
