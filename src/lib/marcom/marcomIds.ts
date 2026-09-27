/**
 * Centralized Marcom seed entity IDs.
 *
 * These IDs match the seed data in `src/lib/constants/seeds.ts` and
 * `src/app/api/tasks/route.ts`. All production code MUST import from
 * here instead of inlining magic strings.
 *
 * Each constant also has a companion name-hint array and resolver
 * function so lookups degrade gracefully when the seed ID is missing
 * (e.g. user renamed or deleted the entity).
 */

import type { List, Tag } from "@/types";

// ─── Space IDs ──────────────────────────────────────────────────────
export const MARCOM_SPACE_ID = "space-marcom" as const;
export const PRODUCT_SPACE_ID = "space-product" as const;

// ─── List IDs ───────────────────────────────────────────────────────
export const CONTENT_PLANNER_LIST_ID = "list-content-planner" as const;
export const FIELD_OPS_LIST_ID = "list-field-ops" as const;
export const DESIGN_SYSTEM_LIST_ID = "list-design-system" as const;

// ─── Default Seed Space IDs (for initial expand / sync guard) ──────
export const DEFAULT_SEED_SPACE_IDS = [
  PRODUCT_SPACE_ID,
  MARCOM_SPACE_ID,
] as const;

// ─── Tag Presets ────────────────────────────────────────────────────
export const OPS_TAG: Readonly<Tag> = {
  id: "tag-ops",
  name: "Operations",
  color: "#059669",
} as const;

export const ALERT_TAG: Readonly<Tag> = {
  id: "tag-alert",
  name: "Urgent Alert",
  color: "#DC2626",
} as const;

// ─── Name-Based Fallback Hints ──────────────────────────────────────
// Used by resolver functions when the seed ID doesn't match any entity.

export const MARCOM_SPACE_NAME_HINTS = [
  "marketing",
  "marcom",
  "campaign",
] as const;

export const CONTENT_LIST_NAME_HINTS = [
  "content",
  "social",
  "planner",
] as const;

export const FIELD_OPS_LIST_NAME_HINTS = [
  "field",
  "ops",
  "event",
] as const;

// ─── Resolver Functions ─────────────────────────────────────────────

interface SpaceLike {
  id: string;
  name: string;
}

/**
 * Resolves the Marcom space: seed ID first, then name-based matching.
 */
export function resolveMarcomSpace<T extends SpaceLike>(
  spaces: T[],
): T | undefined {
  if (!spaces || spaces.length === 0) return undefined;
  const byId = spaces.find((s) => s.id === MARCOM_SPACE_ID);
  if (byId) return byId;
  const lower = (s: T) => s.name.toLowerCase();
  return spaces.find((s) =>
    MARCOM_SPACE_NAME_HINTS.some((hint) => lower(s).includes(hint)),
  );
}

/**
 * Resolves the Content Planner list: seed ID first, then name-based matching.
 */
export function resolveContentList(lists: List[]): List | undefined {
  if (!lists || lists.length === 0) return undefined;
  const byId = lists.find((l) => l.id === CONTENT_PLANNER_LIST_ID);
  if (byId) return byId;
  const lower = (l: List) => l.name.toLowerCase();
  return lists.find((l) =>
    CONTENT_LIST_NAME_HINTS.some((hint) => lower(l).includes(hint)),
  );
}

/**
 * Resolves the Field Ops list: seed ID first, then name-based matching.
 */
export function resolveFieldOpsList(lists: List[]): List | undefined {
  if (!lists || lists.length === 0) return undefined;
  const byId = lists.find((l) => l.id === FIELD_OPS_LIST_ID);
  if (byId) return byId;
  const lower = (l: List) => l.name.toLowerCase();
  return lists.find((l) =>
    FIELD_OPS_LIST_NAME_HINTS.some((hint) => lower(l).includes(hint)),
  );
}
