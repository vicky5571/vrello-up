import { validateWorkspaceAccess } from "@/lib/server/workspaceAuth";
import type { MarcomRole } from "./guards";

export async function requireMember(workspaceId: string): Promise<MarcomRole> {
  const result = await validateWorkspaceAccess(workspaceId);
  if (!result.authorized) {
    throw Response.json({ error: result.error }, { status: result.status });
  }
  return (result.role as MarcomRole) || "admin";
}
