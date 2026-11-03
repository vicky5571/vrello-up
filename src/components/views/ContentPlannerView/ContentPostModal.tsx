"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  X,
  AlertCircle,
  Copy,
  RefreshCw,
  Store,
  Paperclip,
  Film,
  File,
} from "lucide-react";
import { toast } from "sonner";
import type {
  PostPlatform,
  PostFormat,
  PostStatus,
  TaskAttachment,
} from "@/types";
import { PLATFORM_CONFIG } from "./contentConstants";
import { formatOutletSelectLabel } from "@/lib/marcom/outletRelations";

export interface OutletOption {
  id: string;
  name: string;
  code?: string;
  city?: string;
}

export interface ContentPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (e: React.FormEvent) => Promise<void> | void;
  isSaving: boolean;
  title: string;
  setTitle: (val: string) => void;
  platform: PostPlatform;
  setPlatform: (val: PostPlatform) => void;
  format: PostFormat;
  setFormat: (val: PostFormat) => void;
  publishDate: string;
  setPublishDate: (val: string) => void;
  status: PostStatus;
  setStatus: (val: PostStatus) => void;
  revisionNotes: string;
  setRevisionNotes: (val: string) => void;
  caption: string;
  setCaption: (val: string) => void;
  mediaUrl: string;
  setMediaUrl: (val: string) => void;
  mediaAttachments?: TaskAttachment[];
  setMediaAttachments?: (val: TaskAttachment[]) => void;
  onOpenUploadModal?: (onAttach: (attachments: TaskAttachment[]) => void) => void;
  onOpenDriveSelector: () => void;
  outletId?: string;
  setOutletId?: (val: string) => void;
}

export function ContentPostModal({
  isOpen,
  onClose,
  onSave,
  isSaving,
  title,
  setTitle,
  platform,
  setPlatform,
  format,
  setFormat,
  publishDate,
  setPublishDate,
  status,
  setStatus,
  revisionNotes,
  setRevisionNotes,
  caption,
  setCaption,
  mediaUrl,
  setMediaUrl,
  mediaAttachments = [],
  setMediaAttachments,
  onOpenUploadModal,
  onOpenDriveSelector,
  outletId,
  setOutletId,
}: ContentPostModalProps) {
  const [outlets, setOutlets] = useState<OutletOption[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/marcom/outlets")
      .then((res) => (res.ok ? res.json() : []))
      .then((json) => {
        if (Array.isArray(json)) setOutlets(json);
        else if (json && Array.isArray(json.data)) setOutlets(json.data);
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#18191B] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-pink-500" />
            <span>Schedule New Post</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSave} className="space-y-3.5">
          {/* Post Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Post Title / Concept *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Behind-the-Scenes: Outlet Solo Launch"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-pink-500"
            />
          </div>

          {/* Platform & Format */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Platform
              </label>
              <select
                value={platform}
                onChange={(e) =>
                  setPlatform(e.target.value as PostPlatform)
                }
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-pink-500 cursor-pointer"
              >
                {Object.keys(PLATFORM_CONFIG).map((p) => (
                  <option key={p} value={p}>
                    {PLATFORM_CONFIG[p as PostPlatform].label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Format
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as PostFormat)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-pink-500 cursor-pointer"
              >
                <option value="reel">Reel / Video</option>
                <option value="carousel">Carousel</option>
                <option value="image">Single Image</option>
                <option value="story">Story</option>
                <option value="article">Article / Press</option>
                <option value="thread">Thread</option>
              </select>
            </div>
          </div>

          {/* Date & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Publish Date
              </label>
              <input
                type="date"
                value={publishDate}
                onChange={(e) => setPublishDate(e.target.value)}
                className="w-full px-2.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-pink-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PostStatus)}
                className="w-full px-2.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-pink-500 cursor-pointer"
              >
                <option value="DRAFT">DRAFT (Konsep)</option>
                <option value="IN_REVIEW">IN_REVIEW (Menunggu Review)</option>
                <option value="REVISION">REVISION (Perlu Revisi)</option>
                <option value="APPROVED">APPROVED (Disetujui)</option>
                <option value="SCHEDULED">SCHEDULED (Terjadwal)</option>
                <option value="PUBLISHED">PUBLISHED (Sudah Tayang)</option>
                <option value="ARCHIVED">ARCHIVED (Diarsipkan)</option>
              </select>
            </div>
          </div>

          {/* Associated Outlet (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-pink-500" />
                <span>Associated Outlet (Optional)</span>
              </span>
              {outletId && setOutletId && (
                <button
                  type="button"
                  onClick={() => setOutletId("")}
                  className="text-[10px] text-rose-500 hover:underline font-normal cursor-pointer"
                >
                  Clear link
                </button>
              )}
            </label>
            <select
              value={outletId || ""}
              onChange={(e) => setOutletId?.(e.target.value)}
              className="w-full px-2.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-pink-500 cursor-pointer"
            >
              <option value="">-- None (Brand / General Social Post) --</option>
              {outlets.map((o: OutletOption) => (
                <option key={o.id} value={o.id}>
                  {formatOutletSelectLabel(o)}
                </option>
              ))}
            </select>
          </div>

          {/* Revision Notes / Feedback */}
          {(status === "REVISION" || revisionNotes.trim()) && (
            <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/40 space-y-1.5">
              <label className="block text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                <span>Catatan Revisi / Feedback Kreatif</span>
              </label>
              <textarea
                rows={2}
                placeholder="Instruksi revisi copy, visual, atau timing..."
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-rose-300/80 dark:border-rose-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-rose-500 resize-none"
              />
            </div>
          )}

          {/* Caption & Copy */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>Draft Caption & Hashtags</span>
              {caption && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(caption);
                    toast.success("Caption copied!");
                  }}
                  className="text-[10px] text-pink-600 hover:text-pink-700 flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" /> Copy
                </button>
              )}
            </label>
            <textarea
              rows={3}
              placeholder="Write draft caption, hashtags, and visual hooks..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-pink-500 resize-none"
            />
          </div>

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
                        className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs"
                      >
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

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-1.5 text-xs rounded-xl font-bold text-white bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSaving && (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              )}
              <span>Schedule Post</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

