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
 * Client hook for uploading files to Google Drive via server-side streaming proxy.
 * Eliminates browser-to-Google CORS issues and requires zero user Google login.
 */
export function useDirectDriveUpload(): UseDirectDriveUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(0);
    setError(null);
    abortControllerRef.current = null;
  }, []);

  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsUploading(false);
    setProgress(0);
    setError("Unggahan dibatalkan.");
  }, []);

  const uploadFile = useCallback(
    async (file: File): Promise<TaskAttachment | null> => {
      setIsUploading(true);
      setProgress(20);
      setError(null);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        // Step 1: Upload file bytes via server-side proxy (bypassing CORS)
        const formData = new FormData();
        formData.append("file", file);
        formData.append("name", file.name);
        formData.append("mimeType", file.type || "application/octet-stream");
        formData.append("sizeBytes", String(file.size));

        setProgress(40);

        const uploadRes = await fetch("/api/marcom/drive/upload", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json().catch(() => ({}));
          throw new Error(errData.error || `Gagal mengunggah file (${uploadRes.status})`);
        }

        const uploadData = await uploadRes.json();
        const fileId = uploadData.fileId;
        const thumbnailUrl =
          typeof uploadData.thumbnailUrl === "string"
            ? uploadData.thumbnailUrl
            : undefined;
        if (!fileId) {
          throw new Error("Respon server tidak memuat Google Drive file ID.");
        }

        setProgress(75);

        // Step 2: Finalize attachment and set public read permissions
        const finalizeRes = await fetch("/api/marcom/drive/finalize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileId,
            name: file.name,
            mimeType: file.type || "application/octet-stream",
            sizeBytes: file.size,
            thumbnailUrl,
          }),
          signal: controller.signal,
        });

        if (!finalizeRes.ok) {
          const errData = await finalizeRes.json().catch(() => ({}));
          throw new Error(errData.error || `Gagal menyelesaikan lampiran (${finalizeRes.status})`);
        }

        const finalizeData = await finalizeRes.json();
        setProgress(100);
        setIsUploading(false);
        abortControllerRef.current = null;
        return finalizeData.attachment as TaskAttachment;
      } catch (err) {
        setIsUploading(false);
        abortControllerRef.current = null;
        if (err instanceof DOMException && err.name === "AbortError") {
          setError("Unggahan dibatalkan.");
          return null;
        }
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
