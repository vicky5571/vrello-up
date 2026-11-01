"use client";

import { useState, useRef, useCallback } from "react";
import type { TaskAttachment } from "@/types";

export interface UseDirectDriveUploadReturn {
  isUploading: boolean;
  progress: number;
  error: string | null;
  uploadFile: (file: File) => Promise<TaskAttachment | null>;
  cancelUpload: () => void;
  reset: () => void;
}

/**
 * Client hook for streaming files directly to Google Drive via resumable upload session.
 * Completely bypasses Vercel's 4.5 MB serverless limit and requires zero user Google login.
 */
export function useDirectDriveUpload(): UseDirectDriveUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const activeXhrRef = useRef<XMLHttpRequest | null>(null);

  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(0);
    setError(null);
    activeXhrRef.current = null;
  }, []);

  const cancelUpload = useCallback(() => {
    if (activeXhrRef.current) {
      activeXhrRef.current.abort();
      activeXhrRef.current = null;
    }
    setIsUploading(false);
    setProgress(0);
    setError("Unggahan dibatalkan.");
  }, []);

  const uploadFile = useCallback(
    async (file: File): Promise<TaskAttachment | null> => {
      setIsUploading(true);
      setProgress(0);
      setError(null);

      try {
        // Step 1: Request resumable session from backend
        const sessionRes = await fetch("/api/marcom/drive/upload-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: file.name,
            mimeType: file.type || "application/octet-stream",
            sizeBytes: file.size,
          }),
        });

        if (!sessionRes.ok) {
          const errData = await sessionRes.json().catch(() => ({}));
          throw new Error(errData.error || `Gagal memulai sesi unggahan (${sessionRes.status})`);
        }

        const { uploadUrl } = await sessionRes.json();
        if (!uploadUrl) {
          throw new Error("Respon server tidak memuat URL unggah Google Drive.");
        }

        // Step 2: Stream binary file directly to Google's CDN
        const fileId = await new Promise<string>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          activeXhrRef.current = xhr;

          xhr.open("PUT", uploadUrl, true);

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable && e.total > 0) {
              const percent = Math.min(99, Math.round((e.loaded / e.total) * 100));
              setProgress(percent);
            }
          };

          xhr.onload = () => {
            activeXhrRef.current = null;
            if (xhr.status === 200 || xhr.status === 201) {
              try {
                const resJson = JSON.parse(xhr.responseText);
                if (resJson.id) {
                  return resolve(resJson.id);
                }
                reject(new Error("Google Drive tidak mengembalikan file ID."));
              } catch {
                reject(new Error("Format respon Google Drive tidak valid."));
              }
            } else {
              reject(new Error(`Unggahan Google Drive gagal dengan status ${xhr.status}.`));
            }
          };

          xhr.onerror = () => {
            activeXhrRef.current = null;
            reject(new Error("Koneksi terputus saat mengunggah ke Google Drive."));
          };

          xhr.onabort = () => {
            activeXhrRef.current = null;
            reject(new Error("Unggahan dibatalkan."));
          };

          xhr.send(file);
        });

        setProgress(100);

        // Step 3: Finalize attachment and set public read permissions
        const finalizeRes = await fetch("/api/marcom/drive/finalize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileId,
            name: file.name,
            mimeType: file.type || "application/octet-stream",
            sizeBytes: file.size,
          }),
        });

        if (!finalizeRes.ok) {
          const errData = await finalizeRes.json().catch(() => ({}));
          throw new Error(errData.error || `Gagal menyelesaikan lampiran (${finalizeRes.status})`);
        }

        const finalizeData = await finalizeRes.json();
        setIsUploading(false);
        return finalizeData.attachment as TaskAttachment;
      } catch (err) {
        setIsUploading(false);
        const errMsg = err instanceof Error ? err.message : "Terjadi kesalahan unggah.";
        setError(errMsg);
        return null;
      }
    },
    []
  );

  return {
    isUploading,
    progress,
    error,
    uploadFile,
    cancelUpload,
    reset,
  };
}

