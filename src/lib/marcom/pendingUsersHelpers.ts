/**
 * Pure helpers for the Global Rail pending users notification badge.
 */

export function formatPendingBadgeCount(count: number): string | null {
  if (count <= 0) return null;
  if (count > 99) return "99+";
  return String(count);
}

export async function fetchPendingUsersCountApi(
  fetcher: (url: string) => Promise<Response> = fetch
): Promise<number> {
  try {
    const res = await fetcher("/api/admin/users?status=PENDING&limit=1");
    if (!res.ok) return 0;
    const data = (await res.json()) as { total?: number };
    return typeof data?.total === "number" ? Math.max(0, data.total) : 0;
  } catch (err) {
    console.error("[pendingUsersHelpers] Failed to fetch pending users count:", err);
    return 0;
  }
}

