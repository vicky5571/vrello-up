import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/marcom/db";
import { requireWorkspaceAccess } from "@/lib/server/workspaceAuth";

const VALID_POST_STATUSES = [
  "DRAFT",
  "IN_REVIEW",
  "REVISION",
  "APPROVED",
  "SCHEDULED",
  "PUBLISHED",
  "ARCHIVED",
] as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId") || "ws-main";
  const authError = await requireWorkspaceAccess(workspaceId, { requiredRole: "viewer", request });
  if (authError) return authError;

  const status = searchParams.get("status");
  const platform = searchParams.get("platform");
  const branchName = searchParams.get("branchName");
  const query = searchParams.get("q")?.toLowerCase();
  const limitParam = searchParams.get("limit");
  const pageParam = searchParams.get("page");

  const where: Prisma.ContentPostWhereInput = {
    workspaceId,
  };

  if (status && status !== "ALL") {
    where.status = status;
  }
  if (platform && platform !== "ALL" && platform !== "all") {
    where.platform = platform;
  }
  if (branchName && branchName !== "ALL" && branchName !== "all") {
    where.branchName = { equals: branchName, mode: "insensitive" };
  }
  if (query) {
    const contains = { contains: query, mode: "insensitive" as const };
    where.OR = [
      { title: contains },
      { caption: contains },
      { branchName: contains },
      { picName: contains },
      { platform: contains },
      { format: contains },
    ];
  }

  const limit = limitParam
    ? Math.max(1, Math.min(200, parseInt(limitParam, 10) || 50))
    : undefined;
  const page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;
  const skip = limit ? (page - 1) * limit : undefined;

  try {
    const [total, posts] = await Promise.all([
      prisma.contentPost.count({ where }),
      prisma.contentPost.findMany({
        where,
        orderBy: { publishDate: "desc" },
        take: limit,
        skip,
        include: {
          outlet: { select: { id: true, code: true, name: true } },
        },
      }),
    ]);
    return NextResponse.json({
      total,
      page: limit ? page : 1,
      totalPages: limit ? Math.ceil(total / limit) : 1,
      data: posts,
    });
  } catch (err) {
    console.error("Failed to fetch ContentPosts:", err);
    return NextResponse.json({ total: 0, data: [] });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const workspaceId = body?.workspaceId || "ws-main";
  const authError = await requireWorkspaceAccess(workspaceId, { requiredRole: "staff", request });
  if (authError) return authError;

  const {
    title,
    platform,
    format,
    publishDate,
    status = "SCHEDULED",
    caption = "",
    mediaUrl = "",
    branchName = "",
    picName = "",
    revisionNotes = "",
    subtasks = [],
    outletId,
  } = body ?? {};

  if (!title || !platform) {
    return NextResponse.json(
      { error: "Missing required fields: title, platform" },
      { status: 400 }
    );
  }

  if (status && !VALID_POST_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid post status" }, { status: 400 });
  }

  try {
    const post = await prisma.contentPost.create({
      data: {
        workspaceId,
        title: title.trim(),
        platform: String(platform).toLowerCase(),
        format: String(format || "reel").toLowerCase(),
        publishDate: publishDate ? new Date(publishDate) : undefined,
        status,
        caption: String(caption || "").trim(),
        mediaUrl: String(mediaUrl || "").trim(),
        branchName: String(branchName || "").trim(),
        picName: String(picName || "").trim(),
        revisionNotes: String(revisionNotes || "").trim(),
        subtasks: Array.isArray(subtasks) ? subtasks : [],
        outletId: outletId || null,
      },
      include: {
        outlet: { select: { id: true, code: true, name: true } },
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (err) {
    console.error("Failed to create ContentPost:", err);
    return NextResponse.json(
      { error: "Failed to create content post" },
      { status: 500 }
    );
  }
}
