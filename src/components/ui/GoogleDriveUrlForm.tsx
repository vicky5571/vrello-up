"use client";

import React, { useState } from "react";
import { AlertCircle, FileText, Folder, Link2, Video } from "lucide-react";
import {
  parseGoogleDriveUrl,
  getGoogleDriveMimeCategory,
} from "@/lib/marcom/googleDriveUtils";
import { cn } from "@/lib/utils";

export interface GoogleDriveUrlFormProps {
  onAttach: (url: string, customTitle?: string) => void;
  onClose: () => void;
  defaultKind?: "all" | "video";
}

export function GoogleDriveUrlForm({
  onAttach,
  onClose,
  defaultKind = "all",
}: GoogleDriveUrlFormProps) {
  const [url, setUrl] = useState("");
  const [customTitle, setCustomTitle] = useState("");

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsed.isValid) return;
    onAttach(url.trim(), customTitle.trim() || undefined);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
        <button
          type="button"
          onClick={onClose}
          className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={!parsed.isValid}
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <Link2 className="w-3.5 h-3.5" />
          <span>Tautkan Aset</span>
        </button>
      </div>
    </form>
  );
}

