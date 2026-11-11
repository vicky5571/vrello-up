# ADR 0052: Inventory Compensation Settlement and Stock Restoration Workflow

- **Status:** APPROVED
- **Date:** 2026-11-06
- **Author:** Senior Software Engineer & Principal Systems Architect

---

## 1. Context & Business Problem

In ADR-0050, Vrello Up introduced an operational inspection workflow for field marketing equipment loans (`BorrowRecord`), establishing multi-unit condition breakdowns (`goodUnits`, `minorDamageUnits`, `majorDamageUnits`, `lostUnits`), atomic stock decommissioning (afkir) for major damage and lost items, and initial compensation tracking (`compensationAmount`, `compensationStatus: "PENDING_SETTLEMENT"`, `compensationNotes`, and `damagePhotos`).

While ADR-0050 successfully closed the loophole of unverified returns and untracked liabilities, an end-to-end operational audit revealed a critical **unfinished lifecycle loop**:

1. **Absence of a Settlement / Resolution Workflow:**  
   Once a loan return records equipment damage or loss, `compensationStatus` is set to `"PENDING_SETTLEMENT"`. Currently, there is **no API endpoint and no UI mechanism** for warehouse staff or administrators to record that the borrower has settled their liability. The loan record permanently displays `"Ganti Rugi: Rp X (Pending)"` in `BorrowDetailModal.tsx`, leaving outstanding liabilities unresolved on company ledgers.

2. **Divergent Real-World Settlement Modes (Cash vs Physical Unit Replacement):**  
   In field marketing operations, liability settlement occurs in two distinct operational forms:
   - **Mode A: Cash / Bank Transfer Reimbursement (`CASH_TRANSFER`):** The borrower pays cash or transfers funds to the company's operational bank account. In this mode, the master equipment inventory remains decommissioned (afkir) because no physical replacement item was introduced; funds are absorbed into company finance.
   - **Mode B: Physical Unit Replacement (`ITEM_REPLACEMENT`):** The borrower purchases an identical replacement item (e.g., replacement Shure wireless microphone or HDMI cable kit) and physically hands it over to the warehouse team. Under ADR-0050, the original unit was subtracted from `totalUnits` upon return. Without an automated stock restoration mechanism, warehouse staff would have to manually navigate to the inventory catalog to increment `totalUnits`—an error-prone decoupling that frequently leads to discrepancies between physical shelf counts and system stock.

3. **Multi-Proof Attachment Requirements:**  
   Settling a liability requires documentary evidence: bank transfer receipts, cash register receipts, store purchase invoices, or photo evidence of physical item handover with serial numbers. The system must support multi-file uploads (`.pdf`, `.jpg`, `.png`) to provide an airtight audit trail.

4. **Strict Four-Eyes Principle Governance:**  
   Under no circumstances may a borrower (`staff`) mark their own liability as resolved. Settlement authority must be strictly restricted to `warehouse` staff (who inspect physical replacements or receipt of funds) and `admin` / `super_admin` roles.

---

## 2. Decision Drivers

1. **Complete Lifecycle Accountability**: Eliminate dead-end liabilities by providing an explicit settlement workflow transitioning `compensationStatus` from `PENDING_SETTLEMENT` to `RESOLVED`.
2. **Unified Single-Form UX**: Handle both cash reimbursement and physical equipment replacement in a single, intuitive modal without multi-screen fragmentation.
3. **Atomic Stock Restoration**: When physical equipment is replaced, automatically restore `totalUnits += replacedUnits` and `availableUnits += replacedUnits` on `InventoryItem` within the same database transaction.
4. **Multi-Proof Documentary Evidence**: Ingest and store 1–5 proof documents/photos (`settlementProofUrls: String[]`) in Supabase Storage with in-app preview.
5. **Strict RBAC (Four-Eyes Principle)**: Block `staff` and `viewer` from resolving liabilities; restrict mutation authority to `warehouse` and `admin`.
6. **Financial Audit Trail**: Capture exact timestamps (`settledAt`), authorizing personnel (`settledBy`), amount resolved (`settledAmount`), and resolution notes (`settlementNotes`).

---

## 3. Options Considered

### Option 1: Unified Settlement Modal with Atomic Stock Restoration & Multi-Proof Deck (Chosen)
* **Architecture**:
  - Add schema fields to `BorrowRecord`:
    - `settlementType: String @default("NONE")` (`"NONE" | "CASH_TRANSFER" | "ITEM_REPLACEMENT"`)
    - `settledAmount: Float @default(0)`
    - `settledAt: DateTime?`
    - `settledBy: String @default("")`
    - `settlementNotes: String @default("")`
    - `settlementProofUrls: String[] @default([])`
  - Mutation Route: `POST /api/marcom/inventory/borrow/[id]/settle`.
  - In `CASH_TRANSFER` mode: validates proof attachment and notes, sets `compensationStatus = "RESOLVED"`, leaves master inventory stocks unchanged.
  - In `ITEM_REPLACEMENT` mode: calculates replaced units per `BorrowItem`, validates physical handover proof, sets `compensationStatus = "RESOLVED"`, and atomically updates `totalUnits += replacedUnits` & `availableUnits += replacedUnits` on each affected `InventoryItem` within `prisma.$transaction`.
  - UI: `BorrowDetailModal.tsx` renders a *"Selesaikan Ganti Rugi"* action button opening `BorrowSettlementModal.tsx` with a mode toggle, multi-file attachment deck, and live breakdown summary.
* **Trade-offs**:
  - *Pros:* Fully unified experience, zero risk of stock desynchronization, complete multi-file audit proof, strict Four-Eyes enforcement.
  - *Cons:* Requires atomic multi-table transaction in backend route handler.

### Option 2: Decoupled Financial-Only Settlement + Manual Master Stock Adjustment
* **Architecture**: Form only records cash payments. If a replacement physical item is handed over, warehouse staff are instructed to manually navigate to the inventory master view and adjust `totalUnits`.
* **Trade-offs**:
  - *Pros:* Simpler backend endpoint touching only `BorrowRecord`.
  - *Cons:* High risk of human error; warehouse staff frequently forget to manually increment master stock, leading to discrepancies between physical shelves and system inventory.

### Option 3: Two-Step Verification (Staff Submission $\rightarrow$ Warehouse Verification)
* **Architecture**: Borrower uploads proof of payment, setting status to `SETTLEMENT_SUBMITTED`, followed by warehouse sign-off.
* **Trade-offs**:
  - *Pros:* Rigid step-by-step audit.
  - *Cons:* Over-engineered bureaucracy for branch office operations where staff and warehouse coordinators settle replacements face-to-face at the equipment counter.

---

## 4. Decision & Explicit Consequences

We choose **Option 1**.

### Explicit Architectural Consequences
1. **Schema Extension (`BorrowRecord`)**: Six new fields persist settlement state and multi-proof URLs.
2. **Atomic Inventory Stock Restoration**: Replaced units immediately restore `totalUnits` and `availableUnits` on `InventoryItem`, ensuring catalog accuracy without manual intervention.
3. **Fail-Closed RBAC**: Settlement endpoint strictly rejects requests from `staff` or `viewer` with `HTTP 403 Forbidden`.
4. **Multi-Proof Upload**: Uses existing Supabase Storage bucket (`inventory-proofs` or `uploads`) with multi-file selection and individual delete capabilities.
5. **Technical Debt / Accepted Consequences**:
   - Partial cash + partial unit replacement is simplified to either cash or unit replacement per settlement event; edge cases where half is paid in cash and half in items can be recorded with explanatory notes under `ITEM_REPLACEMENT`.

---

## 5. Verification & Testing Invariants

1. **RBAC Guard Invariant**: `POST /api/marcom/inventory/borrow/[id]/settle` must reject requests from users with role `staff` or `viewer` with `HTTP 403 Forbidden`.
2. **State Guard Invariant**: Requests to settle a record whose `compensationStatus` is not `"PENDING_SETTLEMENT"` must be rejected with `HTTP 400 Bad Request`.
3. **Proof Verification Invariant**: Settlement requests with zero proof attachments (`settlementProofUrls.length === 0`) must be rejected with `HTTP 422 Unprocessable Entity`.
4. **Stock Math Invariant (`ITEM_REPLACEMENT`)**: In `ITEM_REPLACEMENT` mode, for each item with replaced units, `totalUnits` and `availableUnits` must increase by exactly the number of replaced units, and no stock adjustment may occur in `CASH_TRANSFER` mode.
5. **Non-Negotiable Gates**: `npm run drift:check`, `npm run build:check`, and `npm test` must pass with 0 errors and 0 failures.

---

## 6. Addendum: Storage Infrastructure & Upload Route Alignment (2026-11-11)

In ADR-0052 (Section 4, Item 4), the storage bucket for settlement proofs was projected as `inventory-proofs`. During operational execution under [ADR-0105](0105-multi-photo-direct-upload-for-inventory-damage-inspection.md), the storage architecture was standardized:
- The upload kind `inventory-proofs` is formally registered in `VALID_KINDS` in `/api/marcom/uploads/route.ts`.
- Storage is unified into the `inventory-damage` Supabase Storage bucket under the folder prefix `settlement/`.
- `BorrowSettlementModal.tsx` passes `id: record.id` in `FormData`, applies client-side image compression, and extracts `data.filePath || data.url`.




