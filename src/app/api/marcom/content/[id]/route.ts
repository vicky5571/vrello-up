import { NextResponse } from "next/server";
import { prisma } from "@/lib/marcom/db";
import { requireMember } from "@/lib/marcom/auth";
import { hasPermission } from "@/lib/marcom/guards";

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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireMember("ws-main");
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const { id } = await params;
  try {
    const post = await prisma.contentPost.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
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
  try {
    await requireContentWriter();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = String(body.title).trim();
  if (body.platform !== undefined) data.platform = String(body.platform).toLowerCase();
  if (body.format !== undefined) data.format = String(body.format).toLowerCase();
  if (body.publishDate !== undefined) {
    data.publishDate = body.publishDate ? new Date(body.publishDate) : null;
  }
  if (body.status !== undefined) data.status = body.status;
  if (body.caption !== undefined) data.caption = String(body.caption).trim();
  if (body.mediaUrl !== undefined) data.mediaUrl = String(body.mediaUrl).trim();
  if (body.branchName !== undefined) data.branchName = String(body.branchName).trim();
  if (body.picName !== undefined) data.picName = String(body.picName).trim();
  if (body.subtasks !== undefined) data.subtasks = body.subtasks;

  try {
    const updated = await prisma.contentPost.update({
      where: { id },
      data,
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("Failed to update post:", err);
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireContentWriter();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const { id } = await params;
  try {
    await prisma.contentPost.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete post:", err);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
