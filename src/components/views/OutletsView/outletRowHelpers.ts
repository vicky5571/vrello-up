import type { OutletTier, Brand } from "@/types";

/**
 * Formats outlet tier and brand into a clean display label (e.g. "TIER 1 • IM3").
 */
export function formatTierAndBrand(
  tier?: OutletTier | string | null,
  brand?: Brand | string | null,
): string {
  const cleanTier = (tier || "TIER_1").replaceAll("_", " ");
  const cleanBrand = brand || "IM3";
  return `${cleanTier} • ${cleanBrand}`;
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
