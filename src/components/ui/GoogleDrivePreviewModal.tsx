"use client";

import { useEffect, type JSX } from "react";
import {
  ExternalLink,
  Film,
  FileText,
  Folder,
  FolderOpen,
  X,
} from "lucide-react";
import type { TaskAttachment } from "@/types";
import { parseGoogleDriveUrl } from "@/lib/marcom/googleDriveUtils";

export function GoogleDrivePreviewModal({
  attachment,
  onClose,
}: {
  attachment: TaskAttachment | null;
  onClose: () => void;
}): JSX.Element | null {
  // Handle keyboard Escape dismissal
  useEffect(() => {
    if (!attachment) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [attachment, onClose]);

  // When attachment is null, return null
  if (!attachment) {
    return null;
  }

  // Determine if attachment is a folder
  const isFolder =
    Boolean(attachment.isSharedFolder) ||
    (attachment.type === "other" &&
      (attachment.url.includes("/folders/") ||
        parseGoogleDriveUrl(attachment.url).kind === "folder"));

  // Determine preview embed URL
  const parsed = parseGoogleDriveUrl(attachment.url);
  const previewUrl =
    attachment.embedUrl ||
    (attachment.driveFileId
      ? `https://drive.google.com/file/d/${attachment.driveFileId}/preview`
      : parsed.embedUrl || attachment.url);

  // Icon depending on media kind
  const renderHeaderIcon = () => {
    if (isFolder) {
      return <Folder className="w-4 h-4 text-amber-400 shrink-0" />;
    }
    if (
      attachment.type === "video" ||
      attachment.name.toLowerCase().endsWith(".mp4") ||
      attachment.name.toLowerCase().endsWith(".mov") ||
      attachment.name.toLowerCase().endsWith(".mkv")
    ) {
      return <Film className="w-4 h-4 text-teal-400 shrink-0" />;
    }
    return <FileText className="w-4 h-4 text-blue-400 shrink-0" />;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={attachment.name || "Pratinjau Google Drive"}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-xs animate-in fade-in-0 duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-900/90 shrink-0">
          {/* Left: Icon, Title & Google Drive Badge */}
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            {renderHeaderIcon()}
            <span
              className="font-semibold text-xs sm:text-sm text-slate-100 truncate max-w-xs sm:max-w-sm md:max-w-md"
              title={attachment.name}
            >
              {attachment.name}
            </span>
            {/* Google Drive badge */}
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-[11px] font-medium text-slate-300 shrink-0">
              <svg className="w-3.5 h-3.5" viewBox="0 0 87.3 78" fill="none">
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
              <span>Google Drive</span>
            </span>
          </div>

          {/* Right: "Buka di Google Drive" button & Close (X) button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => window.open(attachment.url, "_blank", "noopener,noreferrer")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white border border-white/10 transition-colors cursor-pointer"
              title="Buka di Google Drive (tab baru)"
            >
              <span className="hidden xs:inline">Buka di Google Drive</span>
              <span className="xs:hidden">Buka Drive</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup pratinjau"
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {isFolder ? (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center bg-slate-900/50">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4 shadow-inner">
              <Folder className="w-8 h-8 text-amber-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-white max-w-md truncate">
              {attachment.name}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1.5 mb-6 max-w-md leading-relaxed">
              Folder Google Drive berisi aset / klip B-roll
            </p>
            <button
              type="button"
              onClick={() => window.open(attachment.url, "_blank", "noopener,noreferrer")}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <FolderOpen className="w-4 h-4" />
              <span>Buka Folder di Tab Baru</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </button>
          </div>
        ) : (
          <div className="p-3 sm:p-4 bg-slate-950/60">
            <div className="aspect-video w-full bg-black rounded-xl overflow-hidden shadow-2xl relative flex items-center justify-center">
              {/* Background loading / placeholder indicator */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-2 pointer-events-none">
                <div className="w-6 h-6 border-2 border-slate-600 border-t-teal-400 rounded-full animate-spin" />
                <span className="text-xs text-slate-400">Memuat pratinjau Google Drive...</span>
              </div>
              <iframe
                src={previewUrl}
                allow="autoplay; fullscreen"
                allowFullScreen
                className="w-full h-full border-0 relative z-10"
                title={attachment.name}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
