# Handover: Sub-Komponen ContentMediaSection pada Modal Schedule New Post

**Date:** 2026-11-05  
**Spec:** `docs/superpowers/specs/2026-11-05-content-post-modal-media-section-design.md`  
**Plan:** `docs/superpowers/plans/2026-11-05-content-post-modal-media-section.md`  
**ADR:** `docs/adr/0028-content-post-modal-media-section.md`  
**Status:** READY TO EXECUTE

---

## 1. File Manifest & One-Line Purpose

1. `src/components/views/ContentPlannerView/ContentMediaSection.tsx`: Sub-komponen atomik baru untuk upload langsung ke Google Drive, streaming progress bar, 16:9 showcase banner dengan play overlay, dan daftar lampiran berkas reorderable.
2. `src/components/views/ContentPlannerView/ContentPostModal.tsx`: Form modal Schedule New Post; merender `ContentMediaSection` menggantikan blok manual baris 330–462.
3. `src/components/views/ContentPlannerView/contentCardStyling.test.ts`: Test suite untuk memverifikasi integrasi `ContentMediaSection` di `ContentPostModal.tsx`.

---

## 2. Exact Current Code Snippets (As-Is)

### 2.1 Drag-Drop State & Handlers di `src/components/views/ContentPlannerView/ContentPostModal.tsx` (baris 93–134):
```tsx
  // Drag-and-drop attachment reordering
  const [draggedAttachmentIndex, setDraggedAttachmentIndex] = useState<number | null>(null);
  const [dragOverAttachmentIndex, setDragOverAttachmentIndex] = useState<number | null>(null);

  const handleDragStartAttachment = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedAttachmentIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
    const row = (e.currentTarget as HTMLElement).closest(".attachment-row") as HTMLElement | null;
    if (row && e.dataTransfer.setDragImage) {
      e.dataTransfer.setDragImage(row, 20, 20);
    }
  };

  const handleDragOverAttachment = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverAttachmentIndex !== index) {
      setDragOverAttachmentIndex(index);
    }
  };

  const handleDropAttachment = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedAttachmentIndex === null || draggedAttachmentIndex === targetIndex) {
      setDraggedAttachmentIndex(null);
      setDragOverAttachmentIndex(null);
      return;
    }
    const updated = [...mediaAttachments];
    const [moved] = updated.splice(draggedAttachmentIndex, 1);
    updated.splice(targetIndex, 0, moved);
    setMediaAttachments?.(updated);
    setDraggedAttachmentIndex(null);
    setDragOverAttachmentIndex(null);
  };

  const handleDragEndAttachment = () => {
    setDraggedAttachmentIndex(null);
    setDragOverAttachmentIndex(null);
  };
```

### 2.2 Current Inline Media Block di `src/components/views/ContentPlannerView/ContentPostModal.tsx` (baris 330–462):
```tsx
          {/* Media Attachments */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Media / Aset (optional)
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenUploadModal) {
                      onOpenUploadModal((attachments) => {
                        const merged = [...mediaAttachments, ...attachments];
                        setMediaAttachments?.(merged);
                        setMediaUrl(merged[0]?.url ?? "");
                        toast.success(`${attachments.length} file berhasil dilampirkan`);
                      });
                    } else {
                      onOpenDriveSelector();
                    }
                  }}
                  className="text-[11px] font-semibold text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Paperclip className="w-3 h-3" />
                  <span>Tambah Media</span>
                </button>
                <span className="text-slate-300 dark:text-slate-700 text-xs">|</span>
                <button
                  type="button"
                  onClick={onOpenDriveSelector}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Google Drive</span>
                </button>
              </div>
            </div>

            {/* Attachment list — shown when files are attached */}
            {mediaAttachments.length > 0 ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <span>Lampiran ({mediaAttachments.length})</span>
                </div>
                <div className="space-y-1 max-h-44 overflow-y-auto pr-0.5">
                  {mediaAttachments.map((att, i) => {
                    const currentCoverUrl = mediaUrl.trim() || mediaAttachments[0]?.url;
                    const isCover =
                      att.url === currentCoverUrl || (!currentCoverUrl && i === 0);

                    return (
                      <div
                        key={att.id || i}
                        onDragOver={(e) => handleDragOverAttachment(e, i)}
                        onDragLeave={() => {
                          if (dragOverAttachmentIndex === i) {
                            setDragOverAttachmentIndex(null);
                          }
                        }}
                        onDrop={(e) => handleDropAttachment(e, i)}
                        className={cn(
                          "attachment-row flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs transition-colors",
                          draggedAttachmentIndex === i && "opacity-40 border-dashed border-pink-400 dark:border-pink-500",
                          dragOverAttachmentIndex === i &&
                            draggedAttachmentIndex !== i &&
                            "border-pink-500 dark:border-pink-400 bg-pink-50/50 dark:bg-pink-950/20"
                        )}
                      >
                        <div
                          draggable
                          onDragStart={(e) => handleDragStartAttachment(e, i)}
                          onDragEnd={handleDragEndAttachment}
                          className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-0.5 -ml-0.5 shrink-0 transition-colors"
                          title="Tarik untuk mengubah urutan lampiran"
                        >
                          <GripVertical className="w-3.5 h-3.5" />
                        </div>
                        {att.type === "video" ? (
                          <Film className="w-4 h-4 text-purple-500 shrink-0" />
                        ) : (
                          <File className="w-4 h-4 text-blue-500 shrink-0" />
                        )}
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate flex-1">
                          {att.name}
                        </span>
                        {att.sizeBytes > 0 && (
                          <span className="text-[10px] text-slate-400 shrink-0 tabular-nums">
                            {(att.sizeBytes / (1024 * 1024)).toFixed(1)} MB
                          </span>
                        )}
                        {isCover ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-pink-100 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400 font-bold uppercase tracking-wider shrink-0">
                            Cover
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setMediaUrl(att.url)}
                            className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-pink-50 hover:text-pink-600 dark:hover:bg-pink-950/40 dark:hover:text-pink-400 font-semibold transition-colors cursor-pointer shrink-0 border border-slate-200 dark:border-slate-700"
                            title="Jadikan file ini sebagai thumbnail cover"
                          >
                            Cover
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const next = mediaAttachments.filter((_, j) => j !== i);
                            setMediaAttachments?.(next);
                            if (att.url === currentCoverUrl) {
                              setMediaUrl(next[0]?.url ?? "");
                            }
                          }}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
                          title="Hapus lampiran ini"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Fallback URL input — shown when no files attached yet */
              <input
                type="url"
                placeholder="https://drive.google.com/... atau klik Tambah Media"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-pink-500 font-mono"
              />
            )}
          </div>
```

---

## 3. Exact Change Instructions

### Step 1: Buat `src/components/views/ContentPlannerView/ContentMediaSection.tsx`
Buat berkas sub-komponen baru dengan isi lengkap:
```tsx
"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  Film,
  File,
  Video,
  Play,
  X,
  ExternalLink,
  Loader2,
  GripVertical,
  Cloud,
} from "lucide-react";
import { toast } from "sonner";
import { useDirectDriveUpload } from "@/lib/marcom/useDirectDriveUpload";
import { AppImage } from "@/components/ui/AppImage";
import { parseGoogleDriveUrl } from "@/lib/marcom/googleDrive";
import { cn } from "@/lib/utils";
import type { TaskAttachment } from "@/types";

export interface ContentMediaSectionProps {
  mediaAttachments: TaskAttachment[];
  setMediaAttachments?: (attachments: TaskAttachment[]) => void;
  mediaUrl: string;
  setMediaUrl: (url: string) => void;
  postTitle?: string;
  platform?: string;
  format?: string;
  onOpenDriveSelector?: () => void;
}

export function ContentMediaSection({
  mediaAttachments,
  setMediaAttachments,
  mediaUrl,
  setMediaUrl,
  postTitle = "",
  platform = "Instagram",
  format = "Post",
  onOpenDriveSelector,
}: ContentMediaSectionProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isUploading, progress, uploadFile, cancelUpload } =
    useDirectDriveUpload("content");

  const coverAttachment =
    mediaAttachments.find((a) => a.url === mediaUrl) ||
    mediaAttachments[0];
  const coverThumbnailUrl = coverAttachment?.thumbnailUrl;
  const isCoverVideo =
    coverAttachment?.type === "video" ||
    Boolean(coverAttachment?.url?.match(/\.(mp4|mov|webm)$/i));

  const processFiles = async (files: File[]) => {
    if (files.length === 0) return;
    for (const file of files) {
      try {
        const att = await uploadFile(file, { context: "content" });
        if (att) {
          const next = [...mediaAttachments, att];
          setMediaAttachments?.(next);
          if (!mediaUrl) {
            setMediaUrl(next[0]?.url || att.url);
          }
          toast.success(`Berhasil mengunggah ${file.name}`);
        }
      } catch {
        toast.error(`Gagal mengunggah ${file.name}`);
      }
    }
  };

  const handleDeviceFilesSelected = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await processFiles(Array.from(files));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveAttachment = (id: string, url: string) => {
    const next = mediaAttachments.filter((a) => a.id !== id);
    setMediaAttachments?.(next);
    if (url === mediaUrl) {
      setMediaUrl(next[0]?.url || "");
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleRowDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleRowDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;
    const updated = [...mediaAttachments];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(dropIndex, 0, moved);
    setMediaAttachments?.(updated);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
      {/* Header & Upload Buttons */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Video className="w-3.5 h-3.5 text-purple-500" />
          <span>Aset Media / Video Footage</span>
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-white bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload dari Perangkat</span>
          </button>
          <button
            type="button"
            onClick={onOpenDriveSelector}
            disabled={isUploading}
            className="inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Cloud className="w-3.5 h-3.5 text-blue-500" />
            <span>Drive</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={handleDeviceFilesSelected}
          />
        </div>
      </div>

      {/* Progress Bar */}
      {isUploading && (
        <div className="p-3 rounded-lg border border-pink-200 dark:border-pink-900/50 bg-pink-50/60 dark:bg-pink-950/20 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-pink-700 dark:text-pink-300">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Mengunggah berkas ke Google Drive ({progress}%)...
            </span>
            <button
              type="button"
              onClick={cancelUpload}
              className="text-[11px] text-rose-600 hover:underline cursor-pointer"
            >
              Batal
            </button>
          </div>
          <div className="w-full bg-pink-100 dark:bg-pink-900/40 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-pink-600 to-purple-600 h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* 16:9 Showcase Banner */}
      {mediaAttachments.length > 0 && (
        <div className="relative rounded-xl overflow-hidden aspect-video bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-center">
          {coverThumbnailUrl ? (
            <AppImage
              src={coverThumbnailUrl}
              alt={postTitle || "Post Cover"}
              fill
              sizes="card"
              className="w-full h-full object-cover"
            />
          ) : isCoverVideo ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-purple-950/40 to-slate-900 p-4 text-center">
              <Video className="w-8 h-8 text-purple-400 mb-1 opacity-80" />
              <span className="text-xs text-slate-200 font-medium truncate max-w-[90%]">
                {coverAttachment?.name || "Video Footage"}
              </span>
              <span className="text-[10px] text-purple-400/90 mt-0.5 font-medium">
                {platform} • {format}
              </span>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-pink-950/30 to-slate-900 p-4 text-center">
              <Film className="w-8 h-8 text-pink-400 mb-1 opacity-80" />
              <span className="text-xs text-slate-200 font-medium truncate max-w-[90%]">
                {coverAttachment?.name || "Aset Media"}
              </span>
            </div>
          )}

          {/* Play Button Overlay */}
          <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-pink-600/90 text-white flex items-center justify-center shadow-lg">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>
          </div>
        </div>
      )}

      {/* Attachments List */}
      {mediaAttachments.length > 0 ? (
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
          {mediaAttachments.map((att, idx) => {
            const isCover =
              att.url === (mediaUrl || mediaAttachments[0]?.url);
            return (
              <div
                key={att.id || idx}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleRowDragOver(e, idx)}
                onDrop={(e) => handleRowDrop(e, idx)}
                className={cn(
                  "flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border text-xs shadow-2xs transition-all",
                  draggedIndex === idx
                    ? "opacity-40 border-dashed border-pink-400"
                    : "border-slate-200 dark:border-slate-700"
                )}
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <div
                    className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 shrink-0"
                    title="Tarik untuk mengatur urutan"
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                  </div>

                  {att.thumbnailUrl ? (
                    <div className="relative w-8 h-8 rounded-md overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                      <AppImage
                        src={att.thumbnailUrl}
                        alt={att.name}
                        fill
                        sizes="thumb"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : att.type === "video" ||
                    att.name.match(/\.(mp4|mov|webm)$/i) ? (
                    <div className="w-8 h-8 rounded-md shrink-0 flex items-center justify-center bg-purple-500/10 text-purple-500">
                      <Video className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-md shrink-0 flex items-center justify-center bg-blue-500/10 text-blue-500">
                      <File className="w-4 h-4" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                      {att.name}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span>{att.type.toUpperCase()}</span>
                      {att.sizeBytes > 0 && (
                        <span>
                          • {(att.sizeBytes / (1024 * 1024)).toFixed(1)} MB
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isCover ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-pink-100 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400 font-bold uppercase tracking-wider">
                      Cover
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setMediaUrl(att.url)}
                      className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 hover:text-pink-600 font-semibold transition-colors cursor-pointer"
                    >
                      Cover
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(att.id, att.url)}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <input
          type="url"
          placeholder="https://drive.google.com/... atau klik Upload dari Perangkat"
          value={mediaUrl}
          onChange={(e) => setMediaUrl(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-pink-500 font-mono"
        />
      )}
    </div>
  );
}
```

---

### Step 2: Modifikasi `src/components/views/ContentPlannerView/ContentPostModal.tsx`
1. Impor `ContentMediaSection`:
   ```tsx
   import { ContentMediaSection } from "./ContentMediaSection";
   ```
2. Hapus state dan handler drag-and-drop lama (baris 93–134) yang sudah dipindahkan ke sub-komponen.
3. Ganti blok JSX lama (baris 330–462) dengan:
   ```tsx
   {/* Media Attachments & Video Footage */}
   <ContentMediaSection
     mediaAttachments={mediaAttachments}
     setMediaAttachments={setMediaAttachments}
     mediaUrl={mediaUrl}
     setMediaUrl={setMediaUrl}
     postTitle={title}
     platform={platform}
     format={format}
     onOpenDriveSelector={onOpenDriveSelector}
   />
   ```

---

### Step 3: Modifikasi `src/components/views/ContentPlannerView/contentCardStyling.test.ts`
Tambahkan test assertion:
```typescript
  it("verifies ContentPostModal mounts ContentMediaSection and wires props", () => {
    const modalPath = path.resolve(
      process.cwd(),
      "src/components/views/ContentPlannerView/ContentPostModal.tsx"
    );
    const content = fs.readFileSync(modalPath, "utf-8");

    assert.ok(
      content.includes("import { ContentMediaSection }"),
      "ContentPostModal must import ContentMediaSection"
    );
    assert.ok(
      content.includes("<ContentMediaSection"),
      "ContentPostModal must render ContentMediaSection component"
    );
    assert.ok(
      content.includes("mediaAttachments={mediaAttachments}"),
      "ContentPostModal must pass mediaAttachments to ContentMediaSection"
    );
  });
```

---

## 4. Explicit "Do Not Touch" List

1. **`src/components/views/ContentPlannerView/ContentDrawer.tsx`**: JANGAN ubah markup atau state di file ini saat ini (ADR-0028 menunda refaktor drawer demi keamanan rilis).
2. **`src/components/views/ContentPlannerView/ContentPlannerView.tsx`**: JANGAN ubah coordinator ini; prop modal `ContentPostModal` tetap kompatibel 100%.
3. **`src/app/api/marcom/content/route.ts`**: JANGAN modifikasi route backend; skema payload dan validasi sudah lengkap.
4. **`prisma/schema.prisma`**: JANGAN jalankan migrasi database.

---

## 5. Numbered Execution Order

1. **Step 1**: Buat berkas baru `src/components/views/ContentPlannerView/ContentMediaSection.tsx`.
2. **Step 2**: Modifikasi `src/components/views/ContentPlannerView/ContentPostModal.tsx` untuk mengimpor dan merender `ContentMediaSection`.
3. **Step 3**: Tambahkan unit test assertion di `src/components/views/ContentPlannerView/contentCardStyling.test.ts`.
4. **Step 4**: Jalankan targeted unit test:
   `node --test src/components/views/ContentPlannerView/contentCardStyling.test.ts`
5. **Step 5**: Jalankan full verification suite:
   - `npm run drift:check`
   - `npm run build:check`
   - `npm test`
6. **Step 6**: Update `docs/SESSION_STATE.md` dan commit.

---

## 6. Acceptance Criteria Checklist

- [ ] `ContentMediaSection.tsx` dibuat dengan rapi, tipe aman, dan mendukung direct Google Drive upload.
- [ ] `ContentPostModal.tsx` menggunakan `ContentMediaSection` dan tidak lagi memuat markup media manual.
- [ ] Modal menampilkan tombol "Upload dari Perangkat", progress bar, banner 16:9, dan daftar lampiran berkas.
- [ ] `ContentDrawer.tsx` tidak tersentuh sama sekali (zero regression risk).
- [ ] Unit test di `contentCardStyling.test.ts` lolos tanpa kegagalan.
- [ ] Invariant check `npm run drift:check` mengonfirmasi 55 spec-plan pairs dan 0 drift.
- [ ] `npm run build:check` lolos dengan 0 error TypeScript.
- [ ] `npm test` lolos dengan 0 test gagal.



