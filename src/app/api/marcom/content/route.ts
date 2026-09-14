import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/marcom/db";
import { requireMember } from "@/lib/marcom/auth";
import { hasPermission } from "@/lib/marcom/guards";

const VALID_POST_STATUSES = ["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"] as const;

async function requireContentWriter() {
  let role;
  try {
    role = await requireMember("ws-main");
  } catch (e) {
    if (e instanceof Response) throw e;
    throw e;
  }
  if (!hasPermission(role, "CREATE_EVENT")) {
    throw Response.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function GET(request: Request) {
  try {
    await requireMember("ws-main");
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const platform = searchParams.get("platform");
  const query = searchParams.get("q")?.toLowerCase();

  const where: Prisma.ContentPostWhereInput = {};

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
  try {
    await requireContentWriter();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const body = await request.json();
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
        title: title.trim(),
        platform: String(platform).toLowerCase(),
        format: String(format || "reel").toLowerCase(),
        publishDate: publishDate ? new Date(publishDate) : undefined,
        status,
        caption: String(caption || "").trim(),
        mediaUrl: String(mediaUrl || "").trim(),
        branchName: String(branchName || "").trim(),
        picName: String(picName || "").trim(),
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
