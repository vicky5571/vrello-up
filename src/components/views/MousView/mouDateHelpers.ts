export type MouValidityStatus = "ACTIVE" | "EXPIRING_SOON" | "EXPIRED" | "FUTURE" | "NO_DATE";

export interface MouValidityInfo {
  status: MouValidityStatus;
  daysRemaining: number | null;
  isExpired: boolean;
  isExpiringSoon: boolean;
  badgeText: string;
  variant: "emerald" | "amber" | "rose" | "blue" | "slate";
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function calculateMouValidity(
  startDate?: string | null,
  endDate?: string | null,
  referenceNowMs: number = Date.now()
): MouValidityInfo {
  if (!endDate) {
    return {
      status: "NO_DATE",
      daysRemaining: null,
      isExpired: false,
      isExpiringSoon: false,
      badgeText: "No expiry",
      variant: "slate",
    };
  }

  const endMs = new Date(endDate).getTime();
  if (Number.isNaN(endMs)) {
    return {
      status: "NO_DATE",
      daysRemaining: null,
      isExpired: false,
      isExpiringSoon: false,
      badgeText: "Invalid date",
      variant: "slate",
    };
  }

  if (startDate) {
    const startMs = new Date(startDate).getTime();
    if (!Number.isNaN(startMs) && startMs > referenceNowMs) {
      const daysUntilStart = Math.ceil((startMs - referenceNowMs) / MS_PER_DAY);
      return {
        status: "FUTURE",
        daysRemaining: Math.ceil((endMs - referenceNowMs) / MS_PER_DAY),
        isExpired: false,
        isExpiringSoon: false,
        badgeText: `Starts in ${daysUntilStart}d`,
        variant: "blue",
      };
    }
  }

  const diffDays = Math.ceil((endMs - referenceNowMs) / MS_PER_DAY);

  if (diffDays < 0) {
    const pastDays = Math.abs(diffDays);
    return {
      status: "EXPIRED",
      daysRemaining: diffDays,
      isExpired: true,
      isExpiringSoon: false,
      badgeText: pastDays === 1 ? "Expired yesterday" : `Expired ${pastDays} days ago`,
      variant: "rose",
    };
  }

  if (diffDays <= 30) {
    return {
      status: "EXPIRING_SOON",
      daysRemaining: diffDays,
      isExpired: false,
      isExpiringSoon: true,
      badgeText: diffDays === 0 ? "Expires today" : `Expires in ${diffDays} days`,
      variant: "amber",
    };
  }

  return {
    status: "ACTIVE",
    daysRemaining: diffDays,
    isExpired: false,
    isExpiringSoon: false,
    badgeText: `${diffDays} days left`,
    variant: "emerald",
  };
}

function formatDate(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    if (Number.isNaN(d.getTime())) return isoStr.slice(0, 10);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return isoStr.slice(0, 10);
  }
}

export function formatMouDateRange(startDate?: string | null, endDate?: string | null): string {
  if (!startDate && !endDate) return "No period set";
  if (!startDate && endDate) return `Until ${formatDate(endDate)}`;
  if (startDate && !endDate) return `From ${formatDate(startDate)}`;
  return `${formatDate(startDate!)} – ${formatDate(endDate!)}`;
}
