import { isValidCoordinate } from "@/lib/marcom/locationUtils";

export interface OutletPlacementMaterial {
  id?: string;
  name?: string;
  type?: string;
  requiresMou?: boolean;
}

export interface OutletPlacementSummary {
  id?: string;
  material?: OutletPlacementMaterial | null;
  [key: string]: unknown;
}

export interface OutletSearchResult {
  id: string;
  code: string;
  name: string;
  type?: string;
  tier?: string;
  address?: string;
  city?: string;
  picName?: string;
  picPhone?: string;
  active?: boolean;
  brand?: string;
  latitude?: number | null;
  longitude?: number | null;
  branchId?: string;
  branch?: {
    id?: string;
    code?: string;
    name?: string;
    city?: string;
    region?: string;
    picName?: string;
    picPhone?: string;
    address?: string;
  } | null;
  placements?: OutletPlacementSummary[];
  placementCount?: number;
  mouCount?: number;
}

export type OutletSelectionPayload = OutletSearchResult | null;

export function extractRecentPlacementMaterials(
  placements?: OutletPlacementSummary[] | null
): string[] {
  if (!placements || !Array.isArray(placements)) return [];
  const tags = new Set<string>();
  for (const p of placements) {
    const matName = p.material?.name || p.material?.type;
    if (matName && typeof matName === "string" && matName.trim()) {
      tags.add(matName.trim());
    }
  }
  return Array.from(tags);
}

export function formatCoordinates(
  lat: number | null | undefined,
  lng: number | null | undefined
): { isSet: boolean; text: string } {
  if (
    typeof lat === "number" &&
    typeof lng === "number" &&
    isValidCoordinate(lat, lng)
  ) {
    return {
      isSet: true,
      text: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    };
  }
  return {
    isSet: false,
    text: "Titik GPS belum diatur",
  };
}

export function getBrandBadgeMeta(brand?: string | null): {
  normalizedBrand: string;
  isIM3: boolean;
  is3: boolean;
} | null {
  if (!brand || !brand.trim()) return null;
  const upper = brand.toUpperCase().trim();
  const is3 = upper === "3" || upper === "TRI";
  const isIM3 = upper === "IM3";
  return {
    normalizedBrand: brand.trim(),
    isIM3,
    is3,
  };
}
