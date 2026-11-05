# ADR-0056: Hide Brain² AI Assistant from User-Facing Navigation Surfaces

- **Status:** ACCEPTED
- **Date:** 2026-11-06
- **Deciders:** Senior Software Engineer, Lead Developer

## Context & Business Problem

*vrello-up* is an enterprise field marketing operations management system tailored for Indosat Ooredoo Hutchison (IM3 & Tri brands). Its active workflows center on master data (branches, outlets, materials), operational execution (POSM placements, media contracts/MOUs, field events, inventory loans, and compensation settlements), and reporting.

Currently, the application displays prominent entry points for **Brain² AI Assistant** across core user interfaces:
1. A permanent violet **"AI"** button (`Sparkles` icon) inside `GlobalRail.tsx` between Calendar and Users/More navigation.
2. A **"Brain² AI Assistant"** action button in the "Main Tools" section of the `MoreAppsMenu.tsx` popover.
3. An active dynamic mount of `<AiDrawer />` on the root workspace canvas (`src/app/page.tsx`).
4. A documentation guide card entitled *"Brain² & Autonomous Agents"* in `HelpDocsModal.tsx`.

### The Problem
The current AI assistant is a local mock chatbot prototype that is not integrated into field operational procedures. Displaying a prominent "AI" button on primary navigation rails confuses field coordinators and supervisors, who expect it to perform actual telecom marketing functions, while cluttering visual real estate and incurring unnecessary client-side bundle load on `page.tsx`.

The product decision has been established: **the business does not need the Brain² AI Assistant for now**, but wants it cleanly hidden across the entire application without permanently discarding developed UI assets or creating complex runtime feature-flag overhead.

## Options Considered

### Option 1: Clean UI Dormancy & Removal from Navigation Surfaces (Chosen)
- Remove the `"ai"` entry from `NAV_ITEMS` in `GlobalRail.tsx`.
- Remove the `"Brain² AI Assistant"` button from `MoreAppsMenu.tsx`, and update `MoreAppsMenu.test.ts` to assert its absence.
- Unmount `<AiDrawer />` and eliminate its dynamic import from `src/app/page.tsx`.
- Replace the AI guide card in `HelpDocsModal.tsx` with a practical field guide (*"Field Inventory & Equipment Loans"*).
- Retain `src/components/ai/AiDrawer.tsx` and Zustand UI state (`isAiDrawerOpen`, `setAiDrawerOpen`) as dormant code, allowing effortless re-activation in the future without re-engineering UI chat structures or Framer Motion drawers.

*Trade-Offs:*
- **Pros:** 100% elimination of user-facing AI clutter; saves root bundle parsing overhead in `page.tsx`; clean separation; zero runtime feature-flag boilerplate; test suites remain green and robust.
- **Cons:** Leaves dormant files (`src/components/ai/AiDrawer.tsx`) in the repository until a future decision is reached to either expand or delete them.

### Option 2: Runtime Feature Flag Toggle (`NEXT_PUBLIC_ENABLE_AI_ASSISTANT=false`)
- Wrap the buttons in `GlobalRail`, `MoreAppsMenu`, and drawer mount in `page.tsx` behind an environment variable check.

*Trade-Offs:*
- **Pros:** Configurable without code deployment.
- **Cons:** Introduces unnecessary runtime branching and dead UI conditional boilerplate across multiple components for a feature explicitly deferred (violates YAGNI/Ponytail minimal complexity).

### Option 3: Hard Deletion (Complete Elimination)
- Permanently delete `AiDrawer.tsx`, remove Zustand state slice keys, and purge all AI references.

*Trade-Offs:*
- **Pros:** Maximum LOC reduction and zero dormant code.
- **Cons:** Irreversible without git history archaeology; if an LLM-powered field assistant is approved later, all chat layout and state dispatchers would have to be rebuilt from scratch.

## Decision

We adopt **Option 1: Clean UI Dormancy & Removal from Navigation Surfaces**.

Specifically:
1. **GlobalRail Navigation:** Remove the `"ai"` item from `NAV_ITEMS` in `src/components/layout/GlobalRail.tsx`.
2. **MoreAppsMenu Modal:** Remove the `"Brain² AI Assistant"` action item from `src/components/modals/MoreAppsMenu.tsx`. Update `src/components/modals/MoreAppsMenu.test.ts` to assert that the menu does not contain "Brain² AI Assistant".
3. **Workspace Canvas Host:** Remove dynamic import and mounting of `<AiDrawer />` from `src/app/page.tsx`.
4. **Help & Documentation:** Replace the *"Brain² & Autonomous Agents"* card in `src/components/modals/HelpDocsModal.tsx` with a practical operational card: *"Field Inventory & Equipment Loans"*.
5. **Dormant Assets:** Retain `src/components/ai/AiDrawer.tsx` intact for future reference. Retain `isAiDrawerOpen` in Zustand to maintain backwards compatibility with existing hotkey handlers and UI state.

## Consequences

### Positive Consequences
1. **Zero User-Facing AI Distraction:** Field coordinators and area managers interact only with active, relevant operational modules (Tasks, Outlets, MOUs, Events, Placements, Inventory, Reports).
2. **Faster Canvas Loading:** Removing `<AiDrawer />` from `page.tsx` prevents dynamic chunk fetching and backdrop rendering on application mount.
3. **Cleaner Rails & Menus:** `GlobalRail` is freed of non-functional items, improving ergonomic spacing. `MoreAppsMenu` focuses strictly on Command Palette, Export Center, and Backup/Data operations.
4. **Reversible & Safe:** If a real AI assistant is commissioned in the future, re-enabling it requires simply mounting the component and restoring the navigation entries.

### Negative Consequences / Accepted Technical Debt
1. **Dormant Code in Repo:** `src/components/ai/AiDrawer.tsx` will remain dormant in the codebase without active callers. Marked with `// ponytail: deferred AI assistant UI dormant until LLM backend integration`.



