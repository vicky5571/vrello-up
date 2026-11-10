# Design Spec: Strict Test-Environment Header Isolation & Inventory Auth Standardization

- **Date:** 2026-11-11
- **Status:** APPROVED
- **Author:** Senior Software Engineer & Principal Systems Architect
- **Target ADR:** [ADR-0104](../../adr/0104-strict-test-environment-header-isolation-and-inventory-auth-standardization.md)

---

## 1. Executive Summary & Threat Model

This specification locks down the inventory authentication perimeter across all operational equipment routes (`/borrow`, `/borrow/[id]`, `/return`, `/settle`), eliminating an open privilege escalation vector (Temuan 6).

### 1.1. Threat Vectors Addressed
1. **Header Injection in Production/Staging:** An attacker submitting `x-user-role: admin` or `x-user-role: warehouse` via HTTP headers could previously override the authentic NextAuth session, gaining unearned authorization to approve loans, reduce stock, or process asset returns.
2. **Environment Parity Violation in `/return`:** Non-production environments implicitly defaulted unauthenticated callers to the `warehouse` role, masking authorization bugs and violating the Four-Eyes Principle (ADR-0050).

This design centralizes authentication resolution into an isolated SSOT helper (`src/lib/server/inventoryAuth.ts`), restricting test-header evaluation strictly to `process.env.NODE_ENV === "test"` and mandating `401 Unauthorized` across all endpoints for unauthenticated requests.

---

## 2. Centralized Helper Specification (`src/lib/server/inventoryAuth.ts`)

### 2.1. Pure Interface & Contract
```ts
import type { Session } from "next-auth";
import type { MarcomRole } from "@/lib/marcom/guards";

export interface InventoryAuthResolution {
  session: Session | null;
  role: MarcomRole;
  userName: string;
  userId?: string;
  isAuthenticated: boolean;
}

export async function resolveInventoryAuth(
  request: Request
): Promise<InventoryAuthResolution>;
```

### 2.2. Resolution Algorithm
1. **Attempt NextAuth Session Resolution:**
   - Execute `session = await auth().catch(() => null)`.
2. **Strict Test Environment Check:**
   - Evaluate `const isTestEnv = process.env.NODE_ENV === "test";`.
   - If `isTestEnv === true`:
     - Extract `testRole = request.headers.get("x-user-role")`.
     - Extract `testName = request.headers.get("x-user-name")`.
   - If `isTestEnv === false`:
     - `testRole = null; testName = null;` (external headers are strictly ignored).
3. **Authentication Evaluation:**
   - `isAuthenticated = Boolean(session?.user?.id || (isTestEnv && testRole))`.
4. **Role Normalization:**
   - Resolve raw role: `const rawRole = (testRole || session?.user?.role || "viewer").toLowerCase()`.
   - Normalize strictly to `MarcomRole`:
     `["admin", "supervisor", "warehouse", "staff"].includes(rawRole) ? rawRole : "viewer"`.
5. **Caller Identity Resolution:**
   - Resolve display name:
     `userName = (session?.user?.name || session?.user?.email || testName || "Authorized User").trim()`.
   - Return `{ session, role, userName, userId: session?.user?.id, isAuthenticated }`.

---

## 3. Route Handlers Harmonization

### 3.1. Standardized Invariant at Top of All Inventory Mutation Endpoints
Every route handler (`POST /borrow`, `PUT /borrow/[id]`, `POST /return`, `POST /settle`) must execute:
```ts
const { session, role, userName, isAuthenticated } = await resolveInventoryAuth(request);

if (!isAuthenticated) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

### 3.2. Concrete Route Updates
1. **`src/app/api/marcom/inventory/borrow/route.ts` (`POST`):**
   - Replace manual session & role resolution with `resolveInventoryAuth`.
   - Validate `hasPermission(role, "REQUEST_BORROW")`.
2. **`src/app/api/marcom/inventory/borrow/[id]/route.ts` (`PUT`):**
   - Replace manual session & role resolution with `resolveInventoryAuth`.
   - Enforce transition permissions using verified `role` and `userName`.
3. **`src/app/api/marcom/inventory/borrow/[id]/return/route.ts` (`POST`):**
   - Remove `(process.env.NODE_ENV === "production" ? "viewer" : "warehouse")`.
   - Use `resolveInventoryAuth`. Reject unauthenticated requests with `401`.
   - Validate `hasPermission(role, "PROCESS_RETURN")`.
4. **`src/app/api/marcom/inventory/borrow/[id]/settle/route.ts` (`POST`):**
   - Replace manual session & role resolution with `resolveInventoryAuth`.
   - Set `settledBy = userName`.
   - Validate `hasPermission(role, "PROCESS_RETURN")`.

---

## 4. Acceptance Criteria (Gherkin Scenarios)

### AC-1: Header Ignored in Production / Non-Test Environment
- **Given** `NODE_ENV` is set to `"production"` or `"development"`
- **And** an incoming request with header `x-user-role: admin` and no valid session
- **When** calling any inventory endpoint (`/borrow`, `/borrow/[id]`, `/return`, `/settle`)
- **Then** the server responds with HTTP 401 Unauthorized
- **And** the `x-user-role` header is completely ignored.

### AC-2: Session Overrides Injected Header in Production
- **Given** an authenticated user with role `staff`
- **And** an incoming request with header `x-user-role: admin`
- **When** in production mode (`NODE_ENV === "production"`)
- **Then** `resolveInventoryAuth` establishes `role = "staff"`
- **And** administrative actions (such as `PUT /borrow/[id]` status `APPROVED`) are rejected with HTTP 403 Forbidden.

### AC-3: Automated Test Runner Header Recognition
- **Given** `NODE_ENV` is set to `"test"`
- **When** an integration test sends `x-user-role: warehouse` without cookies
- **Then** `resolveInventoryAuth` returns `isAuthenticated: true` and `role: "warehouse"`
- **And** test execution succeeds without requiring NextAuth cookie stores.

### AC-4: Elimination of Implicit Warehouse Fallback in `/return`
- **Given** `NODE_ENV` is set to `"development"`
- **When** an unauthenticated request hits `POST /api/marcom/inventory/borrow/[id]/return`
- **Then** the server responds with HTTP 401 Unauthorized
- **And** does NOT grant the `warehouse` role.

### AC-5: Complete Regression Suite Pass
- **Given** the refactored route handlers
- **When** executing `npm test`
- **Then** all 1091+ tests pass with 0 failures.

---

## 5. Non-Goals

1. **No UI Changes:** No alterations to frontend components or user interfaces.
2. **No Schema Migrations:** Database schema in `prisma/schema.prisma` remains untouched.
3. **No Global Auth Replacement:** This specifically standardizes inventory operational endpoints (`/borrow`, `/borrow/[id]`, `/return`, `/settle`), where isolated integration testing was introduced.

---

## 6. Verification Checklist

- [ ] `npm run drift:check` passes with zero violations.
- [ ] Dedicated unit tests in `src/lib/server/inventoryAuth.test.ts` verify all environment conditions (`test` vs `production`/`development`).
- [ ] Integration tests in `inventoryApi.test.ts` pass with 0 failures.
- [ ] `npm test` runs with 0 failures across all 195+ suites.
- [ ] `npm run build:check` compiles with 0 errors.



