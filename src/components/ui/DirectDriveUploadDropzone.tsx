"use client";

import React, { useState, useRef } from "react";
import { CloudUpload, AlertCircle, X } from "lucide-react";
import type { TaskAttachment } from "@/types";
import { useDirectDriveUpload } from "@/lib/marcom/useDirectDriveUpload";
import { cn } from "@/lib/utils";

export interface DirectDriveUploadDropzoneProps {
  onUploadComplete: (attachment: TaskAttachment) => void;
  accept?: string;
  className?: string;
  label?: string;
}

export function DirectDriveUploadDropzone({
  onUploadComplete,
  accept,
  className,
  label = "Unggah ke Google Drive",
}: DirectDriveUploadDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeFileName, setActiveFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isUploading, progress, error, uploadFile, cancelUpload, reset } =
    useDirectDriveUpload();

  const handleFile = async (file: File) => {
    setActiveFileName(file.name);
    const attachment = await uploadFile(file);
    if (attachment) {
      onUploadComplete(attachment);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isUploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // Clear input so user can re-upload identical file if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={cn("w-full space-y-2", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        disabled={isUploading}
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!isUploading) setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => {
          if (!isUploading && fileInputRef.current) {
            fileInputRef.current.click();
          }
        }}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all duration-200 select-none",
          isDragOver
            ? "border-blue-500 bg-blue-50/60 dark:bg-blue-950/20 shadow-md"
            : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40",
          isUploading && "cursor-default border-blue-400 bg-blue-50/30 dark:bg-blue-950/10"
        )}
      >
        {isUploading ? (
          <div className="space-y-3 py-1" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
              <span className="font-semibold truncate max-w-[220px]">
                {activeFileName || "Mengunggah..."}
              </span>
              <span className="font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                {progress}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Streaming langsung ke Google Drive</span>
              <button
                type="button"
                onClick={cancelUpload}
                className="text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Batal
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
              <CloudUpload className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {label}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Tarik & lepas file footage atau dokumen, atau{" "}
                <span className="text-blue-600 dark:text-blue-400 font-medium underline">
                  pilih file
                </span>
              </p>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              Otomatis tersimpan di Cloud Drive developer (tanpa login Google)
            </p>
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start justify-between gap-2 text-xs text-rose-700 dark:text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={reset}
            className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}
    </div>
  );
}

