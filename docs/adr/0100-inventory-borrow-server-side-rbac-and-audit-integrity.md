# ADR-0100: Inventory Borrow Server-Side RBAC Guard and Audit Integrity

- **Status:** APPROVED
- **Date:** 2026-11-10
- **Deciders:** Senior Software Engineer, Lead Architect

---

## 1. Context & Business Problem

In *vrello-up*, the Field Event Inventory & Equipment subsystem manages physical assets (folding tents, sound systems, wireless walkie-talkies, display banners) loaned to marketing and sales staff for brand activations.

ADR-0050 established the `warehouse` role and isolated return inspections via `/api/marcom/inventory/borrow/[id]/return` with strict `hasPermission(userRole, "PROCESS_RETURN")` server guards. However, a comprehensive security and architectural audit revealed that the core borrowing lifecycle handlers remained unprotected on the server:

1. **Missing Server-Side Role Enforcement in `PUT /borrow/[id]`:**
   - In `src/app/api/marcom/inventory/borrow/[id]/route.ts`, the `PUT` handler only checks `ALLOWED_TRANSITIONS` based on status strings.
   - It performs zero authentication checks (`auth()`) and zero RBAC checks (`hasPermission()`).
   - Any authenticated user (including `staff` or `viewer`) can bypass the frontend UI and send HTTP requests to transition status from `PENDING` to `APPROVED`, or from `APPROVED` to `ACTIVE` (which automatically decrements physical stock `availableUnits`).

2. **Audit Trail Impersonation & Default Fallback in Approval Flow:**
   - In `PUT /borrow/[id]`, the `approvedBy` field is populated directly from the client request body (`approvedBy || "Admin"`).
   - In the frontend UI (`InventoryView.tsx`), status changes only transmit `{ status: newStatus }`, causing all approvals to be permanently attributed to the hardcoded string `"Admin"`.
   - This destroys non-repudiation and auditability during equipment loss or asset disputes.

3. **Unprotected Creation in `POST /borrow`:**
   - In `src/app/api/marcom/inventory/borrow/route.ts`, `POST` accepts requests from any caller without verifying the `REQUEST_BORROW` permission, allowing unauthorized roles (such as `viewer`) to spawn pending loan records.

To enforce the four-eyes principle, protect warehouse assets, and maintain an immutable audit log, server-side RBAC and session-derived approver identity must be enforced.

---

## 2. Options Considered

### Option 1: In-Handler Granular RBAC + Server-Derived Session Identity (Chosen)
- In `POST /borrow`:
  - Call `auth()` to extract authenticated user session.
  - Reject unauthorized requests with 401 (if no session).
  - Verify role using `hasPermission(userRole, "REQUEST_BORROW")`. Reject with 403 if unauthorized.
- In `PUT /borrow/[id]`:
  - Call `auth()` to resolve caller session and role.
  - Guard transitions by requested `status`:
    - `status === "APPROVED"`: Require `hasPermission(userRole, "APPROVE_BORROW")` (`admin`, `supervisor`, `warehouse`). Derive `approvedBy` strictly from `session.user.name || session.user.email` (ignore client body). Set `approvedAt = new Date()`.
    - `status === "ACTIVE"`: Require `hasPermission(userRole, "MANAGE_INVENTORY")` (`admin`, `supervisor`, `warehouse`).
    - `status === "CANCELLED"`: Require `hasPermission(userRole, "MANAGE_INVENTORY")` OR allow the requester if status is still `PENDING`.
    - Metadata updates (notes, PIC, purpose): Require `MANAGE_INVENTORY` or requester when `PENDING`.
  - Maintain compatibility with isolated test runners by checking `x-user-role` header strictly in test environments (`process.env.NODE_ENV === "test"`).
- *Trade-offs:*
  - **Pros:** Zero breaking changes to existing client code; preserves existing frontend contract; closes privilege escalation and audit spoofing immediately; minimal complexity.
  - **Cons:** Role validation logic branches based on target transition state inside the route handler.

### Option 2: Dedicated RPC Action Endpoints (`/approve`, `/pickup`, `/cancel`)
- Discard multipurpose status updates in `PUT /borrow/[id]` and implement dedicated sub-endpoints:
  - `POST /api/marcom/inventory/borrow/[id]/approve`
  - `POST /api/marcom/inventory/borrow/[id]/pickup`
  - `POST /api/marcom/inventory/borrow/[id]/cancel`
- *Trade-offs:*
  - **Pros:** Strict RESTful separation of concerns per transition action.
  - **Cons:** Breaking changes across multiple frontend components (`BorrowDetailModal.tsx`, `InventoryView.tsx`, `BorrowTrackingBoard.tsx`); requires updating all tests and increases endpoint footprint.

### Option 3: Next.js Edge Middleware Dynamic Route Guarding
- Intercept and evaluate roles within `src/middleware.ts` for all `/api/marcom/inventory/borrow/*` paths.
- *Trade-offs:*
  - **Pros:** Enforced at edge proxy layer before route handler execution.
  - **Cons:** Impossible to inspect JSON request payload (`body.status`) without reading the stream in edge runtime, which breaks downstream route handler consumption in Next.js.

---

## 3. Decision

Adopt **Option 1**:
1. Add strict server-side RBAC to `POST /api/marcom/inventory/borrow` checking `hasPermission(role, "REQUEST_BORROW")`.
2. Add state-transition-specific RBAC guards in `PUT /api/marcom/inventory/borrow/[id]`:
   - Transition to `APPROVED` requires `APPROVE_BORROW`.
   - Transition to `ACTIVE` requires `MANAGE_INVENTORY`.
   - Transition to `CANCELLED` requires `MANAGE_INVENTORY` or matching requester while `PENDING`.
3. Eliminate client-supplied `approvedBy` override; force `approvedBy` to be resolved from verified server session (`session.user.name || session.user.email`).
4. Support test execution in `inventoryApi.test.ts` via test-environment header check.

---

## 4. Consequences & Mitigations

### Positive Consequences
- **Elimination of Privilege Escalation:** Viewers and unprivileged Staff can no longer approve loans or trigger stock decrements directly via API.
- **Audit Integrity Guarantee:** `approvedBy` reflects the authentic authenticated user who approved the loan, preventing audit repudiation.
- **Client Stability:** Existing frontend state and modal interactions remain 100% compatible.

### Accepted Trade-offs & Mitigations
- **Requester Ownership Matching:** In the current schema, `BorrowRecord` stores `borrowerName` as a string rather than a foreign key to `User`. Cancellation authorization for non-admin requesters checks `borrowerName` against `session.user.name` (or allows `MANAGE_INVENTORY`). A formal user relationship migration is deferred to avoid database downtime.
- **Test Harness Consideration:** Tests without a full NextAuth session mock can pass `x-user-role` headers during test runner invocations (`NODE_ENV === "test"`).


