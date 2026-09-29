import type { MarcomPlacement } from "@/types";

export const PLACEMENT_SEARCH_KEYS: (keyof MarcomPlacement)[] = [
  "picName",
  "dimensions",
  "notes",
  "locationNotes",
];

export function extractPlacementSearchText(p: MarcomPlacement): string {
  const tokens: string[] = [];

  if (p.outlet?.name) tokens.push(p.outlet.name);
  if (p.outlet?.code) tokens.push(p.outlet.code);
  if (p.material?.name) tokens.push(p.material.name);
  if (p.picName) tokens.push(p.picName);
  if (p.dimensions) tokens.push(p.dimensions);
  if (p.notes) tokens.push(p.notes);
  if (p.locationNotes) tokens.push(p.locationNotes);
  if (p.brand) tokens.push(p.brand);

  return tokens.join(" ").toLowerCase();
}
