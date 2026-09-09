import { NextResponse } from "next/server";
import { prisma } from "@/lib/marcom/db";
import {
  type Task,
  type Workspace,
  type Folder,
  type Status,
  type Priority,
  type PostPlatform,
  type PostFormat,
  type User,
  type Tag,
  type Subtask,
  type TaskAttachment,
  type TaskCommentAttachment,
} from "@/types";
import { SEED_USERS, DEFAULT_STATUSES } from "@/lib/store/useWorkspaceStore";
import { realtimeHub } from "@/lib/server/realtimeHub";

// Auto-seed initial workspace, spaces, lists, and tasks if PostgreSQL task tables are empty
async function ensureSeedData() {
  const count = await prisma.workspaceItem.count();
  if (count > 0) return;

  const ws = await prisma.workspaceItem.create({
    data: {
      id: "ws-main",
      name: "Acme Corp Core",
      avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80",
      members: JSON.parse(JSON.stringify(SEED_USERS)),
      spaces: {
        create: [
          {
            id: "space-eng",
            name: "Engineering Core",
            icon: "Code2",
            color: "#0D9488",
            statuses: JSON.parse(JSON.stringify(DEFAULT_STATUSES)),
            folders: {
              create: [
                {
                  id: "folder-sprint",
                  name: "Sprint 42",
                },
              ],
            },
            lists: {
              create: [
                {
                  id: "list-sprint-tasks",
                  folderId: "folder-sprint",
                  name: "Sprint Backlog",
                  icon: "ListTodo",
                },
                {
                  id: "list-roadmap",
                  name: "Architecture Roadmap",
                  icon: "Milestone",
                },
                {
                  id: "list-bugs",
                  name: "Bug Tracker",
                  icon: "Bug",
                },
              ],
            },
          },
          {
            id: "space-product",
            name: "Design & Product",
            icon: "Palette",
            color: "#8B5CF6",
            statuses: JSON.parse(JSON.stringify(DEFAULT_STATUSES)),
            lists: {
              create: [
                {
                  id: "list-design-system",
                  name: "Design Tokens & UI Specs",
                  icon: "Layers",
                },
                {
                  id: "list-user-research",
                  name: "Customer Interviews",
                  icon: "Users",
                },
              ],
            },
          },
          {
            id: "space-marcom",
            name: "Marketing & Campaigns",
            icon: "Sparkles",
            color: "#EC4899",
            statuses: JSON.parse(JSON.stringify(DEFAULT_STATUSES)),
            lists: {
              create: [
                {
                  id: "list-content-planner",
                  name: "Social & Content Calendar",
                  icon: "Calendar",
                },
                {
                  id: "list-field-ops",
                  name: "Field Operations & Setup",
                  icon: "Layers",
                },
              ],
            },
          },
        ],
      },
    },
  });

  // Seed initial tasks
  await prisma.taskItem.createMany({
    data: [
      {
        id: "task-1",
        listId: "list-sprint-tasks",
        title: "Implement Framer Motion view transition animations",
        description:
          "<h3>Overview</h3><p>Integrate <code>layoutId</code> morphing for view indicator tabs and spring physics for the task slide-over drawer.</p>",
        statusId: "status-in-progress",
        priority: "urgent",
        assignees: JSON.parse(JSON.stringify([SEED_USERS[0], SEED_USERS[1]])),
        dueDate: "2026-09-02",
        startDate: "2026-08-28",
        orderIndex: 0,
        tags: JSON.parse(
          JSON.stringify([
            { id: "tag-frontend", name: "Frontend", color: "#0D9488" },
            { id: "tag-ui-ux", name: "UI/UX", color: "#8B5CF6" },
          ]),
        ),
        subtasks: JSON.parse(
          JSON.stringify([
            { id: "st-1", title: "Tab strip layoutId indicator", completed: true, createdAt: "2026-08-28T10:00:00Z" },
            { id: "st-2", title: "TaskDrawer spring entrance curves", completed: true, createdAt: "2026-08-28T11:00:00Z" },
            { id: "st-3", title: "ViewSwitcher animated pill transition", completed: false, createdAt: "2026-08-28T14:00:00Z" },
          ]),
        ),
      },
      {
        id: "task-content-1",
        listId: "list-content-planner",
        title: "Teaser Clip: Behind the Scenes of Vrello Launch",
        description: "<p>Short video highlighting engineering velocity and sleek keyboard shortcuts.</p>",
        statusId: "status-in-progress",
        priority: "high",
        assignees: JSON.parse(JSON.stringify([SEED_USERS[1]])),
        dueDate: "2026-09-10",
        startDate: "2026-09-08",
        orderIndex: 0,
        postPlatform: "instagram",
        postFormat: "reel",
        mediaUrl: "https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-code-screen-close-up-34289-large.mp4",
        tags: JSON.parse(JSON.stringify([{ id: "tag-frontend", name: "Frontend", color: "#0D9488" }])),
        subtasks: JSON.parse(
          JSON.stringify([
            { id: "st-c1", title: "Record 4K screen capture of board drag & drop", completed: true, createdAt: "2026-09-05T10:00:00Z" },
            { id: "st-c2", title: "Sound design & upbeat audio sync", completed: true, createdAt: "2026-09-05T14:00:00Z" },
            { id: "st-c3", title: "Final marketing copy & hashtag review", completed: false, createdAt: "2026-09-06T09:00:00Z" },
          ]),
        ),
      },
      {
        id: "task-field-1",
        listId: "list-field-ops",
        title: "HQ Main Entrance Signboard Installation",
        description: "<p>Mount the acrylic 3D back-lit logo signage at the primary reception area.</p>",
        statusId: "status-todo",
        priority: "urgent",
        assignees: JSON.parse(JSON.stringify([SEED_USERS[0]])),
        dueDate: "2026-09-12",
        orderIndex: 0,
        tags: JSON.parse(JSON.stringify([{ id: "tag-security", name: "Security", color: "#EF4444" }])),
        subtasks: JSON.parse(
          JSON.stringify([
            { id: "st-f1", title: "Inspect electrical wiring & power supply", completed: false, createdAt: "2026-09-05T08:00:00Z" },
            { id: "st-f2", title: "Drill mounting brackets on stone facade", completed: false, createdAt: "2026-09-05T09:00:00Z" },
          ]),
        ),
      },
    ],
  });

  return ws;
}

export async function GET() {
  try {
    await ensureSeedData();

    const [dbWorkspaces, dbTasks] = await Promise.all([
      prisma.workspaceItem.findMany({
        include: {
          spaces: {
            include: {
              folders: {
                include: {
                  lists: true,
                },
              },
              lists: true,
            },
          },
        },
      }),
      prisma.taskItem.findMany({
        include: {
          comments: true,
        },
        orderBy: {
          orderIndex: "asc",
        },
      }),
    ]);

    // Format workspaces to match frontend Workspace shape
    const workspaces: Workspace[] = dbWorkspaces.map((ws) => ({
      id: ws.id,
      name: ws.name,
      avatar: ws.avatar || undefined,
      members: (ws.members as unknown as User[]) || [],
      spaces: ws.spaces.map((sp) => {
        // Direct lists: lists that do not belong to any folder
        const directLists = sp.lists.filter((l) => !l.folderId);
        return {
          id: sp.id,
          workspaceId: sp.workspaceId,
          name: sp.name,
          icon: sp.icon,
          color: sp.color,
          statuses: (sp.statuses as unknown as Status[]) || DEFAULT_STATUSES,
          folders: sp.folders.map((f) => ({
            id: f.id,
            spaceId: f.spaceId,
            name: f.name,
            lists: f.lists.map((l) => ({
              id: l.id,
              spaceId: l.spaceId,
              folderId: l.folderId || undefined,
              name: l.name,
              color: l.color,
              icon: l.icon,
            })),
          })),
          lists: directLists.map((l) => ({
            id: l.id,
            spaceId: l.spaceId,
            folderId: undefined,
            name: l.name,
            color: l.color,
            icon: l.icon,
          })),
        };
      }),
    }));

    // Format tasks to match frontend Task shape
    const tasks: Task[] = dbTasks.map((t) => ({
      id: t.id,
      listId: t.listId,
      title: t.title,
      description: t.description,
      statusId: t.statusId,
      priority: t.priority as Priority,
      dueDate: t.dueDate || undefined,
      startDate: t.startDate || undefined,
      estimatedHours: t.estimatedHours || undefined,
      orderIndex: t.orderIndex,
      relatedMarcomId: t.relatedMarcomId || undefined,
      postPlatform: (t.postPlatform as PostPlatform) || undefined,
      postFormat: (t.postFormat as PostFormat) || undefined,
      mediaUrl: t.mediaUrl || undefined,
      progress: t.progress || undefined,
      assignees: (t.assignees as unknown as User[]) || [],
      tags: (t.tags as unknown as Tag[]) || [],
      subtasks: (t.subtasks as unknown as Subtask[]) || [],
      dependencies: (t.dependencies as unknown as string[]) || [],
      attachments: (t.attachments as unknown as TaskAttachment[]) || [],
      comments: t.comments.map((c) => ({
        id: c.id,
        taskId: c.taskId,
        userId: c.userId,
        user: c.user as unknown as User,
        content: c.content,
        createdAt: c.createdAt.toISOString(),
        attachments: (c.attachments as unknown as TaskCommentAttachment[]) || [],
      })),
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }));

    return NextResponse.json({ workspaces, tasks });
  } catch (error) {
    console.error("Error fetching tasks from database:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks from database" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      listId,
      title,
      description,
      statusId,
      priority,
      dueDate,
      startDate,
      estimatedHours,
      orderIndex,
      relatedMarcomId,
      postPlatform,
      postFormat,
      mediaUrl,
      progress,
      assignees,
      tags,
      subtasks,
      dependencies,
      attachments,
    } = body;

    if (!listId || !title || !statusId) {
      return NextResponse.json(
        { error: "Missing required fields: listId, title, statusId" },
        { status: 400 },
      );
    }

    // Verify parent list exists; if not, create it under target space so listId is preserved
    let targetListId = listId;
    const listExists = await prisma.listItem.findUnique({ where: { id: listId } });
    if (!listExists) {
      const parentSpace =
        (body.spaceId
          ? await prisma.spaceItem.findUnique({ where: { id: body.spaceId } })
          : null) || (await prisma.spaceItem.findFirst());

      if (parentSpace) {
        await prisma.listItem.create({
          data: {
            id: listId,
            spaceId: parentSpace.id,
            folderId: body.folderId || null,
            name: body.listName || "General",
            icon: body.listIcon || "ListTodo",
            color: "#64748B",
          },
        });
        targetListId = listId;
      } else {
        const fallbackList = await prisma.listItem.findFirst();
        if (fallbackList) {
          targetListId = fallbackList.id;
        } else {
          return NextResponse.json({ error: "No target list found" }, { status: 400 });
        }
      }
    }

    const task = await prisma.taskItem.create({
      data: {
        id: id || undefined,
        listId: targetListId,
        title,
        description: description || "",
        statusId,
        priority: priority || "normal",
        dueDate: dueDate || null,
        startDate: startDate || null,
        estimatedHours: estimatedHours || null,
        orderIndex: typeof orderIndex === "number" ? orderIndex : 0,
        relatedMarcomId: relatedMarcomId || null,
        postPlatform: postPlatform || null,
        postFormat: postFormat || null,
        mediaUrl: mediaUrl || null,
        progress: progress || null,
        assignees: assignees ? JSON.parse(JSON.stringify(assignees)) : [],
        tags: tags ? JSON.parse(JSON.stringify(tags)) : [],
        subtasks: subtasks ? JSON.parse(JSON.stringify(subtasks)) : [],
        dependencies: dependencies ? JSON.parse(JSON.stringify(dependencies)) : [],
        attachments: attachments ? JSON.parse(JSON.stringify(attachments)) : [],
      },
      include: {
        comments: true,
      },
    });

    const formattedTask: Task = {
      id: task.id,
      listId: task.listId,
      title: task.title,
      description: task.description,
      statusId: task.statusId,
      priority: task.priority as Priority,
      dueDate: task.dueDate || undefined,
      startDate: task.startDate || undefined,
      estimatedHours: task.estimatedHours || undefined,
      orderIndex: task.orderIndex,
      relatedMarcomId: task.relatedMarcomId || undefined,
      postPlatform: (task.postPlatform as PostPlatform) || undefined,
      postFormat: (task.postFormat as PostFormat) || undefined,
      mediaUrl: task.mediaUrl || undefined,
      progress: task.progress || undefined,
      assignees: (task.assignees as unknown as User[]) || [],
      tags: (task.tags as unknown as Tag[]) || [],
      subtasks: (task.subtasks as unknown as Subtask[]) || [],
      dependencies: (task.dependencies as unknown as string[]) || [],
      attachments: (task.attachments as unknown as TaskAttachment[]) || [],
      comments: task.comments.map((c) => ({
        id: c.id,
        taskId: c.taskId,
        userId: c.userId,
        user: c.user as unknown as User,
        content: c.content,
        createdAt: c.createdAt.toISOString(),
        attachments: (c.attachments as unknown as TaskCommentAttachment[]) || [],
      })),
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };

    realtimeHub.broadcastTaskUpsert(formattedTask);
    return NextResponse.json(formattedTask, { status: 201 });
  } catch (error) {
    console.error("Error creating task in database:", error);
    return NextResponse.json(
      { error: "Failed to create task in database" },
      { status: 500 },
    );
  }
}

