import type { PostFormat, PostPlatform, PostStatus } from "@/types";

/**
 * Canonical content taxonomy allowlists.
 *
 * These mirror the SSoT unions in `@/types`. The `satisfies` clauses plus the
 * exhaustiveness assertions below turn any drift into a compile error, so the
 * API can never silently accept a value the frontend cannot represent.
 */

export const VALID_PLATFORMS = [
  "instagram",
  "tiktok",
  "youtube",
  "linkedin",
  "facebook",
  "twitter",
  "blog",
  "press",
] as const satisfies readonly PostPlatform[];

export const VALID_FORMATS = [
  "reel",
  "carousel",
  "image",
  "story",
  "article",
  "thread",
] as const satisfies readonly PostFormat[];

export const VALID_POST_STATUSES = [
  "DRAFT",
  "IN_REVIEW",
  "REVISION",
  "APPROVED",
  "SCHEDULED",
  "PUBLISHED",
  "ARCHIVED",
] as const satisfies readonly PostStatus[];

// Compile-time exhaustiveness: if a new member is added to a SSoT union and not
// added above, these resolve to `never` and the assignments fail to typecheck.
type MissingPlatform = Exclude<PostPlatform, (typeof VALID_PLATFORMS)[number]>;
type MissingFormat = Exclude<PostFormat, (typeof VALID_FORMATS)[number]>;
type MissingStatus = Exclude<PostStatus, (typeof VALID_POST_STATUSES)[number]>;

const _assertNoMissingPlatform: MissingPlatform extends never ? true : never = true;
const _assertNoMissingFormat: MissingFormat extends never ? true : never = true;
const _assertNoMissingStatus: MissingStatus extends never ? true : never = true;

/**
 * Honest predicates: these validate the value exactly as given. Callers that
 * accept free-form input must normalize (`trim().toLowerCase()`) before calling,
 * otherwise a truthy return would falsely narrow an un-normalized string to the
 * strict union.
 */
export function isValidPlatform(value: unknown): value is PostPlatform {
  return typeof value === "string" && (VALID_PLATFORMS as readonly string[]).includes(value);
}

export function isValidFormat(value: unknown): value is PostFormat {
  return typeof value === "string" && (VALID_FORMATS as readonly string[]).includes(value);
}
