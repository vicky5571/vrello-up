"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Files, Plus, Edit2, Upload, RefreshCw } from "lucide-react";
import { useMarcomPermissions } from "@/lib/marcom/permissions";
import { cn } from "@/lib/utils";
import {
  MarcomTableShell,
  createMarcomColumnHelper,
} from "@/components/views/shared/MarcomTableShell";

export type DocFileType = "PDF" | "XLSX" | "DOCX" | "ZIP" | "CSV" | "MP4" | "PNG" | "JPG";

export interface MarcomDocument {
  id: string;
  name: string;
  category: string;
  period: string;
  branchName: string;
  ownerPic: string;
  status: string;
  fileType: DocFileType;
  fileSizeMb: number;
  filePath: string;
  description: string;
}

interface BranchOption {
  id: string;
  name: string;
}

const columnHelper = createMarcomColumnHelper<MarcomDocument>();

const FILE_TYPE_STYLES: Record<DocFileType, string> = {
  PDF: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  XLSX: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  DOCX: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  ZIP: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  CSV: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  MP4: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  PNG: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  JPG: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
};

function DocumentPreview({ document }: { document: MarcomDocument }) {
  if (document.fileType === "MP4") {
    return <video controls preload="metadata" src={document.filePath} className="w-full max-w-xl rounded-md bg-black" />;
  }
  if (document.fileType === "PNG" || document.fileType === "JPG") {
    return <img src={document.filePath} alt={document.name} className="w-full max-w-xl rounded-md border border-slate-200 dark:border-slate-700" />;
  }
  if (document.fileType === "PDF") {
    return <iframe src={document.filePath} title={document.name} className="w-full max-w-xl h-96 rounded-md border border-slate-200 dark:border-slate-700 bg-white" />;
  }
  return <a href={document.filePath} target="_blank" rel="noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline break-all">{document.filePath}</a>;
}

export function DocumentsView() {
  const { can } = useMarcomPermissions();

  const [documents, setDocuments] = useState<MarcomDocument[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalDocument, setModalDocument] = useState<Partial<MarcomDocument> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const canManage = can("DELETE_DOCUMENT");
  const canUpload = can("UPLOAD_DOCUMENT");

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [resDocs, resBranches] = await Promise.all([fetch("/api/marcom/documents"), fetch("/api/marcom/branches")]);
      if (!resDocs.ok) throw new Error(`Request failed (${resDocs.status})`);
      const jsonDocs = await resDocs.json();
      setDocuments(Array.isArray(jsonDocs.data) ? jsonDocs.data : []);
      if (resBranches.ok) {
        const jsonBranches = await resBranches.json();
        setBranches(Array.isArray(jsonBranches.data) ? jsonBranches.data : []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load documents");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !modalDocument) return;
    setIsUploading(true);
    try {
      const docId = modalDocument.id || `doc-${Date.now()}`;
      const fd = new FormData();
      fd.append("kind", "documents");
      fd.append("id", docId);
      fd.append("file", file);
      const res = await fetch("/api/marcom/uploads", { method: "POST", body: fd });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to upload file");
      }
      const data = await res.json();
      const ext = file.name.split(".").pop()?.toUpperCase() as DocFileType;
      const validTypes: DocFileType[] = ["PDF", "XLSX", "DOCX", "ZIP", "CSV", "MP4", "PNG", "JPG"];
      const fileType = validTypes.includes(ext) ? ext : "PDF";
      const fileSizeMb = Number((file.size / (1024 * 1024)).toFixed(2));
      setModalDocument((prev) => ({ ...prev, filePath: data.filePath, fileType: prev?.fileType || fileType, fileSizeMb, name: prev?.name || file.name.replace(/\.[^/.]+$/, "") }));
      toast.success("File uploaded successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveDocument = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!modalDocument) return;
    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = (formData.get("name") as string)?.trim();
    const category = (formData.get("category") as string)?.trim();
    const period = (formData.get("period") as string)?.trim() || undefined;
    const branchName = (formData.get("branchName") as string)?.trim() || undefined;
    const ownerPic = (formData.get("ownerPic") as string)?.trim() || undefined;
    const status = (formData.get("status") as string)?.trim() || "Active";
    const fileType = (formData.get("fileType") as string)?.trim() as DocFileType;
    const filePath = (formData.get("filePath") as string)?.trim();
    const fileSizeMb = Number(formData.get("fileSizeMb")) || 0;
    const description = (formData.get("description") as string)?.trim() || undefined;
    if (!name || !category || !fileType || !filePath) {
      toast.error("Name, Category, File Type, and File Path are required");
      return;
    }
    if (!filePath.startsWith("/api/marcom/files/")) {
      toast.error("File path must start with /api/marcom/files/ (upload a file or use valid path)");
      return;
    }
    setIsSaving(true);
    try {
      const isEditing = Boolean(modalDocument.id);
      const url = isEditing ? `/api/marcom/documents/${modalDocument.id}` : "/api/marcom/documents";
      const method = isEditing ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, category, period, branchName, ownerPic, status, fileType, filePath, fileSizeMb, description }) });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Failed with status ${res.status}`);
      }
      toast.success(isEditing ? "Document updated successfully" : "Document created successfully");
      setModalDocument(null);
      await fetchDocuments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save document");
    } finally {
      setIsSaving(false);
    }
  };

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.display({
          id: "select",
          header: ({ table }) => (
            <div className="flex items-center justify-center">
              <input type="checkbox" aria-label="Select all documents" checked={table.getIsAllRowsSelected()} ref={(el) => { if (el) el.indeterminate = table.getIsSomeRowsSelected(); }} onChange={table.getToggleAllRowsSelectedHandler()} className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-teal-600 focus:ring-teal-500 cursor-pointer accent-teal-600" />
            </div>
          ),
          cell: ({ row }) => (
            <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <input type="checkbox" aria-label={`Select document ${row.original.name}`} checked={row.getIsSelected()} disabled={!row.getCanSelect()} onChange={row.getToggleSelectedHandler()} className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-teal-600 focus:ring-teal-500 cursor-pointer accent-teal-600" />
            </div>
          ),
          size: 36, minSize: 36, maxSize: 36, enableSorting: false,
        }),
        columnHelper.display({
          id: "name",
          header: "Name",
          size: 220, minSize: 140,
          cell: ({ row }) => <span className="truncate font-semibold text-slate-900 dark:text-slate-100">{row.original.name}</span>,
        }),
        columnHelper.accessor("category", { id: "category", header: "Category", size: 160, minSize: 120 }),
        columnHelper.accessor("fileType", {
          id: "fileType",
          header: "Type",
          size: 110, minSize: 90,
          cell: ({ row }) => <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold", FILE_TYPE_STYLES[row.original.fileType] ?? FILE_TYPE_STYLES.PDF)}>{row.original.fileType}</span>,
        }),
        columnHelper.accessor("fileSizeMb", {
          id: "size",
          header: "Size (MB)",
          size: 110, minSize: 90,
          cell: ({ row }) => <span className="text-slate-700 dark:text-slate-300">{typeof row.original.fileSizeMb === "number" ? row.original.fileSizeMb.toFixed(2) : "—"}</span>,
        }),
        columnHelper.display({
          id: "expander",
          header: () => null,
          size: 40, minSize: 40, maxSize: 40, enableSorting: false,
          cell: () => <div className="flex justify-end"><span className="w-4 h-4 text-slate-400 flex items-center justify-center">›</span></div>,
        }),
      ]),
    [],
  );

  const deleteOne = useCallback(async (id: string) => {
    const res = await fetch(`/api/marcom/documents/${id}`, { method: "DELETE" });
    return res.ok;
  }, []);

  return (
    <>
      <MarcomTableShell
        data={documents}
        columns={columns}
        getRowId={(row) => row.id}
        initialSorting={[{ id: "name", desc: false }]}
        title="Documents"
        titleIcon={Files}
        entityName="document"
        entityPlural="documents"
        isLoading={isLoading}
        error={error}
        onRefresh={fetchDocuments}
        canDelete={canManage}
        deleteRequiresMessage="Delete requires admin role"
        onDeleteOne={deleteOne}
        canAdd={canUpload}
        onAdd={() => setModalDocument({ name: "", category: "Brand Guidelines", branchName: branches[0]?.name || "", status: "Active", fileType: "PDF", fileSizeMb: 0, filePath: "" })}
        addLabel="Upload Document"
        addIcon={Plus}
        addClassName="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-xs cursor-pointer"
        renderExpanded={(document) => (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">Owner</div>
                <div className="text-slate-700 dark:text-slate-300">{document.ownerPic || "—"}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">Period / Branch</div>
                <div className="text-slate-700 dark:text-slate-300">{document.period || "—"}{document.branchName ? ` · ${document.branchName}` : ""}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">Status</div>
                <div className="text-slate-700 dark:text-slate-300">{document.status || "—"}</div>
              </div>
              <div className="sm:col-span-3">
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">Description</div>
                <div className="text-slate-700 dark:text-slate-300">{document.description || "—"}</div>
              </div>
            </div>
            <div className="mt-3">
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">Preview</div>
              <DocumentPreview document={document} />
            </div>
            {canUpload && (
              <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-end">
                <button type="button" onClick={(e) => { e.stopPropagation(); setModalDocument(document); }} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-2xs cursor-pointer">
                  <Edit2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>Edit Document</span>
                </button>
              </div>
            )}
          </>
        )}
        emptyLabel="No documents found."
      />

      {modalDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#18191B] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/80 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Files className="w-4 h-4 text-teal-600" />
                <span>{modalDocument.id ? "Edit Document" : "Upload Document"}</span>
              </h3>
              <button type="button" onClick={() => setModalDocument(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg">✕</button>
            </div>
            <form onSubmit={handleSaveDocument} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Document Name *</label>
                <input name="name" type="text" required defaultValue={modalDocument.name || ""} placeholder="e.g., Brand Guidelines 2025" className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Category *</label>
                  <input name="category" type="text" required defaultValue={modalDocument.category || "Brand Guidelines"} placeholder="Brand Guidelines, SOP, Contract..." className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Branch</label>
                  <select name="branchName" defaultValue={modalDocument.branchName || branches[0]?.name || ""} className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer">
                    <option value="">No branch (HQ / Global)</option>
                    {branches.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Period</label>
                  <input name="period" type="text" defaultValue={modalDocument.period || ""} placeholder="e.g., 2025" className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Owner / PIC</label>
                  <input name="ownerPic" type="text" defaultValue={modalDocument.ownerPic || ""} placeholder="e.g., Design Team" className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Status</label>
                  <select name="status" defaultValue={modalDocument.status || "Active"} className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer">
                    <option value="Active">Active</option>
                    <option value="Archived">Archived</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>
              <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-3 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-teal-600" />
                    <span>Upload File (PDF, Images, Video, up to 25MB)</span>
                  </span>
                  {isUploading && <span className="text-xs text-teal-600 flex items-center gap-1 font-medium"><RefreshCw className="w-3 h-3 animate-spin" />Uploading...</span>}
                </div>
                <input type="file" onChange={handleFileUpload} disabled={isUploading} className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-teal-50 dark:file:bg-teal-950/40 file:text-teal-700 dark:file:text-teal-300 hover:file:bg-teal-100 cursor-pointer" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">File Type *</label>
                  <select name="fileType" defaultValue={modalDocument.fileType || "PDF"} className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer">
                    <option value="PDF">PDF</option>
                    <option value="PNG">PNG</option>
                    <option value="JPG">JPG</option>
                    <option value="MP4">MP4</option>
                    <option value="DOCX">DOCX</option>
                    <option value="XLSX">XLSX</option>
                    <option value="CSV">CSV</option>
                    <option value="ZIP">ZIP</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">File Size (MB)</label>
                  <input name="fileSizeMb" type="number" step="0.01" min="0" defaultValue={modalDocument.fileSizeMb ?? 0} className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">File Path * (Must begin with /api/marcom/files/)</label>
                <input name="filePath" type="text" required defaultValue={modalDocument.filePath || ""} placeholder="/api/marcom/files/documents/..." className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Description</label>
                <textarea name="description" rows={2} defaultValue={modalDocument.description || ""} placeholder="Document purpose, revisions, notes..." className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
              </div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setModalDocument(null)} disabled={isSaving} className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={isSaving} className="px-4 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5">
                  {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{modalDocument.id ? "Save Changes" : "Save Document"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
