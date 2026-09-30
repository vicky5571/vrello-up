/**
 * Pure formatting helpers for the Operational Analytics Hub.
 * These functions are side-effect free and defensive against
 * NaN, Infinity, null and undefined inputs.
 */

/**
 * Compact Indonesian Rupiah formatter with negative & NaN safety.
 * Examples:
 *  - 2_500_000_000 -> "Rp 2.5 M"
 *  - 15_000_000    -> "Rp 15.0 Jt"
 *  - 250_000       -> "Rp 250 Rb"
 *  - -5_000_000    -> "-Rp 5.0 Jt"
 */
export function formatCompactIDR(val: number | null | undefined): string {
  if (typeof val !== "number" || Number.isNaN(val) || !Number.isFinite(val)) {
    return "Rp 0";
  }

  const isNegative = val < 0;
  const abs = Math.abs(val);

  let formatted: string;
  if (abs >= 1_000_000_000) {
    formatted = `Rp ${(abs / 1_000_000_000).toFixed(1)} M`;
  } else if (abs >= 1_000_000) {
    formatted = `Rp ${(abs / 1_000_000).toFixed(1)} Jt`;
  } else if (abs >= 1_000) {
    formatted = `Rp ${(abs / 1_000).toFixed(0)} Rb`;
  } else {
    formatted = `Rp ${abs.toLocaleString("id-ID")}`;
  }

  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Safe percentage formatter with 0-denominator guard.
 */
export function formatPercent(numerator: number, denominator: number): string {
  if (
    typeof numerator !== "number" ||
    typeof denominator !== "number" ||
    denominator <= 0 ||
    Number.isNaN(numerator) ||
    Number.isNaN(denominator)
  ) {
    return "0%";
  }
  return `${Math.round((numerator / denominator) * 100)}%`;
}

/**
 * Formats SLA turnaround days for executive KPI cards.
 */
export function formatSlaTurnaround(days: number): string {
  const safeDays = Math.max(0, Math.round(Number(days) || 0));
  return `${safeDays} Hari`;
}
