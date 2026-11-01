"use client";

import React, { useRef, useState } from "react";
import { Camera, Trash2, Upload } from "lucide-react";
import { AppImage } from "@/components/ui/AppImage";
import { getInitials } from "@/components/layout/userProfileHelpers";
import { toast } from "sonner";

export interface ProfileAvatarUploaderProps {
  currentAvatar: string | null;
  userName: string;
  onChangeAvatar: (avatar: string | null) => void;
  disabled?: boolean;
}

export function ProfileAvatarUploader({
  currentAvatar,
  userName,
  onChangeAvatar,
  disabled = false,
}: ProfileAvatarUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState(false);

  const initials = getInitials(userName);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("File yang dipilih harus berupa file gambar (JPG, PNG, WebP).");
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 400;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            toast.error("Gagal memproses gambar.");
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/webp", 0.85);
          setImageError(false);
          onChangeAvatar(compressedDataUrl);
          toast.success("Foto profil berhasil dipilih. Klik 'Simpan' untuk menerapkan.");
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Gagal membaca file gambar.");
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
      {/* Avatar Circle Preview */}
      <div className="relative w-24 h-24 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xl overflow-hidden shrink-0 border-2 border-indigo-200/80 dark:border-indigo-800/80 shadow-sm">
        {currentAvatar && !imageError ? (
          <AppImage
            src={currentAvatar}
            alt={userName}
            fill
            sizes="96px"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{initials}</span>
        )}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          title="Ganti Foto"
          className="absolute inset-0 bg-slate-950/40 opacity-0 hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer disabled:hidden"
        >
          <Camera className="w-6 h-6" />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Controls */}
      <div className="flex-1 space-y-2 text-center sm:text-left">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Foto Avatar
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Unggah foto PNG, JPG, atau WebP (otomatis dikompresi &lt;100KB).
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Pilih File</span>
          </button>

          {currentAvatar && (
            <button
              type="button"
              onClick={() => {
                setImageError(false);
                onChangeAvatar(null);
              }}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

