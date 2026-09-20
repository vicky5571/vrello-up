import type { Prisma } from "@prisma/client";

/**
 * Builds a strict Prisma filter for FieldEvents associated with an outlet.
 * Never falls back to loose location/name string matching to prevent
 * roadshows or city-level events from accidentally attaching to retail outlets.
 */
export function buildOutletEventWhere(
  workspaceId: string,
  outletId: string
): Prisma.FieldEventWhereInput {
  return {
    workspaceId,
    outletId,
  };
}

/**
 * Builds a strict Prisma filter for ContentPosts associated with an outlet.
 * Restricts matching to the explicit foreign key relation (`outletId`),
 * and optionally bracketed store code `[CODE]` tags in the post title.
 * Drops loose `title: { equals: outlet.name }` matching to prevent homonym collisions.
 */
export function buildOutletContentWhere(
  workspaceId: string,
  outletId: string,
  outletCode?: string | null
): Prisma.ContentPostWhereInput {
  const contentOr: Prisma.ContentPostWhereInput[] = [{ outletId }];

  const cleanCode = outletCode?.trim();
  if (cleanCode && cleanCode.length >= 3) {
    contentOr.push({
      AND: [
        { outletId: null },
        { title: { contains: `[${cleanCode}]`, mode: "insensitive" } },
      ],
    });
  }

  return {
    workspaceId,
    OR: contentOr,
  };
}

/**
 * Formats a clear, disambiguated display label for outlet dropdown selectors:
 * e.g., "[BDG-001] Braga Cell — Bandung" or "[JKT-002] Berkah Cell — Jakarta Selatan"
 */
export function formatOutletSelectLabel(outlet: {
  code?: string | null;
  name: string;
  city?: string | null;
}): string {
  const codePrefix = outlet.code?.trim() ? `[${outlet.code.trim()}] ` : "";
  const citySuffix = outlet.city?.trim() ? ` — ${outlet.city.trim()}` : "";
  return `${codePrefix}${outlet.name.trim()}${citySuffix}`;
}

/**
 * Matches an outlet against a search term safely.
 * Handles bracketed query strings (e.g. "[BDG-001]" or "BDG-001") and case-insensitivity.
 */
export function matchOutletQuery(
  rawQuery: string,
  outlet?: { code?: string | null; name?: string | null } | null
): boolean {
  if (!outlet || !rawQuery) return false;
  const q = rawQuery.toLowerCase().trim();
  if (!q) return false;

  const strippedQ = q.replace(/^\[|\]$/g, "").trim();

  if (outlet.code) {
    const code = outlet.code.toLowerCase().trim();
    if (code && (code.includes(q) || code.includes(strippedQ) || q.includes(code))) {
      return true;
    }
  }

  if (outlet.name) {
    const name = outlet.name.toLowerCase().trim();
    if (name && (name.includes(q) || name.includes(strippedQ))) {
      return true;
    }
  }

  return false;
}
