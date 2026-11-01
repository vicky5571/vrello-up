"use client";

import React, { useState, useEffect } from "react";
import { CloudUpload, Link2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { GoogleDriveUrlForm } from "@/components/ui/GoogleDriveUrlForm";
import { DirectDriveUploadDropzone } from "@/components/ui/DirectDriveUploadDropzone";
import type { TaskAttachment } from "@/types";
import { cn } from "@/lib/utils";

export interface GoogleDriveLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAttach: (url: string, customTitle?: string) => void;
  defaultKind?: "all" | "video";
}

/**
 * Google Drive modal supporting both direct browser-to-Google streaming (no Google login required)
 * and smart manual link pasting with regex parsing.
 */
export function GoogleDriveLinkModal({
  isOpen,
  onClose,
  onAttach,
  defaultKind = "all",
}: GoogleDriveLinkModalProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "url">("upload");

  // Reset tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab("upload");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUploadComplete = (attachment: TaskAttachment) => {
    onAttach(attachment.url, attachment.name);
    onClose();
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
      <div className="p-5">
        {activeTab === "upload" ? (
          <div className="space-y-3">
            <DirectDriveUploadDropzone
              onUploadComplete={handleUploadComplete}
              label={
                defaultKind === "video"
                  ? "Unggah Video Footage ke Google Drive"
                  : "Unggah Berkas ke Google Drive"
              }
              accept={defaultKind === "video" ? "video/*" : undefined}
            />
            <p className="text-[11px] text-center text-slate-400 dark:text-slate-500">
              Mendukung file besar (hingga beberapa GB) langsung ke cloud developer.
            </p>
          </div>
        ) : (
          <GoogleDriveUrlForm
            onAttach={onAttach}
            onClose={onClose}
            defaultKind={defaultKind}
          />
        )}
      </div>
    </Modal>
  );
}
