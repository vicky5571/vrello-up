import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireWorkspaceAccess } from "@/lib/server/workspaceAuth";
import {
  VALID_FORMATS,
  VALID_PLATFORMS,
  VALID_POST_STATUSES,
  isValidFormat,
  isValidPlatform,
} from "@/lib/marcom/contentTaxonomy";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const post = await prisma.contentPost.findUnique({
      where: { id },
      include: {
        outlet: { select: { id: true, code: true, name: true } },
      },
    });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const authError = await requireWorkspaceAccess(post.workspaceId, { requiredRole: "viewer", request });
    if (authError) return authError;

    return NextResponse.json(post);
  } catch (err) {
    console.error("Failed to fetch post:", err);
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await prisma.contentPost.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const authError = await requireWorkspaceAccess(existing.workspaceId, { requiredRole: "staff", request });
  if (authError) return authError;

  const body = await request.json().catch(() => ({}));

  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = String(body.title).trim();

  if (body.platform !== undefined) {
    const normalized = String(body.platform).trim().toLowerCase();
    if (!isValidPlatform(normalized)) {
      return NextResponse.json(
        { error: `Invalid platform: '${body.platform}'. Must be one of: ${VALID_PLATFORMS.join(", ")}` },
        { status: 400 },
      );
    }
    data.platform = normalized;
  }

  if (body.format !== undefined) {
    const normalized = String(body.format).trim().toLowerCase();
    if (!isValidFormat(normalized)) {
      return NextResponse.json(
        { error: `Invalid format: '${body.format}'. Must be one of: ${VALID_FORMATS.join(", ")}` },
        { status: 400 },
      );
    }
    data.format = normalized;
  }

  if (body.publishDate !== undefined) {
    data.publishDate = body.publishDate ? new Date(body.publishDate) : null;
  }

  if (body.status !== undefined) {
    if (!(VALID_POST_STATUSES as readonly string[]).includes(String(body.status))) {
      return NextResponse.json(
        { error: `Invalid status: '${body.status}'. Must be one of: ${VALID_POST_STATUSES.join(", ")}` },
        { status: 400 },
      );
    }
    data.status = body.status;
  }
  if (body.caption !== undefined) data.caption = String(body.caption).trim();
  if (body.mediaUrl !== undefined) data.mediaUrl = String(body.mediaUrl).trim();
  if (body.branchName !== undefined) data.branchName = String(body.branchName).trim();
  if (body.picName !== undefined) data.picName = String(body.picName).trim();
  if (body.revisionNotes !== undefined) data.revisionNotes = String(body.revisionNotes).trim();
  if (body.subtasks !== undefined) data.subtasks = body.subtasks;
  if (body.outletId !== undefined) {
    data.outletId = body.outletId ? String(body.outletId).trim() : null;
  }

  try {
    const updated = await prisma.contentPost.update({
      where: { id },
      data,
      include: {
        outlet: { select: { id: true, code: true, name: true } },
      },
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("Failed to update post:", err);
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await prisma.contentPost.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const authError = await requireWorkspaceAccess(existing.workspaceId, { requiredRole: "staff", request });
  if (authError) return authError;

  try {
    await prisma.contentPost.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete post:", err);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
