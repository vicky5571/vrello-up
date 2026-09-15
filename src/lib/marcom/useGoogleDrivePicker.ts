"use client";

import { useState, useRef, useCallback } from "react";
import type { TaskAttachment } from "@/types";
import {
  parseGoogleDriveUrl,
  getGoogleDriveMimeCategory,
} from "@/lib/marcom/googleDriveUtils";

declare global {
  interface Window {
    gapi?: any;
    google?: any;
  }
}

export interface OpenSelectorOptions {
  onSelect: (attachments: TaskAttachment[]) => void;
  defaultKind?: "all" | "video";
}

export interface UseGoogleDrivePickerReturn {
  isConfigured: boolean;
  openSelector: (options: OpenSelectorOptions) => void;
  isModalOpen: boolean;
  closeModal: () => void;
  handleManualAttach: (url: string, customTitle?: string) => void;
}

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "";
const FOLDER_ID = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID || "";

function generateAttachmentId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `gdrive-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function buildAttachmentFromManualUrl(
  url: string,
  customTitle?: string,
  defaultKind?: "all" | "video"
): TaskAttachment | null {
  const parsed = parseGoogleDriveUrl(url);
  if (!parsed.isValid) return null;

  const isFolder = parsed.kind === "folder";
  const trimmedTitle = customTitle?.trim();
  const title =
    trimmedTitle || (isFolder ? "Google Drive Folder" : "Google Drive File");

  let attachmentType: TaskAttachment["type"] = "other";
  if (isFolder) {
    attachmentType = "other";
  } else {
    const cat = getGoogleDriveMimeCategory("", title);
    if (cat === "video" || defaultKind === "video") {
      attachmentType = "video";
    } else if (cat === "image") {
      attachmentType = "image";
    } else {
      attachmentType = "document";
    }
  }

  return {
    id: generateAttachmentId(),
    name: title,
    sizeBytes: 0,
    type: attachmentType,
    url: parsed.viewUrl,
    uploadedAt: new Date().toISOString(),
    source: "gdrive",
    driveFileId: parsed.id ?? undefined,
    isSharedFolder: isFolder,
    embedUrl: parsed.embedUrl ?? undefined,
  };
}

export function buildAttachmentFromGoogleDriveDoc(doc: {
  id?: string;
  name?: string;
  sizeBytes?: number;
  mimeType?: string;
  url?: string;
  embedUrl?: string;
  iconUrl?: string;
  thumbnails?: Array<{ url?: string }>;
}): TaskAttachment {
  const mimeType = doc.mimeType || "";
  const isFolder = mimeType === "application/vnd.google-apps.folder";
  const cat = getGoogleDriveMimeCategory(mimeType, doc.name);
  const type: TaskAttachment["type"] = isFolder ? "other" : cat;

  return {
    id: generateAttachmentId(),
    name: doc.name || (isFolder ? "Google Drive Folder" : "Google Drive File"),
    sizeBytes: typeof doc.sizeBytes === "number" ? doc.sizeBytes : 0,
    type,
    url:
      doc.url ||
      doc.embedUrl ||
      (doc.id ? `https://drive.google.com/file/d/${doc.id}/view` : ""),
    uploadedAt: new Date().toISOString(),
    source: "gdrive",
    driveFileId: doc.id,
    thumbnailUrl: doc.iconUrl || doc.thumbnails?.[0]?.url || undefined,
    isSharedFolder: isFolder,
    embedUrl:
      doc.embedUrl ||
      (doc.id ? `https://drive.google.com/file/d/${doc.id}/preview` : undefined),
  };
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined") {
      return reject(new Error("Document is undefined"));
    }
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      if (existing.getAttribute("data-loaded") === "true") {
        return resolve();
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", (e) => reject(e), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.setAttribute("data-loaded", "true");
      resolve();
    };
    script.onerror = (e) => reject(e);
    document.body.appendChild(script);
  });
}

let gapiLoadPromise: Promise<void> | null = null;
function loadGapi(): Promise<void> {
  if (gapiLoadPromise) return gapiLoadPromise;
  gapiLoadPromise = (async () => {
    await loadScript("https://apis.google.com/js/api.js");
    await new Promise<void>((resolve, reject) => {
      if (!window.gapi) {
        return reject(new Error("gapi is not available on window"));
      }
      window.gapi.load("picker", {
        callback: resolve,
        onerror: reject,
      });
    });
  })().catch((err) => {
    gapiLoadPromise = null;
    throw err;
  });
  return gapiLoadPromise;
}

let gsiLoadPromise: Promise<void> | null = null;
function loadGsi(): Promise<void> {
  if (gsiLoadPromise) return gsiLoadPromise;
  gsiLoadPromise = loadScript("https://accounts.google.com/gsi/client").catch(
    (err) => {
      gsiLoadPromise = null;
      throw err;
    }
  );
  return gsiLoadPromise;
}

/**
 * Hook for Google Drive integration.
 * If NEXT_PUBLIC_GOOGLE_CLIENT_ID and NEXT_PUBLIC_GOOGLE_API_KEY are configured,
 * lazy-loads Google Picker API & Google Identity Services (GSI) for in-app picking.
 * If unconfigured or on failure, falls back to GoogleDriveLinkModal.
 */
export function useGoogleDrivePicker(): UseGoogleDrivePickerReturn {
  const isConfigured = Boolean(CLIENT_ID && API_KEY);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const onSelectRef = useRef<((attachments: TaskAttachment[]) => void) | null>(null);
  const defaultKindRef = useRef<"all" | "video">("all");

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleManualAttach = useCallback((url: string, customTitle?: string) => {
    const attachment = buildAttachmentFromManualUrl(
      url,
      customTitle,
      defaultKindRef.current
    );
    if (!attachment) return;

    if (onSelectRef.current) {
      onSelectRef.current([attachment]);
    }
    setIsModalOpen(false);
  }, []);

  const createAndShowPicker = useCallback(
    (accessToken: string, defaultKind: "all" | "video") => {
      try {
        const google = window.google;
        if (!google?.picker) {
          throw new Error("google.picker is not loaded");
        }

        const viewId =
          defaultKind === "video"
            ? google.picker.ViewId.DOCS_VIDEOS
            : google.picker.ViewId.DOCS;

        const docsView = new google.picker.DocsView(viewId);
        docsView.setIncludeFolders(true);
        if (FOLDER_ID) {
          docsView.setParent(FOLDER_ID);
        }

        const uploadView = new google.picker.DocsUploadView();
        if (FOLDER_ID) {
          uploadView.setParent(FOLDER_ID);
        }

        const builder = new google.picker.PickerBuilder()
          .enableFeature(google.picker.Feature.SUPPORT_DRIVES)
          .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
          .setDeveloperKey(API_KEY)
          .setOAuthToken(accessToken)
          .addView(docsView)
          .addView(uploadView)
          .setCallback((data: any) => {
            if (data.action === google.picker.Action.PICKED) {
              const docs = data.docs || [];
              const attachments: TaskAttachment[] = docs.map((doc: any) =>
                buildAttachmentFromGoogleDriveDoc(doc)
              );

              if (attachments.length > 0 && onSelectRef.current) {
                onSelectRef.current(attachments);
              }
            }
          });

        if (typeof window !== "undefined" && window.location?.origin) {
          builder.setOrigin(window.location.origin);
        }

        const picker = builder.build();
        picker.setVisible(true);
      } catch (err) {
        console.warn(
          "Failed to build or show Google Picker, opening fallback modal:",
          err
        );
        setIsModalOpen(true);
      }
    },
    []
  );

  const openSelector = useCallback(
    async (options: OpenSelectorOptions) => {
      onSelectRef.current = options.onSelect;
      defaultKindRef.current = options.defaultKind || "all";

      if (!isConfigured) {
        setIsModalOpen(true);
        return;
      }

      if (typeof window === "undefined") {
        setIsModalOpen(true);
        return;
      }

      try {
        await Promise.all([loadGapi(), loadGsi()]);

        if (!window.google?.accounts?.oauth2) {
          throw new Error("Google Identity Services not loaded");
        }

        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: "https://www.googleapis.com/auth/drive.file",
          callback: (tokenResponse: any) => {
            if (tokenResponse.error) {
              console.warn("GSI OAuth error:", tokenResponse);
              setIsModalOpen(true);
              return;
            }
            createAndShowPicker(
              tokenResponse.access_token,
              defaultKindRef.current
            );
          },
        });

        tokenClient.requestAccessToken({ prompt: "" });
      } catch (err) {
        console.warn(
          "Failed to initialize Google Picker API, falling back to manual link modal:",
          err
        );
        setIsModalOpen(true);
      }
    },
    [isConfigured, createAndShowPicker]
  );

  return {
    isConfigured,
    openSelector,
    isModalOpen,
    closeModal,
    handleManualAttach,
  };
}
