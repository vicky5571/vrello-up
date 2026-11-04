# Implementation Plan: Automated Daily Rolling Sync & Monthly Report Creation via Vercel Cron

- **Spec:** `docs/superpowers/specs/2026-11-05-automated-daily-sync-and-monthly-report-creation-cron-design.md`
- **ADR:** `docs/adr/0036-automated-daily-sync-and-monthly-report-creation-cron.md`
- **Date:** 2026-11-05
- **Status:** DRAFT

## 1. File Manifest & Blast Radius

| File Path | Action | Estimated LOC | Description / Responsibility |
| :--- | :--- | :--- | :--- |
| `vercel.json` | Create/Modify | ~10 LOC | Defines Vercel serverless cron schedule (`0 17 * * *` targeting `/api/cron/reports-sync`) |
| `src/lib/marcom/monthlyReportSync.test.ts` | Create | ~80 LOC | Unit tests for monthly report auto-creation, daily rolling sync, and narrative preservation |
| `src/lib/marcom/monthlyReportSync.ts` | Create | ~120 LOC | Pure domain logic module executing aggregation and safe upsert on `MonthlyReport` |
| `src/app/api/cron/reports-sync/route.ts` | Create | ~50 LOC | Secure Next.js App Router route handler validating `CRON_SECRET` and calling sync engine |
| `src/app/api/cron/reportsSyncRoute.test.ts` | Create | ~60 LOC | Route integration tests verifying HTTP 401 unauthorized and HTTP 200 authorized execution |
| `CHANGELOG.md` | Modify | +10 LOC | Document ADR-0036 release entry |
| `docs/SESSION_STATE.md` | Modify | +15 LOC | Update session status and active feature |
| `docs/superpowers/plans/2026-11-05-automated-daily-sync-and-monthly-report-creation-cron.md` | Track | - | Phased execution tracking |
| `docs/superpowers/specs/2026-11-05-automated-daily-sync-and-monthly-report-creation-cron-design.md` | Modify | - | Update spec status to IMPLEMENTED upon completion |
| `docs/handover-automated-daily-sync-and-monthly-report-creation-cron.md` | Create | ~200 LOC | Execution-ready handover guide |

## 2. Phased Implementation Tasks

### Phase 1: Test-First Harness (TDD Red)
- [ ] Task 1.1: Create `src/lib/marcom/monthlyReportSync.test.ts`:
  - Test auto-creation: asserts `syncMonthlyReport` creates a new record if none exists for the period.
  - Test daily update: asserts `syncMonthlyReport` updates `summary` and `activities` when new operational data arrives.
  - Test narrative protection: asserts custom admin entries in `achievements`, `keyIssues`, and `actionPlans` are strictly preserved during daily sync.
- [ ] Task 1.2: Create `src/app/api/cron/reportsSyncRoute.test.ts`:
  - Test authorization: asserts HTTP 401 when `CRON_SECRET` is set and request lacks `Bearer` token.
  - Test success: asserts HTTP 200 with `{ ok: true, result: ... }` when properly authorized.
- [ ] Task 1.3: Run tests to confirm failing (red) state.

### Phase 2: Implement Pure Domain Sync Engine (`monthlyReportSync.ts`)
- [ ] Task 2.1: Create `src/lib/marcom/monthlyReportSync.ts`:
  - Export `syncMonthlyReport` function.
  - Integrate with `getMonthDateRange` and `generateReportDraft`.
  - Fetch operational entities (placements, MOUs, contents, events).
  - Implement safe upsert into `prisma.monthlyReport`.
  - Implement custom narrative preservation logic.
- [ ] Task 2.2: Run `node --test --import ./test/register-alias.mjs src/lib/marcom/monthlyReportSync.test.ts` to confirm passing (green) state.

### Phase 3: Implement Secure Route & Vercel Cron Configuration
- [ ] Task 3.1: Create `vercel.json` in project root:
  - Add `crons` schedule `0 17 * * *` targeting `/api/cron/reports-sync`.
- [ ] Task 3.2: Create `src/app/api/cron/reports-sync/route.ts`:
  - Enforce `CRON_SECRET` validation.
  - Call `syncMonthlyReport`.
  - Return JSON response with synced status and counts.
- [ ] Task 3.3: Run `node --test --import ./test/register-alias.mjs src/app/api/cron/reportsSyncRoute.test.ts` to confirm passing (green) state.

### Phase 4: Full Invariants & Verification Gates
- [ ] Task 4.1: Run `npm run drift:check` (must pass 100%, 63/63 spec-plan pairs, coordinator LOC OK).
- [ ] Task 4.2: Run `npm run build:check` (must compile with 0 TypeScript errors).
- [ ] Task 4.3: Run `npm test` (must pass with 0 failures across all test suites).
- [ ] Task 4.4: Update `docs/superpowers/specs/2026-11-05-automated-daily-sync-and-monthly-report-creation-cron-design.md` status to `IMPLEMENTED`.
- [ ] Task 4.5: Update `CHANGELOG.md` and `docs/SESSION_STATE.md`.
- [ ] Task 4.6: Create execution-ready handover guide `docs/handover-automated-daily-sync-and-monthly-report-creation-cron.md`.

## 3. Verification Checklist

- [ ] `vercel.json` exists with daily cron schedule.
- [ ] `src/lib/marcom/monthlyReportSync.ts` implements safe upsert and narrative preservation.
- [ ] `src/app/api/cron/reports-sync/route.ts` rejects unauthorized requests with HTTP 401.
- [ ] Daily rolling sync updates `summary` and `activities` without data loss.
- [ ] `npm run drift:check` passes with no drift detected.
- [ ] `npm run build:check` compiles with 0 errors.
- [ ] `npm test` passes with 0 failures across all suites.


