import { NextResponse } from "next/server";
import { prisma } from "@/lib/marcom/db";
import { requireWorkspaceAccess } from "@/lib/server/workspaceAuth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: taskId } = await params;

    const existingTask = await prisma.taskItem.findUnique({
      where: { id: taskId },
      include: { list: { include: { space: true } } },
    });
    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const authError = await requireWorkspaceAccess(
      existingTask.list.space.workspaceId,
      { requiredRole: "viewer", request },
    );
    if (authError) return authError;

    const body = await request.json();
    const { id, userId, user, content, attachments } = body;

    if (!userId || !user || !content) {
      return NextResponse.json(
        { error: "Missing required fields: userId, user, content" },
        { status: 400 },
      );
    }

    const comment = await prisma.taskCommentItem.create({
      data: {
        id: id || undefined,
        taskId,
        userId,
        user: JSON.parse(JSON.stringify(user)),
        content,
        attachments: attachments ? JSON.parse(JSON.stringify(attachments)) : [],
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Error creating comment in database:", error);
    return NextResponse.json(
      { error: "Failed to create comment in database" },
      { status: 500 },
    );
  }
}

