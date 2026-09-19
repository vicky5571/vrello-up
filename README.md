# Vrello Up

[![Next.js](https://img.shields.io/badge/Next.js-15.2.0-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![Tests](https://img.shields.io/badge/Tests-238%20passing-brightgreen?style=flat)](https://nodejs.org/api/test.html)

**Vrello Up** is a production-grade collaborative workspace, productivity suite, and Marketing Communications (Marcom) operations platform. Built on Next.js 15 App Router, React 19, and Tailwind CSS v4, it combines high-performance interactive task management (Kanban, Table, Calendar, Gantt) with deep domain workflows (MoU lifecycle, placement tracking, event budgeting, and content scheduling).

---

## Key Features

### 1. Workspace & Task Management
- **Hierarchical Structure**: Multi-tenant Workspaces $\rightarrow$ Spaces $\rightarrow$ Folders $\rightarrow$ Lists $\rightarrow$ Tasks.
- **Multiple View Modes**: Kanban Board (`@dnd-kit`), Structured Table (`@tanstack/react-table`), Calendar, and Gantt timeline.
- **Rich Task Details**: TipTap rich text descriptions, checklist subtasks, activity log, attachments, priorities, tags, and actor attribution.
- **Task Dependencies & Trash Retention**: Soft-delete trash with automatic retention expiration and circular dependency prevention.

### 2. Marketing Communications (Marcom) Operations
- **MoU & Partnership Machine**: Deterministic state machine managing partnership proposals, reviews, active periods, and renewals.
- **Placement & Outlet Sync**: Multi-outlet placement tracker with budget allocation and automatic sync into space task boards.
- **Field Events & Budgeting**: Event timeline scheduling, PIC assignment, attendee tracking, conflict detection, and cost aggregation.
- **Content Planner**: Multi-channel editorial calendar (social media, print, digital) with status pipelines and draft engines.

### 3. Resilient Dual-Persistence & Realtime
- **Optimistic Zustand Store**: Client-side state mutations render instantly with zero lag.
- **Dual-Layer Fallback**: Quota-aware `localStorage` persistence when offline or unauthenticated.
- **PostgreSQL & Prisma Sync**: Seamless background synchronization to PostgreSQL via REST and Server-Sent Events (SSE) realtime hubs.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [Next.js 15.2.0](https://nextjs.org/) (App Router, Turbopack ready) |
| **UI Library** | [React 19](https://react.dev/) + [Tailwind CSS v4](https://tailwindcss.com/) |
| **Icons & Components** | [Lucide React](https://lucide.dev/), `clsx`, `tailwind-merge` |
| **Interactivity** | [`@dnd-kit`](https://dndkit.com/) (Board Drag & Drop), [TipTap](https://tiptap.dev/) (WYSIWYG Editor) |
| **State Management** | [Zustand 5](https://zustand-demo.pmnd.rs/) with modular slices |
| **Database & ORM** | [PostgreSQL](https://www.postgresql.org/) via [Prisma ORM](https://www.prisma.io/) |
| **Authentication** | [NextAuth.js v5 beta](https://authjs.dev/) (Auth.js) with Google OAuth |
| **Test Runner** | Native [Node.js Test Runner](https://nodejs.org/api/test.html) (`node --test`) with custom path alias hook |

---

## Getting Started

### Prerequisites
- **Node.js**: v20.x or higher
- **npm** or **pnpm**
- **PostgreSQL** instance (local Docker, Supabase, or cloud DB)

### 1. Clone & Install
```bash
git clone https://github.com/vicky5571/vrello-up.git
cd vrello-up
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local` and configure your credentials:
```bash
cp .env.example .env.local
```

Key variables:
- `DATABASE_URL`: PostgreSQL connection string (e.g. `postgresql://postgres:postgres@localhost:5432/vrelloup`)
- `AUTH_SECRET`: Secret for NextAuth session encryption (`openssl rand -base64 32`)
- `AUTH_GOOGLE_ID` & `AUTH_GOOGLE_SECRET`: Google OAuth credentials (optional for development mode)

### 3. Setup Database & Seed
```bash
# Push schema migrations to your database
npx prisma migrate dev

# Seed database with initial workspace, spaces, and demo tasks
npx prisma db seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Next.js development server with hot reload |
| `npm run build` | Builds optimized production bundle |
| `npm run start` | Runs the production build |
| `npm run lint` | Runs Next.js ESLint checks |
| `npm run typecheck` | Validates TypeScript static types (`tsc --noEmit`) |
| `npm test` | Runs the full unit & integration test suite via Node test runner |
| `npm test -- <path>` | Runs a specific test file with fast feedback loop |
| `npm run test:e2e` | Runs Playwright End-to-End (E2E) smoke tests headlessly |
| `npm run test:e2e:ui` | Launches Playwright interactive UI test runner |

### Running Tests

#### 1. Unit & Integration Tests (Fast Feedback Loop)
The project leverages Node's native test runner with custom module resolution (`test/register-alias.mjs`), executing hundreds of tests in seconds:

```bash
# Run all 238+ unit & integration tests
npm test

# Run specific slice test
npm test -- src/lib/store/taskCrud.test.ts
npm test -- src/lib/marcom/mouMachine.test.ts
```

#### 2. End-to-End (E2E) Tests (Playwright)
Validates real browser rendering, view mode transitions, and interactive task workflows:

```bash
# Run E2E smoke tests in headless mode
npm run test:e2e

# Run with interactive UI mode
npm run test:e2e:ui
```

---

## Directory Overview

```text
vrello-up/
├── src/
│   ├── app/                 # Next.js App Router (pages & /api endpoints)
│   │   ├── api/             # REST APIs (workspaces, tasks, marcom, auth, realtime)
│   │   └── page.tsx         # Primary workspace view controller
│   ├── components/          # Reusable UI component library
│   │   ├── layout/          # Sidebar, Navbar, CommandPalette, NotificationCenter
│   │   ├── tasks/           # Task card, detail drawer, subtask checklist, comments
│   │   ├── views/           # BoardView, ListView, CalendarView, GanttView, Marcom views
│   │   ├── spaces/          # Space switchers, folders, list management
│   │   └── ui/              # Design primitives (Modal, Button, Input, Dropdown, Badge)
│   ├── lib/                 # Core business logic & application engines
│   │   ├── store/           # Zustand store slices (useWorkspaceStore.ts)
│   │   ├── marcom/          # State machines (MoU, placement), analytics, permissions
│   │   ├── tasks/           # Task persistence, filtering, inline editing helpers
│   │   └── server/          # Realtime server hubs & SSE connectors
│   └── types/               # Single Source of Truth TypeScript interfaces (index.ts)
├── prisma/                  # Prisma schema & database seed script
├── test/                    # Node test runner configuration & alias registration
└── docs/                    # Architecture blueprints & technical documentation
```

---

## Architecture & Development Guidelines

For comprehensive AI and developer context, domain models, and anti-bloat engineering rules, refer to [`AGENTS.md`](./AGENTS.md).
