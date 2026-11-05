# ADR 0050: Warehouse Role and Return Inspection Compensation Workflow

- **Status:** APPROVED
- **Date:** 2026-11-06
- **Author:** Senior Software Engineer & Principal Systems Architect

---

## 1. Context & Business Problem

In Vrello Up's marcom and field operations architecture, the **Field Event Inventory & Equipment Borrowing System** manages physical operational assets (e.g., promotional folding tents, sound systems, wireless walkie-talkies, banner stands, generators) loaned to field staff for activations and partner store events.

A critical operational and governance audit revealed five interlocking technical and procedural vulnerabilities in the current codebase:

1. **Flawed Availability Restoration for Broken Assets:**  
   In `src/app/api/marcom/inventory/borrow/[id]/return/route.ts`, when an item is returned with `conditionIn === "MAJOR_DAMAGE"`, the system erroneously increments `availableUnits` on the master `InventoryItem` and marks the item as `AVAILABLE`. Consequently, unusable, broken equipment is returned to active stock, where subsequent event teams mistakenly reserve it.

2. **Absence of Multi-Unit Condition Breakdown:**  
   Equipment is frequently borrowed in batches (e.g., 10 HTs or 4 tents). In `BorrowItem`, a single row holds a bulk `quantity` and a single `conditionIn` enum. If 8 units return in good condition, 1 is damaged, and 1 is lost, the logistics officer cannot record mixed outcomes. The system forces an all-or-nothing classification.

3. **Permanent Ghost Inventory on Lost Assets:**  
   When an item is returned as `LOST`, the return endpoint skips incrementing `availableUnits`, but leaves `totalUnits` unchanged. Because no active borrow records remain, the item appears perpetually borrowed (`totalUnits - availableUnits > 0`), causing permanent data drift in physical asset audits.

4. **Zero Financial Liability & Evidence Tracking (Ganti Rugi):**  
   The current return flow lacks any mechanism to record financial compensation, fine amounts, replacement commitments, or physical damage evidence (photos). When an expensive asset is lost or destroyed through field negligence, the borrow record simply flips to `RETURNED`, concealing open financial liabilities.

5. **Violation of Segregation of Duties (Four-Eyes Principle):**  
   Under current centralized RBAC (`src/lib/marcom/guards.ts`), `staff` holds `PROCESS_RETURN` and `MANAGE_INVENTORY`. Field staff who borrow equipment can self-inspect and process their own returns. Furthermore, dedicated warehouse/logistics personnel do not have a specialized role; granting them admin or supervisor roles introduces privilege creep into legal MoUs, store master data, and promotional placements.

To protect physical assets, ensure accurate warehouse stock, and establish clear operational accountability, the organization requires a dedicated **`WAREHOUSE` role** with scoped CUD access strictly isolated to the Inventory subsystem, combined with a comprehensive **Return Inspection, Multi-Condition Breakdown, and Compensation Settlement Workflow**.

---

## 2. Decision Drivers

1. **Physical Asset & Stock Integrity**: `availableUnits` must only include immediately borrowable, functional gear. Units with `MAJOR_DAMAGE` or `LOST` must never be returned to active inventory without explicit repair/replacement.
2. **Multi-Unit Inspection Realism**: Field logistics operations need the ability to record mixed condition counts on a single borrow line (e.g. 10 units = 8 Good, 1 Damaged, 1 Lost).
3. **Traceable Financial Liability (Ganti Rugi)**: An unambiguous record of damages, estimated compensation amount (IDR), settlement method (Cash/Transfer or Unit Replacement), proof photos, and status (`PENDING_SETTLEMENT` vs `RESOLVED`).
4. **Segregation of Duties (Four-Eyes Principle)**: Field staff must not inspect or approve their own borrowing returns. Only authorized logistics officers (`warehouse`), branch managers (`supervisor`), or system administrators (`admin`) can process returns.
5. **Strict RBAC Boundary Enforcement**: The `warehouse` role must possess full Create-Update-Delete (CUD) capabilities within Equipment Inventory, but strictly **Read-Only / No-CUD** access in all other business domains (MoU, Placements, Outlets, Events, Content Planner, Documents, Reports, and Users).

---

## 3. Options Considered

### Option 1: Unified Architecture — Scoped `WAREHOUSE` Role + In-Place Return Inspection & Compensation (Chosen)
- **Role & RBAC**:
  - Add `WAREHOUSE` to Prisma `DbUserRole` enum.
  - In `src/lib/marcom/guards.ts`: Grant `VIEW_INVENTORY`, `MANAGE_INVENTORY`, `REQUEST_BORROW`, `APPROVE_BORROW`, `PROCESS_RETURN` to `warehouse`.
  - Strip `MANAGE_INVENTORY` and `PROCESS_RETURN` from `staff` (staff retains only `REQUEST_BORROW`).
  - Bar `warehouse` from all non-inventory write permissions (`CREATE_MOU`, `CREATE_PLACEMENT`, `CREATE_EVENT`, `UPLOAD_DOCUMENT`, `SUBMIT_DRAFT_OUTLET`, etc.).
- **Data Model**:
  - `BorrowItem`: Add breakdown columns `goodUnits Int @default(0)`, `minorDamageUnits Int @default(0)`, `majorDamageUnits Int @default(0)`, `lostUnits Int @default(0)`.
  - `BorrowRecord`: Add `compensationAmount Float @default(0)`, `compensationStatus String @default("NONE")` (`NONE`, `PENDING_SETTLEMENT`, `RESOLVED`), `compensationNotes String @default("")`, `damagePhotos String[] @default([])`.
  - Status transition: When returned with issues, status becomes `RETURNED` with `compensationStatus = "PENDING_SETTLEMENT"`, or a distinct badge in the UI.
- **Stock Arithmetic**:
  - `availableUnits += (goodUnits + minorDamageUnits)`.
  - `majorDamageUnits`: Treated as decommissioned/afkir for now (decrements `totalUnits` from active circulation, flagged as tech-debt for future maintenance module).
  - `lostUnits`: Decrements `totalUnits` to maintain physical balance without ghost borrows.
- **Pros**:
  - Solves the entire operational problem in one single clean Prisma migration.
  - Enforces strict segregation of duties without touching other business domains.
  - Zero ghost borrows and zero broken equipment leaked back into active circulation.
- **Cons**:
  - Requires updating Prisma schema, NextAuth role definitions, and the return modal UI.

### Option 2: Phased Architecture — Two Consecutive ADRs & Migrations
- **Phase 1 (ADR-0050)**: Create `WAREHOUSE` role and configure guards.
- **Phase 2 (ADR-0051)**: Refactor return inspection modal, quantity breakdown, and compensation tracking.
- **Pros**: Smaller cognitive surface area per document.
- **Cons**: Unnecessary database migration churn (running `prisma db push` twice for the same subsystem); leaves the broken asset stock leak unresolved until Phase 2 is finished.

### Option 3: Full Enterprise Invoicing & Finance ERP Integration
- **Flow**: Generates formal corporate debit notes/invoices with virtual account billing, finance department approvals, and automated bank reconciliation.
- **Pros**: End-to-end financial audit trail.
- **Cons**: Severe over-engineering for regional field marketing operations; introduces extreme friction to quick warehouse check-ins.

---

## 4. Deep Trade-Off Matrix

| Evaluation Dimension | Option 1: Unified Architecture (Chosen) | Option 2: Phased Architecture | Option 3: Enterprise ERP Invoicing |
| :--- | :--- | :--- | :--- |
| **Business & Operational Continuity** | **High**: Solves physical stock drift and liability tracking in a single release. Warehouse staff receive an immediate, functional workflow. | **Medium**: Delayed resolution of stock leak; creates temporary inconsistencies between role rollout and UI capability. | **Low**: High operational friction; warehouse staff blocked by corporate finance approval chains. |
| **Engineering Cost & Complexity** | **Moderate**: Single atomic Prisma migration, scoped guard changes, and updated return modal. | **High**: Duplicate migration cycles, multiple spec/plan pairs for the same core subsystem. | **Very High**: New billing tables, external payment/invoice integration, multi-role approval state machines. |
| **Data Integrity & Stock Precision** | **Exact**: `availableUnits` and `totalUnits` mathematically match physical storage. Ghost borrows eliminated. | **Partial**: Stock drift persists until second phase is completed. | **Exact**: Highly detailed, but prone to human bypass when operators avoid slow forms. |
| **RBAC Security & Boundary** | **Airtight**: `warehouse` has zero write access outside Inventory. Staff cannot self-inspect returns. | **Airtight**: Same security model, but delivered in fragments. | **Complex**: Multi-department role dependencies increase risk of configuration error. |

---

## 5. Decision & Explicit System Architecture

We adopt **Option 1: Unified Architecture — Scoped `WAREHOUSE` Role + In-Place Return Inspection & Compensation Tracking**.

### 5.1 RBAC & Role Boundaries (`guards.ts` & `schema.prisma`)
1. **New Database Enum**: Add `WAREHOUSE` to `enum DbUserRole` in `prisma/schema.prisma`.
2. **SSOT Role Typing**: Add `"warehouse"` to `MarcomRole` and `UserRole` in `src/types/index.ts`.
3. **Role Permissions Matrix (`guards.ts`)**:
   - `warehouse` role permissions:
     - `VIEW_INVENTORY`
     - `MANAGE_INVENTORY`
     - `REQUEST_BORROW`
     - `APPROVE_BORROW`
     - `PROCESS_RETURN`
   - Explicitly **excluded** from `warehouse`:
     - `CREATE_MOU`, `APPROVE_MOU`, `DELETE_MOU`
     - `CREATE_PLACEMENT`, `UPDATE_PLACEMENT`
     - `CREATE_EVENT`, `UPLOAD_VIDEO_FOOTAGE`
     - `UPLOAD_DOCUMENT`, `DELETE_DOCUMENT`
     - `SUBMIT_DRAFT_OUTLET`, `APPROVE_OUTLET`
     - `MANAGE_MASTER_DATA`, `EXPORT_REPORTS`
4. **Enforcing Four-Eyes Principle on `staff`**:
   - Remove `PROCESS_RETURN` and `MANAGE_INVENTORY` from `rolePermissions.staff`.
   - Field staff may only submit borrow requests (`REQUEST_BORROW`); they cannot approve requests or conduct return inspections on equipment.

### 5.2 Database Schema Enhancements (`prisma/schema.prisma`)
1. **`BorrowItem` Multi-Condition Breakdown**:
   ```prisma
   model BorrowItem {
     id                 String              @id @default(cuid())
     borrowRecordId     String
     borrowRecord       BorrowRecord        @relation(fields: [borrowRecordId], references: [id], onDelete: Cascade)
     inventoryItemId    String
     inventoryItem      InventoryItem       @relation(fields: [inventoryItemId], references: [id])
     quantity           Int                 @default(1)
     conditionOut       EquipmentCondition  @default(GOOD)
     conditionIn        EquipmentCondition? // Dominant/fallback condition
     goodUnits          Int                 @default(0)
     minorDamageUnits   Int                 @default(0)
     majorDamageUnits   Int                 @default(0)
     lostUnits          Int                 @default(0)
     notes              String              @default("")

     @@index([borrowRecordId])
     @@index([inventoryItemId])
   }
   ```
2. **`BorrowRecord` Compensation & Damage Evidence**:
   ```prisma
   model BorrowRecord {
     // ... existing fields ...
     compensationAmount Float    @default(0)
     compensationStatus String   @default("NONE") // "NONE" | "PENDING_SETTLEMENT" | "RESOLVED"
     compensationNotes  String   @default("")
     damagePhotos       String[] @default([])
     // ...
   }
   ```

### 5.3 Stock Balancing Arithmetic (`return/route.ts`)
For each item in the return payload:
1. **Validation**: Assert `goodUnits + minorDamageUnits + majorDamageUnits + lostUnits === bi.quantity`.
2. **Restoration**:
   - `restoredAvailable = goodUnits + minorDamageUnits` (usable items returned to storage).
   - `writeOffUnits = majorDamageUnits + lostUnits` (unusable or missing assets).
3. **Master Catalog Update (`InventoryItem`)**:
   - `availableUnits = Math.min(inv.totalUnits - writeOffUnits, inv.availableUnits + restoredAvailable)`.
   - `totalUnits = Math.max(0, inv.totalUnits - writeOffUnits)`.
   - `status = availableUnits > 0 ? AVAILABLE : (totalUnits > 0 ? BORROWED : RETIRED)`.
4. **Compensation Flagging**:
   - If `writeOffUnits > 0` and `compensationStatus === "NONE"`, automatically set `compensationStatus = "PENDING_SETTLEMENT"`.

### 5.4 Return Inspection Modal Elevation (`ReturnProcessModal.tsx`)
1. Multi-unit quantity breakdown fields per borrowed item with instant mathematical sum validation.
2. Photo upload section for physical damage proof (supporting image upload via `/api/marcom/uploads?kind=inventory-damages`).
3. Compensation liability inputs:
   - Estimasi Nilai Ganti Rugi (Rp)
   - Metode Ganti Rugi (Penggantian Unit / Potong Biaya / Transfer)
   - Status Ganti Rugi toggle (`PENDING_SETTLEMENT` vs `RESOLVED`).

---

## 6. Explicit Consequences & Technical Debt Recording

### Consciously Accepted Trade-offs:
1. **Immediate Decommissioning (Afkir) of Damaged Goods**:
   - Rather than maintaining an intermediate "Under Repair" holding state, `majorDamageUnits` are written off from `totalUnits` immediately to ensure active stock count accuracy.
   - **Technical Debt Recorded (TD-005 - Asset Maintenance Lifecycle)**: In a future iteration, if the company contracts an external repair service, a dedicated `AssetRepairRecord` state machine can be introduced to route broken items from `MAINTENANCE` back into `totalUnits`.
2. **Database Migration Requirement**:
   - Requires generating and applying a Prisma migration for `DbUserRole.WAREHOUSE` and the new columns on `BorrowItem` and `BorrowRecord`.

---

## 7. Verification Invariants

Before marking this architectural decision implemented, the following verification gates must pass:
1. `guards.test.ts`: Verify `hasPermission("warehouse", "CREATE_MOU") === false` and `hasPermission("staff", "PROCESS_RETURN") === false`.
2. `inventoryApi.test.ts`: Verify return arithmetic with mixed conditions (e.g. 10 units = 8 good, 1 major damage, 1 lost), confirming `totalUnits` is decremented by 2 and `availableUnits` incremented by 8.
3. `drift:check`: Full architectural invariant and spec-plan pairing verification.
4. `build:check`: Clean TypeScript compilation with 0 errors.
5. `npm test`: Full test suite passes with 0 failures.



