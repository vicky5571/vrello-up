"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  Camera,
  Image as ImageIcon,
  X,
  Eye,
  Loader2,
  Plus,
  Link as LinkIcon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  compressImage,
  parsePlacementPhotos,
  serializePlacementPhotos,
} from "@/lib/marcom/photoUtils";

interface PlacementPhotoUploaderProps {
  photoUrl?: string;
  onChange: (newPhotoUrl: string) => void;
  placementId?: string;
  disabled?: boolean;
}

export function PlacementPhotoUploader({
  photoUrl = "",
  onChange,
  placementId,
  disabled = false,
}: PlacementPhotoUploaderProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [showManualUrl, setShowManualUrl] = useState(false);
  const [manualUrlInput, setManualUrlInput] = useState("");
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const photos = parsePlacementPhotos(photoUrl);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || disabled) return;

    const files = Array.from(fileList);
    setIsUploading(true);
    setUploadStatus(`Mengompres & mengunggah ${files.length} foto...`);

    const newUploadedUrls: string[] = [];
    const uploadTargetId = placementId || `placement-temp-${Date.now()}`;

    for (let i = 0; i < files.length; i++) {
      const originalFile = files[i];
      setUploadStatus(`Mengunggah foto ${i + 1} dari ${files.length}...`);

      try {
        // 1. Compress image client-side to save mobile bandwidth
        const compressed = await compressImage(originalFile, {
          maxWidth: 1600,
          maxHeight: 1600,
          quality: 0.82,
        });

        // 2. Prepare multipart upload payload
        const formData = new FormData();
        formData.append("kind", "placements");
        formData.append("id", uploadTargetId);
        formData.append("file", compressed);

        const res = await fetch("/api/marcom/uploads", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || `Gagal mengunggah ${originalFile.name}`);
          continue;
        }

        if (data.filePath) {
          newUploadedUrls.push(data.filePath);
        }
      } catch (err) {
        console.error("Upload error:", err);
        toast.error(`Gagal mengunggah ${originalFile.name}`);
      }
    }

    setIsUploading(false);
    setUploadStatus(null);

    // Reset input elements so the same file can be re-selected if needed
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";

    if (newUploadedUrls.length > 0) {
      const combined = [...photos, ...newUploadedUrls];
      onChange(serializePlacementPhotos(combined));
      toast.success(
        `${newUploadedUrls.length} foto bukti pemasangan berhasil ditambahkan!`,
      );
    }
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    if (disabled) return;
    const next = photos.filter((_, idx) => idx !== indexToRemove);
    onChange(serializePlacementPhotos(next));
    toast.info("Foto bukti dihapus");
  };

  const handleAddManualUrl = () => {
    const trimmed = manualUrlInput.trim();
    if (!trimmed) return;
    if (photos.includes(trimmed)) {
      toast.warning("URL foto sudah ada dalam daftar");
      return;
    }
    const next = [...photos, trimmed];
    onChange(serializePlacementPhotos(next));
    setManualUrlInput("");
    toast.success("Tautan foto ditambahkan");
  };

  return (
    <div className="space-y-2.5">
      {/* Hidden file inputs for direct camera and gallery */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        disabled={disabled || isUploading}
        onChange={(e) => handleFiles(e.target.files)}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        disabled={disabled || isUploading}
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Label and Count Badge */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Foto Bukti Pemasangan
        </label>
        <div className="flex items-center gap-2">
          {photos.length > 0 && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80">
              {photos.length} Foto Terlampir
            </span>
          )}
          <button
            type="button"
            onClick={() => setShowManualUrl((prev) => !prev)}
            className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <LinkIcon className="w-3 h-3" />
            <span>Tautan URL</span>
            {showManualUrl ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
        </div>
      </div>

      {/* Action Buttons: Camera & Gallery */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={disabled || isUploading}
          className={cn(
            "flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border shadow-2xs cursor-pointer",
            "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 hover:border-emerald-700 active:scale-98",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Camera className="w-4 h-4" />
          )}
          <span>Ambil Foto (Kamera)</span>
        </button>

        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          disabled={disabled || isUploading}
          className={cn(
            "flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border shadow-2xs cursor-pointer",
            "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 active:scale-98",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ImageIcon className="w-4 h-4 text-emerald-600" />
          )}
          <span>Pilih dari Galeri</span>
        </button>
      </div>

      {/* Uploading Status Message */}
      {isUploading && (
        <div className="flex items-center gap-2 p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs border border-blue-200/60 dark:border-blue-800/60 animate-pulse">
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          <span>{uploadStatus || "Sedang memproses foto..."}</span>
        </div>
      )}

      {/* Optional Manual URL Input */}
      {showManualUrl && (
        <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 animate-in fade-in duration-150">
          <input
            type="url"
            placeholder="Tempel tautan gambar https://..."
            value={manualUrlInput}
            onChange={(e) => setManualUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddManualUrl();
              }
            }}
            disabled={disabled || isUploading}
            className="flex-1 px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          />
          <button
            type="button"
            onClick={handleAddManualUrl}
            disabled={!manualUrlInput.trim() || disabled || isUploading}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-3 h-3" />
            <span>Tambah</span>
          </button>
        </div>
      )}

      {/* Photo Gallery Grid Preview */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
          {photos.map((url, idx) => (
            <div
              key={`${url}-${idx}`}
              className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-850 shadow-2xs"
            >
              <img
                src={url}
                alt={`Bukti Pemasangan ${idx + 1}`}
                className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200"
                onError={(e) => {
                  (e.target as HTMLElement).style.opacity = "0.2";
                }}
              />

              {/* Counter Pill */}
              <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold bg-black/60 backdrop-blur-xs text-white">
                #{idx + 1}
              </span>

              {/* Overlay Actions */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                <button
                  type="button"
                  onClick={() => setLightboxUrl(url)}
                  title="Lihat Foto Ukuran Penuh"
                  className="p-1.5 rounded-lg bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-md"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    title="Hapus Foto"
                    className="p-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-md"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Simple Lightbox Modal */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setLightboxUrl(null)}
        >
          <div
            className="relative max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl bg-black border border-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxUrl(null)}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={lightboxUrl}
              alt="Preview bukti foto"
              className="max-w-full max-h-[85vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
