"use client";

import { useState, useEffect } from "react";
import {
  AlertCircle,
  FileText,
  Folder,
  Info,
  Link2,
  Video,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import {
  parseGoogleDriveUrl,
  getGoogleDriveMimeCategory,
} from "@/lib/marcom/googleDriveUtils";
import { cn } from "@/lib/utils";

export interface GoogleDriveLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAttach: (url: string, customTitle?: string) => void;
  defaultKind?: "all" | "video";
}

/**
 * Google Drive smart link fallback modal.
 * Used when Google Picker credentials are not configured or when users
 * prefer to manually paste a Google Drive file, video, or folder URL.
 */
export function GoogleDriveLinkModal({
  isOpen,
  onClose,
  onAttach,
  defaultKind = "all",
}: GoogleDriveLinkModalProps) {
  const [url, setUrl] = useState("");
  const [customTitle, setCustomTitle] = useState("");

  // Reset inputs when modal opens
  useEffect(() => {
    if (isOpen) {
      setUrl("");
      setCustomTitle("");
    }
  }, [isOpen]);

  const parsed = parseGoogleDriveUrl(url);

  let detectedKind: "Folder" | "Video" | "File" | null = null;
  if (parsed.isValid) {
    if (parsed.kind === "folder") {
      detectedKind = "Folder";
    } else {
      const category = getGoogleDriveMimeCategory("", customTitle.trim() || "");
      if (defaultKind === "video" || category === "video") {
        detectedKind = "Video";
      } else {
        detectedKind = "File";
      }
    }
  }

  const handleClose = () => {
    setUrl("");
    setCustomTitle("");
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsed.isValid) return;

    onAttach(url.trim(), customTitle.trim() || undefined);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      label="Tautkan Google Drive"
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
            Tautkan Google Drive
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {defaultKind === "video"
              ? "Tautkan video footage atau B-roll dari Google Drive."
              : "Tempel tautan file, footage video, atau folder Google Drive."}
          </p>
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* URL Input */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            URL Google Drive <span className="text-rose-500">*</span>
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://drive.google.com/file/d/... atau .../folders/..."
            autoFocus
            className={cn(
              "w-full px-3 py-2 text-sm rounded-xl border bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors",
              url.trim().length > 0 && !parsed.isValid
                ? "border-rose-300 dark:border-rose-800 focus:ring-rose-500"
                : "border-slate-200 dark:border-white/10 focus:ring-teal-500"
            )}
          />

          {/* Live Validation & Kind Badge */}
          {url.trim().length > 0 && (
            <div className="mt-2 flex items-center justify-between">
              {parsed.isValid ? (
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold",
                      detectedKind === "Folder" &&
                        "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800",
                      detectedKind === "Video" &&
                        "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800",
                      detectedKind === "File" &&
                        "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800"
                    )}
                  >
                    {detectedKind === "Folder" && <Folder className="w-3.5 h-3.5" />}
                    {detectedKind === "Video" && <Video className="w-3.5 h-3.5" />}
                    {detectedKind === "File" && <FileText className="w-3.5 h-3.5" />}
                    <span>{detectedKind}</span>
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    ID: <code className="font-mono text-[10px] bg-slate-100 dark:bg-white/10 px-1 py-0.5 rounded">{parsed.id}</code>
                  </span>
                </div>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>URL Google Drive tidak valid</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Custom Title Input */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Judul Lampiran <span className="text-slate-400 font-normal">(Opsional)</span>
          </label>
          <input
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder={
              detectedKind === "Folder"
                ? "Contoh: Folder B-Roll Roadshow Mall"
                : detectedKind === "Video"
                ? "Contoh: Highlight Video Event Day 1"
                : "Contoh: Dokumen Brief Desain"
            }
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Jika dikosongkan, nama default akan otomatis digunakan.
          </p>
        </div>

        {/* Setup Callout for Native Google Picker */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium text-slate-800 dark:text-slate-200">
              Aktifkan Pemilih Otomatis (Google Picker)
            </p>
            <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              Untuk membuka dialog Google Drive resmi dengan dukungan Shared Drive kantor dan unggah langsung dari browser, atur{" "}
              <code className="px-1 py-0.5 rounded bg-slate-200/80 dark:bg-white/10 font-mono text-[10px] text-slate-800 dark:text-slate-200">
                NEXT_PUBLIC_GOOGLE_CLIENT_ID
              </code>{" "}
              dan{" "}
              <code className="px-1 py-0.5 rounded bg-slate-200/80 dark:bg-white/10 font-mono text-[10px] text-slate-800 dark:text-slate-200">
                NEXT_PUBLIC_GOOGLE_API_KEY
              </code>{" "}
              pada berkas{" "}
              <code className="px-1 py-0.5 rounded bg-slate-200/80 dark:bg-white/10 font-mono text-[10px] text-slate-800 dark:text-slate-200">
                .env
              </code>
              .
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
          <button
            type="button"
            onClick={handleClose}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={!parsed.isValid}
            className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 active:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Tautkan Aset</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
