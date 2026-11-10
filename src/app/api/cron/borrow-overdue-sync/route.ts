import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  sendBorrowOverdueEmail,
  sendBorrowOverdueDigestEmail,
} from "@/lib/server/mailer";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // In production, enforce CRON_SECRET authorization header
    if (process.env.NODE_ENV === "production" && cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          { error: "Unauthorized cron execution" },
          { status: 401 }
        );
      }
    }

    const now = new Date();

    // Query active borrow records that are past returnDueDate
    // Invariant: Status in DB remains strictly ACTIVE (virtual overdue)
    const overdueRecords = await prisma.borrowRecord.findMany({
      where: {
        status: "ACTIVE",
        returnDueDate: { lt: now },
      },
      include: {
        items: {
          include: {
            inventoryItem: { select: { name: true } },
          },
        },
      },
      orderBy: { returnDueDate: "asc" },
    });

    // 1. Borrower individual reminders
    let borrowersNotified = 0;
    for (const record of overdueRecords) {
      const user = await prisma.user.findFirst({
        where: {
          name: { equals: record.borrowerName.trim(), mode: "insensitive" },
          status: "APPROVED",
        },
        select: { email: true },
      });

      if (user?.email) {
        const itemsDescription =
          record.items
            .map((i) => `${i.inventoryItem?.name || "Peralatan"} (${i.quantity}x)`)
            .join(", ") || "Peralatan Marcom";

        const formattedDate = record.returnDueDate.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });

        await sendBorrowOverdueEmail(
          user.email,
          record.borrowerName,
          record.borrowCode,
          itemsDescription,
          formattedDate
        );
        borrowersNotified++;
      }
    }

    // 2. Warehouse & Management consolidated digest
    let managersNotified = 0;
    if (overdueRecords.length > 0) {
      const managers = await prisma.user.findMany({
        where: {
          role: { in: ["WAREHOUSE", "SUPERVISOR", "ADMIN"] },
          status: "APPROVED",
        },
        select: { email: true },
      });

      const managerEmails = managers
        .map((m) => m.email)
        .filter((email): email is string => Boolean(email));

      if (managerEmails.length > 0) {
        const summaryList = overdueRecords.map((r) => {
          const itemsSummary =
            r.items
              .map((i) => `${i.inventoryItem?.name || "Peralatan"} (${i.quantity}x)`)
              .join(", ") || "Peralatan Marcom";

          const formattedDueDate = r.returnDueDate.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });

          return {
            borrowCode: r.borrowCode,
            borrowerName: r.borrowerName,
            dueDate: formattedDueDate,
            itemsSummary,
          };
        });

        await sendBorrowOverdueDigestEmail(managerEmails, summaryList);
        managersNotified = managerEmails.length;
      }
    }

    return NextResponse.json({
      ok: true,
      syncedAt: now.toISOString(),
      totalOverdue: overdueRecords.length,
      borrowersNotified,
      managersNotified,
    });
  } catch (error) {
    console.error("GET /api/cron/borrow-overdue-sync error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to execute borrow overdue cron sync",
      },
      { status: 500 }
    );
  }
}
