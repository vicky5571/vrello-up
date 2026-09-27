import type { DocumentStatus } from "@/types";

/**
 * Canonical document status allowlist.
 *
 * This mirrors the `DocumentStatus` SSoT union in `@/types`. The `satisfies`
 * clause plus the exhaustiveness assertion below turn any drift into a compile
 * error, so the API can never silently accept a value the frontend cannot
 * represent.
 */
export const VALID_DOCUMENT_STATUSES = [
  "DRAFT",
  "ACTIVE",
  "ARCHIVED",
] as const satisfies readonly DocumentStatus[];

// Compile-time exhaustiveness: if a new member is added to `DocumentStatus` and
// not added above, `MissingStatus` resolves to `never` and this assignment fails
// to typecheck.
type MissingStatus = Exclude<DocumentStatus, (typeof VALID_DOCUMENT_STATUSES)[number]>;
const _assertNoMissingStatus: MissingStatus extends never ? true : never = true;

/**
 * Honest predicate: validates the value exactly as given. Callers that accept
 * free-form input must normalize (`trim().toUpperCase()`) before calling.
 */
export function isValidDocumentStatus(value: unknown): value is DocumentStatus {
  return (
    typeof value === "string" &&
    (VALID_DOCUMENT_STATUSES as readonly string[]).includes(value)
  );
}
