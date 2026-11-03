# ADR-0016 — Multi-File Media Upload for Content Posts

**Status:** Proposed  
**Date:** 2026-11-03  
**Area:** Content Planner — Media Upload  

---

## Context

`ContentPostItem.mediaUrl` is a single `string` field. The current upload flow (`DirectDriveUploadDropzone` → `useDirectDriveUpload` → `/api/marcom/drive/upload`) successfully uploads one file and sets `mediaUrl` to the resulting Drive URL.

A content post (carousel, thread, multi-image) often requires **multiple media assets**. Users want to attach more than one file per post.

---

## Decision Drivers

- `ContentPostItem` currently has no `mediaUrls: string[]` field
- DB schema has `mediaUrl TEXT` — a single column
- `TaskAttachment` interface already supports rich metadata per file (name, size, type, driveFileId)
- The upload pipeline works correctly for single files — the extension point is in the data model and UI

---

## Options Considered

| # | Option | Pro | Con |
|---|---|---|---|
| **A** | Add `mediaUrls: string[]` alongside existing `mediaUrl` | Minimal type change, backward compatible | Two parallel fields to maintain, ambiguous which is "primary" |
| **B** | Replace `mediaUrl: string` with `mediaAttachments: TaskAttachment[]` stored as JSON | Rich metadata per file, reuses existing `TaskAttachment` type, single field | DB migration needed, `mediaUrl` usages throughout need updating |
| **C** | Keep `mediaUrl` as primary (first/cover), add `mediaAttachments: TaskAttachment[]` as secondary JSON column | Cover image stays fast/simple, extras are structured, no breakage of existing displays | Slightly redundant for posts with only one file |
| **D** | Keep `mediaUrl` only, allow comma-separated URLs | Zero schema change | Brittle, unparseable, breaks all URL consumers |

**Decision: Option C**

---

## Rationale

- `mediaUrl` is used in 6+ places for display (board cards, gantt, drawer preview, table) — changing it to an array breaks all consumers
- `TaskAttachment` already has `id`, `name`, `sizeBytes`, `type`, `url`, `driveFileId` — perfect for structured multi-file metadata
- Option C is additive: `mediaUrl` = first/cover file URL (unchanged behavior), `mediaAttachments` = all files including the first (new)
- DB: add `mediaAttachments JSONB DEFAULT '[]'` column — one migration, no breaking changes
- `ContentPostItem` gets `mediaAttachments?: TaskAttachment[]` — optional, so all existing code continues to work

---

## Consequences

### Positive
- Existing single-file display code (`mediaUrl`) unchanged
- Multiple files stored with full metadata (name, size, type, driveFileId)
- `DirectDriveUploadDropzone` can be reused with `multiple` support
- Upload modal stays the same — just accumulates attachments instead of closing after first

### Negative
- `mediaUrl` and `mediaAttachments[0].url` can drift if not kept in sync — must be enforced in save logic
- DB migration required

### Neutral
- `ContentPostItem` grows by one optional field — no drift check impact

---

## Related

- ADR-0015 — Unify Filter: Remove Pill Tabs  
- Spec: `docs/auth-user-management/spec-multi-file-media-upload.md`  
- Plan: `docs/superpowers/plans/2026-11-03-multi-file-media-upload.md`
