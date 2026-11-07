# ADR-0087: BorrowRequestModal Step 2 Empty Initial Schedule Dates & Step 3 Mobile Catalog Card Readability

- **Status:** Accepted
- **Date:** 2026-11-08
- **Author:** Critical Senior Software Engineer (Pair Programmer)
- **Deciders:** User & Senior Software Engineer
- **Consulted:** Field Operations Coordinator, Inventory Lead, Mobile UI/UX Team
- **Amends:** ADR-0042, ADR-0055 (`docs/adr/0055-borrow-request-modal-stepper-header.md`)

---

## Context & Business Problem

In `src/components/views/InventoryView/BorrowRequestModal.tsx`, two UX and operational regressions affect the 4-step Equipment Borrow Request wizard (`media_1794081110158_b30c3b2c.jpg` and `media_1794081342515_8e555662.jpg`):

1. **Premature Step 2 Completion Checkmark on Initial Modal Open (`BorrowRequestModal.tsx` lines 60–63)**:
   - `borrowDate` (`new Date().toISOString().slice(0, 10)`) and `returnDueDate` (`+3 days`) are pre-filled immediately when state is initialized.
   - Because `canAdvanceFromBorrowStep(2, data)` in `borrowWizardHelpers.ts` checks `Boolean(data.borrowDate && data.returnDueDate && new Date(data.returnDueDate) >= new Date(data.borrowDate))`, Step 2 immediately evaluates as `completed` (`true`) the instant the modal opens at Step 1.
   - Visually, the Step 2 pill displays a green checkmark (`✓`) before the user has even finished Step 1 or inspected the schedule dates, and makes Step 2 prematurely clickable from the header.
   - Operationally, pre-filling both schedule dates encourages accidental submission of arbitrary default dates instead of deliberate schedule entry.

2. **Severe Mobile Readability Degradation in Step 3 Equipment Catalog (`BorrowRequestModal.tsx` lines 264, 467–557)**:
   - Each catalog row uses a single horizontal flex layout (`p-3 flex items-center justify-between gap-3`) where the left metadata column (`flex-1 min-w-0`) competes for horizontal width with the right-hand quantity stepper (`[-] [0] [+]`, ~104px wide).
   - On a 375px mobile viewport (with `p-4` outer modal padding and `p-6` body padding), only ~155px remains for the left column:
     - **Item Code Badge Wraps into 3 Vertical Lines**: `<span className="font-mono text-[10px] ...">{item.code}</span>` lacks `shrink-0 whitespace-nowrap`, causing codes like `BTH-POP-004` to fracture across hyphens into 3 stacked lines (`BTH-\nPOP-\n004`).
     - **Item Name Truncates to ~12 Characters**: Placed beside the code badge on the same line, equipment names truncate to unreadable fragments (`"Backdrop Pop..."`, `"Meja Lipat Ba..."`, `"Tenda Lipat H..."`), preventing field coordinators from distinguishing equipment sizes or variants.
     - **Category & Stock Metadata Collapses into 4 Cramped Lines**: `"Booth & Staging"` and `"3 available (4 total)"` wrap into multi-line stacks on either side of the separator dot.

---

## Options Considered

### Option 1: Empty Initial `borrowDate` & `returnDueDate` (`""`) + 3-Layer Full-Width Catalog Card Layout in Step 3 (Accepted)
- **Step 2 Initial State & Reset**:
  - Initialize both `borrowDate` and `returnDueDate` to empty strings (`useState("")`).
  - Reset `borrowDate("")` and `returnDueDate("")` inside the `isOpen` `useEffect` when the modal opens.
  - Step 2 remains incomplete (slate step `2` badge, non-clickable ahead of turn) until the user explicitly inputs valid `borrowDate` and `returnDueDate` values.
- **Step 3 Catalog Card Layout & Responsive Modal Padding**:
  - Update modal body padding from `p-6` to `p-4 sm:p-6` to recover 16px of horizontal viewport width on mobile.
  - Add `no-scrollbar` and `shrink-0` to the horizontal category filter chips rail.
  - Restructure each catalog item row from a cramped 2-column horizontal flex row into a clean **3-layer stacked card** (`p-3 flex flex-col gap-2`):
    - **Layer 1 (Top Meta Row)**: Item code badge (`shrink-0 whitespace-nowrap font-mono text-[10px]`) + separator dot + Category name (`truncate text-[11px] text-slate-500`).
    - **Layer 2 (Full-Width Title Row)**: Equipment name spanning 100% of card width with `font-semibold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2` (eliminating 12-character truncation).
    - **Layer 3 (Bottom Action & Stock Bar)**: `flex items-center justify-between gap-2 pt-0.5` with stock availability text (`shrink-0 text-[11px] font-medium`) on the left and the quantity stepper controls (`[-] [0] [+]`, `shrink-0`) on the right.
- *Pros*:
  - Eliminates the premature Step 2 green checkmark with zero extra state complexity while enforcing deliberate schedule input.
  - Guarantees `item.code` never wraps across lines and gives `item.name` nearly 3× more horizontal width on mobile.
  - Keeps stock availability and stepper buttons aligned on a dedicated bottom row with zero text collision.
- *Cons*:
  - Users must explicitly pick both `Borrow Date` and `Return Due Date` in Step 2 (desired operational safeguard).

### Option 2: Keep Default Dates (`today` & `+3 days`) and Track `maxVisitedStep` State
- Retain pre-filled dates and introduce `maxVisitedStep` state so Step 2 only shows a checkmark after Step 2 is visited.
- *Rejected*: Adds state synchronization complexity and still allows operators to gloss over pre-filled dates without deliberate confirmation.

### Option 3: Require `eventLocation` in Step 2 to Gate Completion
- Make `eventLocation` mandatory so Step 2 is incomplete until location is typed.
- *Rejected*: Alters domain validation rules for standalone/internal borrow requests where event location is optional, and still leaves default dates pre-filled.

---

## Trade-Off Matrix

| Dimension | Option 1 (Empty Initial Dates + 3-Layer Card - Accepted) | Option 2 (Default Dates + `maxVisitedStep`) | Option 3 (Require `eventLocation`) |
| :--- | :--- | :--- | :--- |
| **Step 2 Badge Accuracy** | **High (Incomplete until dates are chosen)** | High | Medium |
| **Schedule Data Integrity** | **High (Deliberate date selection required)** | Low (Risk of unreviewed default dates) | Low |
| **Step 3 Mobile Readability** | **High (Full-width title, single-line code, clean bottom bar)** | High (if paired) | High (if paired) |
| **Implementation Simplicity** | **High (Zero extra wizard state)** | Medium (Requires extra step tracking state) | Low (Changes business rules) |

---

## Decision

We accept **Option 1**:
1. In `src/components/views/InventoryView/BorrowRequestModal.tsx`:
   - Initialize `borrowDate` and `returnDueDate` to `""` (`useState("")`), and reset both to `""` when `isOpen` becomes `true` inside `useEffect`.
   - Change modal body padding from `p-6` to `p-4 sm:p-6`.
   - Add `no-scrollbar` and `shrink-0` to the Step 3 category filter chips.
   - Refactor Step 3 catalog item rows into a 3-layer card layout (`flex flex-col gap-2`):
     1. Top row: `item.code` badge (`shrink-0 whitespace-nowrap`) + `item.category` (`truncate`).
     2. Middle row: full-width `item.name` (`font-semibold leading-snug line-clamp-2`).
     3. Bottom row: availability count on the left (`shrink-0`) and `[-][qty][+]` stepper controls on the right (`shrink-0`).
2. In `src/components/views/InventoryView/borrowRequestModal.test.ts`:
   - Add unit test assertions verifying empty initial state for `borrowDate` and `returnDueDate`, responsive `p-4 sm:p-6` modal body padding, `shrink-0 whitespace-nowrap` on the item code badge, and `line-clamp-2` full-width item name rendering.

---

## Consequences

### Positive Consequences
- **Accurate Stepper Progression**: Opening the modal at Step 1 shows Step 2 in its proper inactive state (`2`) until both `Borrow Date` and `Return Due Date` are filled.
- **Crystal-Clear Mobile Equipment Selection**: Field operators can read the full equipment name and single-line item code on 375px screens without horizontal cramping or 3-line badge wrapping.
- **Zero Backend Impact**: API contracts and database schemas remain untouched.

### Negative Consequences / Accepted Technical Debt
- None.

---

## References
- `src/components/views/InventoryView/BorrowRequestModal.tsx`
- `src/components/views/InventoryView/wizard/borrowWizardHelpers.ts`
- `src/components/views/InventoryView/borrowRequestModal.test.ts`
- Spec: `docs/superpowers/specs/2026-11-08-borrow-request-modal-step2-dates-and-step3-readability-design.md`
- Plan: `docs/superpowers/plans/2026-11-08-borrow-request-modal-step2-dates-and-step3-readability.md`


