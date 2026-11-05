"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  X,
  Download,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  FileQuestion,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { parseMouDocumentSource } from "./mouDocumentHelpers";
import { AppImage } from "@/components/ui/AppImage";

export interface MouDocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  docPath: string | null | undefined;
  docPaths?: string[] | null;
  title?: string;
  partnerName?: string;
  mouType?: string;
  outletName?: string;
  branchName?: string;
}

export function MouDocumentViewerModal({
  isOpen,
  onClose,
  docPath,
  docPaths,
  title,
  partnerName,
  mouType,
  outletName,
  branchName,
}: MouDocumentViewerModalProps) {
  const docs = useMemo(() => {
    const list: string[] = [];
    if (Array.isArray(docPaths)) {
      for (const p of docPaths) {
        if (typeof p === "string" && p.trim()) list.push(p.trim());
      }
    }
    if (
      docPath &&
      typeof docPath === "string" &&
      docPath.trim() &&
      !list.includes(docPath.trim())
    ) {
      list.unshift(docPath.trim());
    }
    return list;
  }, [docPath, docPaths]);

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
    }
  }, [isOpen, docs.length]);

  const activeDoc = docs[currentIndex] || docs[0] || docPath;
  const parsed = parseMouDocumentSource(activeDoc, partnerName || title);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        setCurrentIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === "ArrowRight") {
        setCurrentIndex((prev) =>
          Math.min(Math.max(0, docs.length - 1), prev + 1)
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, docs.length]);

  if (!isOpen) return null;

  const displayTitle =
    partnerName || title || outletName || "Dokumen Perjanjian Kerjasama (MoU)";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mou-doc-viewer-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full flex flex-col max-h-[92vh] shadow-2xl overflow-hidden transition-all">
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-fuchsia-100 dark:bg-fuchsia-950/60 text-fuchsia-600 dark:text-fuchsia-400 flex items-center justify-center shrink-0 border border-fuchsia-200 dark:border-fuchsia-800/60 shadow-2xs">
              {parsed.type === "INTERNAL_IMAGE" ? (
                <ImageIcon className="w-5 h-5" />
              ) : (
                <FileText className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                <h3
                  id="mou-doc-viewer-title"
                  className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate"
                >
                  {displayTitle}
                </h3>
                {mouType && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-fuchsia-100 dark:bg-fuchsia-950/60 text-fuchsia-700 dark:text-fuchsia-300 border border-fuchsia-200 dark:border-fuchsia-800">
                    {mouType}
                  </span>
                )}
                {branchName && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {branchName}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="truncate">{parsed.filename || "Berkas Lampiran"}</span>
                {parsed.label && (
                  <>
                    <span>•</span>
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      {parsed.label}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {docs.length > 1 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title="Berkas Sebelumnya (Arrow Left)"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 px-1 text-center select-none whitespace-nowrap">
                  Berkas {currentIndex + 1} dari {docs.length}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentIndex((prev) =>
                      Math.min(docs.length - 1, prev + 1)
                    )
                  }
                  disabled={currentIndex === docs.length - 1}
                  className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title="Berkas Berikutnya (Arrow Right)"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {parsed.type !== "EMPTY" && (
              <a
                href={parsed.downloadUrl}
                download={parsed.filename || "dokumen-mou"}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-fuchsia-600 hover:bg-fuchsia-700 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                title="Unduh berkas asli ke komputer/perangkat"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Unduh</span>
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Tutup (Esc)"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-auto p-3 sm:p-4 bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center min-h-[360px] sm:min-h-[500px]">
          {parsed.type === "EMPTY" ? (
            <div className="p-8 text-center max-w-md space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800">
                <FileQuestion className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Belum Ada Berkas Terlampir
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Perjanjian MoU ini belum memiliki dokumen lampiran fisik atau tautan digital.
                Unggah dokumen pindaian bertandatangan atau PDF melalui tombol edit MoU.
              </p>
            </div>
          ) : parsed.type === "INTERNAL_IMAGE" ? (
            <div className="w-full h-full flex items-center justify-center p-2">
              <div className="relative w-[90vw] max-w-4xl h-[72vh] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg flex items-center justify-center">
                <AppImage
                  src={parsed.previewUrl}
                  alt={parsed.filename}
                  fill
                  sizes="lightbox"
                  className="object-contain"
                />
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col flex-1 min-h-[480px]">
              <iframe
                src={`${parsed.previewUrl}#toolbar=1`}
                title={parsed.filename}
                className="w-full h-full flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white shadow-inner min-h-[480px]"
              />
              <div className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Jika berkas PDF tidak tampil di browser Anda, silakan gunakan tombol{" "}
                  <a
                    href={parsed.downloadUrl}
                    download={parsed.filename}
                    className="font-bold text-fuchsia-600 hover:underline"
                  >
                    Unduh Berkas
                  </a>
                  .
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3 truncate max-w-[60%]">
            {docs.length > 1 && (
              <div className="flex items-center gap-1 shrink-0">
                {docs.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrentIndex(i)}
                    className={cn(
                      "h-2 rounded-full transition-all cursor-pointer",
                      i === currentIndex
                        ? "w-5 bg-fuchsia-600"
                        : "w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400"
                    )}
                    title={`Lihat berkas ke-${i + 1}`}
                  />
                ))}
              </div>
            )}
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">
              {parsed.rawPath || "Tidak ada URL berkas"}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
