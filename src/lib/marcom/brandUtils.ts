import type { Brand } from "@/types";

export type { Brand };
export type BrandType = Brand;

export interface BrandMeta {
  brand: Brand;
  label: string;
  shortLabel: string;
  color: string; // primary pin color
  textColor: string;
  contrastColor: string; // for text inside pin
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  badgeClass: string;
}

export const BRAND_CONFIG: Record<Brand, BrandMeta> = {
  IM3: {
    brand: "IM3",
    label: "IM3",
    shortLabel: "IM3",
    color: "#EAB308", // Vibrant Yellow / Amber
    textColor: "text-amber-600 dark:text-amber-400",
    contrastColor: "#92400E", // High contrast amber-800 for readability on white
    borderColor: "#CA8A04",
    badgeBg: "bg-yellow-400/15",
    badgeText: "text-yellow-800 dark:text-yellow-300",
    badgeBorder: "border-yellow-400/30",
    badgeClass: "bg-yellow-400/15 text-yellow-800 dark:text-yellow-300 border border-yellow-400/30 font-bold",
  },
  TRI: {
    brand: "TRI",
    label: "3 (Tri)",
    shortLabel: "3",
    color: "#EC4899", // Vibrant Pink / Magenta
    textColor: "text-pink-600 dark:text-pink-400",
    contrastColor: "#BE185D", // High contrast pink-700 for readability on white
    borderColor: "#DB2777",
    badgeBg: "bg-pink-500/15",
    badgeText: "text-pink-700 dark:text-pink-300",
    badgeBorder: "border-pink-500/30",
    badgeClass: "bg-pink-500/15 text-pink-700 dark:text-pink-300 border border-pink-500/30 font-bold",
  },
};

/**
 * Normalizes any raw brand string input (e.g. "3", "tri", "TRI", "IM3", "im3")
 * into canonical Brand enum ("IM3" | "TRI"). Defaults to "IM3" if unknown or unspecified.
 */
export function normalizeBrand(raw?: string | null): Brand {
  if (!raw) return "IM3";
  const trimmed = raw.trim().toUpperCase();
  if (trimmed === "3" || trimmed === "TRI" || trimmed === "THREE") {
    return "TRI";
  }
  return "IM3";
}

/**
 * Retrieves the BrandMeta configuration for a brand name.
 */
export function getBrandMeta(raw?: string | null): BrandMeta {
  const normalized = normalizeBrand(raw);
  return BRAND_CONFIG[normalized];
}
