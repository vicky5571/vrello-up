import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { compareReportPeriodDesc } from "@/lib/marcom/analytics";

function asJsonArray(value: unknown): Prisma.InputJsonValue {
  return (Array.isArray(value) ? value : []) as Prisma.InputJsonValue;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const month = searchParams.get("month");
  const yearParam = searchParams.get("year");

  const where: Prisma.MonthlyReportWhereInput = {};
  if (month) {
    where.month = { equals: month, mode: "insensitive" };
  }
  if (yearParam !== null) {
    const year = Number(yearParam);
    if (!Number.isInteger(year)) {
      return NextResponse.json({ error: "Invalid year" }, { status: 400 });
    }
    where.year = year;
  }

  const reports = await prisma.monthlyReport.findMany({
    where,
    orderBy: [{ year: "desc" }],
  });
  reports.sort(compareReportPeriodDesc);
  return NextResponse.json({ total: reports.length, data: reports });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { month, year, summary, activities, achievements, keyIssues, actionPlans } =
    body ?? {};
  if (!month || year === undefined) {
    return NextResponse.json(
      { error: "Missing required fields: month, year" },
      { status: 400 },
    );
  }
  if (typeof month !== "string" || !Number.isInteger(year)) {
    return NextResponse.json(
      { error: "Invalid month or year" },
      { status: 400 },
    );
  }

  const normalizedMonth = month.trim();
  const existing = await prisma.monthlyReport.findFirst({
    where: {
      month: { equals: normalizedMonth, mode: "insensitive" },
      year,
    },
  });

  if (existing) {
    const updated = await prisma.monthlyReport.update({
      where: { id: existing.id },
      data: {
        month: normalizedMonth,
        year,
        summary: (summary ?? {}) as Prisma.InputJsonValue,
        activities: asJsonArray(activities),
        achievements: asJsonArray(achievements),
        keyIssues: asJsonArray(keyIssues),
        actionPlans: asJsonArray(actionPlans),
      },
    });
    return NextResponse.json(updated, { status: 200 });
  }

  const report = await prisma.monthlyReport.create({
    data: {
      month: normalizedMonth,
      year,
      summary: (summary ?? {}) as Prisma.InputJsonValue,
      activities: asJsonArray(activities),
      achievements: asJsonArray(achievements),
      keyIssues: asJsonArray(keyIssues),
      actionPlans: asJsonArray(actionPlans),
    },
  });
  return NextResponse.json(report, { status: 201 });
}
