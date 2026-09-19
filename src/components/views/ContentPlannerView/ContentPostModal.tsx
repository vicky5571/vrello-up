"use client";

import React from "react";
import {
  Sparkles,
  X,
  Layers,
  AlertCircle,
  Copy,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import type {
  PostPlatform,
  PostFormat,
  PostStatus,
} from "@/types";
import { PLATFORM_CONFIG } from "./contentConstants";

export interface FlatSpaceItem {
  id: string;
  name: string;
  lists: { id: string; name: string }[];
}

export interface ContentPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (e: React.FormEvent) => Promise<void> | void;
  isSaving: boolean;
  title: string;
  setTitle: (val: string) => void;
  targetSpaceId: string;
  onTargetSpaceChange: (newSpaceId: string) => void;
  targetListId: string;
  setTargetListId: (newListId: string) => void;
  flatSpaces: FlatSpaceItem[];
  targetLists: { id: string; name: string }[];
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
  onOpenDriveSelector: () => void;
}

export function ContentPostModal({
  isOpen,
  onClose,
  onSave,
  isSaving,
  title,
  setTitle,
  targetSpaceId,
  onTargetSpaceChange,
  targetListId,
  setTargetListId,
  flatSpaces,
  targetLists,
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
  onOpenDriveSelector,
}: ContentPostModalProps) {
  if (!isOpen) return null;

  const currentSpace = flatSpaces.find((s) => s.id === targetSpaceId);
  const currentList = targetLists.find((l) => l.id === targetListId);

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

          {/* Destination: Target Space & List */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5 text-pink-500" />
                <span>Target Space & List (Lokasi Penyimpanan Task)</span>
              </label>
              <span className="text-[10px] text-pink-600 dark:text-pink-400 font-medium">
                Tersinkronisasi ke Board
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Pilih Space dan List di Workspace tempat task postingan ini akan dibuat dan dipantau.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Pilih Space
                </label>
                <select
                  value={targetSpaceId}
                  onChange={(e) => onTargetSpaceChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-pink-500 cursor-pointer"
                >
                  {flatSpaces.map((sp) => (
                    <option key={sp.id} value={sp.id}>
                      {sp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Pilih List
                </label>
                <select
                  value={targetListId}
                  onChange={(e) => setTargetListId(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-pink-500 cursor-pointer"
                >
                  {targetLists.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Live destination preview pill */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 pt-1">
              <span className="text-slate-400">Tujuan akhir:</span>
              <span className="inline-flex items-center gap-1 font-semibold text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/40 px-2 py-0.5 rounded-md border border-pink-200/50 dark:border-pink-900/40">
                <Layers className="w-3.5 h-3.5" />
                {currentSpace?.name || "Space"} › {currentList?.name || "List"}
              </span>
            </div>
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

          {/* Media URL */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Media / Thumbnail URL (optional)
              </label>
              <button
                type="button"
                onClick={onOpenDriveSelector}
                className="text-[11px] font-semibold text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Pilih dari Google Drive</span>
              </button>
            </div>
            <input
              type="url"
              placeholder="https://..."
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-pink-500"
            />
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

