# ADR-0104: Strict Test-Environment Header Isolation and Inventory Auth Standardization

- **Status:** APPROVED
- **Date:** 2026-11-11
- **Deciders:** Senior Software Engineer, Lead Architect

---

## 1. Context & Business Problem

During initial implementation of the warehouse return inspection flow (ADR-0050), integration tests in `inventoryApi.test.ts` were executed directly under the Node native test runner (`node --test`), where NextAuth request cookie contexts are not mounted. 

To enable automated testing without an extensive session harness, two testing accommodations were introduced into route handlers:
1. **Unconstrained Header Consumption:**  
   Across `borrow/route.ts`, `borrow/[id]/route.ts`, `return/route.ts`, and `settle/route.ts`, the incoming request header `x-user-role` (and `x-user-name`) is parsed directly to establish caller permissions. Crucially, this header check is executed **without verifying that the runtime environment is an automated test runner**.
   In production and staging environments, if an external client transmits `x-user-role: admin`, the application prioritizes this custom header over the authentic NextAuth session, creating a severe **OWASP A01: Broken Access Control (Privilege Escalation)** vulnerability.
2. **Implicit Role Fallback in `/return`:**  
   In `src/app/api/marcom/inventory/borrow/[id]/return/route.ts`, the role fallback evaluates to:
   ```ts
   (process.env.NODE_ENV === "production" ? "viewer" : "warehouse")
   ```
   In non-production environments (development or staging preview deployments where `NODE_ENV !== "production"`), any unauthenticated HTTP request to `/return` automatically inherits the `warehouse` role and bypasses authentication (no 401 response). This directly violates the **Four-Eyes Principle and Segregation of Duties mandated by ADR-0050** and introduces an environment parity flaw (dev/prod drift).

Furthermore, authentication and test-header resolution logic is duplicated with minor variances across 4 disparate files. A single, hardened, and test-isolated authentication helper is required.

---

## 2. Options Considered

### Option 1: Centralized Inventory Auth Helper (`inventoryAuth.ts`) with Strict `NODE_ENV === "test"` Isolation (Chosen)
- Extract all authentication, role normalization, and test harness resolution into `src/lib/server/inventoryAuth.ts`.
- Enforce strict environment guarding:
  ```ts
  const isTest = process.env.NODE_ENV === "test";
  const testRole = isTest ? request.headers.get("x-user-role") : null;
  const testName = isTest ? request.headers.get("x-user-name") : null;
  ```
- In production, staging, and development:
  - Outside test execution, `x-user-role` and `x-user-name` are completely ignored.
  - Role is derived strictly from verified NextAuth session (`session.user.role`).
  - Unauthenticated requests to `/return` (and all inventory endpoints) strictly return `401 Unauthorized`.
  - Fallback string `"warehouse"` is eliminated entirely.
- Apply `resolveInventoryAuth` across `borrow`, `borrow/[id]`, `return`, and `settle`.
- *Trade-offs:*
  - Pros: Completely closes the privilege escalation vulnerability; enforces environment parity; DRY architecture; 100% preserves existing test suite (all 1091+ tests pass unmodified).
  - Cons: Requires refactoring authentication calls in 4 route files.

### Option 2: Inline In-File Fix across 4 Route Handlers
- Add `if (process.env.NODE_ENV === "test")` directly inside each file without creating a central helper.
- *Trade-offs:*
  - Pros: No new file.
  - Cons: Duplicates boilerplate across 4 endpoints; prone to future drift if endpoints are added or updated.

### Option 3: Complete Removal of Test Headers and Rewriting Test Suite with NextAuth Mocks
- Eliminate `x-user-role` completely and rewrite all 40+ tests in `inventoryApi.test.ts` to mock the NextAuth session store.
- *Trade-offs:*
  - Pros: Server code contains zero test header awareness.
  - Cons: High friction, fragile setup in Node native test runner (`node --test`), high risk of breaking existing regression baselines.

---

## 3. Decision

Adopt **Option 1**:
1. Implement `src/lib/server/inventoryAuth.ts` exporting:
   ```ts
   export async function resolveInventoryAuth(request: Request): Promise<{
     session: Session | null;
     role: MarcomRole;
     userName: string;
     userId?: string;
     isAuthenticated: boolean;
   }>
   ```
2. Restrict reading of `x-user-role` and `x-user-name` headers strictly to `process.env.NODE_ENV === "test"`.
3. Eliminate the non-production `"warehouse"` fallback in `/return/route.ts`. All endpoints must reject unauthenticated requests with `401 Unauthorized`.
4. Refactor `POST /borrow`, `PUT /borrow/[id]`, `POST /borrow/[id]/return`, and `POST /borrow/[id]/settle` to consume `resolveInventoryAuth`.

---

## 4. Consequences & Mitigations

### Positive Consequences
- **Security Hardening (A01: Broken Access Control Resolved):** External clients can no longer spoof `admin` or `warehouse` privileges via custom headers in production or staging.
- **Environment Parity Restored:** Staging and development environments enforce identical authorization rules as production, eliminating false-positive QA testing passes.
- **ADR-0050 & ADR-0100 Compliance:** Reinstates the strict Segregation of Duties and test-harness isolation clauses mandated by previous ADRs.
- **Codebase Health & Maintainability:** Replaces fragmented duplicate authentication code with a single, highly tested SSOT helper.

### Accepted Trade-offs & Mitigations
- **Test Runner Invariant:** Automated tests executing via `node --test` must ensure `NODE_ENV === "test"` (default in npm test script) to continue using `x-user-role` test headers.


