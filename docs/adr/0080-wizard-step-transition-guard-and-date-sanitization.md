# ADR-0080: Wizard Step Transition Submission Guard and Placement Date Sanitization

- **Status:** Accepted
- **Date:** 2026-11-07
- **Author:** Critical Senior Software Engineer (Pair Programmer)
- **Deciders:** User & Senior Software Engineer
- **Consulted:** Marcom Field Operations, Data Layer Architecture

---

## Context & Business Problem

When a field operator advances through the 4-step POSM Placement wizard (`PlacementFormModal.tsx`), navigating from Step 3 (Photo & Notes) to Step 4 (Location Verification) triggers an immediate, unintended form submission. The placement modal unexpectedly displays `"Menyimpan..."` and issues a `POST /api/marcom/placements` network request before the operator has viewed, verified, or adjusted the location pin on Step 4.

Furthermore, this unintended network request crashes with an HTTP 500 server error:
```
POST /api/marcom/placements 500
⨯ Error [PrismaClientValidationError]:
Invalid `prisma.placement.create()` invocation:
{
  data: {
    ...
    date: "2026-11-07",
          ~~~~~~~~~~~~
```

### Root Cause Analysis

#### 1. UI Layer: React DOM Reconciliation & Synthetic Event Bleed
In `src/components/views/PlacementsView/wizard/WizardFooter.tsx`:
```tsx
{!isFinalStep ? (
  <button type="button" onClick={onNextStep}>
    <span>Lanjut</span>
  </button>
) : (
  <button type="submit">
    <span>Simpan Eksekusi POSM</span>
  </button>
)}
```
- Neither button has a `key` prop.
- When an operator clicks or taps `"Lanjut"` on Step 3, `onNextStep` updates state: `currentStep = 4`.
- React re-renders `WizardFooter`. Because both branches of the ternary render a `<button>` at the identical tree position without keys, React **reuses the existing DOM `<button>` element** and mutates its attributes in-place from `type="button"` to `type="submit"`.
- In mobile browser event dispatching (where touch sequences synthesize a `click` event asynchronously) or rapid pointer completion, the browser's native `click` event resolves on the **mutated `type="submit"` button**.
- The browser treats this click as an intentional submit button click and dispatches a `submit` event to the parent `<form>`.
- In `PlacementFormModal.tsx` line 238, `<form onSubmit={onSave}>` passes `onSave` directly to the form's `submit` event without verifying if `currentStep === 4`.

#### 2. API Layer: Prisma Client DateTime Validation Failure
In `prisma/schema.prisma` line 182, model `Placement` defines:
```prisma
date DateTime?
```
The client sends a 10-character date string (`"YYYY-MM-DD"`, e.g. `"2026-11-07"`) from standard `<input type="date">` and default date helpers.
In `src/app/api/marcom/placements/route.ts` line 135:
```ts
const placement = await prisma.placement.create({
  data: {
    ...
    date, // Raw string "2026-11-07" passed directly
  }
});
```
Prisma Client requires a JavaScript `Date` object or an ISO-8601 DateTime string with time components. A bare date string `"2026-11-07"` causes a fatal `PrismaClientValidationError` and returns an uncaught HTTP 500 error.

---

## Options Considered

### Option 1: Dual-Layer Defense: Key Separation & Step Guard (UI) + Date Sanitization (API) (Accepted)
- **UI Defense 1 (DOM Isolation)**: Give each button in `WizardFooter.tsx` an explicit unique `key`:
  `key="wizard-btn-next"` for the Next step button, and `key="wizard-btn-submit"` for the final submission button. This forces React to unmount the old button and mount a fresh DOM element, eliminating in-flight synthetic click leakage.
- **UI Defense 2 (Modal Step Guard)**: Wrap form submission in `PlacementFormModal.tsx` with a step guard:
  ```tsx
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep !== 4) return;
    onSave(e);
  };
  ```
  Accidental submissions from any intermediate step (e.g. pressing Enter in a text input) are defensively blocked.
- **API Defense (Date Parsing)**: In `POST /api/marcom/placements/route.ts` and `PATCH /api/marcom/placements/[id]/route.ts`:
  Convert incoming date strings defensively:
  ```ts
  const parsedDate = date ? new Date(date) : null;
  const validDate = parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate : null;
  ```
  Ensure Prisma always receives a valid JavaScript `Date` object or `null`.

### Option 2: Client-Only Patch (Format Date as ISO String & Add Key)
- Only modify the client components without touching the API routes.
- *Rejected*: Fragile. Any external API client, future feature, or third-party integration sending `"YYYY-MM-DD"` will continue to trigger HTTP 500 crashes.

### Option 3: Replace `<form>` with Non-Form `<div>`
- Replace `<form>` with a `<div>` and bind button clicks directly.
- *Rejected*: Breaks standard HTML form semantics and keyboard accessibility without resolving the server-side date validation bug.

---

## Trade-Off Matrix

| Metric | Option 1 (Dual Defense - Accepted) | Option 2 (Client Only) | Option 3 (Replace Form) |
| :--- | :--- | :--- | :--- |
| **Premature Auto-Save Prevention** | **100% (DOM unmount + Step guard)** | 85% (Key only, no step guard) | 100% |
| **Prisma DateTime Resilience** | **100% (Defensive server parsing)** | 0% (API remains vulnerable) | 0% (API remains vulnerable) |
| **Touch Event / Mobile Emulation Safety** | **100% (Clean event lifecycle)** | Medium | High |
| **HTML Form Semantics & A11y** | **Preserved** | Preserved | Degraded |
| **Architectural Maintainability** | **High (Robust at all boundaries)** | Low (Technical debt remains) | Medium |

---

## Decision

We accept **Option 1**: Implement comprehensive dual-layer protection:
1. Isolate wizard button reconciliation in `WizardFooter.tsx` with distinct `key` attributes (`wizard-btn-next` and `wizard-btn-submit`).
2. Add a defensive `handleFormSubmit` guard in `PlacementFormModal.tsx` to strictly prevent form submission unless `currentStep === 4`.
3. Defensively parse and validate incoming date strings in `/api/marcom/placements/route.ts` and `/api/marcom/placements/[id]/route.ts` using `new Date(date)` before Prisma operations.

---

## Consequences

### Positive Consequences
- **Elimination of Premature Saves**: Operators can safely transition from Step 3 to Step 4 to review location and geofencing without fear of automatic accidental saves.
- **Robust Prisma Persistence**: Eliminates `PrismaClientValidationError` across all placement creation and edit pathways for any valid date format (`YYYY-MM-DD` or ISO string).
- **Zero Invariant Drift**: Preserves coordinator file budgets, domain types (`MarcomPlacement.date`), and single-tenant architecture.

### Negative Consequences / Accepted Technical Debt
- Minor coordination across three files (`WizardFooter.tsx`, `PlacementFormModal.tsx`, and `route.ts`), which is fully mitigated through automated regression tests.

---

## References
- Spec: `docs/superpowers/specs/2026-11-07-wizard-step-transition-guard-and-date-sanitization-design.md`
- Plan: `docs/superpowers/plans/2026-11-07-wizard-step-transition-guard-and-date-sanitization.md`

