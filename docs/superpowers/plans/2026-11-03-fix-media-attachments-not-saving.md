# Handover — Fix: mediaAttachments Not Saving + Lightbox No Navigation on Card Click

**Status:** Complete  
**Date:** 2026-11-03  
**Estimated time:** 10 minutes  
**Risk:** Low — two targeted additions, no logic changes

---

## Symptom

1. User uploads multiple files in ContentDrawer → saves → reopens → only cover shown, other files gone
2. Clicking a card thumbnail in the content planner page opens the lightbox with no prev/next arrows

Both symptoms share the **same root cause**.

---

## Root Cause

`handleDrawerUpdate` in `ContentPlannerView.tsx` (line 336–347) constructs the PATCH request body manually and **omits `mediaAttachments`**:

```ts
body: JSON.stringify({
  title: updated.title,
  platform: updated.platform,
  format: updated.format,
  publishDate: updated.publishDate || undefined,
  status: updated.status,
  caption: updated.caption,
  mediaUrl: updated.mediaUrl,
  branchName: updated.branchName,
  revisionNotes: updated.revisionNotes,
  subtasks: updated.subtasks,
  // ← mediaAttachments is MISSING
}),
```

The PATCH API route at `/api/marcom/content/[id]` already accepts and saves `mediaAttachments` — it is never sent, so it is never saved. The DB column stays `[]` for every post.

**Why this causes the lightbox bug too:**  
The card thumbnail click code (line ~637) correctly checks `post.mediaAttachments?.length` to decide whether to build a multi-item attachments array or fall back to the single-cover synthetic item. But because `mediaAttachments` is always `[]` in DB (never saved), it always falls back to the single-item array — so the lightbox never has more than 1 attachment and shows no navigation.

**Fix the save → both bugs are fixed.**

---

## Verified Facts

```
DB check — most recent posts:
  "tes upload lagi 3" | mediaUrl: true | mediaAttachments count: 0
  "tes"               | mediaUrl: true | mediaAttachments count: 0
  ... (all posts have mediaAttachments: [])

PATCH API route (/api/marcom/content/[id]/route.ts):
  Line 86: if (body.mediaAttachments !== undefined) {
  Line 87:   data.mediaAttachments = Array.isArray(body.mediaAttachments)
  Line 88:     ? body.mediaAttachments : [];
  → API is correct and ready — just never receives the field

ContentDrawer.tsx handleSave (line 248–258):
  const updatedPost: ContentPostItem = {
    ...post,
    mediaAttachments,   ← correctly included in updatedPost
    ...
  };
  await onUpdatePost(updatedPost);  ← passes full object to parent

ContentPlannerView.tsx handleDrawerUpdate (line 336–347):
  body: JSON.stringify({
    ...                 ← mediaAttachments NOT included ← THE BUG
  })
```

---

## The Fix — One Line Addition

**File:** `src/components/views/ContentPlannerView/ContentPlannerView.tsx`  
**Location:** `handleDrawerUpdate`, inside the `JSON.stringify({...})` body, lines 336–347

```ts
// BEFORE:
body: JSON.stringify({
  title: updated.title,
  platform: updated.platform,
  format: updated.format,
  publishDate: updated.publishDate || undefined,
  status: updated.status,
  caption: updated.caption,
  mediaUrl: updated.mediaUrl,
  branchName: updated.branchName,
  revisionNotes: updated.revisionNotes,
  subtasks: updated.subtasks,
}),

// AFTER:
body: JSON.stringify({
  title: updated.title,
  platform: updated.platform,
  format: updated.format,
  publishDate: updated.publishDate || undefined,
  status: updated.status,
  caption: updated.caption,
  mediaUrl: updated.mediaUrl,
  mediaAttachments: updated.mediaAttachments ?? [],   // ← ADD THIS LINE
  branchName: updated.branchName,
  revisionNotes: updated.revisionNotes,
  subtasks: updated.subtasks,
}),
```

That is the **only code change needed**.

---

## Why This Fixes Both Symptoms

After the fix:
1. `mediaAttachments` is sent in the PATCH body
2. API saves it to the DB `mediaAttachments JSONB` column
3. Next `fetchPosts()` returns posts with `mediaAttachments` populated
4. Card thumbnail click: `post.mediaAttachments?.length > 0` → builds multi-item array → lightbox shows prev/next arrows

---

## Execution Checklist

```
[x] 1. Open: src/components/views/ContentPlannerView/ContentPlannerView.tsx
[x] 2. Find handleDrawerUpdate (line ~336) → JSON.stringify body (line ~343)
[x] 3. Add: mediaAttachments: updated.mediaAttachments ?? [],
[x] 4. npx tsc --noEmit  → 0 errors
[x] 5. npm test          → 0 failures
[x] 6. Manual test:
        → Open ContentDrawer for any post
        → Upload 3 files via "Upload dari Perangkat"
        → Click "Simpan Perubahan"
        → Close drawer → reopen → all 3 attachments still shown ✓
        → Close drawer → click card thumbnail in content planner page
        → Lightbox opens with "1 / 3" counter and prev/next arrows ✓
        → ArrowRight navigates to file 2, then file 3 ✓
```

---

## No Other Files to Touch

| File | Status |
|---|---|
| `/api/marcom/content/[id]/route.ts` | ✅ Already accepts `mediaAttachments` |
| `ContentDrawer.tsx` handleSave | ✅ Already passes `mediaAttachments` in `updatedPost` |
| `ContentPlannerView.tsx` lightbox JSX | ✅ Already reads `attachments[currentIndex]` correctly |
| `ContentPlannerView.tsx` card thumbnail click | ✅ Already checks `post.mediaAttachments?.length` correctly |
| `prisma/schema.prisma` | ✅ Column exists |
| `src/types/index.ts` | ✅ `mediaAttachments?: TaskAttachment[]` on `ContentPostItem` |
