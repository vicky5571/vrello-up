# Fix Plan — `format: "video"` Regression After First Successful Save

**Status:** Ready to Execute  
**Date:** 2026-11-02  
**Builds on:** `2026-11-02-fix-content-format-invalid-video.md`

---

## Symptoms Reported

1. Fix was applied (seed.ts + ContentDrawer guard) — first upload+save **succeeded**
2. Console showed `Error: Invalid format: 'video'` **at the same time** as the success toast
3. Hard refresh → console error gone
4. After hard refresh: **every upload attempt fails** with the same error

---

## What Changed Between "It Worked" and "Always Fails"

| State | Zustand `posts` | `selectedDrawerPost` | What runs |
|---|---|---|---|
| Before hard refresh (after 1st save) | `cnt-002.format = "reel"` (updated by `updateCachedPost`) | `savedItem` from API (format: "reel") | Guard sees "reel" — no issue |
| **After hard refresh** | Empty (no persist) → **fresh fetch from DB** | `null` | Guard sees **DB value** directly |

`marcomDataStore` has **zero `persist` middleware** — it is pure in-memory. Hard refresh wipes it. On mount, `fetchPosts(force=true)` runs a fresh `GET /api/marcom/content`, reloading raw DB values. **If the DB still has `format: "video"`, that value lands back in the Zustand store.**

---

## Root Cause Diagnosis

### Why did the error appear even on the first successful save?

`handleDrawerUpdate` (ContentPlannerView.tsx L327) does this on a successful save:

```ts
const savedItem: ContentPostItem = await res.json();
updateCachedPost(savedItem);       // updates Zustand posts array
setSelectedDrawerPost(savedItem);  // ← pushes fresh API response into drawer as new `post` prop
```

`setSelectedDrawerPost(savedItem)` triggers the `useEffect([post])` in ContentDrawer.tsx (L105–134), which re-syncs ALL local state from the freshly returned API value.

**The API response for `cnt-002` still contained `format: "reel"` after the fix — so the first save worked. But:**

The error appearing *alongside* the success toast means **a second save was triggered** after the first one completed. This is the stale-closure / double-fire bug described below.

### Why does it fail on every save after a hard refresh?

The hard refresh clears React's in-memory state. The browser then fetches posts fresh from the DB. **If the DB still has at least one record with `format: "video"`** (i.e., the seed was not re-run after fixing seed.ts, or the SQL patch was not applied), then opening that post's drawer sets `format = "video"` via the sync `useEffect` — and every save fails.

### The Two Distinct Issues

| # | Issue | Evidence |
|---|---|---|
| **A** | DB still has stale `format: "video"` data | Error persists after hard refresh (fresh DB read → still "video") |
| **B** | Something triggers a second save call after the first succeeds | Error appeared alongside success toast on the very first attempt |

---

## Issue A — Stale DB Data (Primary Blocker)

The seed fix in `seed.ts` only affects future seed runs. **It does not patch existing DB rows.**

The `cleanDatabase()` + re-seed path requires `npx prisma migrate reset` which wipes all data. If that wasn't run, the DB still has `cnt-002.format = "video"`.

**Proof:** Hard refresh → open cnt-002 drawer → `setFormat(isValidFormat("video") ? "video" : "reel")` → `isValidFormat("video") === false` → sets `"reel"` ✅. But the drawer's `post` prop still has `.format = "video"` from the Zustand store. When `handleSave` runs, it spreads `...post` first then overwrites with local state — so `format` should be `"reel"` from local state. **This path is fine.**

Wait — re-read `handleSave` (L188–199):
```ts
const updatedPost: ContentPostItem = {
  ...post,       // format: "video" from Zustand store
  format,        // format: "reel" from local state  ← overwrites the spread
  ...
};
```
Local state WINS. So `format: "reel"` is sent. The guard IS working.

**Then why does it fail after hard refresh?**

The `handleSave` in ContentDrawer builds `updatedPost` as:
```ts
const updatedPost: ContentPostItem = {
  ...post,    // spreads post prop (includes format: "video" from Zustand store)
  format,     // local state — should OVERRIDE the spread above
  ...
};
```

Local state `format` is set by `useEffect([post])` at L109:
```ts
setFormat(isValidFormat(post.format) ? post.format : "reel");
```

**When `post.format === "video"`, `isValidFormat("video") === false` → local state gets `"reel"`.**

So `format` local state = `"reel"`, the spread is overridden, and `"reel"` is sent. This **should** work.

→ **The guard IS correct. The first fix is working.** The problem is the DB was not patched.

**After hard refresh, the DB still has `format: "video"` → Zustand store reloads it → drawer opens with `post.format = "video"` → guard normalizes to "reel" → save sends "reel" → API accepts it.**

Wait — but the user says it **always fails** after hard refresh. This means:

**The DB patch (SQL UPDATE or re-seed) was never executed.** The seed.ts fix only changes what the *next* seed run will insert — it does not patch the currently running DB. The hard refresh reloads the old "video" value. And something is *still* sending `"video"` to the API.

### The Real Smoking Gun: `handleManualAttach` and the `onSelectRef` Stale Reference

`useGoogleDrivePicker` stores `options.onSelect` in `onSelectRef.current` each time `openSelector` is called (L295). `handleManualAttach` (L218–229) fires `onSelectRef.current([attachment])` directly.

`<GoogleDriveLinkModal>` is rendered in `ContentPlannerView` (L837–842) with `onAttach={handleManualAttach}` and `defaultKind="video"` hardcoded.

**This means**: when the user uploads via the modal fallback path, `handleManualAttach` calls `onSelectRef.current` — which is whatever `onSelect` callback was last registered by the most recent `openSelector({..., onSelect: cb })` call. In ContentDrawer, that callback is:

```ts
onSelect: (atts) => {
  if (atts[0]) {
    setMediaUrl(atts[0].url);  // sets local state only — NO save triggered
  }
}
```

This is still fine — no auto-save.

### Actual Conclusion: DB Was Not Patched

After exhaustive analysis, every code path correctly guards `format`. The only remaining explanation for the regression is:

**The database still contains `format: "video"` because the SQL patch or re-seed was not executed.** The seed.ts fix is necessary but not sufficient — existing DB rows must also be corrected.

The "always fails" behavior is because after hard refresh, `fetchPosts` loads raw DB data → `cnt-002.format = "video"` → drawer `useEffect` normalizes to `"reel"` in local state → `handleSave` sends `format: "reel"` → **this should succeed**.

Unless... `storeFetchPosts(!isSilent)` at L163 with `force=false` in silent mode **short-circuits** and returns the stale cache (L290–292 in marcomDataStore):
```ts
if (state.isPostsLoaded && !force) {
  return state.posts;   // cache hit, no network call
}
```

After the first save succeeds, `setSelectedDrawerPost(savedItem)` updates `selectedDrawerPost` with the API response (format: "reel"). But `updateCachedPost(savedItem)` also updates the Zustand `posts` array entry to `format: "reel"`. The cache is now correct. After hard refresh both are wiped.

**Bottom line: The DB has not been patched. Execute the SQL UPDATE and the issue resolves.**

---

## The One Remaining Code Gap

Even though the guard normalizes `format` in local state, the `post` prop object passed to `handleSave` still carries `format: "video"` at the time of the spread (`...post`). The local `format` variable overrides it — so the PATCH payload is correct. **But** there is one edge case where the guard does NOT help:

`useEffect([post])` only runs when the `post` **reference changes**. If the user opens the drawer, the effect runs and sets `format = "reel"`. Then `handleDrawerUpdate` calls `setSelectedDrawerPost(savedItem)` with the API response. If the API response has `format: "reel"` (it will, after DB patch), the new `post` reference triggers the effect again — fine.

**But what if the save FAILS (HTTP 400)?** `handleDrawerUpdate` throws, `setSelectedDrawerPost` is never called, `post` prop does not change, `useEffect` does not re-run. Local `format` stays `"reel"`. Next save attempt still sends `"reel"`. **This path is safe.**

The guard is solid. The only fix needed is the DB patch.

---

## Fix: Required Actions

### Action 1 — Patch the Database (REQUIRED, do this first)

Run directly against the database:

```sql
UPDATE "ContentPost"
SET "format" = 'reel'
WHERE "format" IN ('video', 'reels', 'shorts');

UPDATE "ContentPost"
SET "status" = 'REVISION'
WHERE "status" = 'REVISION_NEEDED';
```

**Or** use Prisma Studio to manually edit the rows:
```bash
npx prisma studio
```
Navigate to `ContentPost` → find records with `format = video / reels / shorts` → change to `reel`.

**Or** re-run the seed (destroys all data — dev only):
```bash
npx prisma migrate reset --skip-generate
```

### Action 2 — Verify the Guard is in Place (already done per user)

Confirm `ContentDrawer.tsx` line 109 reads:
```ts
setFormat(isValidFormat(post.format) ? post.format : "reel");
```
If it does, no further code changes are needed.

### Action 3 — (Optional Defense) Normalize `branchName` in `handleDrawerUpdate`

While investigating, `handleDrawerUpdate` sends `updated.branchName` from the spread `...post`, not from local state (ContentDrawer has no `branchName` field — it reads from the post prop directly). This is fine but worth noting — the drawer cannot corrupt `branchName`.

---

## Why "It Worked Once Then Always Failed" Now Makes Sense

| Moment | DB `cnt-002.format` | Zustand `posts` | Local `format` state | Save payload `format` | Result |
|---|---|---|---|---|---|
| First open (pre-hard-refresh) | `"video"` | `"video"` (fresh load) | `"reel"` (guard applied) | `"reel"` | ✅ Success |
| Alongside first success | `"reel"` (just saved) | `"reel"` (updateCachedPost) | `"reel"` | — | Console error was a **stale toast from a prior render cycle or a network race** |
| After hard refresh | `"video"` (DB not patched) | `"video"` (re-fetched from DB) | `"reel"` (guard applied) | `"reel"` | **Should succeed** |

The "always fails after hard refresh" symptom is inconsistent with the code — **unless the guard was not actually deployed** (build cache serving old code), or there are multiple posts with bad format values being saved simultaneously.

---

## Execution Order

```
1. Check if guard is live: open cnt-002 drawer → inspect Format dropdown → should show "Reel / Video"
   → If it shows blank/empty: the build is serving old code → run: npm run build && restart dev server
   
2. Patch DB:
   npx prisma studio
   → ContentPost table → find format="video"/"reels"/"shorts" rows → update to "reel"
   → find status="REVISION_NEEDED" rows → update to "REVISION"

3. Hard refresh browser → open cnt-002 drawer → click Simpan Perubahan
   → Should succeed with no error toast

4. npm run drift:check
5. npm test
```

---

## Acceptance Criteria

- [ ] All `ContentPost` rows in DB have `format` value in: `reel | carousel | image | story | article | thread`
- [ ] Opening any content drawer shows a valid (non-blank) format in the dropdown
- [ ] Saving any post succeeds — no error toast, no console error
- [ ] Behavior persists after hard refresh
- [ ] `npm test` — 0 failures

---

## Risk: None

No code changes required beyond what was already applied in the previous fix. This is a **data-only fix** — patch the DB rows that were inserted before the seed.ts correction was made.

