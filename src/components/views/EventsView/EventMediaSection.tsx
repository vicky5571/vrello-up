"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  Film,
  File,
  Video,
  Folder,
  Play,
  X,
  ExternalLink,
  Loader2,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import { useDirectDriveUpload } from "@/lib/marcom/useDirectDriveUpload";
import { AppImage } from "@/components/ui/AppImage";
import { cn } from "@/lib/utils";
import type { TaskAttachment } from "@/types";

export interface EventMediaSectionProps {
  mediaAttachments: TaskAttachment[];
  setMediaAttachments: React.Dispatch<React.SetStateAction<TaskAttachment[]>>;
  mediaUrl?: string;
  setMediaUrl?: (url: string) => void;
  onOpenPreview?: (idx: number) => void;
  eventName?: string;
}

export function EventMediaSection({
  mediaAttachments,
  setMediaAttachments,
  mediaUrl,
  setMediaUrl,
  onOpenPreview,
  eventName,
}: EventMediaSectionProps) {
  const [folderUrlInput, setFolderUrlInput] = useState("");
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hook for Google Drive upload with context "events"
  const { isUploading, progress, uploadFile, cancelUpload } =
    useDirectDriveUpload("events");

  // Resolve active cover
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
        const att = await uploadFile(file, { context: "events" });
        if (att) {
          setMediaAttachments((prev) => {
            const next = [...prev, att];
            if (!mediaUrl && setMediaUrl) {
              setMediaUrl(next[0]?.url || att.url);
            }
            return next;
          });
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

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processFiles(Array.from(files));
    }
  };

  const handleAttachFolder = () => {
    if (!folderUrlInput.trim()) return;
    const folderAtt: TaskAttachment = {
      id: `folder-${Date.now()}`,
      name: "Raw Documentation Archive Folder",
      sizeBytes: 0,
      type: "document",
      url: folderUrlInput.trim(),
      source: "gdrive",
      isSharedFolder: true,
      uploadedAt: new Date().toISOString(),
    };
    setMediaAttachments((prev) => {
      const next = [...prev, folderAtt];
      if (!mediaUrl && setMediaUrl) {
        setMediaUrl(next[0]?.url || folderAtt.url);
      }
      return next;
    });
    setFolderUrlInput("");
    setShowFolderInput(false);
    toast.success("Folder dokumentasi berhasil dilampirkan");
  };

  const handleRemoveAttachment = (id: string, url: string) => {
    const next = mediaAttachments.filter((a) => a.id !== id);
    setMediaAttachments(next);
    if (url === mediaUrl && setMediaUrl) {
      setMediaUrl(next[0]?.url || "");
    }
  };

  // Drag reordering for attachment list
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleRowDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleRowDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;
    const updated = [...mediaAttachments];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(dropIndex, 0, moved);
    setMediaAttachments(updated);
    setDraggedIndex(null);
  };

  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100">
          <Film className="w-4 h-4 text-blue-500 shrink-0" />
          <span>Media & Dokumentasi Event</span>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload dari Perangkat</span>
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={handleDeviceFilesSelected}
        />
      </div>

      {/* Real-time Upload Progress Bar */}
      {isUploading && (
        <div className="p-3 rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/30 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-blue-700 dark:text-blue-300">
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
          <div className="w-full bg-blue-100 dark:bg-blue-900/40 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* 16:9 Cover Showcase Banner */}
      {mediaAttachments.length > 0 && (
        <div
          onClick={() => {
            const coverIdx = coverAttachment
              ? mediaAttachments.indexOf(coverAttachment)
              : 0;
            onOpenPreview?.(coverIdx >= 0 ? coverIdx : 0);
          }}
          className="group/player relative rounded-xl overflow-hidden aspect-video bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer shadow-xs hover:border-blue-500/50 transition-all flex items-center justify-center mb-3"
          title="Klik untuk memutar / preview media"
        >
          {coverThumbnailUrl ? (
            <AppImage
              src={coverThumbnailUrl}
              alt={eventName || "Event Cover"}
              fill
              sizes="card"
              className="w-full h-full object-cover group-hover/player:scale-105 transition-transform duration-300"
            />
          ) : isCoverVideo ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-purple-950/40 to-slate-900 p-4 text-center">
              <Video className="w-8 h-8 text-purple-400 mb-1 opacity-80 group-hover/player:scale-110 transition-transform" />
              <span className="text-xs text-slate-200 font-medium truncate max-w-[90%]">
                {coverAttachment?.name || "Klip Video Event"}
              </span>
              <span className="text-[10px] text-purple-400/90 mt-0.5 font-medium">
                File Video (.MP4/.MOV)
              </span>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 p-4 text-center">
              <Folder className="w-8 h-8 text-amber-500 mb-1 opacity-80" />
              <span className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate">
                {coverAttachment?.name || "Dokumentasi Event"}
              </span>
            </div>
          )}

          {/* Play Button Overlay */}
          <div className="absolute inset-0 bg-black/30 group-hover/player:bg-black/15 flex items-center justify-center transition-colors">
            <div className="w-11 h-11 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-lg group-hover/player:scale-110 transition-transform">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>
          </div>
        </div>
      )}

      {/* Attachments List */}
      {mediaAttachments.length > 0 ? (
        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
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
                  "flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-800 border text-xs shadow-2xs transition-all",
                  draggedIndex === idx
                    ? "opacity-40 border-dashed border-blue-400"
                    : "border-slate-200 dark:border-slate-700"
                )}
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <div
                    className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 shrink-0"
                    title="Geser untuk mengatur urutan"
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                  </div>

                  {/* 36x36 Square Thumbnail */}
                  {att.thumbnailUrl ? (
                    <div className="relative w-9 h-9 rounded-md overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                      <AppImage
                        src={att.thumbnailUrl}
                        alt={att.name}
                        fill
                        sizes="thumb"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : att.isSharedFolder ? (
                    <div className="w-9 h-9 rounded-md shrink-0 flex items-center justify-center bg-amber-500/10 text-amber-500">
                      <Folder className="w-4 h-4" />
                    </div>
                  ) : att.type === "video" ||
                    att.name.match(/\.(mp4|mov|webm)$/i) ? (
                    <div className="w-9 h-9 rounded-md shrink-0 flex items-center justify-center bg-purple-500/10 text-purple-500">
                      <Video className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-md shrink-0 flex items-center justify-center bg-blue-500/10 text-blue-500">
                      <File className="w-4 h-4" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                      {att.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {att.sizeBytes && att.sizeBytes > 0
                        ? `${(att.sizeBytes / (1024 * 1024)).toFixed(1)} MB`
                        : att.isSharedFolder
                        ? "Drive Folder"
                        : "Drive Link"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Cover Selector */}
                  {isCover ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">
                      Cover
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setMediaUrl?.(att.url)}
                      className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40 dark:hover:text-blue-400 font-semibold transition-colors cursor-pointer shrink-0 border border-slate-200 dark:border-slate-700"
                      title="Jadikan aset ini sebagai cover thumbnail"
                    >
                      Cover
                    </button>
                  )}

                  {onOpenPreview && !att.isSharedFolder && (
                    <button
                      type="button"
                      onClick={() => onOpenPreview(idx)}
                      className="p-1 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                      title="Preview Media"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                  )}
                  <a
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                    title="Buka link"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(att.id, att.url)}
                    className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                    title="Hapus lampiran"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`p-4 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
            isDragging
              ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
              : "border-slate-200 dark:border-slate-700 hover:border-blue-400"
          }`}
        >
          <Upload className="w-5 h-5 mx-auto text-slate-400 mb-1" />
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Klik untuk upload dari perangkat atau drag & drop file ke sini
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Mendukung file gambar (JPG, PNG, WebP) dan video (MP4, MOV)
          </p>
        </div>
      )}

      {/* Mobile-Only Full-Width Upload Button */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="w-full sm:hidden py-2.5 px-3 rounded-lg bg-blue-50 hover:bg-blue-100 active:bg-blue-200 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-semibold flex items-center justify-center gap-2 border border-blue-200/60 dark:border-blue-900/40 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
      >
        <Upload className="w-4 h-4" />
        <span>Upload dari Perangkat</span>
      </button>

      {/* Folder Archive Input Fallback */}
      <div className="pt-1">
        {!showFolderInput ? (
          <button
            type="button"
            onClick={() => setShowFolderInput(true)}
            className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Folder className="w-3 h-3" />
            <span>+ Tempel Link Folder Drive untuk Raw Documentation</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="url"
              placeholder="https://drive.google.com/drive/folders/..."
              value={folderUrlInput}
              onChange={(e) => setFolderUrlInput(e.target.value)}
              className="flex-1 px-2.5 py-1.5 rounded-md text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-[11px]"
            />
            <button
              type="button"
              onClick={handleAttachFolder}
              className="px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shrink-0 cursor-pointer"
            >
              Lampirkan Folder
            </button>
            <button
              type="button"
              onClick={() => setShowFolderInput(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
