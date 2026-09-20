import { parsePlacementPhotos } from "@/lib/marcom/photoUtils";

export interface PlacementActionState {
  canStart: boolean;
  canResume: boolean;
  canMarkDone: boolean;
  needsPhoto: boolean;
  nextStatus?: "ON_PROGRESS" | "DONE";
  actionLabel: string;
}

export interface OutletActionSummary {
  pendingMousCount: number;
  issuePlacementsCount: number;
  unstartedPlacementsCount: number;
  totalPendingCount: number;
}

/**
 * Determines whether a user can approve/reject an MoU.
 * Strict RBAC: Requires MoU to be in SUBMITTED state and user to possess APPROVE_MOU permission.
 */
export function canPerformMouAction(mouStatus: string, hasPermission: boolean): boolean {
  return mouStatus === "SUBMITTED" && hasPermission;
}

/**
 * Computes available quick status actions for a placement item.
 * Strictly adheres to placementMachine.ts constraints:
 * - DONE requires photoUrl proof
 * - ISSUE transitions back to ON_PROGRESS
 * - NOT_STARTED transitions to ON_PROGRESS
 */
export function getPlacementActionState(
  status: string,
  photoUrl?: string | null
): PlacementActionState {
  const photos = parsePlacementPhotos(photoUrl);
  const hasPhoto = photos.length > 0;

  switch (status) {
    case "NOT_STARTED":
      return {
        canStart: true,
        canResume: false,
        canMarkDone: false,
        needsPhoto: false,
        nextStatus: "ON_PROGRESS",
        actionLabel: "Mulai Pasang",
      };
    case "ISSUE":
      return {
        canStart: false,
        canResume: true,
        canMarkDone: false,
        needsPhoto: false,
        nextStatus: "ON_PROGRESS",
        actionLabel: "Lanjutkan Pasang",
      };
    case "ON_PROGRESS":
      if (hasPhoto) {
        return {
          canStart: false,
          canResume: false,
          canMarkDone: true,
          needsPhoto: false,
          nextStatus: "DONE",
          actionLabel: "Tandai Selesai",
        };
      }
      return {
        canStart: false,
        canResume: false,
        canMarkDone: false,
        needsPhoto: true,
        actionLabel: "Upload Bukti Foto",
      };
    case "DONE":
    default:
      return {
        canStart: false,
        canResume: false,
        canMarkDone: false,
        needsPhoto: false,
        actionLabel: "Selesai",
      };
  }
}

/**
 * Computes the bottleneck and pending action count for Cockpit Overview spotlight.
 */
export function summarizeOutletPendingActions(
  mous: Array<{ status: string }> = [],
  placements: Array<{ status: string }> = []
): OutletActionSummary {
  let pendingMousCount = 0;
  let issuePlacementsCount = 0;
  let unstartedPlacementsCount = 0;

  for (const m of mous) {
    if (m.status === "SUBMITTED") {
      pendingMousCount++;
    }
  }

  for (const p of placements) {
    if (p.status === "ISSUE") {
      issuePlacementsCount++;
    } else if (p.status === "NOT_STARTED") {
      unstartedPlacementsCount++;
    }
  }

  return {
    pendingMousCount,
    issuePlacementsCount,
    unstartedPlacementsCount,
    totalPendingCount: pendingMousCount + issuePlacementsCount + unstartedPlacementsCount,
  };
}
