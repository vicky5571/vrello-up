# Design Specification: Automated Daily Rolling Sync & Monthly Report Creation via Vercel Cron

- **Date:** 2026-11-05
- **Status:** IMPLEMENTED (ADR-0036)
- **ADR Reference:** `docs/adr/0036-automated-daily-sync-and-monthly-report-creation-cron.md`

## 1. Executive Summary & Goals

This specification defines the zero-VPS serverless automation pipeline for the **Reports** view in Vrello Marcom Operations. The goal is to provide continuous, daily synchronization for the active month's report and automatic initialization of new monthly reports on the 1st of every month without requiring manual admin intervention or paid server infrastructure.

### Core Objectives:
1. **Zero-VPS Infrastructure:** Implement scheduling natively via **Vercel Cron Jobs** targeting a secure Next.js App Router API route (`/api/cron/reports-sync`).
2. **Automated Monthly Kickoff:** Automatically create a new `MonthlyReport` record on day 1 of every month with pre-aggregated operational data.
3. **Daily Rolling Synchronization:** Update the active month's report daily at 00:00 WIB (17:00 UTC) with fresh placements, MOUs, published content, and completed events.
4. **Human-in-the-Loop Preservation:** Protect human-authored narrative inputs (Achievements, Key Issues, Action Plans). The daily job updates metrics and activity matrices without destroying custom notes authored by administrators.
5. **Multi-layer Security:** Protect the cron endpoint using standard Vercel `CRON_SECRET` authorization (`Authorization: Bearer <CRON_SECRET>`), rejecting unauthorized public access with HTTP 401.

## 2. Architecture & Cron Configuration

### 2.1 Vercel Cron Configuration (`vercel.json`)
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
- Schedule `0 17 * * *` translates to 17:00 UTC, which corresponds to 00:00 WIB midnight (UTC+7).
- Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` on every scheduled request.

## 3. API Route Contract & Security (`/api/cron/reports-sync`)

### 3.1 Endpoint Specifications
- **HTTP Method:** `GET`
- **Route:** `/api/cron/reports-sync`
- **Headers Required:**
  - `Authorization: Bearer <CRON_SECRET>`
- **Security Check:**
  ```ts
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (process.env.NODE_ENV === "production" && cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
    }
  }
  ```

### 3.2 Response Payload
```json
{
  "ok": true,
  "syncedAt": "2026-11-05T17:00:00.000Z",
  "result": {
    "action": "updated",
    "reportId": "cm1234567890",
    "month": "November",
    "year": 2026,
    "totalActivities": 8,
    "completionRate": 38,
    "preservedCustomNarratives": true
  }
}
```

## 4. Pure Domain Sync Engine & Preservation Algorithm

### 4.1 Module Location: `src/lib/marcom/monthlyReportSync.ts`
To maintain the project's invariant of pure, testable domain modules decoupled from HTTP routing:
```ts
export interface SyncReportOptions {
  month?: string;
  year?: number;
  forceRebuildNarratives?: boolean;
}

export interface SyncReportResult {
  action: "created" | "updated" | "skipped";
  reportId: string;
  month: string;
  year: number;
  totalActivities: number;
  completionRate: number;
  preservedCustomNarratives: boolean;
}
```

### 4.2 Narrative Preservation Policy
When performing daily updates on an existing `MonthlyReport`:
1. Check existing narrative fields (`achievements`, `keyIssues`, `actionPlans`).
2. If the user has customized these fields (defined as containing non-empty arrays that differ from default fallback text), the daily sync **preserves the existing arrays**.
3. If the fields are empty or still match the initial auto-generated draft, the sync engine updates them with newly synthesized achievements based on fresh operational data.
4. `summary` (total activities, costs, completion rate) and `activities` (full realization list) are **always updated** to reflect the exact state of the database today.

### 4.3 Month Rollover Algorithm
If current day is $\le 3$ (e.g. November 1, 2, 3):
- The sync engine also verifies that the previous month (e.g. October) has a finalized report.
- Captures any last-minute submissions before sealing the previous month.
- Initializes the new month's report record.

## 5. Acceptance Criteria & Verification Checklist

- [x] `vercel.json` exists in project root with daily cron schedule targeting `/api/cron/reports-sync`.
- [x] `GET /api/cron/reports-sync` rejects unauthorized requests with HTTP 401 when `CRON_SECRET` is set.
- [x] `GET /api/cron/reports-sync` succeeds with HTTP 200 and JSON response when authorized.
- [x] `syncMonthlyReport` creates a new `MonthlyReport` if one does not exist for the target period.
- [x] `syncMonthlyReport` updates `summary` and `activities` for an existing month's report.
- [x] Custom user narratives in `achievements`, `keyIssues`, and `actionPlans` are preserved during daily updates.
- [x] Automated unit test `src/lib/marcom/monthlyReportSync.test.ts` passes 100%.
- [x] Automated route test `src/app/api/cron/reportsSyncRoute.test.ts` passes 100%.
- [x] `npm run drift:check` passes with no drift detected.
- [x] `npm run build:check` compiles with 0 TypeScript errors.
- [x] `npm test` passes with 0 failures across all suites.



