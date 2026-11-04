# ADR-0025: Complete Elimination of Overengineered Document Status Field Across Database, API, and UI

## Status
ACCEPTED

## Date
2026-11-05

## Context & Problem Statement
In the Marcom Documents & Asset Library (`DocumentItem`), records historically included a `status` field (`"DRAFT" | "ACTIVE" | "ARCHIVED"`).

An architectural evaluation of the codebase reveals that `status` is an orphaned, speculative abstraction (YAGNI violation) copied from transactional workflow entities (such as `Mou`, `ContentPost`, and `FieldEvent`):
1. **No State Machine or Lifecycle**: Unlike `mouMachine.ts` or `eventMachine.ts`, there is no `documentMachine.ts`. A document has no approval gates, no review states, and no state transitions.
2. **Hardcoded and Unused in Filtering**: In `DocumentsView.tsx`, the status filter was permanently hardcoded to `"ALL"` (`const [selectedStatus] = useState<string>("ALL")`). The header toolbar (`DocumentsHeader.tsx`) offers zero status filtering controls. Users have never had the ability to filter or hide documents by status.
3. **No Access Restrictions or Guards**: Documents marked as `DRAFT` were just as downloadable and visible as documents marked as `ACTIVE`.
4. **Taxonomy Incoherence**: In `prisma/seed.ts`, seed records were populated with ad-hoc statuses (`"PUBLISHED"`, `"FINAL"`, `"VERIFIED"`, `"DRAFT"`), completely bypassing the nominal `VALID_DOCUMENT_STATUSES` union (`"DRAFT"`, `"ACTIVE"`, `"ARCHIVED"`).
5. **Cognitive Noise in UI**: Operators uploading a corporate guideline or template were forced to make a meaningless decision in `DocumentCreateModal` and `DocumentDrawer` ("Should this be Draft, Active, or Archived?"), while cards and tables were cluttered with redundant pill badges.

Because Documents functions strictly as a Digital Asset Management (DAM) repository (storing brand guidelines, SOPs, and agreement archives), files either exist in the library or they are deleted. Versioning is already naturally handled by the `period` and `name` attributes (e.g. "Brand Guidelines 2026").

Because this project is in active development and not yet used operationally in production, the user confirmed that **zero backward compatibility compromises are needed**. Rather than maintaining zombie database columns or defaulting fields in API adapters, the system should eliminate `status` completely from the root database schema to the UI presentation layer.

## Options Considered

### Option A: Complete Database & Full-Stack Elimination (SELECTED)
- Drop `status` column from `model DocumentItem` in `prisma/schema.prisma`.
- Generate clean Prisma migration (`drop_document_item_status`).
- Update `prisma/seed.ts` to remove all `status` fields from document seeding, and re-run seed.
- Delete obsolete helper `src/lib/marcom/documentTaxonomy.ts` and its test `src/lib/marcom/documentTaxonomy.test.ts`.
- Clean API routes: Remove `status` from POST create, PATCH update, and validation checks.
- Clean SSoT types: Remove `DocumentStatus` and `status` from `src/types/index.ts`.
- Clean UI:
  - Remove status controls from `DocumentDrawer.tsx` and `DocumentCreateModal.tsx`.
  - Remove status badge from `DocumentCardsView.tsx`.
  - Remove status column and dead `selectedStatus` state from `DocumentsView.tsx`.
  - Convert the 3rd KPI card from "Dokumen Aktif" to "Ragam Kategori" (`categoryCount`).
  - Eliminate confusing legacy `Drive / Cloud` and `Server Local` storage indicator badges from card footers and table rows (all files stream to Supabase Storage; internal storage mechanics are irrelevant to end users).
- **Trade-off Summary**:
  - *Engineering Cleanliness*: Maximum. 100% debt-free. Eliminates dead code, unused types, phantom DB columns, and misleading legacy storage labels.
  - *Data Integrity*: 100% consistency across Prisma schema, TypeScript SSoT types, API contracts, seed data, and UI.
  - *Operational Complexity*: Requires running `npx prisma migrate dev` and `npx prisma db seed`. Safe because the system has no production operational traffic.

### Option B: Eliminate from UI Only, Retain Zombie Column in Database
- Remove status from UI components only, while leaving `status String @default("DRAFT")` in PostgreSQL and defaulting it to `"ACTIVE"` in API handlers.
- **Trade-off Summary**:
  - Unnecessary technical debt. Leaves a ghost column in PostgreSQL and requires artificial defaulting code in perpetuity. Rejected by explicit user directive.

### Option C: Retain Status Quo and Build Document Workflow Machine
- Implement formal approval stages, reviewer assignment, and draft hiding for static files.
- **Trade-off Summary**: Severe overengineering. Static assets (brand guidelines, logo kits, MoU scans) do not need multi-tier approval states.

## Decision
We choose **Option A (Complete Database & Full-Stack Elimination)**.
We drop `status` from `model DocumentItem` in Prisma, generate a clean migration, clean `prisma/seed.ts`, delete `documentTaxonomy.ts`, remove `DocumentStatus` from `src/types/index.ts`, clean API routes, remove all status elements from UI components, and re-seed the database.

## Detailed Consequences & Technical Debt Management

### Positive Consequences
- **True YAGNI Architecture**: Zero orphaned status concepts, zero dead state machines.
- **SSoT Purity**: Canonical `DocumentItem` in `src/types/index.ts` accurately mirrors `model DocumentItem` in `schema.prisma`.
- **Zero Cognitive Load for Operators**: Creating or editing documents focuses entirely on Name, Category, Period, Branch, PIC, and File Link/Upload.
- **Modernized Documents KPI Row**: The 3rd KPI card shifts from meaningless "Dokumen Aktif (4 Aktif · 0 Draft)" to actionable "Penyimpanan Cloud" (`cloudDocsCount` vs `localDocsCount`), giving visibility into Google Drive vs local storage assets.
- **Clean Seed Data**: `prisma/seed.ts` contains only valid, schema-compliant fields without ad-hoc statuses like `PUBLISHED` or `VERIFIED`.

### Negative Consequences / Accepted Trade-offs
- **Migration & Re-seed Execution**: Requires applying migration and re-seeding the development database. Explicitly approved as safe.

## Invariant Compliance
- [x] Single-tenant invariant preserved (no workspace fields).
- [x] SSoT enforced: `DocumentItem` strictly defined in `src/types/index.ts` with no duplicate inline types.
- [x] Coordinator LOC: `DocumentsView.tsx` remains ~390 LOC (modularized and clean).
- [x] Non-negotiable gates: `npm run drift:check`, `npm run build:check`, and `npm test` must all pass.


