# CHANGELOG — vrello-up

Format: `[YYYY-MM-DD] <type>(<scope>): <description>` with spec/plan references.

---

## [2026-10-30]

- `fix(auth)`: Resolve 4 audit issues from auth implementation
  - `fix(auth)`: Make JWT type fields required in `src/types/next-auth.d.ts`
  - `fix(middleware)`: Implement Auth.js v5 JWT verification with split `src/auth.config.ts` for Edge compatibility
  - `fix(register)`: Extract `RegisterSuccess.tsx` subcomponent, bringing `RegisterForm.tsx` to 249 LOC
  - `test(mailer)`: Add silent-catch tests for `sendMail` rejection path in `src/lib/server/mailer.test.ts`
  Spec: `docs/superpowers/specs/2026-10-30-auth-user-management-design.md`
  Plan: `docs/superpowers/plans/2026-10-30-auth-user-management-fixes.md`

- `docs(auth-fixes)`: Fix plan for 4 audit issues found in auth implementation
  Plan: `docs/superpowers/plans/2026-10-30-auth-user-management-fixes.md`
  Issues: JWT optional fields, cookie-only middleware, RegisterForm LOC, missing mailer failure test

- `feat(auth)`: Add credential registration, admin approval gate, and user management page
  - Add User Prisma model (`DbUserRole`/`DbUserStatus` enums, `PENDING` approval flow)
  - Add `/register` page with email+password form and Google OAuth path
  - Add `/login` page (credentials + Google, status-aware error messages)
  - Add NextAuth Credentials provider with bcryptjs, status blocking, lastLoginAt update
  - Add `/api/auth/register` endpoint (`POST`, bcrypt hash, duplicate guard)
  - Add `/api/admin/users` GET + PATCH + DELETE endpoints (admin-only)
  - Add `/admin/users` full-page view (Pending/Active/Rejected tabs)
  - Add Nodemailer email notifications for approval and rejection
  - Add Next.js middleware protecting all app routes via session cookie validation
  - Add `bcryptjs` and `nodemailer` dependencies
  - Add `auth-helpers` and `mailer` server utilities with unit test suites
  - Remove deprecated `LoginModal`, `InviteModal`, `TeamsModal`, `ShareModal`, and `AuthSync`
  - Remove persona switcher from `UserMenuDropdown` and `SettingsModal`
  - Remove Invite rail item; update Teams rail item to `/admin/users` navigation link
  - Remove Share button from `TopNavActionModals`
  Spec: `docs/superpowers/specs/2026-10-30-auth-user-management-design.md`  
  Plan: `docs/superpowers/plans/2026-10-30-auth-user-management.md`  
  ADR:  `docs/auth-user-management/adr.md`

- `docs(auth)`: ARD, spec, and implementation plan for Authentication & User Management system
  Spec: `docs/superpowers/specs/2026-10-30-auth-user-management-design.md`
  Plan: `docs/superpowers/plans/2026-10-30-auth-user-management.md`
  ADR:  `docs/auth-user-management/adr.md`

---

## [2026-10-29]

- `fix(reports)`: Add outer scroll container to prevent content clipping  
  Ref: `docs/handover-scroll-reports-view.md`
- `feat(reports)`: Reports view UX improvements (KPI cards, progress bar, period highlight, empty state, report deletion)  
  Spec: `docs/superpowers/specs/2026-10-29-reports-view-improvements-design.md`  
  Plan: `docs/superpowers/plans/2026-10-29-reports-view-improvements.md`  
  ADR: `docs/reports-improvements/adr.md`
- `fix(documents)`: Add outer scroll container to prevent content clipping  
  Ref: `docs/handover-scroll-documents-view.md`

---

## [2026-10-27]

- `refactor(workspace)`: Remove multi-workspace layer — single-tenant simplification  
  Spec: `docs/superpowers/specs/2026-10-27-remove-workspace-single-tenant-design.md`  
  Plan: `docs/superpowers/plans/2026-10-27-remove-workspace-single-tenant.md`

---

## [2026-10-01]

- `feat(analytics)`: Analytics defect fixes  
  Plan: `docs/superpowers/plans/2026-10-01-analytics-defect-fixes.md`
- `feat(analytics)`: Phase 1 — Backend persistence engine fixes  
  Plan: `docs/superpowers/plans/2026-10-01-analytics-phase-1-backend-persistence-engine-fixes.md`
- `feat(analytics)`: Phase 2 — Multi-dimensional filters & actionable KPIs  
  Plan: `docs/superpowers/plans/2026-10-01-analytics-phase-2-multi-dimensional-filters-actionable-kpis.md`
- `feat(analytics)`: Phase 3 — Modular charts, accessibility, drilldown  
  Plan: `docs/superpowers/plans/2026-10-01-analytics-phase-3-modular-charts-accessibility-drilldown.md`
- `refactor(outlets)`: Remove outlet tier option 2a  
  Spec: `docs/superpowers/specs/2026-10-01-remove-outlet-tier-option-2a-design.md`  
  Plan: `docs/superpowers/plans/2026-10-01-remove-outlet-tier-option-2a.md`

## [2026-09-30]

- `feat(mous)`: MOU table phase 1–4 (layout, validity countdown, filters, drawer-first architecture)
- `feat(outlets)`: Pilih Outlet phase 1–4 (UI consolidation, initialization safety, tokenized search, brand sync)
- `feat(placements)`: Placements table UI/UX overhaul
- `refactor(outlets)`: Outlet-MOU status refactor

## [2026-09-29]

- `feat(branches)`: Branches table UI/UX overhaul  
  Plan: `docs/superpowers/plans/2026-09-29-branches-table-ui-ux-overhaul.md`
- `feat(outlets)`: Outlet form modal UX overhaul  
  Plan: `docs/superpowers/plans/2026-09-29-outlet-form-modal-ux-overhaul.md`

## [2026-09-28]

- `perf(marcom)`: Batch delete N+1 query fix  
  Plan: `docs/superpowers/plans/2026-09-28-batch-delete-n-plus-one.md`
- `perf(marcom)`: Marcom table search performance  
  Plan: `docs/superpowers/plans/2026-09-28-marcom-table-search-performance.md`
- `feat(outlets)`: Master data boundary guards — outlet backfill  
  Plan: `docs/superpowers/plans/2026-09-28-master-data-boundary-guards-outlet-backfill.md`

## [2026-09-27]

- `refactor(types)`: Consolidate type definitions — SSOT  
  Plan: `docs/superpowers/plans/2026-09-27-consolidate-type-definitions-ssot.md`
- `refactor(mous)`: Decompose MousView (god-file strangler)  
  Plan: `docs/superpowers/plans/2026-09-27-decompose-mous-view.md`
- `refactor(store)`: God-file store strangler plan  
  Plan: `docs/superpowers/plans/2026-09-27-god-file-store-strangler-plan.md`
- `refactor(marcom)`: Reactive marcom data store  
  Plan: `docs/superpowers/plans/2026-09-27-reactive-marcom-data-store.md`
- Various: decouple-task-marcom-hardcoded-ids, eliminate-duplicate-state-phase-2, fix-kanban-marcom-desync, formalize-related-marcom-type, prisma-frontend-schema-divergence, relocate-prisma-singleton, type-outlet-backfill-prisma-client, workspace-store-slices-composition, auto-backfill-outlet-gps

## [2026-09-25]

- `feat(placements)`: Placement form wizard  
  Plan: `docs/superpowers/plans/2026-09-25-placement-form-wizard.md`
- `feat(placements)`: Placement wizard UX polish

## [2026-09-24]

- `feat(workspace)`: Workspace boundary — tenant isolation in views  
  Plan: `docs/superpowers/plans/2026-09-24-workspace-boundary-tenant-isolation-in-views.md`

## [2026-09-21]

- `feat(outlets)`: Draft outlet approval flow  
  Spec: `docs/superpowers/specs/2026-09-21-draft-outlet-approval-flow-design.md`
- `feat(posm)`: Field POSM execution  
  Spec: `docs/superpowers/specs/2026-09-21-field-posm-execution-design.md`
- `feat(reports)`: POSM quarterly regional reports  
  Spec: `docs/superpowers/specs/2026-09-21-posm-quarterly-regional-reports-design.md`
- `feat(router)`: URL routing and state sync  
  Spec: `docs/superpowers/specs/2026-09-21-url-routing-and-state-sync-design.md`

## [2026-09-20]

- `feat(pipeline)`: Pipeline view  
  Spec: `docs/superpowers/specs/2026-09-20-pipeline-view-design.md`

## [2026-09-19]

- `refactor(store)`: God files strangler phase 1  
  Spec: `docs/superpowers/specs/2026-09-19-god-files-strangler-phase-1-design.md`

## [2026-09-17]

- `feat(placements)`: Placement maps  
  Spec: `docs/superpowers/specs/2026-09-17-placement-maps-design.md`

## [2026-09-15]

- `feat(gdrive)`: Google Drive picker integration  
  Spec: `docs/superpowers/specs/2026-09-15-google-drive-picker-integration-design.md`
- `feat(marcom)`: Marcom work items workspace scoping  
  Spec: `docs/superpowers/specs/2026-09-15-marcom-work-items-workspace-scoping-design.md`

## [2026-09-14]

- `feat(mode)`: Dual context mode  
  Spec: `docs/superpowers/specs/2026-09-14-dual-context-mode-design.md`
- `feat(events)`: Separate content and field events  
  Spec: `docs/superpowers/specs/2026-09-14-separate-content-and-field-events-design.md`

## [2026-09-07]

- `feat(marcom)`: Marcom port — initial marcom domain integration  
  Spec: `docs/superpowers/specs/2026-09-07-marcom-port-design.md`
