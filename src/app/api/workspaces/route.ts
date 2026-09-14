import { NextResponse } from "next/server";
import { prisma } from "@/lib/marcom/db";
import { type Workspace, type User, type Status } from "@/types";
import { DEFAULT_STATUSES } from "@/lib/store/useWorkspaceStore";

export async function GET() {
  try {
    const dbWorkspaces = await prisma.workspaceItem.findMany({
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
    });

    const workspaces: Workspace[] = dbWorkspaces.map((ws) => ({
      id: ws.id,
      name: ws.name,
      avatar: ws.avatar || undefined,
      members: (ws.members as unknown as User[]) || [],
      spaces: ws.spaces.map((sp) => {
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

    return NextResponse.json({ workspaces });
  } catch (error) {
    console.error("Error fetching workspaces:", error);
    return NextResponse.json(
      { error: "Failed to fetch workspaces" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const workspaces: Workspace[] = Array.isArray(body.workspaces)
      ? body.workspaces
      : body.workspace
        ? [body.workspace]
        : [];

    if (workspaces.length === 0) {
      return NextResponse.json({ error: "No workspaces provided" }, { status: 400 });
    }

    for (const ws of workspaces) {
      // 1. Upsert WorkspaceItem
      await prisma.workspaceItem.upsert({
        where: { id: ws.id },
        create: {
          id: ws.id,
          name: ws.name,
          avatar: ws.avatar,
          members: JSON.parse(JSON.stringify(ws.members || [])),
        },
        update: {
          name: ws.name,
          avatar: ws.avatar,
          members: JSON.parse(JSON.stringify(ws.members || [])),
        },
      });

      // 2. Manage Spaces
      const existingSpaces = await prisma.spaceItem.findMany({
        where: { workspaceId: ws.id },
        select: { id: true },
      });
      const existingSpaceIds = new Set(existingSpaces.map((s) => s.id));
      const currentSpaceIds = new Set((ws.spaces || []).map((s) => s.id));

      const spacesToDelete = [...existingSpaceIds].filter((id) => !currentSpaceIds.has(id));
      if (spacesToDelete.length > 0) {
        await prisma.spaceItem.deleteMany({
          where: { id: { in: spacesToDelete } },
        });
      }

      for (const space of ws.spaces || []) {
        await prisma.spaceItem.upsert({
          where: { id: space.id },
          create: {
            id: space.id,
            workspaceId: ws.id,
            name: space.name,
            icon: space.icon || "folder",
            color: space.color || "#64748B",
            statuses: JSON.parse(JSON.stringify(space.statuses || DEFAULT_STATUSES)),
          },
          update: {
            name: space.name,
            icon: space.icon || "folder",
            color: space.color || "#64748B",
            statuses: JSON.parse(JSON.stringify(space.statuses || DEFAULT_STATUSES)),
          },
        });

        // 3. Manage Folders in Space
        const existingFolders = await prisma.folderItem.findMany({
          where: { spaceId: space.id },
          select: { id: true },
        });
        const existingFolderIds = new Set(existingFolders.map((f) => f.id));
        const currentFolderIds = new Set((space.folders || []).map((f) => f.id));

        const foldersToDelete = [...existingFolderIds].filter((id) => !currentFolderIds.has(id));
        if (foldersToDelete.length > 0) {
          await prisma.folderItem.deleteMany({
            where: { id: { in: foldersToDelete } },
          });
        }

        for (const folder of space.folders || []) {
          await prisma.folderItem.upsert({
            where: { id: folder.id },
            create: {
              id: folder.id,
              spaceId: space.id,
              name: folder.name,
            },
            update: {
              name: folder.name,
            },
          });
        }

        // 4. Manage Lists in Space (both direct and folder lists)
        const allListsInSpace: {
          id: string;
          name: string;
          color?: string;
          icon?: string;
          folderId: string | null;
        }[] = [
          ...(space.lists || []).map((l) => ({
            id: l.id,
            name: l.name,
            color: l.color,
            icon: l.icon,
            folderId: null,
          })),
          ...(space.folders || []).flatMap((f) =>
            (f.lists || []).map((l) => ({
              id: l.id,
              name: l.name,
              color: l.color,
              icon: l.icon,
              folderId: f.id,
            })),
          ),
        ];

        const existingLists = await prisma.listItem.findMany({
          where: { spaceId: space.id },
          select: { id: true },
        });
        const existingListIds = new Set(existingLists.map((l) => l.id));
        const currentListIds = new Set(allListsInSpace.map((item) => item.id));

        const listsToDelete = [...existingListIds].filter((id) => !currentListIds.has(id));
        if (listsToDelete.length > 0) {
          await prisma.listItem.deleteMany({
            where: { id: { in: listsToDelete } },
          });
        }

        for (const list of allListsInSpace) {
          await prisma.listItem.upsert({
            where: { id: list.id },
            create: {
              id: list.id,
              spaceId: space.id,
              folderId: list.folderId,
              name: list.name,
              color: list.color || "#64748B",
              icon: list.icon || "ListTodo",
            },
            update: {
              folderId: list.folderId,
              name: list.name,
              color: list.color || "#64748B",
              icon: list.icon || "ListTodo",
            },
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating workspaces:", error);
    return NextResponse.json(
      { error: "Failed to update workspaces" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  return PUT(request);
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Missing workspace id" },
        { status: 400 },
      );
    }

    const totalCount = await prisma.workspaceItem.count();
    if (totalCount <= 1) {
      return NextResponse.json(
        { error: "Cannot delete the last remaining workspace" },
        { status: 400 },
      );
    }

    await prisma.workspaceItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting workspace:", error);
    return NextResponse.json(
      { error: "Failed to delete workspace" },
      { status: 500 },
    );
  }
}
