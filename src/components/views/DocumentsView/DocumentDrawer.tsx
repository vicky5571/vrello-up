"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  X,
  ExternalLink,
  Copy,
  FileText,
  Table,
  Archive,
  Film,
  Image as ImageIcon,
  Trash2,
  Building2,
  User as UserIcon,
  Calendar,
  Cloud,
  Download,
  Upload,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AppImage } from "@/components/ui/AppImage";
import type {
  DocumentItem as MarcomDocument,
  DocFileType,
  User,
} from "@/types";
import {
  getDocumentTypeMeta,
  formatFileSize,
  isCloudDocumentUrl,
  isValidDocumentFilePath,
  resolvePreviewSrc,
} from "@/lib/marcom/documentWorkflow";
import { parseGoogleDriveUrl } from "@/lib/marcom/googleDriveUtils";
import { useGoogleDrivePicker } from "@/lib/marcom/useGoogleDrivePicker";
import { GoogleDriveLinkModal } from "@/components/ui/GoogleDriveLinkModal";
import { buildShareableDocumentUrl } from "@/lib/router/urlState";

export interface DocumentDrawerProps {
  document: MarcomDocument | null;
  onClose: () => void;
  onUpdateDocument: (updated: MarcomDocument) => Promise<void> | void;
  onDeleteDocument: (id: string) => Promise<boolean | void> | void;
  branches: { id: string; name: string }[];
  members: User[];
  canManage?: boolean;
}

const VALID_FILE_TYPES: DocFileType[] = [
  "PDF",
  "PNG",
  "JPG",
  "MP4",
  "DOCX",
  "XLSX",
  "CSV",
  "ZIP",
  "LINK",
];

export function DocumentDrawer({
  document,
  onClose,
  onUpdateDocument,
  onDeleteDocument,
  branches,
  members,
  canManage = false,
}: DocumentDrawerProps) {
  // Form states
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Brand Guidelines");
  const [branchName, setBranchName] = useState("");
  const [ownerPic, setOwnerPic] = useState("");
  const [period, setPeriod] = useState("");
  const [fileType, setFileType] = useState<DocFileType>("PDF");
  const [fileSizeMb, setFileSizeMb] = useState<number>(0);
  const [filePath, setFilePath] = useState("");
  const [description, setDescription] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Google Drive Picker
  const {
    openSelector,
    isModalOpen: isDriveModalOpen,
    closeModal: closeDriveModal,
    handleManualAttach,
  } = useGoogleDrivePicker();

  // Populate state on document change
  useEffect(() => {
    if (!document) return;
    setName(document.name || "");
    setCategory(document.category || "Brand Guidelines");
    setBranchName(document.branchName || "");
    setOwnerPic(document.ownerPic || "");
    setPeriod(document.period || "");
    setFileType((document.fileType as DocFileType) || "PDF");
    setFileSizeMb(document.fileSizeMb || 0);
    setFilePath(document.filePath || "");
    setDescription(document.description || "");
  }, [document]);

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!document) return null;

  const typeMeta = getDocumentTypeMeta(fileType);
  const isCloud = isCloudDocumentUrl(filePath);
  const driveInfo = isCloud ? parseGoogleDriveUrl(filePath) : null;
  const previewSrc = resolvePreviewSrc(filePath);

  const handleCopyShareLink = () => {
    const shareUrl = buildShareableDocumentUrl(document.id, window.location.origin);
    navigator.clipboard.writeText(shareUrl);
    toast.success("Tautan dokumen berhasil disalin!");
  };

  const handleCopyRawFilePath = () => {
    if (!filePath) return;
    navigator.clipboard.writeText(filePath);
    toast.success("Path file berhasil disalin ke clipboard!");
  };

  const handleFileReplacement = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("kind", "documents");
      fd.append("id", document.id);
      fd.append("file", file);

      const res = await fetch("/api/marcom/uploads", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Gagal mengunggah file baru");
      }

      const data = await res.json();
      const ext = file.name.split(".").pop()?.toUpperCase() as DocFileType;
      const detectedType = VALID_FILE_TYPES.includes(ext) ? ext : "PDF";
      const detectedSize = Number((file.size / (1024 * 1024)).toFixed(2));

      setFilePath(data.filePath);
      setFileType(detectedType);
      setFileSizeMb(detectedSize);

      toast.success("File baru berhasil diunggah");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunggah file");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Nama dokumen wajib diisi");
      return;
    }
    if (!category.trim()) {
      toast.error("Kategori dokumen wajib diisi");
      return;
    }
    if (!filePath.trim()) {
      toast.error("File dokumen wajib diunggah atau memiliki URL valid");
      return;
    }
    if (!isValidDocumentFilePath(filePath.trim())) {
      toast.error("Path file tidak valid");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: name.trim(),
        category: category.trim(),
        branchName: branchName.trim() || undefined,
        ownerPic: ownerPic.trim() || undefined,
        period: period.trim() || undefined,
        fileType,
        fileSizeMb: Number(fileSizeMb) || 0,
        filePath: filePath.trim(),
        description: description.trim() || undefined,
      };

      const res = await fetch(`/api/marcom/documents/${document.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Gagal memperbarui dokumen (${res.status})`);
      }

      const updated = await res.json();
      await onUpdateDocument(updated);
      toast.success("Perubahan dokumen berhasil disimpan");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui dokumen");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus dokumen "${document.name}"?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/marcom/documents/${document.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Gagal menghapus dokumen");
      }

      await onDeleteDocument(document.id);
      toast.success("Dokumen berhasil dihapus");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus dokumen");
    } finally {
      setIsDeleting(false);
    }
  };

  const renderFileIcon = (className = "w-4 h-4") => {
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
    <>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity cursor-pointer z-40"
        />

        {/* Drawer container (560px wide) */}
        <motion.aside
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="relative z-50 w-full sm:w-[560px] h-full bg-white dark:bg-[#18191B] border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 1. Header (Sticky) */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 shrink-0">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border",
                    typeMeta.badgeClass
                  )}
                >
                  {renderFileIcon("w-3.5 h-3.5")}
                  <span>{fileType}</span>
                </span>

                <span className="text-[11px] text-slate-400">
                  {formatFileSize(fileSizeMb)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Salin tautan dokumen"
                >
                  <Copy className="w-4 h-4" />
                </button>

                {filePath && (
                  <a
                    href={filePath}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg text-teal-600 hover:text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors cursor-pointer"
                    title="Buka file di tab baru"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Tutup (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Editable Title Input */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Nama Dokumen / Aset
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama dokumen..."
                className="w-full text-base font-bold text-slate-900 dark:text-slate-100 bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-teal-500 focus:outline-hidden transition-colors px-0 py-0.5"
              />
            </div>
          </div>

          {/* 2. Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            {/* Main Media Preview Frame */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-950/5 dark:bg-slate-900/60 min-h-[280px] flex items-center justify-center relative">
              {(() => {
                // 1. Google Drive Embed
                if (driveInfo?.isValid && driveInfo.embedUrl) {
                  return (
                    <iframe
                      src={driveInfo.embedUrl}
                      title={name}
                      className="w-full h-[360px] border-0 bg-white dark:bg-slate-900"
                      allow="autoplay"
                    />
                  );
                }

                // Guard: never render src="" (ADR-0092)
                if (
                  !previewSrc &&
                  (fileType === "MP4" || fileType === "PNG" || fileType === "JPG" || fileType === "PDF")
                ) {
                  return (
                    <div className="py-10 px-6 text-center text-xs text-slate-500 dark:text-slate-400">
                      Belum ada file untuk dipratinjau
                    </div>
                  );
                }

                // 2. Video Format (MP4)
                if (previewSrc && fileType === "MP4") {
                  return (
                    <video
                      controls
                      preload="metadata"
                      src={previewSrc}
                      className="w-full max-h-[340px] rounded-lg bg-black"
                    />
                  );
                }

                // 3. Image Formats (PNG, JPG)
                if (previewSrc && (fileType === "PNG" || fileType === "JPG")) {
                  return (
                    <div className="p-3 flex items-center justify-center w-full">
                      <div className="relative w-full h-[320px] rounded-lg overflow-hidden shadow-2xs flex items-center justify-center">
                        <AppImage
                          src={previewSrc}
                          alt={name}
                          fill
                          sizes="lightbox"
                          className="object-contain"
                        />
                      </div>
                    </div>
                  );
                }

                // 4. PDF Documents
                if (previewSrc && fileType === "PDF") {
                  return (
                    <iframe
                      src={previewSrc}
                      title={name}
                      className="w-full h-[360px] border-0 bg-white"
                    />
                  );
                }

                // 5. Office, Spreadsheet, Archives (DOCX, XLSX, CSV, ZIP)
                return (
                  <div className="py-10 px-6 flex flex-col items-center justify-center text-center max-w-sm space-y-3">
                    <div
                      className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center border shadow-2xs",
                        typeMeta.badgeClass
                      )}
                    >
                      {renderFileIcon("w-7 h-7")}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {name || "Dokumen Aset"}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Format {typeMeta.label} ({formatFileSize(fileSizeMb)}) siap diunduh atau dibuka.
                      </p>
                    </div>
                    {filePath && (
                      <a
                        href={filePath}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-2xs transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download / Buka Dokumen</span>
                      </a>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* File Replacement Section — Content Planner Style */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileReplacement}
                disabled={isUploading}
                className="hidden"
              />

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Ganti File Dokumen</span>
                </span>
                {isUploading && (
                  <span className="text-xs text-teal-600 dark:text-teal-400 flex items-center gap-1 font-medium">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Mengunggah...
                  </span>
                )}
              </div>

              {/* Current Active File Card (Content Planner Attachment Item Style) */}
              <div className="flex items-center justify-between gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs transition-colors shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 border border-teal-200/50 dark:border-teal-900/40">
                    {renderFileIcon("w-4 h-4")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-mono font-medium text-slate-800 dark:text-slate-200 truncate">
                      {filePath || "Belum ada file terpilih"}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span className="font-semibold text-teal-600 dark:text-teal-400">
                        {fileType}
                      </span>
                      <span>•</span>
                      <span>{formatFileSize(fileSizeMb)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyRawFilePath}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
                    title="Salin path file"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {filePath && (
                    <a
                      href={filePath}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg text-teal-600 hover:text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors cursor-pointer"
                      title="Buka file di tab baru"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Action Buttons: Device Upload & Google Drive */}
              <div className="flex items-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-500 shadow-xs transition-all cursor-pointer disabled:opacity-50 flex-1"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload dari Perangkat</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    openSelector({
                      defaultKind: "all",
                      onSelect: (atts) => {
                        if (atts[0]) {
                          setFilePath(atts[0].url);
                          toast.success("Tautan Google Drive berhasil disematkan!");
                        }
                      },
                    })
                  }
                  disabled={isUploading}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Cloud className="w-3.5 h-3.5 text-blue-500" />
                  <span>Google Drive</span>
                </button>
              </div>
            </div>

            {/* Metadata Form Section in Grey Container */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Informasi & Metadata Dokumen
              </h4>

              {/* Category & Branch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Kategori Dokumen *
                  </label>
                  <input
                    type="text"
                    required
                    list="doc-drawer-categories-list"
                    placeholder="Brand Guidelines, SOP..."
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                  <datalist id="doc-drawer-categories-list">
                    <option value="Brand Guidelines" />
                    <option value="SOP" />
                    <option value="Kontrak" />
                    <option value="Master Key Visual" />
                    <option value="Template Presentasi" />
                    <option value="Legalitas" />
                    <option value="Laporan" />
                  </datalist>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Branch / Wilayah
                  </label>
                  <select
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  >
                    <option value="">HQ / Nasional (Semua Branch)</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Period & Owner PIC */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-teal-500" />
                    <span>Periode Dokumen</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 2026, Q1"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-teal-500" />
                    <span>Owner / PIC</span>
                  </label>
                  <input
                    type="text"
                    list="doc-drawer-members-list"
                    placeholder="Nama PIC/Tim"
                    value={ownerPic}
                    onChange={(e) => setOwnerPic(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                  <datalist id="doc-drawer-members-list">
                    {members.map((m) => (
                      <option key={m.id} value={m.name || m.email || ""} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* File Type & File Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tipe File *
                  </label>
                  <select
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value as DocFileType)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  >
                    <option value="PDF">PDF Document</option>
                    <option value="PNG">PNG Image</option>
                    <option value="JPG">JPG Image</option>
                    <option value="MP4">MP4 Video</option>
                    <option value="DOCX">DOCX Word</option>
                    <option value="XLSX">XLSX Excel</option>
                    <option value="CSV">CSV Data</option>
                    <option value="ZIP">ZIP Archive</option>
                    <option value="LINK">Link</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Ukuran File (MB)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={fileSizeMb}
                    onChange={(e) =>
                      setFileSizeMb(e.target.value ? Number(e.target.value) : 0)
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Deskripsi / Catatan Dokumen
                </label>
                <textarea
                  rows={3}
                  placeholder="Catatan versi, kegunaan dokumen, atau instruksi..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* 3. Footer (Sticky) */}
          <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between gap-3 shrink-0">
            {canManage ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || isSaving}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Hapus Dokumen</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving || isDeleting}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || isDeleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>
        </motion.aside>
      </div>

      <GoogleDriveLinkModal
        isOpen={isDriveModalOpen}
        onClose={closeDriveModal}
        onAttach={handleManualAttach}
        defaultKind="all"
      />
    </>
  );
}

