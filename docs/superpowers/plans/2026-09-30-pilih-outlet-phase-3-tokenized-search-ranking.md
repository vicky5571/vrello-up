# Pilih Outlet Phase 3: Tokenized Search & Relevance Ranking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement multi-token whitespace search parsing (allowing queries like "Berkah Semarang" across name and city) and relevance-weighted ordering to replace arbitrary `code: "asc"` sorting.

**Architecture:** Extend `buildOutletSearchWhere` in `outletsSearchFilter.ts` to tokenize search strings on whitespace and construct an `AND` array of token `OR` clauses across `[code, name, city, picName]`. Add a pure relevance-scoring function `scoreOutletSearchRelevance(outlet, query)` to prioritize exact matches and prefix matches in `/api/marcom/outlets/route.ts` when returning candidate search results.

**Tech Stack:** Next.js 15, Prisma ORM, TypeScript 5, Node test runner (`node:test`).

**Spec:** [`docs/audit-add-placement-outlet-selection.md`](file:///Users/mac/Web%20Development/vrello-up/docs/audit-add-placement-outlet-selection.md)

## Global Constraints

- Performance Guardrail: Hard limit cap of 15-50 candidate records must remain intact to protect database latency across ~25,000 retail outlets.
- SQL Safety: Do not write raw SQL injections; utilize Prisma's strongly-typed `Prisma.OutletWhereInput`.
- Backward Compatibility: Single-word queries (e.g. `"Berkah"`) and filter parameters (`branchId`, `tier`, `type`, `status`) must continue to work with identical semantics.
- Fast Feedback: Run tests with `npm test -- src/app/api/marcom/outlets/outletsSearch.test.ts`.

---

## File Structure

```text
src/app/api/marcom/outlets/
├── outletsSearchFilter.ts                     # Modified: multi-token parsing, scoreOutletSearchRelevance helper
├── outletsSearch.test.ts                      # Extended: unit tests for multi-token and relevance ranking
└── route.ts                                   # Modified: integrate relevance ranking on search results
```

---

### Task 1: Multi-Token Whitespace Query Parsing

**Files:**
- Modify: `src/app/api/marcom/outlets/outletsSearchFilter.ts:107-119`
- Test: `src/app/api/marcom/outlets/outletsSearch.test.ts`

**Interfaces:**
- Produces:
  - Multi-token where-clause handling: for `q = "Berkah Semarang"`, produces `{ AND: [token1Clause, token2Clause] }`

- [ ] **Step 1: Write the failing test for multi-token parsing**

```typescript
// Add to src/app/api/marcom/outlets/outletsSearch.test.ts
test("builds multi-token AND condition when query contains multiple whitespace-separated words", () => {
  const where = buildOutletSearchWhere({ q: "Berkah Semarang" });
  assert.ok(where.AND, "Expected where.AND to be defined for multi-token search");
  assert.equal(Array.isArray(where.AND), true);
  assert.equal((where.AND as unknown[]).length, 2);

  const firstTokenClause = (where.AND as any[])[0];
  assert.ok(firstTokenClause.OR, "Expected each token clause to have OR condition");
  assert.equal(firstTokenClause.OR[0].code.contains, "Berkah");

  const secondTokenClause = (where.AND as any[])[1];
  assert.equal(secondTokenClause.OR[2].city.contains, "Semarang");
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test -- src/app/api/marcom/outlets/outletsSearch.test.ts
```

- [ ] **Step 3: Implement multi-token parsing in `outletsSearchFilter.ts`**

In `src/app/api/marcom/outlets/outletsSearchFilter.ts`:
```typescript
  const trimmedQuery = typeof q === "string" ? q.trim() : "";
  if (trimmedQuery.length > 0) {
    const tokens = trimmedQuery.split(/\s+/).filter(Boolean);
    if (tokens.length === 1) {
      const contains = { contains: tokens[0], mode: "insensitive" as const };
      where.OR = [
        { code: contains },
        { name: contains },
        { city: contains },
        { picName: contains },
      ];
    } else if (tokens.length > 1) {
      where.AND = tokens.map((token) => {
        const contains = { contains: token, mode: "insensitive" as const };
        return {
          OR: [
            { code: contains },
            { name: contains },
            { city: contains },
            { picName: contains },
          ],
        };
      });
    }
  }
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npm test -- src/app/api/marcom/outlets/outletsSearch.test.ts
```

---

### Task 2: Pure Relevance Scorer & Candidate Ranking

**Files:**
- Modify: `src/app/api/marcom/outlets/outletsSearchFilter.ts`
- Modify: `src/app/api/marcom/outlets/route.ts:50-76`
- Test: `src/app/api/marcom/outlets/outletsSearch.test.ts`

**Interfaces:**
- Produces:
  - `scoreOutletSearchRelevance(outlet: { code?: string | null; name?: string | null; city?: string | null; picName?: string | null }, query: string): number`
  - `rankOutletsByRelevance<T extends { code?: string | null; name?: string | null; city?: string | null; picName?: string | null }>(outlets: T[], query: string): T[]`

- [ ] **Step 1: Write the failing test for relevance ranking**

```typescript
// Add to src/app/api/marcom/outlets/outletsSearch.test.ts
import { scoreOutletSearchRelevance, rankOutletsByRelevance } from "./outletsSearchFilter.ts";

test("scoreOutletSearchRelevance prioritizes exact and prefix matches over deep substrings", () => {
  const query = "Berkah";
  const exact = { name: "Berkah", code: "O-001" };
  const prefix = { name: "Berkah Cellular", code: "O-002" };
  const substring = { name: "Toko Berkah Abadi", code: "O-003" };
  const unrelated = { name: "Mitra Ponsel", code: "O-004", city: "Berkah Raya" };

  assert.ok(scoreOutletSearchRelevance(exact, query) > scoreOutletSearchRelevance(prefix, query));
  assert.ok(scoreOutletSearchRelevance(prefix, query) > scoreOutletSearchRelevance(substring, query));
  assert.ok(scoreOutletSearchRelevance(substring, query) > scoreOutletSearchRelevance(unrelated, query));
});

test("rankOutletsByRelevance sorts candidates by score descending", () => {
  const query = "Berkah";
  const candidates = [
    { id: "3", name: "Toko Berkah Abadi", code: "O-003" },
    { id: "1", name: "Berkah", code: "O-001" },
    { id: "2", name: "Berkah Cellular", code: "O-002" },
  ];

  const ranked = rankOutletsByRelevance(candidates, query);
  assert.deepEqual(ranked.map((c) => c.id), ["1", "2", "3"]);
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test -- src/app/api/marcom/outlets/outletsSearch.test.ts
```

- [ ] **Step 3: Implement relevance scoring in `outletsSearchFilter.ts`**

```typescript
export function scoreOutletSearchRelevance(
  outlet: { code?: string | null; name?: string | null; city?: string | null; picName?: string | null },
  query: string
): number {
  if (!query || typeof query !== "string") return 0;
  const q = query.trim().toLowerCase();
  const code = (outlet.code || "").toLowerCase();
  const name = (outlet.name || "").toLowerCase();
  const city = (outlet.city || "").toLowerCase();
  const pic = (outlet.picName || "").toLowerCase();

  let score = 0;
  // Exact matches
  if (code === q) score += 100;
  if (name === q) score += 90;

  // Prefix matches
  if (code.startsWith(q)) score += 60;
  if (name.startsWith(q)) score += 50;

  // Substring matches
  if (name.includes(q)) score += 30;
  if (code.includes(q)) score += 20;
  if (city.includes(q)) score += 10;
  if (pic.includes(q)) score += 5;

  return score;
}

export function rankOutletsByRelevance<T extends { code?: string | null; name?: string | null; city?: string | null; picName?: string | null }>(
  outlets: T[],
  query: string
): T[] {
  if (!query || !query.trim()) return outlets;
  return [...outlets].sort((a, b) => {
    const scoreA = scoreOutletSearchRelevance(a, query);
    const scoreB = scoreOutletSearchRelevance(b, query);
    return scoreB - scoreA;
  });
}
```

- [ ] **Step 4: Connect relevance ranking into `/api/marcom/outlets/route.ts`**

When `query` is provided, apply `rankOutletsByRelevance` to the fetched outlets before returning the response slice:
```typescript
  const ranked = query ? rankOutletsByRelevance(data, query) : data;
  return Response.json({ total: ranked.length, data: ranked });
```

- [ ] **Step 5: Run full test suite to verify passes**

```bash
npm test -- src/app/api/marcom/outlets/outletsSearch.test.ts
```
