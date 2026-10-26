import type { MarcomRole } from "./guards";

/**
 * Single-tenant organization auth checker.
 * System is single-tenant by design.
 */
export async function requireMember(): Promise<MarcomRole> {
  return "admin";
}
