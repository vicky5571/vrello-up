import { NextResponse } from "next/server";
import { prisma } from "@/lib/marcom/db";
import { realtimeHub } from "@/lib/server/realtimeHub";
import { requireWorkspaceAccess } from "@/lib/server/workspaceAuth";
import {
  type Task,
  type User,
  type Priority,
  type PostPlatform,
  type PostFormat,
  type Tag,
  type Subtask,
  type TaskAttachment,
  type TaskCommentAttachment,
} from "@/types";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const existingTask = await prisma.taskItem.findUnique({
      where: { id },
      include: { list: { include: { space: true } } },
    });
    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const authError = await requireWorkspaceAccess(
      existingTask.list.space.workspaceId,
      { requiredRole: "staff", request },
    );
    if (authError) return authError;

    const body = await request.json();

    const updateData: Record<string, unknown> = {};

    const stringFields = [
      "title",
      "description",
      "statusId",
      "priority",
      "dueDate",
      "startDate",
      "relatedMarcomId",
      "postPlatform",
      "postFormat",
      "mediaUrl",
      "listId",
    ];

    for (const field of stringFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (body.estimatedHours !== undefined) {
      updateData.estimatedHours = body.estimatedHours;
    }
    if (body.orderIndex !== undefined) {
      updateData.orderIndex = body.orderIndex;
    }
    if (body.progress !== undefined) {
      updateData.progress = body.progress;
    }

    const jsonFields = ["assignees", "tags", "subtasks", "dependencies", "attachments"];
    for (const field of jsonFields) {
      if (body[field] !== undefined) {
        updateData[field] = JSON.parse(JSON.stringify(body[field]));
      }
    }

    const updated = await prisma.taskItem.update({
      where: { id },
      data: updateData,
      include: {
        comments: true,
      },
    });

    const formattedTask: Task = {
      id: updated.id,
      listId: updated.listId,
      title: updated.title,
      description: updated.description,
      statusId: updated.statusId,
      priority: updated.priority as Priority,
      dueDate: updated.dueDate || undefined,
      startDate: updated.startDate || undefined,
      estimatedHours: updated.estimatedHours || undefined,
      orderIndex: updated.orderIndex,
      relatedMarcomId: updated.relatedMarcomId || undefined,
      postPlatform: (updated.postPlatform as PostPlatform) || undefined,
      postFormat: (updated.postFormat as PostFormat) || undefined,
      mediaUrl: updated.mediaUrl || undefined,
      progress: updated.progress || undefined,
      assignees: (updated.assignees as unknown as User[]) || [],
      tags: (updated.tags as unknown as Tag[]) || [],
      subtasks: (updated.subtasks as unknown as Subtask[]) || [],
      dependencies: (updated.dependencies as unknown as string[]) || [],
      attachments: (updated.attachments as unknown as TaskAttachment[]) || [],
      comments: updated.comments.map((c) => ({
        id: c.id,
        taskId: c.taskId,
        userId: c.userId,
        user: c.user as unknown as User,
        content: c.content,
        createdAt: c.createdAt.toISOString(),
        attachments: (c.attachments as unknown as TaskCommentAttachment[]) || [],
      })),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };

    realtimeHub.broadcastTaskUpsert(formattedTask, existingTask.list.space.workspaceId);
    return NextResponse.json(formattedTask);
  } catch (error) {
    console.error("Error updating task in database:", error);
    return NextResponse.json(
      { error: "Failed to update task in database" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const existingTask = await prisma.taskItem.findUnique({
      where: { id },
      include: { list: { include: { space: true } } },
    });
    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const authError = await requireWorkspaceAccess(
      existingTask.list.space.workspaceId,
      { requiredRole: "staff", request: _request },
    );
    if (authError) return authError;

    await prisma.taskItem.delete({
      where: { id },
    });

    realtimeHub.broadcastTaskDelete(id, existingTask.list.space.workspaceId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting task in database:", error);
    return NextResponse.json(
      { error: "Failed to delete task in database" },
      { status: 500 },
    );
  }
}

