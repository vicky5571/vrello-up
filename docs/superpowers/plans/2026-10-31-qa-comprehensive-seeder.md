# Implementation Plan — QA Comprehensive Seeder (`prisma/seed.ts`)

**Date:** 2026-10-31  
**Spec:** `docs/superpowers/specs/2026-10-31-qa-comprehensive-seeder-design.md`  
**Status:** COMPLETED  

---

## 1. Goal

Rewrite `prisma/seed.ts` as a self-contained, deterministic database seeder with atomic cleanup, realistic Indonesian corporate test vectors, and full "what if" QA scenarios across all operational domains.

---

## 2. File Manifest

| File | Purpose | LOC Est. |
|---|---|---|
| `prisma/seed.ts` | Complete rewritten seeder with clean reset and sectioned subroutines | ~600 - 800 LOC |
| `docs/superpowers/specs/README.md` | Index update | +1 |
| `docs/superpowers/plans/README.md` | Index update | +1 |

---

## 3. Phased Implementation Roadmap

### Phase 1 — Database Reset & Clean Protocol
- [x] Add `cleanDatabase(prisma: PrismaClient)` subroutine deleting all records in reverse foreign-key topological order.
- [x] Verify clean delete operates without foreign key constraint violations.

### Phase 2 — Auth Users & Role Matrix (`User`)
- [x] Seed 6 realistic accounts with bcrypt hash (`changeme123`):
  - 1 Super Admin (`admin@vrelloup.dev`, `ADMIN`, `APPROVED`)
  - 2 Operational Staff (`staff.budi@vrelloup.dev`, `staff.dewi@vrelloup.dev`, `STAFF`, `APPROVED`)
  - 1 Read-only Viewer (`viewer.hendra@vrelloup.dev`, `VIEWER`, `APPROVED`)
  - 1 Pending Registration (`pending.siti@vrelloup.dev`, `STAFF`, `PENDING`)
  - 1 Rejected Registration (`rejected.agus@vrelloup.dev`, `STAFF`, `REJECTED`)

### Phase 3 — Master Data: Materials, Branches & Outlets
- [x] Seed 7 POSM materials (`requiresMou: true/false`).
- [x] Seed 12 primary branches spanning Central Java, DIY, West Java, East Java, Bali.
- [x] Seed realistic retail outlets covering:
  - 4 store types (`TRADITIONAL`, `MODERN_RETAIL`, `EXCLUSIVE`, `CAMPUS_OUTLET`).
  - 4 approval statuses (`APPROVED`, `PENDING_APPROVAL`, `DRAFT`, `REJECTED` with reason).
  - 1 cold/orphan outlet with zero operational activities.
  - 1 inactive outlet (`active: false`).

### Phase 4 — MoUs & Placements Funnel
- [x] Seed MoUs with dynamic relative dates (`now = Date.now()`):
  - Expired MoU (`now - 45 days`) triggering SLA critical.
  - Expiring soon MoU (`now + 8 days`) triggering SLA warning.
  - Pending approval contract aging >60 days.
  - Draft contract with Rp 0 value.
  - Rejected contract with finance disapproval reason.
  - High-value flagship contract (Rp 150.000.000).
- [x] Seed POSM Placements:
  - Healthy completed placements with coordinates and photos.
  - Geolocation anomaly (1.450m deviation, `isLocationValid: false`).
  - Installation blocked with `ISSUE` status and vendor issue notes.
  - In-progress placement without coordinates (`latitude: null`).
  - Permanent material without approved MoU.
  - Extreme dimension installation (`1200 x 400 cm`).

### Phase 5 — Inventory & Borrow Logistics
- [x] Seed 13 equipment items across 5 categories (`AVAILABLE`, `BORROWED`, `MAINTENANCE`, `RETIRED`).
- [x] Seed Borrow Records & Junction Items:
  - `OVERDUE` borrow attached to field event.
  - `ACTIVE` borrow with decremented available units.
  - `PENDING` borrow awaiting admin approval.
  - `RETURNED` check-in with `MAJOR_DAMAGE` and `LOST` equipment.

### Phase 6 — Field Events, Footage, Content Posts & Reports
- [x] Seed field events (`UPCOMING`, `ON_PROGRESS`, `COMPLETED` with footage, `CANCELLED`).
- [x] Seed content posts (`PUBLISHED`, `REVISION_NEEDED` with subtasks, `SCHEDULED`, `IN_REVIEW`).
- [x] Seed document items with varied extensions and file sizes (.pdf, .zip 88.5MB, .docx, .csv).
- [x] Seed monthly reports with rich JSON structures.

### Phase 7 — Verification & Benchmarking
- [x] Run `npx tsx prisma/seed.ts` and confirm execution in < 10 seconds (~0.5s achieved).
- [x] Verify seed idempotence by running twice sequentially without error.
- [x] Run `npm run drift:check` → Pass.
- [x] Run `npm run build:check` → Pass.
- [x] Run `npm test` → Pass (591 passed, 0 failed).
