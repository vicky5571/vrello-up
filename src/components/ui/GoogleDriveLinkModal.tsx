"use client";

import React, { useState, useEffect } from "react";
import { CloudUpload, Link2, Film, FileText, Check, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { GoogleDriveUrlForm } from "@/components/ui/GoogleDriveUrlForm";
import { DirectDriveUploadDropzone } from "@/components/ui/DirectDriveUploadDropzone";
import { buildAttachmentFromManualUrl } from "@/lib/marcom/useGoogleDrivePicker";
import type { TaskAttachment } from "@/types";
import { cn } from "@/lib/utils";

export interface GoogleDriveLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAttach: (attachments: TaskAttachment[]) => void;
  defaultKind?: "all" | "video";
}

function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Google Drive modal supporting multi-file direct browser-to-Google streaming
 * and smart manual link pasting with regex parsing.
 */
export function GoogleDriveLinkModal({
  isOpen,
  onClose,
  onAttach,
  defaultKind = "all",
}: GoogleDriveLinkModalProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "url">("upload");
  const [uploadedFiles, setUploadedFiles] = useState<TaskAttachment[]>([]);

  // Reset tab and accumulated files when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab("upload");
      setUploadedFiles([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUploadComplete = (attachment: TaskAttachment) => {
    setUploadedFiles((prev) => [...prev, attachment]);
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    if (uploadedFiles.length > 0) {
      onAttach(uploadedFiles);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      label="Google Drive Cloud Assets"
      showCloseButton={true}
      panelClassName="max-w-md flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-5 border-b border-slate-100 dark:border-white/10">
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5" viewBox="0 0 87.3 78" fill="none">
            <path
              d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z"
              fill="#0066DA"
            />
            <path
              d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z"
              fill="#00AC47"
            />
            <path
              d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 10.1z"
              fill="#EA4335"
            />
            <path
              d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z"
              fill="#00832D"
            />
            <path d="m59.8 53-16.15-28-16.15 28z" fill="#2684FC" />
            <path
              d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25l16.15 28h27.5c0-1.55-.4-3.1-1.2-4.5z"
              fill="#FFBA00"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Google Drive & Cloud Storage
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {defaultKind === "video"
              ? "Unggah atau tautkan video footage B-roll acara."
              : "Unggah berkas langsung ke cloud atau tautkan URL Drive."}
          </p>
        </div>
      </div>

      {/* Segmented Tab Controls */}
      <div className="p-5 pb-0">
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={cn(
              "flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer",
              activeTab === "upload"
                ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            <CloudUpload className="w-3.5 h-3.5" />
            <span>Unggah Langsung</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("url")}
            className={cn(
              "flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer",
              activeTab === "url"
                ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Tempel Link URL</span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="p-5 space-y-4">
        {activeTab === "upload" ? (
          <div className="space-y-3">
            {uploadedFiles.length < 10 ? (
              <DirectDriveUploadDropzone
                onUploadComplete={handleUploadComplete}
                label={
                  defaultKind === "video"
                    ? "Unggah Video Footage ke Google Drive"
                    : uploadedFiles.length > 0
                      ? "Unggah File Tambahan ke Google Drive"
                      : "Unggah Berkas ke Google Drive"
                }
                accept={defaultKind === "video" ? "video/*" : undefined}
              />
            ) : (
              <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200 text-center">
                Maksimum 10 file per postingan tercapai.
              </p>
            )}

            {/* List of successfully uploaded files in this session */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-white/10">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>File Siap Dilampirkan ({uploadedFiles.length})</span>
                  <button
                    type="button"
                    onClick={() => setUploadedFiles([])}
                    className="text-[10px] text-rose-500 hover:underline cursor-pointer"
                  >
                    Hapus Semua
                  </button>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {uploadedFiles.map((file, idx) => (
                    <div
                      key={file.id || idx}
                      className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {file.type === "video" ? (
                          <Film className="w-4 h-4 text-purple-500 shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                        )}
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                          {file.name}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0 tabular-nums">
                          {formatFileSize(file.sizeBytes)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(idx)}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          title="Hapus dari daftar"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={uploadedFiles.length === 0}
                className="px-4 py-1.5 text-xs rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed"
              >
                {uploadedFiles.length > 0
                  ? `Lampirkan ${uploadedFiles.length} File`
                  : "Lampirkan"}
              </button>
            </div>
          </div>
        ) : (
          <GoogleDriveUrlForm
            onAttach={(url, customTitle) => {
              const attachment = buildAttachmentFromManualUrl(
                url,
                customTitle,
                defaultKind
              );
              if (attachment) {
                onAttach([attachment]);
                onClose();
              }
            }}
            onClose={onClose}
            defaultKind={defaultKind}
          />
        )}
      </div>
    </Modal>
  );
}
