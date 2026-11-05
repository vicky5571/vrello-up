# ADR 0053: Outlet Soft-Delete Architecture and Database Restrict Protection

- **Status:** APPROVED
- **Date:** 2026-11-06
- **Author:** Senior Software Engineer & Principal Systems Architect

---

## 1. Context & Business Problem

In Vrello Up's marketing operations architecture, partner retail stores (`Outlet`) serve as the primary physical anchor for operational activities:
- Promotional physical asset placements (`Placement`), carrying substantial financial production and installation expenditure (`cost: Float`) and physical proof photos (`photoUrl: String`).
- Legal commercial agreements (`Mou`), defining lease terms and partner compensation.
- Field marketing events (`FieldEvent`) and local media campaigns (`ContentPost`).

A critical vulnerability exists in the current Prisma schema and deletion route handlers:

1. **Catastrophic Cascade Deletion (`onDelete: Cascade`):**  
   In `prisma/schema.prisma`, the relation between `Placement` and `Outlet` is defined with `onDelete: Cascade`:
   ```prisma
   model Placement {
     outletId String
     outlet   Outlet @relation(fields: [outletId], references: [id], onDelete: Cascade)
   }
   ```
   When an administrator deletes an outlet (via single-delete `DELETE /api/marcom/outlets/[id]` or batch-delete `DELETE /api/marcom/outlets`), PostgreSQL automatically deletes all linked `Placement` records permanently from the database.

2. **Severe Financial Audit & Reporting Corruption:**  
   In enterprise marketing, POSM installations represent real capital expenditure (Capex/Opex) that has already been executed, verified, and audited by regional management. If a partner kiosk closes down or terminates cooperation, deleting that store permanently deletes all historical placement records and costs. Consequently, past quarterly executive reports (e.g. Q1 2025 financial recaps in `QuarterlyPosmReportTab` and `PosmEconomicsChart`) experience retroactive cost distortion, artificially decreasing historical expenditures and violating corporate compliance audit requirements.

3. **Orphaned Legal Contracts:**  
   In `model Mou`, the relation `outlet Outlet? @relation(..., onDelete: SetNull)` sets `outletId = null` upon store deletion, severing legal agreements from their physical store entity.

4. **Business Reality: Retail Stores are Deactivated, Never Physically Erased:**  
   In physical retail operations, a store that stops partnering or shuts down is **inactive or closed (`active: false`)**, not non-existent. Historical evidence that the company spent Rp 15.000.000 on a facade billboard at that physical location must be permanently preserved. Even when an operator clicks *"Hapus Toko"* in the UI, the system must never execute a physical `DELETE` statement on master operational entities.

---

## 2. Decision Drivers

1. **Absolute Financial & Audit Integrity**: Historical placement expenditures (`cost`), installation photos (`photoUrl`), and legal contracts must never be permanently deleted or unlinked by user action.
2. **Zero Physical Hard-Deletes**: Deleting an outlet must execute a soft-delete under the hood, regardless of UI phrasing.
3. **Defense-in-Depth Database Protection**: Change foreign key constraints on `Placement` to `onDelete: Restrict` so the PostgreSQL database engine itself physically blocks any unintended raw SQL hard-deletes.
4. **Clean Daily Operational UX**: Soft-deleted outlets must be immediately excluded from standard active tables, KPI calculations, and operational comboboxes (Placements, MoUs, Events, Content Planner).
5. **Clear Separation of Store States**: Establish unambiguous state differentiation between:
   - *Active Store* (`active: true, deletedAt: null`)
   - *Temporarily Inactive Store* (`active: false, deletedAt: null`)
   - *Soft-Deleted Store* (`active: false, deletedAt: DateTime`)

---

## 3. Options Considered

### Option 1: Strict Soft-Delete (`deletedAt: DateTime?`) + Database Foreign Key `onDelete: Restrict` (Chosen)
* **Architecture**:
  - Add `deletedAt DateTime?` to `model Outlet` in `prisma/schema.prisma`.
  - Add index `@@index([deletedAt])` on `model Outlet`.
  - Update `model Placement`: change `onDelete: Cascade` to `onDelete: Restrict`.
  - Update `DELETE /api/marcom/outlets/[id]` and `DELETE /api/marcom/outlets` (batch):
    - Replace `prisma.outlet.delete()` and `deleteMany()` with `update` and `updateMany`, setting `{ deletedAt: new Date(), active: false }`.
  - Update query filters in `src/app/api/marcom/outlets/outletsSearchFilter.ts`:
    - Automatically append `where.deletedAt = null` for all standard searches.
  - Update operational work item forms:
    - Search comboboxes (`OutletSearchCombobox.tsx`, `EventCreateModal.tsx`, `MouFormModal.tsx`, etc.) query `{ status: "APPROVED", active: true, deletedAt: null }`.
* **Trade-offs**:
  - *Pros:* Enterprise gold standard. Completely eliminates accidental data destruction; historical financial and audit reports remain 100% stable; database constraint blocks rogue raw SQL queries; soft-deleted stores vanish cleanly from daily view.
  - *Cons:* Requires updating outlet search where builder to ensure soft-deleted stores do not leak into active queries.

### Option 2: Boolean Soft-Delete via Existing `active: Boolean` Field
* **Architecture**: Avoid adding new schema fields; when user clicks delete, API sets `active = false`.
* **Trade-offs**:
  - *Pros:* No schema migration.
  - *Cons:* Blurs the distinction between a store temporarily closed by its owner (`active = false`) and a store deliberately deleted by an administrator; lacks timestamp metadata on when deletion occurred.

### Option 3: Hard-Delete Blocking via Error Rejection (No Soft-Delete)
* **Architecture**: Set foreign key to `Restrict`. When admin clicks delete, API returns `HTTP 409 Conflict`, forcing the admin to manually toggle off `active` in the edit form.
* **Trade-offs**:
  - *Pros:* Simple backend logic.
  - *Cons:* Poor user experience; every delete attempt on operational stores fails with an error popup, frustrating users.

---

## 4. Decision & Explicit Consequences

We choose **Option 1**.

### Explicit Architectural Consequences
1. **Schema Extension (`Outlet`)**: `deletedAt DateTime?` added with index.
2. **Database Engine Hardening**: `Placement.outlet` relation changed to `onDelete: Restrict`, physically preventing cascade deletion.
3. **Soft Mutation API Contract**: Single and batch `DELETE` endpoints update `deletedAt` and set `active: false`.
4. **Permanent Audit Preservation**: All past placement records, photos, costs, and MoUs remain permanently queryable for quarterly reports, analytics charts, and historical audits.
5. **Technical Debt / Accepted Consequences**:
   - Soft-deleted outlets retain their unique `code` in the database. In practice, outlet codes are generated with incrementing sequences or timestamp suffixes, avoiding code collision.

---

## 5. Verification & Testing Invariants

1. **Soft-Delete Invariant**: Calling `DELETE /api/marcom/outlets/[id]` must NOT delete the outlet row from the database; it must set `deletedAt` to a valid timestamp and `active = false`.
2. **Placement Preservation Invariant**: When an outlet is soft-deleted, all linked `Placement` records must remain completely intact in the database with unchanged `cost`, `photoUrl`, and `status`.
3. **Daily Query Exclusion Invariant**: Calling `GET /api/marcom/outlets` must exclude all outlets where `deletedAt != null` by default.
4. **Operational Selection Exclusion Invariant**: In operational form queries (POSM, MoU, Events, Content), soft-deleted and inactive outlets must not be returned.
5. **Database Constraint Invariant**: Attempting to execute a physical SQL `DELETE FROM "Outlet"` on an outlet with linked placements must be blocked by the PostgreSQL foreign key `Restrict` constraint.
6. **Non-Negotiable Gates**: `npm run drift:check`, `npm run build:check`, and `npm test` must pass with 0 errors and 0 failures.



