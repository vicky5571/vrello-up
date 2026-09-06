import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/marcom/db";
import { requireMember } from "@/lib/marcom/auth";
import { hasPermission } from "@/lib/marcom/guards";
import { compareReportPeriodDesc } from "@/lib/marcom/analytics";

async function requireReportWriter() {
  let role;
  try {
    role = await requireMember("ws-main");
  } catch (e) {
    if (e instanceof Response) throw e;
    throw e;
  }
  if (!hasPermission(role, "MANAGE_MASTER_DATA")) {
    throw Response.json({ error: "Forbidden" }, { status: 403 });
  }
}

function asJsonArray(value: unknown): Prisma.InputJsonValue {
  return (Array.isArray(value) ? value : []) as Prisma.InputJsonValue;
}

export async function GET(request: Request) {
  try {
    await requireMember("ws-main");
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

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

  // `month` is a free-text label ("July 2026"), so lexical ORDER BY would
  // sort alphabetically within a year. Fetch year-desc and finish in
  // calendar order via the shared month-name index map.
  const reports = await prisma.monthlyReport.findMany({
    where,
    orderBy: [{ year: "desc" }],
  });
  reports.sort(compareReportPeriodDesc);
  return NextResponse.json({ total: reports.length, data: reports });
}

export async function POST(request: Request) {
  try {
    await requireReportWriter();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const body = await request.json();
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

  const report = await prisma.monthlyReport.create({
    data: {
      month,
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
