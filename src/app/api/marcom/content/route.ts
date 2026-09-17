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
  const query = searchParams.get("q")?.toLowerCase();

  const where: Prisma.ContentPostWhereInput = {
    workspaceId,
  };

  if (status && status !== "ALL") {
    where.status = status;
  }
  if (platform && platform !== "ALL" && platform !== "all") {
    where.platform = platform;
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

  try {
    const posts = await prisma.contentPost.findMany({
      where,
      orderBy: { publishDate: "desc" },
    });
    return NextResponse.json({ total: posts.length, data: posts });
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
