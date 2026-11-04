"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  Film,
  File,
  Video,
  Play,
  X,
  Loader2,
  GripVertical,
  Cloud,
} from "lucide-react";
import { toast } from "sonner";
import { useDirectDriveUpload } from "@/lib/marcom/useDirectDriveUpload";
import { AppImage } from "@/components/ui/AppImage";
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

  const handleDragEnd = () => {
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
                onDragLeave={() => {
                  if (dragOverIndex === idx) setDragOverIndex(null);
                }}
                onDrop={(e) => handleRowDrop(e, idx)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border text-xs shadow-2xs transition-all",
                  draggedIndex === idx
                    ? "opacity-40 border-dashed border-pink-400"
                    : dragOverIndex === idx && draggedIndex !== idx
                    ? "border-pink-500 dark:border-pink-400 bg-pink-50/50 dark:bg-pink-950/20"
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

