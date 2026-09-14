# AGENTS.md — Developer & AI Context Map

Welcome to **vrello-up**. This document serves as the high-signal blueprint for AI agents and developers to understand the project architecture, domain models, directory conventions, and coding rules with zero token churn.

---

## 1. Tech Stack & Architecture

- **Framework**: Next.js 15.2.0 (App Router), React 19, TypeScript 5
- **Styling**: Tailwind CSS v4, Lucide React icons, `clsx`, `tailwind-merge`
- **Database & ORM**: PostgreSQL via Prisma (`prisma/schema.prisma`)
- **State Management**: Zustand 5 (`src/lib/store/useWorkspaceStore.ts`) with dual-persistence (in-memory / quota-aware localStorage fallback + API sync to PostgreSQL via `/api/workspaces` & `/api/tasks`)
- **Auth**: NextAuth v5 beta (`src/auth.ts`, `src/lib/marcom/auth.ts`)
- **Interactions & Editors**: `@dnd-kit/core`, `@dnd-kit/sortable`, TipTap Rich Text Editor (`@tiptap/react`)
- **Testing**: Native Node test runner (`node --test`) with custom path alias hook (`test/register-alias.mjs`)

---

## 2. Single Source of Truth (Types & Data Models)

- **Domain Types (Frontend & Client Store)**:
  👉 [`src/types/index.ts`](file:///Users/mac/Web%20Development/vrello-up/src/types/index.ts)
  *Always* import core entities (`Task`, `Workspace`, `Space`, `Folder`, `List`, `Status`, `User`, `Tag`, `FilterOptions`, `ViewMode`, `AutomationRule`) from `@/types`. **Do not declare duplicate inline interfaces.**

- **Database Models (Prisma / Backend)**:
  👉 [`prisma/schema.prisma`](file:///Users/mac/Web%20Development/vrello-up/prisma/schema.prisma)
  Contains PostgreSQL schema for `WorkspaceItem`, `SpaceItem`, `ListItem`, `TaskItem`, and Marcom models (`Branch`, `Outlet`, `Placement`, `Mou`, `MarcomEvent`, `DocumentItem`, `MonthlyReport`).

---

## 3. Directory Map

```text
vrello-up/
├── src/
│   ├── app/                 # Next.js App Router (pages & /api routes)
│   │   ├── api/             # REST endpoints (tasks, workspaces, marcom, realtime, auth)
│   │   └── page.tsx         # Main interactive workspace entry point
│   ├── components/          # Reusable UI components
│   │   ├── layout/          # Sidebar, Navbar, CommandPalette, NotificationCenter
│   │   ├── tasks/           # Task modal, detail drawer, comments, activity log
│   │   ├── views/           # BoardView, ListView, CalendarView, GanttView, TableView, Marcom views
│   │   ├── spaces/          # Space switchers, folders, list management
│   │   └── ui/              # Primitives (Modal, Button, Input, Dropdown, Badge)
│   ├── lib/                 # Core business logic & helpers
│   │   ├── store/           # Zustand stores (useWorkspaceStore.ts) & slice unit tests
│   │   ├── marcom/          # State machines (mouMachine, placementMachine), permissions, analytics
│   │   ├── tasks/           # Task persistence, filtering, inline editing helpers
│   │   └── server/          # Realtime server hubs & SSE
│   └── types/               # Single Source of Truth (index.ts)
├── prisma/                  # Prisma schema & seed scripts
├── test/                    # Test configuration (register-alias.mjs)
└── docs/                    # Architecture blueprints & superpowers specs
```

---

## 4. Engineering Conventions & Anti-Bloat Rules

1. **Spec-First / Plan-First**:
   - Before executing multi-file edits or new features, produce a concise plan outlining the affected files and approach.
   - Do not jump straight into modifying 5+ files blindly.

2. **Strangler Pattern on God Files (`useWorkspaceStore.ts`)**:
   - [`src/lib/store/useWorkspaceStore.ts`](file:///Users/mac/Web%20Development/vrello-up/src/lib/store/useWorkspaceStore.ts) is already a large file (>2,000 lines).
   - **DO NOT** dump large new blocks of logic directly inside it.
   - Extract helper functions, reducers, or sub-slice logic into modular files under `src/lib/store/` or `src/lib/tasks/`, and import them into the store cleanly.

3. **State Mutation Discipline**:
   - Always trigger updates through defined store actions (`createTask`, `updateTask`, `moveTaskStatus`, etc.).
   - Never mutate state objects directly in place.

4. **Preserve Dual-Persistence**:
   - The app supports offline / in-memory / local storage gracefully alongside PostgreSQL. Ensure mutations update client state immediately and queue/execute sync appropriately.

---

## 5. Precision Testing & Fast Feedback Loop

Proyek ini menggunakan test runner bawaan Node yang sangat cepat (~250ms per file, ~4 detik full suite 105 tests).

- **Run all unit tests**:
  ```bash
  npm test
  ```
- **Run a specific test file (Fastest feedback loop)**:
  ```bash
  npm test -- src/lib/store/taskCrud.test.ts
  npm test -- src/lib/marcom/mouMachine.test.ts
  ```
- **Rule**: Whenever fixing a bug or adding business logic in `src/lib/`, run the specific test file or write a minimal unit test to verify before finalizing.
