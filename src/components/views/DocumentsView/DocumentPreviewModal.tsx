"use client";

import React from "react";
import {
  X,
  ExternalLink,
  Copy,
  Edit2,
  FileText,
  Table,
  Archive,
  Film,
  Image as ImageIcon,
  Building2,
  User,
  Calendar,
  Cloud,
  HardDrive,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { MarcomDocument } from "./DocumentsView";
import {
  getDocumentTypeMeta,
  formatFileSize,
  isCloudDocumentUrl,
} from "@/lib/marcom/documentWorkflow";
import { parseGoogleDriveUrl } from "@/lib/marcom/googleDriveUtils";

interface DocumentPreviewModalProps {
  document: MarcomDocument | null;
  onClose: () => void;
  onEdit?: (doc: MarcomDocument) => void;
  canEdit?: boolean;
}

export function DocumentPreviewModal({
  document,
  onClose,
  onEdit,
  canEdit = false,
}: DocumentPreviewModalProps) {
  if (!document) return null;

  const typeMeta = getDocumentTypeMeta(document.fileType);
  const isCloud = isCloudDocumentUrl(document.filePath);
  const driveInfo = isCloud ? parseGoogleDriveUrl(document.filePath) : null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(document.filePath);
    toast.success("Tautan file berhasil disalin ke clipboard!");
  };

  const renderFileIcon = (className = "w-5 h-5") => {
    switch (typeMeta.iconName) {
      case "table":
        return <Table className={className} />;
      case "archive":
        return <Archive className={className} />;
      case "film":
        return <Film className={className} />;
      case "image":
        return <ImageIcon className={className} />;
      case "file-text":
      default:
        return <FileText className={className} />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-[#18191B] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                "p-2.5 rounded-xl border flex items-center justify-center shrink-0",
                typeMeta.badgeClass
              )}
            >
              {renderFileIcon("w-5 h-5")}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {document.category}
                </span>
                <span
                  className={cn(
                    "px-2 py-0.5 text-[10px] font-bold rounded-md border uppercase",
                    typeMeta.badgeClass
                  )}
                >
                  {document.fileType}
                </span>
                <span className="text-[11px] text-slate-400">
                  • {formatFileSize(document.fileSizeMb)}
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                {document.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-3">
            <button
              type="button"
              onClick={handleCopyLink}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Salin tautan file"
            >
              <Copy className="w-4 h-4" />
            </button>

            <a
              href={document.filePath}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl text-teal-600 hover:text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors cursor-pointer"
              title="Buka file di tab baru"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {canEdit && onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(document);
                }}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Edit dokumen"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Viewer Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Main Media Preview Frame */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-950/5 dark:bg-slate-900/60 min-h-[360px] flex items-center justify-center relative">
            {(() => {
              // 1. Google Drive Embed
              if (driveInfo?.isValid && driveInfo.embedUrl) {
                return (
                  <iframe
                    src={driveInfo.embedUrl}
                    title={document.name}
                    className="w-full h-[450px] border-0 bg-white dark:bg-slate-900"
                    allow="autoplay"
                  />
                );
              }

              // 2. Video Format (MP4)
              if (document.fileType === "MP4") {
                return (
                  <video
                    controls
                    preload="metadata"
                    src={document.filePath}
                    className="w-full max-h-[480px] rounded-lg bg-black"
                  />
                );
              }

              // 3. Image Formats (PNG, JPG)
              if (document.fileType === "PNG" || document.fileType === "JPG") {
                return (
                  <div className="p-4 flex items-center justify-center w-full">
                    <img
                      src={document.filePath}
                      alt={document.name}
                      className="max-h-[460px] w-auto max-w-full object-contain rounded-lg shadow-sm"
                    />
                  </div>
                );
              }

              // 4. PDF Documents
              if (document.fileType === "PDF") {
                return (
                  <iframe
                    src={document.filePath}
                    title={document.name}
                    className="w-full h-[480px] border-0 bg-white"
                  />
                );
              }

              // 5. Office, Spreadsheet, Archives (DOCX, XLSX, CSV, ZIP)
              return (
                <div className="py-12 px-6 flex flex-col items-center justify-center text-center max-w-md space-y-3">
                  <div
                    className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center border shadow-xs",
                      typeMeta.badgeClass
                    )}
                  >
                    {renderFileIcon("w-8 h-8")}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                      {document.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Format {typeMeta.label} ({formatFileSize(document.fileSizeMb)}) siap diunduh atau dibuka di aplikasi eksternal.
                    </p>
                  </div>
                  <a
                    href={document.filePath}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download / Buka Dokumen</span>
                  </a>
                </div>
              );
            })()}
          </div>

          {/* Document Information & Meta Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800/80 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1">
                <User className="w-3 h-3 text-teal-500" />
                <span>PIC / Owner</span>
              </span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                {document.ownerPic || "—"}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1">
                <Building2 className="w-3 h-3 text-teal-500" />
                <span>Branch / Wilayah</span>
              </span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                {document.branchName || "HQ / Nasional"}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1">
                <Calendar className="w-3 h-3 text-teal-500" />
                <span>Periode Dokumen</span>
              </span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                {document.period || "—"}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1">
                {isCloud ? (
                  <Cloud className="w-3 h-3 text-blue-500" />
                ) : (
                  <HardDrive className="w-3 h-3 text-emerald-500" />
                )}
                <span>Lokasi Penyimpanan</span>
              </span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                {isCloud ? "Cloud / Google Drive" : "Internal Server Storage"}
              </p>
            </div>
          </div>

          {/* Description Section */}
          {document.description && (
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#18191B] border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Catatan / Deskripsi Dokumen
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {document.description}
              </p>
            </div>
          )}

          {/* File URL Pill */}
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate flex-1">
              {document.filePath}
            </span>
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer shrink-0"
            >
              <Copy className="w-3 h-3" />
              <span>Salin Link</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
