import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        borrowItems: {
          where: {
            borrowRecord: {
              status: { in: ["ACTIVE", "OVERDUE", "APPROVED"] },
            },
          },
          include: {
            borrowRecord: {
              select: {
                borrowCode: true,
                borrowerName: true,
                returnDueDate: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const activeBorrows = item.borrowItems.map((bi) => ({
      borrowCode: bi.borrowRecord.borrowCode,
      borrowerName: bi.borrowRecord.borrowerName,
      quantity: bi.quantity,
      returnDueDate: bi.borrowRecord.returnDueDate.toISOString(),
      status: bi.borrowRecord.status,
    }));

    return NextResponse.json({
      itemId: item.id,
      name: item.name,
      totalUnits: item.totalUnits,
      availableUnits: item.availableUnits,
      activeBorrows,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch availability";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
