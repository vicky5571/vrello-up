# Implementation Plan: Mobile Wizard Stepper Header Dynamic Accordion Expansion

- **Status:** APPROVED
- **Date:** 2026-11-07
- **Spec:** `docs/superpowers/specs/2026-11-07-mobile-wizard-stepper-accordion-design.md`
- **Refs:** `docs/adr/0077-mobile-wizard-stepper-accordion-expansion.md`

## 1. Overview & File Manifest

Implement dynamic accordion expansion on mobile viewports (< 640px) in `WizardStepperHeader.tsx`:
1. The active step expands to occupy remaining horizontal space (`flex-1 min-w-0`), displaying its step number, icon, and full active title (`s.label`).
2. Inactive steps shrink into compact milestone badges (`shrink-0 px-2 py-1.5`), displaying only numbers/icons without text.
3. Desktop layout ($\ge 640\text{px}$) remains 100% byte-for-byte unaffected (`sm:grid sm:grid-cols-4 sm:gap-2`).

### File Manifest

| File Path | Responsibility | Estimated Diff |
| :--- | :--- | :--- |
| `src/components/views/PlacementsView/wizardStepperResponsiveness.test.ts` | Unit & responsiveness regression test suite | ~60 LOC (New) |
| `src/components/views/PlacementsView/wizard/WizardStepperHeader.tsx` | Responsive flex accordion stepper refactor | ~20 LOC modified |
| `CHANGELOG.md` | Document release entry with ADR-0077 reference | ~10 LOC |
| `docs/SESSION_STATE.md` | Session tracking update | ~15 LOC |

## 2. Phased Implementation Plan

### Phase 1: Test-Driven Development (TDD)
- [ ] Create `src/components/views/PlacementsView/wizardStepperResponsiveness.test.ts`.
- [ ] Add assertions verifying:
  - Stepper header container uses `flex items-center gap-1 sm:grid sm:grid-cols-4 sm:gap-2`.
  - Active step button applies `flex-1 min-w-0` on mobile and renders active mobile label.
  - Inactive step button applies `shrink-0` on mobile.
  - Desktop retains 2-line labels (`hidden sm:flex`).
  - Step click handlers invoke `onSelectStep` correctly.
- [ ] Run test suite (`npx tsx --test src/components/views/PlacementsView/wizardStepperResponsiveness.test.ts`) and confirm baseline failure (RED).

### Phase 2: Atomic Component Refactor
- [ ] In `src/components/views/PlacementsView/wizard/WizardStepperHeader.tsx`:
  - Change line 32: `grid grid-cols-4 gap-1 sm:gap-2` -> `flex items-center gap-1 sm:grid sm:grid-cols-4 sm:gap-2`.
  - Update button classes: add `isCurrent ? "flex-1 min-w-0 px-2.5 py-1.5" : "shrink-0 px-2 py-1.5"`.
  - Add active mobile label: `<span className="truncate text-xs font-bold sm:hidden text-lime-900 dark:text-lime-200">{s.label}</span>`.
- [ ] Run test suite and confirm pass (GREEN).

### Phase 3: Verification & Invariant Enforcement
- [ ] Run `npm run drift:check` (verify 0 drift and 104/104 spec-plan pairing).
- [ ] Run `npm run build:check` (verify 0 TypeScript errors).
- [ ] Run `npm test` (verify all placement tests pass).
- [ ] Update `CHANGELOG.md` and `docs/SESSION_STATE.md`.

## 3. Risks & Mitigations

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| Text overflow on ultra-narrow displays (e.g. 320px) | Medium | Active step label uses `truncate`, ensuring graceful text clipping if screen width is under 320px without pushing inactive steps off-screen. |
| Inadvertent desktop grid distortion | High | Strict `sm:grid sm:grid-cols-4 sm:gap-2` guarantees desktop layout remains identical to previous layout. |
| Button tap target size for inactive steps | Low | Inactive steps maintain `px-2 py-1.5` (~36px height) with full touch padding, easily tappable to jump back to completed steps. |



