/**
 * Pure drill-down helpers for the POSM unit-economics chart.
 *
 * Kept in a dependency-free module (instead of inline in the `.tsx` component)
 * so the Recharts click-payload contract can be unit tested with the Node test
 * runner, which cannot import `.tsx` modules.
 */

/**
 * Defensively extracts the `materialName` string from a Recharts Bar click event.
 * Recharts passes `{ x, y, width, height, value, payload: T }` where the raw row
 * data lives on `entry.payload`. Returns an empty string when unresolvable.
 */
export function extractBarMaterialName(entry: unknown): string {
  if (!entry || typeof entry !== "object") return "";
  const withPayload = entry as { payload?: { materialName?: string } };
  if (withPayload.payload?.materialName) {
    return withPayload.payload.materialName;
  }
  const direct = entry as { materialName?: string };
  return direct.materialName || "";
}
