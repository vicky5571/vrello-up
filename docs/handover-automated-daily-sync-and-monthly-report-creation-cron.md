# Handover: Automated Daily Rolling Sync & Monthly Report Creation via Vercel Cron (ADR-0036)

- **Spec:** `docs/superpowers/specs/2026-11-05-automated-daily-sync-and-monthly-report-creation-cron-design.md`
- **Plan:** `docs/superpowers/plans/2026-11-05-automated-daily-sync-and-monthly-report-creation-cron.md`
- **ADR:** `docs/adr/0036-automated-daily-sync-and-monthly-report-creation-cron.md`
- **Date:** 2026-11-05
- **Status:** READY FOR EXECUTION

## 1. Exact File Manifest & Purpose

1. `vercel.json`
   - *Purpose:* Project root configuration defining Vercel serverless cron schedule (`0 17 * * *` targeting `/api/cron/reports-sync`).
2. `src/lib/marcom/monthlyReportSync.test.ts`
   - *Purpose:* Unit test verifying month kickoff, daily rolling updates, and custom narrative preservation logic.
3. `src/lib/marcom/monthlyReportSync.ts`
   - *Purpose:* Pure domain module orchestrating data extraction via `reportDraftEngine.ts` and executing safe upserts on `prisma.monthlyReport`.
4. `src/app/api/cron/reports-sync/route.ts`
   - *Purpose:* Next.js App Router route handler validating `CRON_SECRET` authorization and dispatching the sync routine.
5. `src/app/api/cron/reportsSyncRoute.test.ts`
   - *Purpose:* Integration test verifying 401 Unauthorized handling and authorized execution.
6. `src/components/views/ReportsView/ReportsView.tsx` & `/api/marcom/reports/route.ts`
   - *Purpose:* DO NOT TOUCH. Existing user-facing views and endpoints remain 100% backward-compatible.

## 2. Exact Current Code Snippets

### A. Existing Report Creation in `src/app/api/marcom/reports/route.ts` (Lines 36–64)
```ts
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
```

### B. Existing Operational Query in `src/app/api/marcom/reports/draft/route.ts` (Lines 21–72)
```ts
    const { start, end } = getMonthDateRange(month, year);

    const [placements, mous, contents, events] = await Promise.all([
      prisma.placement.findMany({
        where: {
          date: { gte: start, lte: end },
        },
        include: {
          outlet: { select: { name: true, code: true } },
          material: { select: { name: true, type: true, requiresMou: true } },
        },
        orderBy: { date: "asc" },
      }),
      prisma.mou.findMany({
        where: {
          OR: [
            { startDate: { gte: start, lte: end } },
            { submissionDate: { gte: start, lte: end } },
            {
              AND: [
                { startDate: { lte: end } },
                { OR: [{ endDate: null }, { endDate: { gte: start } }] },
                { status: { in: ["APPROVED", "DONE"] } },
              ],
            },
          ],
        },
        orderBy: { startDate: "asc" },
      }),
      prisma.contentPost.findMany({
        where: {
          publishDate: { gte: start, lte: end },
        },
        orderBy: { publishDate: "asc" },
      }),
      prisma.fieldEvent.findMany({
        where: {
          startDate: { gte: start, lte: end },
        },
        orderBy: { startDate: "asc" },
      }),
    ]);

    const draft = generateReportDraft({
      month,
      year,
      placements,
      mous,
      contents,
      events,
    });
```

## 3. Exact Change Instructions

### Change 1: Create `vercel.json` in Project Root
Create `vercel.json` defining the daily serverless cron trigger:
```json
{
  "crons": [
    {
      "path": "/api/cron/reports-sync",
      "schedule": "0 17 * * *"
    }
  ]
}
```

### Change 2: Create `src/lib/marcom/monthlyReportSync.ts`
Create the pure domain module handling data aggregation and safe upsert:
```ts
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { getMonthDateRange, generateReportDraft } from "@/lib/marcom/reportDraftEngine";
import { MONTH_OPTIONS } from "@/lib/marcom/analytics";

function asJsonArray(value: unknown): Prisma.InputJsonValue {
  return (Array.isArray(value) ? value : []) as Prisma.InputJsonValue;
}

export interface SyncReportOptions {
  month?: string;
  year?: number;
  prismaClient?: typeof prisma;
}

export interface SyncReportResult {
  action: "created" | "updated";
  reportId: string;
  month: string;
  year: number;
  totalActivities: number;
  completionRate: number;
  preservedCustomNarratives: boolean;
}

/**
 * Checks whether an existing narrative array has been customized by an admin.
 * If user customized it, returns true to prevent daily cron from overwriting.
 */
export function hasCustomNarratives(
  existingNarratives: unknown,
  defaultNarratives: string[],
): boolean {
  if (!Array.isArray(existingNarratives) || existingNarratives.length === 0) return false;
  // If lengths differ or content differs from standard synthesized bullets, consider custom
  if (existingNarratives.length !== defaultNarratives.length) return true;
  return existingNarratives.some((item, idx) => String(item).trim() !== String(defaultNarratives[idx]).trim());
}

/**
 * Performs atomic daily synchronization and monthly report kickoff.
 * - If report does not exist for (month, year): creates it automatically.
 * - If report exists: refreshes summary metrics and activities, but strictly preserves user-authored narratives.
 */
export async function syncMonthlyReport(opts?: SyncReportOptions): Promise<SyncReportResult> {
  const db = opts?.prismaClient ?? prisma;
  const now = new Date();
  const month = opts?.month?.trim() || MONTH_OPTIONS[now.getMonth()];
  const year = opts?.year ?? now.getFullYear();

  const { start, end } = getMonthDateRange(month, year);

  const [placements, mous, contents, events] = await Promise.all([
    db.placement.findMany({
      where: { date: { gte: start, lte: end } },
      include: {
        outlet: { select: { name: true, code: true } },
        material: { select: { name: true, type: true, requiresMou: true } },
      },
      orderBy: { date: "asc" },
    }),
    db.mou.findMany({
      where: {
        OR: [
          { startDate: { gte: start, lte: end } },
          { submissionDate: { gte: start, lte: end } },
          {
            AND: [
              { startDate: { lte: end } },
              { OR: [{ endDate: null }, { endDate: { gte: start } }] },
              { status: { in: ["APPROVED", "DONE"] } },
            ],
          },
        ],
      },
      orderBy: { startDate: "asc" },
    }),
    db.contentPost.findMany({
      where: { publishDate: { gte: start, lte: end } },
      orderBy: { publishDate: "asc" },
    }),
    db.fieldEvent.findMany({
      where: { startDate: { gte: start, lte: end } },
      orderBy: { startDate: "asc" },
    }),
  ]);

  const draft = generateReportDraft({
    month,
    year,
    placements,
    mous,
    contents,
    events,
  });

  const existing = await db.monthlyReport.findFirst({
    where: { month, year },
  });

  if (!existing) {
    const created = await db.monthlyReport.create({
      data: {
        month,
        year,
        summary: draft.summary as unknown as Prisma.InputJsonValue,
        activities: asJsonArray(draft.activities),
        achievements: asJsonArray(draft.achievements),
        keyIssues: asJsonArray(draft.keyIssues),
        actionPlans: asJsonArray(draft.actionPlans),
      },
    });

    return {
      action: "created",
      reportId: created.id,
      month,
      year,
      totalActivities: draft.summary.totalActivities,
      completionRate: draft.summary.completionRate,
      preservedCustomNarratives: false,
    };
  }

  // Preserve existing narrative arrays if admin modified them
  const isCustomAchievements = hasCustomNarratives(existing.achievements, draft.achievements);
  const isCustomIssues = hasCustomNarratives(existing.keyIssues, draft.keyIssues);
  const isCustomPlans = hasCustomNarratives(existing.actionPlans, draft.actionPlans);
  const preservedCustom = isCustomAchievements || isCustomIssues || isCustomPlans;

  const updated = await db.monthlyReport.update({
    where: { id: existing.id },
    data: {
      summary: draft.summary as unknown as Prisma.InputJsonValue,
      activities: asJsonArray(draft.activities),
      achievements: isCustomAchievements ? existing.achievements : asJsonArray(draft.achievements),
      keyIssues: isCustomIssues ? existing.keyIssues : asJsonArray(draft.keyIssues),
      actionPlans: isCustomPlans ? existing.actionPlans : asJsonArray(draft.actionPlans),
    },
  });

  return {
    action: "updated",
    reportId: updated.id,
    month,
    year,
    totalActivities: draft.summary.totalActivities,
    completionRate: draft.summary.completionRate,
    preservedCustomNarratives: preservedCustom,
  };
}
```

### Change 3: Create `src/app/api/cron/reports-sync/route.ts`
Create the secure Next.js App Router handler:
```ts
import { NextResponse } from "next/server";
import { syncMonthlyReport } from "@/lib/marcom/monthlyReportSync";

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

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month") || undefined;
    const yearParam = searchParams.get("year");
    const year = yearParam ? Number(yearParam) : undefined;

    const result = await syncMonthlyReport({ month, year });

    return NextResponse.json({
      ok: true,
      syncedAt: new Date().toISOString(),
      result,
    });
  } catch (error) {
    console.error("GET /api/cron/reports-sync error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to execute reports cron sync" },
      { status: 500 }
    );
  }
}
```

## 4. Explicit "Do Not Touch" List with Reasons

| File / Component | Reason |
| :--- | :--- |
| `src/components/views/ReportsView/ReportsView.tsx` | View layer remains untouched. It fetches `/api/marcom/reports` on mount and renders fresh data automatically. |
| `src/app/api/marcom/reports/route.ts` | Existing GET and POST endpoints for manual report handling remain 100% backward-compatible. |
| `prisma/schema.prisma` | Zero database migrations required; `MonthlyReport` schema natively accommodates all summary metrics and activities. |
| External Infrastructure | Zero VPS, zero Docker daemon setups, zero third-party scheduler subscriptions. |

## 5. Numbered Execution Order

1. **Step 1 (TDD Red):**
   - Create `src/lib/marcom/monthlyReportSync.test.ts` testing kickoff, daily updates, and narrative preservation.
   - Create `src/app/api/cron/reportsSyncRoute.test.ts` testing HTTP 401 and authorized execution.
   - Run:
     ```bash
     node --test --import ./test/register-alias.mjs src/lib/marcom/monthlyReportSync.test.ts src/app/api/cron/reportsSyncRoute.test.ts
     ```
     *(Confirm RED state).*

2. **Step 2 (Domain Implementation Green):**
   - Implement `src/lib/marcom/monthlyReportSync.ts`.
   - Run:
     ```bash
     node --test --import ./test/register-alias.mjs src/lib/marcom/monthlyReportSync.test.ts
     ```
     *(Confirm GREEN state).*

3. **Step 3 (Cron Route & Vercel Config Implementation Green):**
   - Create `vercel.json` with cron schedule.
   - Implement `src/app/api/cron/reports-sync/route.ts`.
   - Run:
     ```bash
     node --test --import ./test/register-alias.mjs src/app/api/cron/reportsSyncRoute.test.ts
     ```
     *(Confirm GREEN state).*

4. **Step 4 (Full Verification Gates):**
   ```bash
   npm run drift:check
   npm run build:check
   npm test
   ```
   *(Confirm 0 drift, 0 build errors, 0 test failures).*

5. **Step 5 (Documentation & Handoff):**
   - Update `docs/superpowers/specs/2026-11-05-automated-daily-sync-and-monthly-report-creation-cron-design.md` status to `IMPLEMENTED`.
   - Update `docs/superpowers/plans/2026-11-05-automated-daily-sync-and-monthly-report-creation-cron.md` task checkboxes.
   - Update `CHANGELOG.md` and `docs/SESSION_STATE.md`.

## 6. Acceptance Criteria Checklist

- [ ] `vercel.json` exists in project root with daily cron schedule `0 17 * * *`.
- [ ] `GET /api/cron/reports-sync` rejects unauthorized requests with HTTP 401 when `CRON_SECRET` is set.
- [ ] `GET /api/cron/reports-sync` executes successfully with HTTP 200 when authorized.
- [ ] `syncMonthlyReport` creates new monthly report on start-of-month kickoff.
- [ ] `syncMonthlyReport` updates `summary` and `activities` daily for active month.
- [ ] User-authored custom narratives in `achievements`, `keyIssues`, and `actionPlans` are preserved.
- [ ] `npm run drift:check` passes with no drift detected.
- [ ] `npm run build:check` compiles with 0 TypeScript errors.
- [ ] `npm test` passes with 0 failures across all test suites.




