"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  X,
  AlertCircle,
  Copy,
  RefreshCw,
  Store,
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
import { ContentMediaSection } from "./ContentMediaSection";
import { CustomDropdown } from "@/components/ui/CustomDropdown";

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
  onOpenDriveSelector,
  outletId,
  setOutletId,
}: ContentPostModalProps) {
  const [outlets, setOutlets] = useState<OutletOption[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/marcom/outlets?status=APPROVED")
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
              <CustomDropdown<PostPlatform>
                value={platform}
                onChange={(val) => setPlatform(val)}
                options={Object.keys(PLATFORM_CONFIG).map((p) => ({
                  value: p as PostPlatform,
                  label: PLATFORM_CONFIG[p as PostPlatform].label,
                }))}
                size="md"
                className="w-full"
                menuClassName="w-full min-w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Format
              </label>
              <CustomDropdown<PostFormat>
                value={format}
                onChange={(val) => setFormat(val)}
                options={[
                  { value: "reel", label: "Reel / Video" },
                  { value: "carousel", label: "Carousel" },
                  { value: "image", label: "Single Image" },
                  { value: "story", label: "Story" },
                  { value: "article", label: "Article / Press" },
                  { value: "thread", label: "Thread" },
                ]}
                size="md"
                className="w-full"
                menuClassName="w-full min-w-full"
              />
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
              <CustomDropdown<PostStatus>
                value={status}
                onChange={(val) => setStatus(val)}
                options={[
                  { value: "DRAFT", label: "DRAFT (Konsep)" },
                  { value: "IN_REVIEW", label: "IN_REVIEW (Menunggu Review)" },
                  { value: "REVISION", label: "REVISION (Perlu Revisi)" },
                  { value: "APPROVED", label: "APPROVED (Disetujui)" },
                  { value: "SCHEDULED", label: "SCHEDULED (Terjadwal)" },
                  { value: "PUBLISHED", label: "PUBLISHED (Sudah Tayang)" },
                  { value: "ARCHIVED", label: "ARCHIVED (Diarsipkan)" },
                ]}
                size="md"
                className="w-full"
                menuClassName="w-full min-w-full"
              />
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
            <CustomDropdown
              value={outletId || ""}
              onChange={(val) => setOutletId?.(val)}
              options={[
                { value: "", label: "-- None (Brand / General Social Post) --" },
                ...outlets.map((o: OutletOption) => ({
                  value: o.id,
                  label: formatOutletSelectLabel(o),
                })),
              ]}
              size="md"
              searchable
              searchPlaceholder="Cari kode atau nama outlet..."
              className="w-full"
              menuClassName="w-full min-w-full max-w-lg"
              placeholder="-- None (Brand / General Social Post) --"
            />
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

