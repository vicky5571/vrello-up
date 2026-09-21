/**
 * Pure helpers for generating temporary draft outlet codes and formatting
 * official outlet code suggestions upon manager ACC/approval.
 */

function sanitizeCodeComponent(str?: string | null, fallback = "GEN"): string {
  if (!str) return fallback;
  const cleaned = str.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return cleaned.length > 0 ? cleaned : fallback;
}

/**
 * Generates a temporary draft code (e.g., "DRAFT-SMG-1726978123").
 */
export function generateDraftOutletCode(
  branchCode?: string | null,
  suffixOrTimestamp?: string | number
): string {
  const branch = sanitizeCodeComponent(branchCode, "GEN");
  const suffix =
    suffixOrTimestamp !== undefined && suffixOrTimestamp !== null
      ? String(suffixOrTimestamp)
      : Date.now().toString(36).toUpperCase();
  return `DRAFT-${branch}-${suffix}`;
}

/**
 * Suggests an official outlet code (e.g., "O-SMG-0842").
 * Sequences are zero-padded to at least 4 digits.
 */
export function suggestOfficialOutletCode(
  branchCode: string | null | undefined,
  sequenceNumber: number
): string {
  const branch = sanitizeCodeComponent(branchCode, "GEN");
  const safeSeq = Math.max(1, Math.floor(sequenceNumber));
  const paddedSeq = String(safeSeq).padStart(4, "0");
  return `O-${branch}-${paddedSeq}`;
}

/**
 * Checks if a code string represents a temporary draft.
 */
export function isDraftOutletCode(code?: string | null): boolean {
  if (!code) return false;
  return code.trim().toUpperCase().startsWith("DRAFT-");
}
