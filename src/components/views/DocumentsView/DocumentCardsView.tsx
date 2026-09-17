"use client";

import React from "react";
import {
  FileText,
  Table,
  Archive,
  Film,
  Image as ImageIcon,
  Eye,
  Copy,
  Edit2,
  Trash2,
  Building2,
  User,
  Calendar,
  Cloud,
  HardDrive,
  Files,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { MarcomDocument } from "./DocumentsView";
import {
  getDocumentTypeMeta,
  formatFileSize,
  isCloudDocumentUrl,
} from "@/lib/marcom/documentWorkflow";

interface DocumentCardsViewProps {
  documents: MarcomDocument[];
  onSelectDocument: (doc: MarcomDocument) => void;
  onEditDocument: (doc: MarcomDocument) => void;
  onDeleteDocument: (id: string) => Promise<boolean>;
  onAddNewDocument?: () => void;
  canManage?: boolean;
}

export function DocumentCardsView({
  documents,
  onSelectDocument,
  onEditDocument,
  onDeleteDocument,
  onAddNewDocument,
  canManage = false,
}: DocumentCardsViewProps) {
  const handleCopyLink = (doc: MarcomDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(doc.filePath);
    toast.success(`Tautan "${doc.name}" berhasil disalin!`);
  };

  const handleDelete = async (doc: MarcomDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Apakah Anda yakin ingin menghapus dokumen "${doc.name}"?`)) {
      return;
    }
    const ok = await onDeleteDocument(doc.id);
    if (ok) {
      toast.success("Dokumen berhasil dihapus");
    } else {
      toast.error("Gagal menghapus dokumen");
    }
  };

  const renderFileIcon = (iconName: string, className = "w-4 h-4") => {
    switch (iconName) {
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

  if (documents.length === 0) {
    return (
      <div className="py-20 text-center rounded-2xl bg-white dark:bg-[#18191B] border border-slate-200 dark:border-slate-800 p-8 space-y-3">
        <Files className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Tidak ada dokumen yang ditemukan
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Coba sesuaikan kata kunci pencarian, filter kategori, atau unggah dokumen aset baru.
          </p>
        </div>
        {onAddNewDocument && (
          <button
            type="button"
            onClick={onAddNewDocument}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Upload Dokumen Pertama</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {documents.map((doc) => {
        const typeMeta = getDocumentTypeMeta(doc.fileType);
        const isCloud = isCloudDocumentUrl(doc.filePath);
        const statusLower = (doc.status || "active").toLowerCase();

        return (
          <div
            key={doc.id}
            onClick={() => onSelectDocument(doc)}
            className="group relative rounded-2xl bg-white dark:bg-[#18191B] border border-slate-200 dark:border-slate-800/80 hover:border-teal-500/50 dark:hover:border-teal-500/50 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer"
            title="Klik untuk membuka pratinjau dokumen"
          >
            <div>
              {/* Card Header: Type Badge & Status */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border",
                    typeMeta.badgeClass
                  )}
                >
                  {renderFileIcon(typeMeta.iconName, "w-3.5 h-3.5")}
                  <span>{doc.fileType}</span>
                </span>

                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                      statusLower === "active"
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300/40"
                        : statusLower === "draft"
                        ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300/40"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                    )}
                  >
                    {doc.status || "Active"}
                  </span>
                </div>
              </div>

              {/* Title & Description */}
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                {doc.name}
              </h3>

              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-teal-600 dark:text-teal-400">
                  {doc.category}
                </span>
                <span>•</span>
                <span>{formatFileSize(doc.fileSizeMb)}</span>
              </div>

              {doc.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                  {doc.description}
                </p>
              )}

              {/* Metadata Pills */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                {doc.branchName && (
                  <div className="flex items-center gap-1.5 truncate">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{doc.branchName}</span>
                  </div>
                )}
                {doc.ownerPic && (
                  <div className="flex items-center gap-1.5 truncate">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">PIC: {doc.ownerPic}</span>
                  </div>
                )}
                {doc.period && (
                  <div className="flex items-center gap-1.5 truncate">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{doc.period}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                {isCloud ? (
                  <>
                    <Cloud className="w-3 h-3 text-blue-500" />
                    <span>Drive / Cloud</span>
                  </>
                ) : (
                  <>
                    <HardDrive className="w-3 h-3 text-emerald-500" />
                    <span>Server Local</span>
                  </>
                )}
              </span>

              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => onSelectDocument(doc)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Lihat Pratinjau"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={(e) => handleCopyLink(doc, e)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Salin Tautan"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>

                {canManage && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditDocument(doc);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Edit Dokumen"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDelete(doc, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Hapus Dokumen"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
