/**
 * Pure date normalization utilities for calendar, task scheduling, and marketing date matching.
 * Guarantees zero timezone offset distortion (e.g. UTC midnight rolling back a day in negative timezones).
 */

/**
 * Normalizes any date string (ISO 8601, ISO with time, or YYYY-MM-DD) into a strict "yyyy-MM-dd" string.
 * Extracts the calendar date directly if in ISO format, preventing local/UTC conversion day shifts.
 */
export function normalizeIsoDateStr(rawDate?: string | null): string | null {
  if (!rawDate || typeof rawDate !== "string") return null;

  const trimmed = rawDate.trim();
  if (!trimmed) return null;

  // Direct regex match for YYYY-MM-DD format (including ISO with T or space)
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    const d = parseInt(day, 10);

    // Validate calendar ranges
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1900 && y <= 2100) {
      return `${year}-${month}-${day}`;
    }
  }

  // Fallback to standard Date parsing if format is non-standard (e.g. MM/DD/YYYY)
  try {
    const parsed = new Date(trimmed);
    if (isNaN(parsed.getTime())) return null;

    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const d = String(parsed.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  } catch {
    return null;
  }
}

/**
 * Checks whether two date representations refer to the exact same calendar day.
 */
export function isSameCalendarDay(
  dateA?: string | null,
  dateB?: string | null,
): boolean {
  const normA = normalizeIsoDateStr(dateA);
  const normB = normalizeIsoDateStr(dateB);
  if (!normA || !normB) return false;
  return normA === normB;
}
