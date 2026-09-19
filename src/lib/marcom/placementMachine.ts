// @ts-expect-error Node strip-types requires explicit .ts extension
import { isValidCoordinate } from "./locationUtils.ts";

export type PlacementStatus = "NOT_STARTED" | "ON_PROGRESS" | "DONE" | "ISSUE";

// Reconciled rule: ISSUE is reachable from any non-terminal state; DONE is terminal.
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

export interface PlacementValidationContext {
  photoUrl?: string | null;
  notes?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  shareLocationUrl?: string | null;
}

export interface PlacementValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates status transition and field guards for POSM placement.
 * - Enforces canTransitionPlacement state machine rules
 * - Enforces mandatory photoUrl when transitioning to DONE
 * - Enforces mandatory physical location verification (GPS or shareLocationUrl) when transitioning to DONE
 * - Enforces mandatory notes when transitioning to ISSUE
 */
export function validatePlacementUpdate(
  fromStatus: PlacementStatus,
  toStatus: PlacementStatus,
  context: PlacementValidationContext,
): PlacementValidationResult {
  if (fromStatus !== toStatus && !canTransitionPlacement(fromStatus, toStatus)) {
    return { valid: false, error: `Illegal status transition: ${fromStatus} → ${toStatus}` };
  }
  if (toStatus === "DONE") {
    if (!context.photoUrl || !context.photoUrl.trim()) {
      return {
        valid: false,
        error: "Bukti foto pemasangan fisik (photoUrl) wajib diunggah sebelum status diselesaikan (DONE)",
      };
    }
    const hasValidCoords =
      context.latitude != null &&
      context.longitude != null &&
      isValidCoordinate(context.latitude, context.longitude);
    const hasValidShareUrl =
      typeof context.shareLocationUrl === "string" &&
      context.shareLocationUrl.trim().length > 0;

    if (!hasValidCoords && !hasValidShareUrl) {
      return {
        valid: false,
        error:
          "Verifikasi lokasi fisik (koordinat GPS atau URL share location Google Maps) wajib disertakan sebelum status diselesaikan (DONE)",
      };
    }
  }
  if (toStatus === "ISSUE") {
    if (!context.notes || !context.notes.trim()) {
      return {
        valid: false,
        error: "Catatan kendala lapangan (notes) wajib diisi saat menandai status ISSUE",
      };
    }
  }
  return { valid: true };
}

