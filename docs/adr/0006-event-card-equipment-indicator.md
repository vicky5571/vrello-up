# ADR 06: Event Card Equipment Logistics Indicator Chip & Pipeline 360° Domain Boundary

**Date:** 2026-10-31  
**Status:** Accepted  
**Author:** Critical Senior Software Engineer (Pair Programmer)  
**Related Specs:** `docs/superpowers/specs/2026-10-31-event-card-equipment-indicator-design.md`  
**Related Plans:** `docs/superpowers/plans/2026-10-31-event-card-equipment-indicator.md`  

---

## Context

With the implementation of the **Field Event Equipment Inventory & Loans System** (ADR-05), physical equipment (tents, sound systems, display units, branding kits) can be linked to `FieldEvent` records through `BorrowRecord`.

Currently, equipment logistics for a field event can only be inspected by opening the `EventFormModal` (specifically via `EventBorrowedEquipmentSection`). Field marketing teams and logistics coordinators reviewing the event overview grid (`EventCardsView`) cannot tell at a glance whether an event:
1. Has borrowed physical equipment attached.
2. How many total units of equipment are deployed.
3. Whether any borrowed items are currently **overdue** past their scheduled `returnDueDate`.

Additionally, the question was raised whether borrowed equipment should also be integrated as a column in the **Pipeline 360°** matrix.

---

## Decisions

### 1. Add an Equipment Logistics Chip to `EventCardsView.tsx`
We will add a compact, contextual chip next to the checklist progress in `EventCardsView`:
- **Active / Scheduled state:** Teal pill showing `📦 N Unit Alat` (or records count).
- **Overdue state:** High-visibility rose/amber pill showing `⚠️ N Unit (Overdue)` when any attached loan has passed `returnDueDate`.
- **Zero / No-equipment state:** Hidden (0px rendered) to prevent visual clutter and maintain card layout balance.
- **Interactivity:** Clicking the chip opens the event detail modal directly, allowing instant access to `EventBorrowedEquipmentSection`.

### 2. Derive Indicator Purely from Client Store Cache (Zero Network Overhead)
Instead of adding new backend endpoints or adding denormalized counter columns to the PostgreSQL `FieldEvent` table, the chip logic is computed client-side using `useMarcomDataStore`'s existing `borrowRecords` state.
A pure, isolated helper `getEventEquipmentSummary(borrowRecords, eventId)` will perform this aggregation.

### 3. Reject Adding Equipment to Pipeline 360° (Domain Boundary Enforcement)
We explicitly **reject** adding an Equipment / Borrow column into `PipelineView` (Pipeline 360°):
- **Domain Invariant:** Pipeline 360° is an **Outlet-centric commercial cockpit** (`OutletPipelineRow`). Outlets do not borrow warehouse equipment; internal field teams borrow equipment to execute events.
- **Transitive Relationship:** The relationship is `BorrowRecord -> FieldEvent -> Outlet (optional)`. Many field events are open-air roadshows or activations unaffiliated with any specific outlet. Forcing warehouse equipment onto outlet rows violates single-responsibility and data scoping.
- **Cognitive Clutter:** Pipeline 360° is already dense (Outlet Info, MOU, Media Placement, Event, Content, Urgency). Equipment inventory already has its own dedicated 4-KPI dashboard, catalog table, and 4-column kanban board (`BorrowTrackingBoard`).

---

## Consequences

### Positive
- **Instant Operational Visibility:** Field managers can immediately identify which upcoming events have secured equipment and which active events have overdue assets.
- **Zero Backend / Database Migration:** Reuses SSOT `BorrowRecord` and reactive cache in `marcomDataStore`.
- **Zero Layout Regression:** Clean, responsive card layout with no layout shift for events without equipment.
- **Protected Pipeline Cockpit:** Preserves the clean semantic boundary of Pipeline 360° as an outlet marketing health matrix.

### Negative / Trade-offs
- If `borrowRecords` are not yet loaded in `marcomDataStore` on initial page mount, the chip may briefly render empty until `fetchBorrowRecords()` resolves. Handled gracefully by standard SWR cache revalidation.
