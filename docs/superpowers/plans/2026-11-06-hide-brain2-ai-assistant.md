# Implementation Plan: Hide Brain² AI Assistant from User-Facing Navigation Surfaces

- **Date:** 2026-11-06
- **Status:** APPROVED
- **Spec:** docs/superpowers/specs/2026-11-06-hide-brain2-ai-assistant-design.md
- **Refs:** ADR-0056

---

## 1. Executive Summary & Strategy

This plan executes the clean dormancy and removal of all user-facing entry points for the prototype **Brain² AI Assistant** across `GlobalRail`, `MoreAppsMenu`, `src/app/page.tsx`, and `HelpDocsModal`.

The approach uses Test-Driven Development (TDD) by establishing negative assertions in `MoreAppsMenu.test.ts` first, followed by atomic UI modifications, and ending with non-negotiable verification gates.

---

## 2. File Manifest & LOC Impact

| File Path | Responsibility | Estimated LOC Change |
|---|---|---|
| `src/components/modals/MoreAppsMenu.test.ts` | Unit test assertion checking omission of Brain² AI Assistant | -2 / +4 |
| `src/components/layout/GlobalRail.tsx` | Remove "AI" nav item, clean up `Sparkles` import & store bindings | -14 |
| `src/components/modals/MoreAppsMenu.tsx` | Remove "Brain² AI Assistant" button and `setAiDrawerOpen` selector | -18 |
| `src/app/page.tsx` | Remove `AiDrawer` dynamic import and JSX render tag | -6 |
| `src/components/modals/HelpDocsModal.tsx` | Replace AI guide card with "Field Inventory & Equipment Loans" | -4 / +5 |
| `src/components/ai/AiDrawer.tsx` | Add dormancy header comment | +3 |
| `docs/SESSION_STATE.md` | Session tracking and planning status update | +25 |

---

## 3. Implementation Phasing & Tasks

### Phase 1: Test Alignment (Red Phase)
- [ ] Task 1.1: Edit `src/components/modals/MoreAppsMenu.test.ts` to assert that `moreContent` does NOT include `"Brain² AI Assistant"`.
- [ ] Task 1.2: Run targeted test `npx tsx --test src/components/modals/MoreAppsMenu.test.ts` and verify it fails as expected against current code.

### Phase 2: Navigation Surfaces & Root Mount Clean-Up (Green Phase)
- [ ] Task 2.1: In `src/components/layout/GlobalRail.tsx`:
  - Remove `Sparkles` from `lucide-react` import list.
  - Remove `isAiDrawerOpen` and `setAiDrawerOpen` from store selectors.
  - Remove `{ id: "ai", label: "AI", icon: Sparkles, ... }` from `NAV_ITEMS`.
- [ ] Task 2.2: In `src/components/modals/MoreAppsMenu.tsx`:
  - Remove `Sparkles` from `lucide-react` import list.
  - Remove `setAiDrawerOpen` from store selectors.
  - Remove the button block triggering `setAiDrawerOpen(true)` with `"Brain² AI Assistant"`.
- [ ] Task 2.3: In `src/app/page.tsx`:
  - Remove `const AiDrawer = dynamic(...)` import.
  - Remove `<AiDrawer />` from the JSX tree inside `WorkspacePage`.
- [ ] Task 2.4: In `src/components/modals/HelpDocsModal.tsx`:
  - Replace `Bot` import with `Package` from `lucide-react`.
  - Update `GUIDES` entry from "Brain² & Autonomous Agents" to "Field Inventory & Equipment Loans".
- [ ] Task 2.5: In `src/components/ai/AiDrawer.tsx`:
  - Add dormancy comment header `// ponytail: deferred AI assistant UI dormant until LLM backend integration. Not mounted in user-facing navigation (ADR-0056).`

### Phase 3: Verification & Execution Handover
- [ ] Task 3.1: Run `npx tsx --test src/components/modals/MoreAppsMenu.test.ts` and verify 100% pass.
- [ ] Task 3.2: Run `npm run drift:check` (verify 83 spec-plan pairs and coordinator lines ≤ 250).
- [ ] Task 3.3: Run `npm run build:check` (verify zero TypeScript compilation errors).
- [ ] Task 3.4: Run `npm run test:smoke` (verify all smoke tests pass).
- [ ] Task 3.5: Run `npm test` (verify all 899+ tests pass with zero failures).
- [ ] Task 3.6: Author execution-ready handover document `docs/handover-hide-brain2-ai-assistant.md`.
- [ ] Task 3.7: Update `docs/SESSION_STATE.md`.


