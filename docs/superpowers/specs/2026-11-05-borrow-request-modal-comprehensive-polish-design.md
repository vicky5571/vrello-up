# Spec: Comprehensive UX Polish and CustomDropdown Integration for BorrowRequestModal

- **Status:** APPROVED
- **Date:** 2026-11-05
- **Refs:** `docs/adr/0042-borrow-request-modal-comprehensive-polish.md` (ADR-0042)
- **Author:** Senior Software Engineer & Principal Systems Architect

---

## 1. Executive Summary & Goals

This specification defines the comprehensive user experience elevation and architecture standardization of the equipment borrow request modal (`src/components/views/InventoryView/BorrowRequestModal.tsx`). 

### Key Objectives:
1. **Eliminate Native `<select>`:** Standardize the Field Event picker in Step 2 with canonical `CustomDropdown<string>`, adding instant event/branch search filtering and "Clear link" capability.
2. **Streamline Requester Identity:** Auto-populate `borrowerName` from the authenticated session user, eliminating redundant manual typing.
3. **Eliminate Redundant Division Field:** Remove the standalone `borrowerDivision` input field to avoid unnecessary schema migrations and maintain flexibility, safely defaulting to `""` in backend payloads.
4. **Accelerate Equipment Selection:** Add horizontal category quick-filter chips (`All`, `Audio/Visual`, etc.) alongside numeric quantity steppers (`-` / `+`).
5. **Modernize Request Confirmation:** Reorganize Step 4 into a structured 2-column card grouping logistics details vs. item tallies with double-submission protection.

---

## 2. 4-Step Wizard Interaction Flow

### 2.1 Step 1: Requester Details
1. Modal opens; `useSession()` is queried. If `borrowerName` is currently empty, it auto-fills with `session.data?.user?.name || ""`.
2. User can freely edit `borrowerName` (supporting cases where an operator logs a request on behalf of a teammate).
3. User enters optional contact phone/WhatsApp and purpose.
4. Field for `Borrower Division` is removed, reducing visual clutter.
5. User clicks **"Next"** (`handleNext`); validation ensures `borrowerName` is non-empty before advancing.

### 2.2 Step 2: Event & Schedule
1. **Field Event Picker:** Rendered via canonical `CustomDropdown<string>` (`size="md"`).
   - `searchable={true}` with placeholder `"Search field event or branch..."`.
   - Option list includes default `{ value: "", label: "— Standalone / Not linked to Field Event —" }` followed by mapped events:
     `"{event.name} ({event.branchName || 'HQ'} · {formattedDate})"`
   - If an event is selected, an adjacent *"Clear link"* text button appears in the label row to quickly reset to Standalone mode.
   - Selecting an event auto-populates `eventLocation` with `ev.location` if `ev.location` is present.
2. **Schedule Selection:**
   - User sets `borrowDate` and `returnDueDate`.
   - A real-time calculated badge displays duration: `"Duration: N day(s)"`.
   - Validation prevents `returnDueDate < borrowDate`.

### 2.3 Step 3: Equipment Selection
1. **Filtering:** User can filter the catalog by:
   - Text query (`itemSearch`) matching code, name, or category.
   - Horizontal category pill chips (`selectedCategoryFilter: string | "ALL"`), mapped dynamically from SSOT `EQUIPMENT_CATEGORIES`.
2. **Item Row:**
   - Displays code pill, item name, category, and real-time stock status badge (`N available (M total)` in emerald or `Out of Stock` in rose).
   - Quantity control offers decrement (`-`) and increment (`+`) stepper buttons alongside the direct numeric input (`max={item.availableUnits}`).
3. **Selected Items Summary:**
   - Floating tag list displaying chosen items with unit count and immediate `×` removal button.
   - Validation ensures at least 1 item is selected before advancing to Step 4.

### 2.4 Step 4: Review & Submit
1. **Structured 2-Column Summary Card:**
   - *Left Column (Logistics & Schedule):* Borrower Name, Contact, Duration Pill, Location, and Linked Event badge.
   - *Right Column (Equipment Items):* Itemized list with item code, item name, and quantity pill, with a summary footer: `"Total Units: N items across M models"`.
2. **Status Alert:** Amber callout explicitly communicating that the request will be submitted as `PENDING` awaiting warehouse approval.
3. **Submission Guard:** Submit button displays `Loader2` spinner and is disabled while `loading === true` to block double dispatches.

---

## 3. Data Contracts & Architecture Invariants

### 3.1 SSOT Constants & Types
- **Category SSOT:** `EQUIPMENT_CATEGORIES` from `@/components/views/InventoryView/inventoryConstants`.
- **Domain Entity:** `BorrowRecord`, `BorrowItem` from `@/types/index.ts`.
- **Payload Contract:** Dispatched payload to `POST /api/marcom/inventory/borrow`:
  ```typescript
  {
    borrowerName: string;         // non-empty trimmed string
    borrowerPhone: string;        // trimmed string
    borrowerDivision: "";         // constant empty string (preserves backward compatibility)
    eventId: string | null;       // eventId string or null
    eventLocation: string;        // trimmed string
    borrowDate: string;           // ISO YYYY-MM-DD
    returnDueDate: string;        // ISO YYYY-MM-DD
    purpose: string;              // trimmed string
    items: Array<{
      inventoryItemId: string;
      quantity: number;
      conditionOut: "GOOD" | "MINOR_DAMAGE";
      notes?: string;
    }>;
  }
  ```

### 3.2 Component Properties & Wiring
#### CustomDropdown for Field Event:
```tsx
<CustomDropdown<string>
  value={eventId}
  onChange={handleEventChange}
  options={[
    { value: "", label: "— Standalone / Not linked to Field Event —" },
    ...events.map((ev) => ({
      value: ev.id,
      label: `${ev.name} (${ev.branchName || "HQ"}${ev.startDate ? ` · ${ev.startDate.slice(5)}` : ""})`,
    })),
  ]}
  size="md"
  searchable={true}
  searchPlaceholder="Search field event or branch..."
  direction="auto"
  buttonClassName="w-full bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-xs text-left"
  menuClassName="w-full min-w-full max-h-60"
/>
```

### 3.3 Z-Index & Stacking Invariants (ADR-0039 Compliance)
- Modal backdrop resides at `z-50`.
- Open `CustomDropdown` menu resides at `z-50` relative to the modal dialog content, floating above subsequent date inputs.

---

## 4. Pure Logic & Helper Signatures

### 4.1 Duration Calculation Helper
```typescript
export function computeBorrowDurationDays(borrowDate: string, returnDueDate: string): number {
  if (!borrowDate || !returnDueDate) return 0;
  const start = new Date(borrowDate).getTime();
  const end = new Date(returnDueDate).getTime();
  if (isNaN(start) || isNaN(end) || end < start) return 0;
  const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}
```

### 4.2 Enriched Event Option Label Formatter
```typescript
export function formatEventSelectOptionLabel(event: {
  name: string;
  branchName?: string;
  startDate?: string;
}): string {
  const branch = event.branchName || "HQ";
  const dateStr = event.startDate ? ` · ${event.startDate.slice(5)}` : "";
  return `${event.name} (${branch}${dateStr})`;
}
```

---

## 5. Acceptance Criteria & Non-Goals

### Acceptance Criteria
- [ ] Raw HTML `<select>` in `BorrowRequestModal.tsx` is completely eliminated and replaced with `CustomDropdown<string>`.
- [ ] Field event picker supports real-time text search filtering (`searchable={true}`).
- [ ] When linked to a field event, an explicit "Clear link" action is visible to detach back to Standalone.
- [ ] Selecting an event auto-fills `eventLocation` with `ev.location` if present.
- [ ] Active session user name (`session.data?.user?.name`) pre-populates `borrowerName` when empty while remaining manually editable.
- [ ] The `Borrower Division` input field is removed from Step 1 and Step 4 review card.
- [ ] Backend request payload continues to pass `borrowerDivision: ""` for backward compatibility.
- [ ] Step 3 features category quick-filter chips dynamically mapped from `EQUIPMENT_CATEGORIES`.
- [ ] Step 3 quantity controls feature increment/decrement buttons (`+` / `-`) alongside direct numeric input.
- [ ] Step 4 review card presents structured 2-column layout (Logistics vs. Item list with total unit count).
- [ ] Submit button is disabled and displays `Loader2` spinner during asynchronous request.
- [ ] Automated tests in `src/components/views/InventoryView/borrowRequestModal.test.ts` pass 100%.

### Non-Goals
- Altering the Prisma database schema or creating migrations.
- Modifying `model User` or adding division attributes to User Management.
- Modifying backend `/api/marcom/inventory/borrow` route handlers.
- Modifying `ReturnProcessModal.tsx` or other modals in this scope.

---

## 6. Verification Plan

```bash
# Targeted test verifying BorrowRequestModal invariants and CustomDropdown
npx tsx --test src/components/views/InventoryView/borrowRequestModal.test.ts

# Architectural drift verification
npm run drift:check

# TypeScript type check
npm run build:check

# Full smoke and regression test suite
npm run test:smoke
npm test
```


