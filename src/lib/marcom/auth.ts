import { auth } from "@/auth";
import { prisma } from "@/lib/marcom/db";
import type { MarcomRole } from "./guards";

export async function requireMember(workspaceId: string): Promise<MarcomRole> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) throw Response.json({ error: "Unauthorized" }, { status: 401 });
  let member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_email: { workspaceId, email } },
  });
  if (!member && process.env.NODE_ENV !== "production") {
    member = await prisma.workspaceMember.create({
      data: { workspaceId, email, role: "admin" },
    });
  }
  if (!member) throw Response.json({ error: "Forbidden" }, { status: 403 });
  return member.role;
}
