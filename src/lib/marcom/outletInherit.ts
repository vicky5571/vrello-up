// @ts-expect-error Node strip-types requires explicit .ts extension
import { isValidCoordinate } from "./locationUtils.ts";

export interface InheritedOutletLocation {
  latitude: number;
  longitude: number;
  shareLocationUrl?: string;
  locationNotes?: string;
}

/**
 * Searches historical placements for a given outlet to find previously recorded
 * GPS coordinates and location notes.
 */
export function findOutletCoordinates<
  T extends {
    outletId: string;
    latitude?: number | null;
    longitude?: number | null;
    shareLocationUrl?: string;
    locationNotes?: string;
  },
>(outletId: string, placements: T[]): InheritedOutletLocation | null {
  if (!outletId || !Array.isArray(placements)) return null;

  // Find the first placement for this outlet that has valid coordinates
  const match = placements.find(
    (p) =>
      p.outletId === outletId &&
      isValidCoordinate(p.latitude ?? Number.NaN, p.longitude ?? Number.NaN),
  );

  if (!match || typeof match.latitude !== "number" || typeof match.longitude !== "number") {
    return null;
  }

  return {
    latitude: match.latitude,
    longitude: match.longitude,
    shareLocationUrl: match.shareLocationUrl || "",
    locationNotes: match.locationNotes || "",
  };
}
