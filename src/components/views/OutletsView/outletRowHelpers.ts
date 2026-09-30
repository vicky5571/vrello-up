import type { Brand } from "@/types";

/**
 * Formats outlet brand into a clean display label (e.g. "IM3").
 */
export function formatBrand(
  brand?: Brand | string | null,
): string {
  return brand || "IM3";
}

/**
 * Formats GPS coordinates to 5 decimal places, or returns "Belum disetel" if missing.
 */
export function formatOutletCoordinates(
  latitude?: number | null,
  longitude?: number | null,
): string {
  if (typeof latitude === "number" && typeof longitude === "number") {
    return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  }
  return "Belum disetel";
}
