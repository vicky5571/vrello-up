"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import {
  Files,
  X,
  Upload,
  RefreshCw,
  Link2,
  CheckCircle2,
} from "lucide-react";
import type {
  DocumentItem as MarcomDocument,
  DocFileType,
  User,
} from "@/types";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import { isValidDocumentFilePath } from "@/lib/marcom/documentWorkflow";

export interface DocumentCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (doc: MarcomDocument) => void;
  branches: { id: string; name: string }[];
  members: User[];
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
];

const DOCUMENT_CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "Brand Guidelines", label: "Brand Guidelines" },
  { value: "SOP", label: "SOP" },
  { value: "Kontrak", label: "Kontrak" },
  { value: "Master Key Visual", label: "Master Key Visual" },
  { value: "Template Presentasi", label: "Template Presentasi" },
  { value: "Legalitas", label: "Legalitas" },
  { value: "Laporan", label: "Laporan" },
];

const FILE_TYPE_OPTIONS: { value: DocFileType; label: string }[] = [
  { value: "PDF", label: "PDF Document" },
  { value: "PNG", label: "PNG Image" },
  { value: "JPG", label: "JPG Image" },
  { value: "MP4", label: "MP4 Video" },
  { value: "DOCX", label: "DOCX Word" },
  { value: "XLSX", label: "XLSX Excel" },
  { value: "CSV", label: "CSV Data" },
  { value: "ZIP", label: "ZIP Archive" },
];

export function DocumentCreateModal({
  isOpen,
  onClose,
  onCreated,
  branches,
  members,
}: DocumentCreateModalProps) {
  const [uploadMode, setUploadMode] = useState<"local" | "url">("local");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Brand Guidelines");
  const [branchName, setBranchName] = useState(branches[0]?.name || "");
  const [ownerPic, setOwnerPic] = useState("");
  const [period, setPeriod] = useState("");
  const [fileType, setFileType] = useState<DocFileType | "">("");
  const [fileSizeMb, setFileSizeMb] = useState<number>(0);
  const [filePath, setFilePath] = useState("");
  const [description, setDescription] = useState("");

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setUploadMode("local");
    setName("");
    setCategory("Brand Guidelines");
    setBranchName(branches[0]?.name || "");
    setOwnerPic("");
    setPeriod("");
    setFileType("");
    setFileSizeMb(0);
    setFilePath("");
    setDescription("");
  };

  const handleModeChange = (nextMode: "local" | "url") => {
    if (nextMode === uploadMode) return;
    setUploadMode(nextMode);
    setFilePath("");
    setFileSizeMb(0);
    setFileType("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("kind", "documents");
      fd.append("id", "new");
      fd.append("file", file);

      const res = await fetch("/api/marcom/uploads", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Gagal mengunggah file");
      }

      const data = await res.json();
      const ext = file.name.split(".").pop()?.toUpperCase() as DocFileType;
      const detectedType: DocFileType | "" = VALID_FILE_TYPES.includes(ext)
        ? ext
        : "";
      const detectedSize = Number((file.size / (1024 * 1024)).toFixed(2));

      setFilePath(data.filePath || "");
      setFileType(detectedType);
      setFileSizeMb(detectedSize || 0);
      if (!name.trim()) {
        setName(file.name.replace(/\.[^/.]+$/, ""));
      }

      toast.success("File berhasil diunggah");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload gagal");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Nama dokumen wajib diisi");
      return;
    }
    if (!category.trim()) {
      toast.error("Kategori dokumen wajib diisi");
      return;
    }
    if (!fileType) {
      toast.error("Tipe file wajib dipilih");
      return;
    }
    if (!filePath.trim()) {
      toast.error("File dokumen wajib diunggah atau memiliki URL valid");
      return;
    }
    if (!isValidDocumentFilePath(filePath.trim())) {
      toast.error("Path file tidak valid. Gunakan URL https:// atau file lokal tersimpan");
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

      const res = await fetch("/api/marcom/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Gagal menyimpan dokumen (${res.status})`);
      }

      const createdDoc = await res.json();
      onCreated(createdDoc);
      toast.success("Dokumen aset berhasil ditambahkan");
      handleClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat dokumen");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
        <div className="bg-white dark:bg-[#18191B] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/80 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Files className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Unggah Dokumen Aset Baru</span>
            </h3>
            <button
              type="button"
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
            {/* Title / Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Nama Dokumen / Aset *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Brand Guidelines 2026, SOP Toko, Master Key Visual"
                value={name ?? ""}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Category & Branch */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Kategori Dokumen *
                </label>
                <CustomDropdown
                  value={category}
                  onChange={(val) => setCategory(val)}
                  options={DOCUMENT_CATEGORY_OPTIONS}
                  placeholder="Pilih Kategori"
                  searchable={false}
                  size="sm"
                  ariaLabel="Kategori Dokumen"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Branch / Wilayah
                </label>
                <CustomDropdown
                  value={branchName}
                  onChange={(val) => setBranchName(val)}
                  options={[
                    { value: "", label: "HQ / Nasional (Semua Branch)" },
                    ...branches.map((b) => ({ value: b.name, label: b.name })),
                  ]}
                  placeholder="HQ / Nasional (Semua Branch)"
                  size="sm"
                  ariaLabel="Branch / Wilayah"
                />
              </div>
            </div>

            {/* Period & PIC */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Periode
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 2026, Q1"
                  value={period ?? ""}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Owner / PIC
                </label>
                <input
                  type="text"
                  list="doc-create-members-list"
                  placeholder="Nama PIC/Tim"
                  value={ownerPic ?? ""}
                  onChange={(e) => setOwnerPic(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
                <datalist id="doc-create-members-list">
                  {members.map((m) => (
                    <option key={m.id} value={m.name || m.email || ""} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Source Mode Toggle & Input */}
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70">
                <button
                  type="button"
                  onClick={() => handleModeChange("local")}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    uploadMode === "local"
                      ? "bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload File Lokal</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange("url")}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    uploadMode === "url"
                      ? "bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Tautan URL</span>
                </button>
              </div>

              {uploadMode === "local" ? (
                <div key="upload-local-mode" className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-3.5 bg-slate-50/50 dark:bg-slate-900/50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      <span>Upload File Lokal (Maksimal 25MB)</span>
                    </span>
                    {isUploading && (
                      <span className="text-xs text-teal-600 dark:text-teal-400 flex items-center gap-1 font-medium">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Mengunggah...
                      </span>
                    )}
                  </div>
                  <input
                    key="file-upload-input"
                    type="file"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-50 dark:file:bg-teal-950/40 file:text-teal-700 dark:file:text-teal-300 hover:file:bg-teal-100 cursor-pointer"
                  />
                  {filePath && (
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-teal-600 dark:text-teal-400">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">File siap disimpan ({filePath.split("/").pop()})</span>
                    </div>
                  )}
                </div>
              ) : (
                <div key="upload-url-mode" className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tautan URL *
                  </label>
                  <input
                    key="url-text-input"
                    type="url"
                    required
                    placeholder="https://..."
                    value={filePath ?? ""}
                    onChange={(e) => setFilePath(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              )}
            </div>

            {/* File Type & File Size */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tipe File *
                </label>
                <CustomDropdown
                  value={fileType}
                  onChange={(val) => setFileType(val as DocFileType)}
                  options={FILE_TYPE_OPTIONS}
                  placeholder="Choose File Type"
                  searchable={false}
                  size="sm"
                  ariaLabel="Tipe File"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Ukuran File (MB)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={fileSizeMb ?? 0}
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
                rows={2}
                placeholder="Catatan versi, kegunaan dokumen, atau instruksi..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSaving}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Simpan Dokumen</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

