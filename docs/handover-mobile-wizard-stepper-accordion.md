# Execution Handover: Mobile Wizard Stepper Header Dynamic Accordion Expansion

- **Target ADR:** `docs/adr/0077-mobile-wizard-stepper-accordion-expansion.md`
- **Target Spec:** `docs/superpowers/specs/2026-11-07-mobile-wizard-stepper-accordion-design.md`
- **Target Plan:** `docs/superpowers/plans/2026-11-07-mobile-wizard-stepper-accordion.md`
- **Status:** EXECUTION-READY

## 1. File Manifest

| File Path | Purpose |
| :--- | :--- |
| `src/components/views/PlacementsView/wizardStepperResponsiveness.test.ts` | Unit & responsiveness regression test suite verifying accordion layout contracts |
| `src/components/views/PlacementsView/wizard/WizardStepperHeader.tsx` | Stepper header component rendering 4 execution milestones with progress bar |

---

## 2. Current Code Snippets

From `src/components/views/PlacementsView/wizard/WizardStepperHeader.tsx` (Lines 31–87):

```tsx
      {/* 4 Step Pills */}
      <div className="grid grid-cols-4 gap-1 sm:gap-2">
        {WIZARD_STEPS.map((s) => {
          const Icon = STEP_ICONS[s.step];
          const isCurrent = currentStep === s.step;
          const isCompleted = completionStatus[s.step];
          const isClickable = isCompleted || s.step <= currentStep;

          return (
            <button
              key={s.step}
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onSelectStep(s.step)}
              className={cn(
                "flex items-center justify-center sm:justify-start gap-1.5 px-2 py-1.5 rounded-xl border text-left transition-all text-xs font-semibold",
                isCurrent
                  ? "bg-lime-500/10 text-lime-800 dark:text-lime-300 border-lime-500/40 ring-2 ring-lime-500/20 shadow-xs"
                  : isCompleted
                  ? "bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 cursor-pointer"
                  : "bg-slate-50/50 dark:bg-slate-900/40 text-slate-400 dark:text-slate-600 border-transparent cursor-not-allowed opacity-60"
              )}
            >
              {/* Step indicator circle */}
              <span
                className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors",
                  isCurrent
                    ? "bg-lime-600 text-white shadow-2xs"
                    : isCompleted
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                )}
              >
                {isCompleted && !isCurrent ? (
                  <Check className="w-3 h-3 stroke-[3]" />
                ) : (
                  s.step
                )}
              </span>

              {/* Label */}
              <div className="hidden sm:flex flex-col min-w-0">
                <span className="truncate text-[11px] leading-tight font-bold">
                  {s.shortLabel}
                </span>
                <span className="truncate text-[9px] opacity-75 font-normal">
                  Langkah {s.step}
                </span>
              </div>

              {/* Mobile icon only */}
              <Icon className="w-3.5 h-3.5 sm:hidden shrink-0" />
            </button>
          );
        })}
      </div>
```

---

## 3. Exact Change Instructions

### Change: `src/components/views/PlacementsView/wizard/WizardStepperHeader.tsx`

**Lines 31–87 Replacement:**

DELETE:
```tsx
      {/* 4 Step Pills */}
      <div className="grid grid-cols-4 gap-1 sm:gap-2">
        {WIZARD_STEPS.map((s) => {
          const Icon = STEP_ICONS[s.step];
          const isCurrent = currentStep === s.step;
          const isCompleted = completionStatus[s.step];
          const isClickable = isCompleted || s.step <= currentStep;

          return (
            <button
              key={s.step}
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onSelectStep(s.step)}
              className={cn(
                "flex items-center justify-center sm:justify-start gap-1.5 px-2 py-1.5 rounded-xl border text-left transition-all text-xs font-semibold",
                isCurrent
                  ? "bg-lime-500/10 text-lime-800 dark:text-lime-300 border-lime-500/40 ring-2 ring-lime-500/20 shadow-xs"
                  : isCompleted
                  ? "bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 cursor-pointer"
                  : "bg-slate-50/50 dark:bg-slate-900/40 text-slate-400 dark:text-slate-600 border-transparent cursor-not-allowed opacity-60"
              )}
            >
              {/* Step indicator circle */}
              <span
                className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors",
                  isCurrent
                    ? "bg-lime-600 text-white shadow-2xs"
                    : isCompleted
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                )}
              >
                {isCompleted && !isCurrent ? (
                  <Check className="w-3 h-3 stroke-[3]" />
                ) : (
                  s.step
                )}
              </span>

              {/* Label */}
              <div className="hidden sm:flex flex-col min-w-0">
                <span className="truncate text-[11px] leading-tight font-bold">
                  {s.shortLabel}
                </span>
                <span className="truncate text-[9px] opacity-75 font-normal">
                  Langkah {s.step}
                </span>
              </div>

              {/* Mobile icon only */}
              <Icon className="w-3.5 h-3.5 sm:hidden shrink-0" />
            </button>
          );
        })}
      </div>
```

REPLACE WITH:
```tsx
      {/* 4 Step Pills (Accordion on Mobile, Grid on Desktop) */}
      <div className="flex items-center gap-1 sm:grid sm:grid-cols-4 sm:gap-2">
        {WIZARD_STEPS.map((s) => {
          const Icon = STEP_ICONS[s.step];
          const isCurrent = currentStep === s.step;
          const isCompleted = completionStatus[s.step];
          const isClickable = isCompleted || s.step <= currentStep;

          return (
            <button
              key={s.step}
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onSelectStep(s.step)}
              className={cn(
                "flex items-center gap-1.5 py-1.5 rounded-xl border text-left transition-all text-xs font-semibold",
                isCurrent
                  ? "flex-1 min-w-0 px-2.5 justify-start bg-lime-500/10 text-lime-800 dark:text-lime-300 border-lime-500/40 ring-2 ring-lime-500/20 shadow-xs"
                  : isCompleted
                  ? "shrink-0 px-2 sm:px-2.5 justify-center sm:justify-start bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 cursor-pointer"
                  : "shrink-0 px-2 sm:px-2.5 justify-center sm:justify-start bg-slate-50/50 dark:bg-slate-900/40 text-slate-400 dark:text-slate-600 border-transparent cursor-not-allowed opacity-60"
              )}
            >
              {/* Step indicator circle */}
              <span
                className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors",
                  isCurrent
                    ? "bg-lime-600 text-white shadow-2xs"
                    : isCompleted
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                )}
              >
                {isCompleted && !isCurrent ? (
                  <Check className="w-3 h-3 stroke-[3]" />
                ) : (
                  s.step
                )}
              </span>

              {/* Step Icon */}
              <Icon className="w-3.5 h-3.5 shrink-0" />

              {/* Active Mobile Label */}
              {isCurrent && (
                <span className="truncate text-xs font-bold sm:hidden text-lime-900 dark:text-lime-200">
                  {s.label}
                </span>
              )}

              {/* Desktop Label (All 4 steps) */}
              <div className="hidden sm:flex flex-col min-w-0">
                <span className="truncate text-[11px] leading-tight font-bold">
                  {s.shortLabel}
                </span>
                <span className="truncate text-[9px] opacity-75 font-normal">
                  Langkah {s.step}
                </span>
              </div>
            </button>
          );
        })}
      </div>
```

---

### Amendment (2026-11-07): Unified Short Labels & Subtitle Elimination

**Lines 69–95 Replacement:**

```tsx
              {/* Step Short Label (Active-only on mobile; all steps on desktop; subtitle eliminated) */}
              <span
                className={cn(
                  "truncate text-xs font-bold min-w-0",
                  isCurrent
                    ? "inline text-lime-900 dark:text-lime-200"
                    : "hidden sm:inline"
                )}
              >
                {s.shortLabel}
              </span>
```

Eliminates `Langkah {s.step}` subtitle globally and prevents `"Pilih ..."` truncation on mobile by using concise `s.shortLabel`.

---

## 4. Do Not Touch List

| File / Component | Reason |
| :--- | :--- |
| `src/components/views/PlacementsView/wizard/placementWizardHelpers.ts` | Step metadata & validation logic; intact |
| `src/components/views/PlacementsView/wizard/WizardFooter.tsx` | Wizard footer buttons; intact |
| Desktop CSS breakpoints (`sm:`, `md:`, `lg:`) | Desktop layout must remain 4-column equal grid |

---

## 5. Numbered Execution Order

1. **Create Test File:**
   - Create `src/components/views/PlacementsView/wizardStepperResponsiveness.test.ts`.
   - Implement test assertions verifying `flex items-center gap-1 sm:grid sm:grid-cols-4 sm:gap-2` on container, `flex-1 min-w-0` on active step, and `shrink-0` on inactive steps.
   - Run `npx tsx --test src/components/views/PlacementsView/wizardStepperResponsiveness.test.ts` (verify RED / baseline failure).
2. **Apply WizardStepperHeader Refactor:**
   - In `src/components/views/PlacementsView/wizard/WizardStepperHeader.tsx`:
     - Apply Change (replace lines 31–87 with accordion container and active/inactive step rules).
3. **Verify Tests & Build:**
   - Run `npx tsx --test src/components/views/PlacementsView/wizardStepperResponsiveness.test.ts` (verify GREEN).
   - Run `npm run drift:check` (verify 104/104 spec-plan pairs).
   - Run `npm run build:check` (verify 0 TypeScript errors).
   - Run `npm test` (verify all placement tests pass).
4. **Update Session Documentation:**
   - Update `CHANGELOG.md` with ADR-0077 entry.
   - Update `docs/SESSION_STATE.md`.

---

## 6. Acceptance Criteria Checklist

- [ ] On mobile (< 640px), active step expands (`flex-1 min-w-0`) and displays full label (`s.label`).
- [ ] On mobile (< 640px), inactive steps shrink (`shrink-0 px-2 py-1.5`) without showing text.
- [ ] Step buttons retain clickability and navigation to completed steps.
- [ ] On desktop ($\ge 640\text{px}$), stepper maintains 4-column equal grid (`sm:grid sm:grid-cols-4 sm:gap-2`) with 2-line labels.
- [ ] 0 layout shift or text wrapping overflow on 320px–420px screens.



