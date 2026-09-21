import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/marcom/db";
import { requireMember } from "@/lib/marcom/auth";
import { hasPermission } from "@/lib/marcom/guards";
import {
  validateDraftOutletPayload,
  buildDraftOutletData,
  type RawDraftOutletInput,
} from "@/app/api/marcom/outlets/draft/draftOutletHelpers";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId") || "ws-main";

  let role;
  try {
    role = await requireMember(workspaceId);
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  if (!hasPermission(role, "SUBMIT_DRAFT_OUTLET")) {
    return Response.json({ error: "Forbidden: role cannot submit draft outlets" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as RawDraftOutletInput;

  const validation = validateDraftOutletPayload(body);
  if (!validation.isValid) {
    return Response.json({ error: "Validation failed", details: validation.errors }, { status: 400 });
  }

  // Look up branch code if not provided
  let branchCode = body.branchCode;
  if (!branchCode && body.branchId) {
    const branch = await prisma.branch.findUnique({
      where: { id: body.branchId },
      select: { code: true },
    });
    if (branch) {
      branchCode = branch.code;
    }
  }

  const submittedBy = searchParams.get("user") || "sales@jateng.indosat.com";
  const outletData = buildDraftOutletData({ ...body, branchCode }, submittedBy);

  try {
    const created = await prisma.outlet.create({
      data: outletData,
      include: {
        branch: { select: { id: true, code: true, name: true, city: true } },
      },
    });

    return Response.json(created, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      // Retry with timestamp collision avoidance
      const fallbackData = buildDraftOutletData(
        { ...body, branchCode, code: `${outletData.code}-${Date.now().toString(36)}` },
        submittedBy
      );
      const created = await prisma.outlet.create({
        data: fallbackData,
        include: {
          branch: { select: { id: true, code: true, name: true, city: true } },
        },
      });
      return Response.json(created, { status: 201 });
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return Response.json({ error: "Selected branch does not exist" }, { status: 400 });
    }
    throw e;
  }
}
