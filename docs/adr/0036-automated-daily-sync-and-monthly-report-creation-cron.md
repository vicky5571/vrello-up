# ADR-0036: Automated Daily Rolling Sync & Monthly Report Creation via Vercel Cron

- **Status:** APPROVED
- **Date:** 2026-11-05
- **Deciders:** Senior Software Engineer, Principal Systems Architect, Product Owner
- **Consulted:** Marcom Lead, Branch Manager
- **Informed:** Core Development Team

## 1. Context & Business Problem

In Vrello Marcom Operations, the **Reports** view provides closed-period and active monthly operational accountability (`docs/reports-vs-analytics-boundaries.md`). Currently, reports only exist if an admin manually opens the creation form, initiates an auto-draft, and clicks "Simpan Laporan".

This manual dependency introduces operational frictions:
1. **Stale Active Month Data:** During an active month (e.g. November 2026), if a report row was saved on day 5, it will not reflect new POSM placements, MOUs, or events completed on days 6–30 unless an admin manually recalculates or deletes/re-creates it.
2. **Missing Start-of-Month Reports:** At the beginning of a new month, reports are not generated until an admin remembers to do so, leading to gaps in management visibility.
3. **Infrastructure Overhead Concerns:** Automating this must NOT introduce unnecessary recurring cloud costs or complex infrastructure management such as provisioning and maintaining a dedicated Virtual Private Server (VPS), container orchestrator, or long-running daemon.

The business requirement is twofold:
- Automatically initialize a new monthly report on the 1st of every month.
- Automatically synchronize and refresh the active month's report daily with fresh operational data, while strictly preserving any custom notes or contextual narratives previously authored by human administrators.

## 2. Options Considered

### Option 1: Vercel Native Cron Jobs + Secure API Route (`vercel.json` + `/api/cron/reports-sync`) — [CHOSEN]
- **Concept:** Configure a daily schedule in `vercel.json` (`0 17 * * *`, which is 00:00 WIB daily). Vercel triggers a dedicated Next.js App Router endpoint `GET /api/cron/reports-sync`. The route verifies the incoming request with the standard `CRON_SECRET` environment variable (`Authorization: Bearer <CRON_SECRET>`). It executes the report aggregation engine and upserts the active month's `MonthlyReport` record.
- **Pros:**
  - Zero VPS cost and zero daemon maintenance.
  - Native integration with Next.js App Router and Vercel hosting.
  - Centrally monitored in Vercel Dashboard with automatic retry and execution logs.
  - Uses existing TypeScript domain logic in `reportDraftEngine.ts`.
- **Cons:** Dependent on Vercel platform scheduler (if migrating away from Vercel in the future, the trigger needs to be pointed to the same endpoint from an external scheduler).

### Option 2: Supabase Database-Level Scheduled Job (`pg_cron` + `pg_net`)
- **Concept:** Enable `pg_cron` in Supabase to trigger a daily SQL stored procedure or call an external webhook via `pg_net`.
- **Pros:** Lives completely inside PostgreSQL; platform-agnostic to frontend hosting.
- **Cons:** Difficult to maintain complex aggregation logic in raw SQL without duplicating TypeScript domain logic; requires manual superuser/dashboard enablement in Supabase.

### Option 3: GitHub Actions Scheduled Workflow
- **Concept:** A `.github/workflows/daily-reports-sync.yml` workflow running on cron schedule `0 17 * * *` invoking `curl -H "Authorization: Bearer $CRON_SECRET" https://.../api/cron/reports-sync`.
- **Pros:** Cloud-agnostic and free.
- **Cons:** GitHub Actions cron schedules suffer from high jitter delays (often 15–45 minutes late during peak hours); requires maintaining CI/CD secret tokens.

## 3. Decision

We choose **Option 1: Vercel Native Cron Jobs + Secure API Route (`vercel.json` + `/api/cron/reports-sync`)**.

### Architectural Directives:
1. **Schedule Configuration (`vercel.json`):**
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
   *(Runs daily at 17:00 UTC, corresponding to 00:00 WIB midnight).*

2. **Secure Route Handler (`src/app/api/cron/reports-sync/route.ts`):**
   - Extracts `Authorization: Bearer <token>` header or `x-vercel-cron` header.
   - Compares with `process.env.CRON_SECRET`. In development/testing, if `CRON_SECRET` is unset or bypassed via dev flag, allows authenticated admin execution. Returns HTTP 401 on unauthorized calls.

3. **Domain Sync & Upsert Workflow:**
   - Evaluates current system date: resolves `activeMonth` (Indonesian name, e.g. "November") and `activeYear` (e.g. 2026).
   - Fetches operational data for the active month using `getMonthDateRange(activeMonth, activeYear)`:
     - Placements (where date in range).
     - MOUs (active or starting in range).
     - Content Posts (published in range).
     - Field Events (started in range).
   - Generates latest metrics via `generateReportDraft(...)`.
   - Queries `prisma.monthlyReport.findFirst({ where: { month: activeMonth, year: activeYear } })`:
     - **If NOT exists (Start of Month Kickoff):**
       Creates a new `MonthlyReport` with calculated `summary`, `activities`, and draft narratives.
     - **If ALREADY exists (Daily Rolling Sync):**
       Updates `summary` and `activities` with latest real-time figures.
       **Strict Narrative Preservation:** Preserves existing `achievements`, `keyIssues`, and `actionPlans` arrays if they contain user-edited content, preventing daily jobs from overwriting manual administrative entries.

4. **Previous Month Rollover Seal:**
   - If today is within days 1–3 of a new month, the job also runs a final sync pass for the immediately preceding month to capture any late-logged end-of-month entries, then flags or finalizes it.

5. **Pure Domain Helper Extraction:**
   - Extract the sync logic into a testable pure helper `src/lib/marcom/monthlyReportSync.ts` so that integration and unit tests can run without needing a live Vercel HTTP trigger.

## 4. Consequences & Accepted Trade-offs

- **Positive:**
  - 100% Zero-VPS infrastructure cost; zero server management or daemon patching.
  - Active month report is always fresh with up-to-date metrics every morning.
  - Guaranteed automatic report creation on the 1st of every month.
  - Safe against data loss: manual notes authored by humans are strictly preserved.
- **Negative / Accepted Debt:**
  - On local development, cron jobs do not fire automatically (must be triggered via manual curl or automated test).



