/**
 * Utility functions for clean, high-performance text extraction and indexing.
 * Used by MarcomTableShell and search components to replace expensive full-object JSON.stringify.
 */

export interface ExtractSearchableTextOptions {
  /** Optional explicit keys to inspect at root level. If omitted, all non-ignored keys are inspected. */
  keys?: string[];
  /** Maximum recursion depth for nested objects (default: 2). */
  maxDepth?: number;
}

const DEFAULT_MAX_DEPTH = 2;

// Regular expression to match keys that should be ignored (IDs)
const IGNORED_KEY_SUFFIX_REGEX = /(^id$|[a-z0-9]+(_id|id)$)/i;

// Set of exact lowercased key names to ignore (audit, technical, and asset fields)
const IGNORED_KEY_EXACT_SET = new Set([
  "createdat",
  "updatedat",
  "deletedat",
  "__typename",
  "version",
  "avatar",
  "thumbnail",
]);

// Values that should be ignored to prevent false-positive queries (ISO dates, URLs)
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
const HTTP_URL_REGEX = /^https?:\/\//i;

/**
 * Determines whether an object property key represents technical noise (IDs, URLs, timestamps)
 * and should be excluded from search indexing.
 */
export function isIgnoredKey(key: string): boolean {
  const lower = key.toLowerCase();
  if (IGNORED_KEY_EXACT_SET.has(lower)) return true;
  if (lower.includes("url")) return true;
  if (IGNORED_KEY_SUFFIX_REGEX.test(key)) return true;
  return false;
}

/**
 * Determines whether a string value represents technical noise (ISO date, web URL, empty whitespace)
 * rather than meaningful search terms.
 */
export function isIgnoredValue(val: string): boolean {
  const trimmed = val.trim();
  if (!trimmed) return true;
  if (ISO_DATE_REGEX.test(trimmed)) return true;
  if (HTTP_URL_REGEX.test(trimmed)) return true;
  return false;
}

/**
 * Recursively extracts clean, space-separated searchable text tokens from an entity or object.
 *
 * Excludes:
 * - Internal / relation IDs (e.g. `id`, `outletId`, `workspaceId`)
 * - URLs and image assets (e.g. `photoUrl`, `avatarUrl`)
 * - Technical metadata and ISO timestamps (e.g. `createdAt`, `2026-09-28T...`)
 * - Booleans, functions, and symbols
 *
 * Supports:
 * - Nested objects up to `maxDepth` (default: 2)
 * - Array of primitives or nested objects
 * - Optional restricted `keys` whitelist at the root level
 */
export function extractSearchableText(
  value: unknown,
  options?: ExtractSearchableTextOptions | string[],
  currentDepth = 0
): string {
  if (value == null) return "";

  const opts: ExtractSearchableTextOptions = Array.isArray(options)
    ? { keys: options }
    : options || {};
  const maxDepth = opts.maxDepth ?? DEFAULT_MAX_DEPTH;

  // Primitives
  if (typeof value === "string") {
    return isIgnoredValue(value) ? "" : value.trim();
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "";
  }
  if (typeof value !== "object") {
    return "";
  }

  // Arrays
  if (Array.isArray(value)) {
    if (currentDepth > maxDepth) return "";
    const tokens: string[] = [];
    for (const item of value) {
      const extracted = extractSearchableText(item, { maxDepth }, currentDepth + 1);
      if (extracted) tokens.push(extracted);
    }
    return tokens.join(" ");
  }

  // Stop recursion beyond maxDepth
  if (currentDepth > maxDepth) return "";

  const obj = value as Record<string, unknown>;
  const tokens: string[] = [];

  // Whitelisted keys at root level if specified
  const targetKeys =
    currentDepth === 0 && opts.keys && opts.keys.length > 0
      ? opts.keys
      : Object.keys(obj);

  for (const key of targetKeys) {
    if (isIgnoredKey(key)) continue;

    const val = obj[key];
    if (val == null) continue;

    if (typeof val === "string") {
      if (!isIgnoredValue(val)) {
        tokens.push(val.trim());
      }
    } else if (typeof val === "number") {
      if (Number.isFinite(val)) {
        tokens.push(String(val));
      }
    } else if (typeof val === "object") {
      // Recurse for child objects/arrays (whitelisted keys apply only to root level)
      const nested = extractSearchableText(val, { maxDepth }, currentDepth + 1);
      if (nested) {
        tokens.push(nested);
      }
    }
  }

  return tokens.join(" ");
}
