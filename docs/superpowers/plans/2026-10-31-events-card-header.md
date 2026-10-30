# Plan: Field Events Card-Banner Header Architecture

**Spec:** [docs/superpowers/specs/2026-10-31-events-card-header-design.md](file:///Users/mac/Web%20Development/vrello-up/docs/superpowers/specs/2026-10-31-events-card-header-design.md)  
**Status:** In Progress  
**Date:** 2026-10-31  

---

## Phased Execution Roadmap

### Phase 1: Component Extraction & Card-Banner Header
- [ ] Create `src/components/views/EventsView/EventsHeader.tsx` (estimated ~80 LOC).
- [ ] Implement card container styling: `bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs`.
- [ ] Port title, icon badge, count badge, subtitle, animated view switcher (`Cards`, `Table`, `Calendar`, `Timeline`), refresh trigger, and `+ New Field Event` button.

### Phase 2: Integration & Coordinator Refactor
- [ ] Import `EventsHeader` in `src/components/views/EventsView/EventsView.tsx`.
- [ ] Replace inline header JSX with `<EventsHeader ... />`.
- [ ] Verify clean layout rhythm with existing KPI cards and search bar.

### Phase 3: Verification & Invariant Enforcement
- [ ] Run `npm run drift:check` (verify 26 spec-plan pairs and architectural invariants).
- [ ] Run `npm run build:check` (verify TypeScript build with 0 errors).
- [ ] Run `npm test` (verify 591+ tests pass with 0 failures).

---

## File Manifest
| Path | Action | Est. LOC |
|---|---|---|
| `docs/superpowers/specs/2026-10-31-events-card-header-design.md` | Create | 65 |
| `docs/superpowers/plans/2026-10-31-events-card-header.md` | Create | 40 |
| `src/components/views/EventsView/EventsHeader.tsx` | Create | 90 |
| `src/components/views/EventsView/EventsView.tsx` | Modify | -50 |
