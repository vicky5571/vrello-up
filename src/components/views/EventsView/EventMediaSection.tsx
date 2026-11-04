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
} from "lucide-react";
import { toast } from "sonner";
import { useDirectDriveUpload } from "@/lib/marcom/useDirectDriveUpload";
import type { TaskAttachment } from "@/types";

export interface EventMediaSectionProps {
  mediaAttachments: TaskAttachment[];
  setMediaAttachments: React.Dispatch<React.SetStateAction<TaskAttachment[]>>;
  onOpenPreview?: (idx: number) => void;
}

export function EventMediaSection({
  mediaAttachments,
  setMediaAttachments,
  onOpenPreview,
}: EventMediaSectionProps) {
  const [folderUrlInput, setFolderUrlInput] = useState("");
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isUploading, progress, uploadFile, cancelUpload } = useDirectDriveUpload();

  const processFiles = async (files: File[]) => {
    if (files.length === 0) return;
    for (const file of files) {
      try {
        const att = await uploadFile(file);
        if (att) {
          setMediaAttachments((prev) => [...prev, att]);
          toast.success(`Berhasil mengunggah ${file.name}`);
        }
      } catch {
        toast.error(`Gagal mengunggah ${file.name}`);
      }
    }
  };

  const handleDeviceFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setMediaAttachments((prev) => [...prev, folderAtt]);
    setFolderUrlInput("");
    setShowFolderInput(false);
    toast.success("Folder dokumentasi berhasil dilampirkan");
  };

  const handleRemoveAttachment = (id: string) => {
    setMediaAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100">
          <Film className="w-4 h-4 text-blue-500" />
          <span>Media & Dokumentasi Event</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload dari Perangkat</span>
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

      {/* Attachments List */}
      {mediaAttachments.length > 0 ? (
        <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
          {mediaAttachments.map((att, idx) => (
            <div
              key={att.id || idx}
              className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs shadow-2xs"
            >
              <div className="flex items-center gap-2 min-w-0 pr-2">
                {att.isSharedFolder ? (
                  <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                ) : att.type === "video" || att.name.match(/\.(mp4|mov|webm)$/i) ? (
                  <Video className="w-4 h-4 text-purple-500 shrink-0" />
                ) : (
                  <File className="w-4 h-4 text-blue-500 shrink-0" />
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
              <div className="flex items-center gap-1 shrink-0">
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
                  onClick={() => handleRemoveAttachment(att.id)}
                  className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                  title="Hapus lampiran"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
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

