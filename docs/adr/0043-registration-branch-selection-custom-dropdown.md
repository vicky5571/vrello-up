# ADR-0043: Registration Branch Selection via Server-Rendered CustomDropdown

- **Status:** APPROVED
- **Date:** 2026-11-05
- **Deciders:** Senior Software Engineer, Principal Systems Architect, Product Owner
- **Consulted:** Marcom Lead, Operations Coordinator, Area Supervisors
- **Informed:** Core Development Team

## 1. Context & Business Problem

In Vrello Up's organizational architecture, field operations, outlet approvals, event workflows, and equipment inventories are strictly segregated by operational branches (`branchId`). Role-based access control rules (established in ADR-0014) restrict Area Supervisors to managing records within their assigned branches (`assignedBranchIds`).

However, the user registration page (`src/app/(auth)/register/page.tsx` and `RegisterForm.tsx`) previously only collected `name`, `email`, and `password`. Consequently:
1. Newly registered users entered the database with an empty branch array (`assignedBranchIds: []`).
2. Administrators and Area Supervisors reviewing the pending queue in `UsersPendingTab` had no visibility into which branch the candidate was registering for, forcing manual out-of-band inquiries before approving the account.
3. Account approvals required administrators to manually select and assign branches from scratch rather than verifying a branch proposed by the applicant.

## 2. Options Considered

### Option 1: Server-Rendered Branch Props (RSC Data Fetching) + CustomDropdown — [CHOSEN]
- **Concept:** `RegisterPage` (Next.js Server Component) queries active branches directly from the database during SSR (`prisma.branch.findMany({ select: { id: true, name: true, city: true, code: true }, orderBy: { name: "asc" } })`) and passes them as typed props to `<RegisterForm branches={branches} />`. The form mounts the canonical `CustomDropdown<string>` with `searchable={true}`, `size="md"`, and clear validation. The registration route (`/api/auth/register`) validates `branchId` and initializes `assignedBranchIds: [branchId]`.
- **Trade-offs:**
  - *Business & Operational Continuity:* High. Zero network waterfall on page load; candidate selects branch immediately; pending approvals display proposed branch natively.
  - *Engineering Cost & Complexity:* Minimal (~40 LOC across 3 files).
  - *Security & Privacy:* Completely avoids exposing a public unauthenticated `/api/branches` endpoint.
  - *Performance:* Database query during SSR executes in <2ms on indexed tables.

### Option 2: Client-Side Fetching via Public API Endpoint (`/api/auth/branches`)
- **Concept:** Expose an unauthenticated public API route and fetch branches inside `useEffect` on `RegisterForm`.
- **Trade-offs:**
  - *Cons:* Introduces a client-side network waterfall (dropdown shows a loading spinner or disabled state until fetch completes), exposes branch metadata publicly, and adds unnecessary client boilerplate.

### Option 3: Optional Branch Selection
- **Concept:** Identical to Option 1, but allow `branchId` to be blank for central office/HQ staff.
- **Trade-offs:**
  - *Cons:* Increases the risk that branch staff skip the field, leaving the administrator with unassigned registrations.

## 3. Decision

We adopt **Option 1: Server-Rendered Branch Props (RSC Data Fetching) + Canonical `CustomDropdown`**.

### Architectural Directives:
1. **Server Component Pre-Fetching:**
   - In `src/app/(auth)/register/page.tsx`, query active branches via `prisma.branch.findMany({ select: { id: true, name: true, city: true }, orderBy: { name: "asc" } })`.
   - Pass `branches` directly as a prop to `<RegisterForm branches={branches} />`.
2. **SSOT Component Usage & Styling:**
   - In `src/components/auth/RegisterForm.tsx`, import and render canonical `CustomDropdown<string>` from `@/components/ui/CustomDropdown`.
   - Configure `size="md"`, `searchable={true}`, `searchPlaceholder="Cari nama cabang atau kota..."`, and label format: `"{branch.name} ({branch.city})"`.
   - Add field label `"CABANG PENUGASAN"` with required indicator.
3. **Form State & Client Validation:**
   - Track `branchId` state in `RegisterForm`.
   - Validate that `branchId` is selected before form submission; display inline field error `"Cabang penugasan wajib dipilih."` if empty.
4. **Backend Payload & Route Validation:**
   - In `src/app/api/auth/register/route.ts`, update `registerSchema` to require `branchId: z.string().min(1, "Branch is required")`.
   - Verify `branchId` exists in `prisma.branch`.
   - Create user record with `assignedBranchIds: [branchId]`.
5. **No Database Migration Required:**
   - `model User` in `prisma/schema.prisma` already defines `assignedBranchIds String[] @default([])`. Zero schema changes needed.

## 4. Consequences & Risks

### Positive:
- Streamlined onboarding: New accounts immediately capture candidate branch placement.
- Instant page load without client-side loading spinners or request waterfalls.
- High usability with real-time branch search powered by `CustomDropdown`.
- No new public API routes needed; SSR props keep architecture secure and simple.

### Negative / Accepted Debt:
- Applicants without a specific branch (e.g. general administrative staff) must select a designated HQ/National branch.

