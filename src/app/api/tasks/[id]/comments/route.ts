import { NextResponse } from "next/server";
import { prisma } from "@/lib/marcom/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: taskId } = await params;
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

