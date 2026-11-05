# ADR-0042: Comprehensive UX Polish and CustomDropdown Integration for BorrowRequestModal

- **Status:** APPROVED
- **Date:** 2026-11-05
- **Deciders:** Senior Software Engineer, Principal Systems Architect, Product Owner
- **Consulted:** Marcom Lead, Operations Coordinator, Field Activation Supervisor
- **Informed:** Core Development Team

## 1. Context & Business Problem

The Equipment Borrowing flow in Vrello Up (`src/components/views/InventoryView/BorrowRequestModal.tsx`) serves as the operational gateway for field marketing teams to check out physical assets (tents, AV equipment, generators, folding chairs) for branch events and roadshows.

While functional, the current 4-step wizard exhibits several operational bottlenecks and design discrepancies:
1. **Unstyled Native OS Select on Step 2 (Event Linking):** The event picker uses a raw HTML `<select>`, rendering an unstyled Aqua popover on macOS without search capabilities, causing friction as the number of field events grows across branches.
2. **Missing Search & Category Filtration on Step 3 (Item Selection):** Step 3 offers only a raw text input for catalog filtering without category quick-filter chips (`Audio/Visual`, `Staging/Booth`, etc.), forcing field coordinators to manually type category names or scroll through all available inventory.
3. **Manual Requester Re-entry & Redundant Division on Step 1:** Users frequently must type their own full name and phone number repeatedly despite being authenticated in the application, while the division field was unstandardized and disconnected from user management.
4. **Suboptimal Review Legibility on Step 4:** The confirmation step uses a basic vertical block lacking structured modular grouping between logistics, schedule, and equipment tallies.

## 2. Options Considered

### Option 1: Focused CustomDropdown Replacement (Event Link Only)
- **Concept:** Replace only the native `<select>` in Step 2 with `CustomDropdown`.
- **Trade-offs:**
  - *Pros:* Smallest LOC footprint.
  - *Cons:* Leaves Step 1 (re-typing data), Step 3 (no category filters), and Step 4 (basic review) unimproved, requiring subsequent polish passes.

### Option 2: CustomDropdown + Enriched Event Labels & Clear Button
- **Concept:** Enhance Step 2 with formatted dates/branches in options and a clear link button, leaving Steps 1, 3, and 4 as-is.
- **Trade-offs:**
  - *Pros:* Improves event linking UX.
  - *Cons:* Ignores item selection friction on Step 3, which is the primary operational task in the modal.

### Option 3: Comprehensive 4-Step Wizard Polish & CustomDropdown Integration — [CHOSEN]
- **Concept:** Deliver an end-to-end UX elevation across all 4 steps of `BorrowRequestModal.tsx`:
  - **Step 1 (Requester):** Intelligent auto-population of `borrowerName` from active session user (`session?.user?.name`) while preserving manual editability; clean input icons and helper microcopy. Eliminate the redundant/unsupported `borrowerDivision` input field to avoid unnecessary user schema expansion while defaulting to `""` in backend payload.
  - **Step 2 (Schedule & Event):** Standardize with canonical `CustomDropdown<string>` (`size="md"`), real-time event/branch search (`searchable={true}`), enriched event labels (`Event Name (Branch · Date)`), dedicated "Clear link" action, and real-time duration counter pill (e.g. "3 days").
  - **Step 3 (Item Selection):** Add horizontal Category quick-filter chips (`All`, `Audio/Visual`, `Staging/Booth`, etc.) alongside text search, clearer stock availability badges, and numeric stepper buttons (`+` / `-`).
  - **Step 4 (Review):** Modular 2-column recap card grouping Requester & Logistics vs. Equipment Item tallies, with high-visibility pending approval notice and double-submission protection.
- **Trade-offs:**
  - *Business & Operational Continuity:* High. Dramatically speeds up borrow request submissions and reduces field input mistakes.
  - *Engineering Cost & Complexity:* Moderate (~150 LOC within `BorrowRequestModal.tsx`).
  - *Data Integrity & Performance:* Zero backend API changes (`POST /api/marcom/inventory/borrow` payload remains strictly identical).

## 3. Decision

We adopt **Option 3: Comprehensive 4-Step Wizard Polish & CustomDropdown Integration for `BorrowRequestModal.tsx`**.

### Architectural Directives:
1. **SSOT Component Usage:** Import and configure `CustomDropdown` from `@/components/ui/CustomDropdown`.
2. **Form Height & Visual Hierarchy:** Specify `size="md"` (`min-h-[36px]`) on Step 2 event dropdown to align with date and location inputs.
3. **Session Auto-Population Invariant:** Default `borrowerName` from `useSession` / user store if empty upon modal open, without locking or preventing custom name edits for surrogate requests.
4. **Category Filtration Hygiene:** Map category chips dynamically from SSOT `EQUIPMENT_CATEGORIES` (`inventoryConstants.ts`) without hardcoding category strings inline.
5. **Payload Contract Preservation:** Ensure the submission object shape dispatched to `POST /api/marcom/inventory/borrow` remains 100% compliant with existing backend validation schemas.
6. **Isolation & Invariants:** Confine all changes strictly to `BorrowRequestModal.tsx` and its test suite. Do not modify backend endpoints or `ReturnProcessModal.tsx`.

## 4. Consequences & Risks

### Positive:
- Seamless, modern borrow request flow matching enterprise standards.
- Rapid item discovery via category chips and fast event lookup via searchable dropdown.
- Eliminates redundant manual entry for logged-in operators.
- Zero breaking API or schema changes.

### Negative / Accepted Debt:
- Slightly larger single-file surface area for `BorrowRequestModal.tsx` (addressed by modular internal layout patterns and targeted invariant tests).

