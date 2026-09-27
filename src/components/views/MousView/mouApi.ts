import type { MarcomMou, MouStatus } from "@/types";
import { compressImageFile } from "@/lib/marcom/imageCompression";

export interface MouSavePayload {
  branchId: string;
  outletId?: string;
  partnerName: string;
  mouType: string;
  outletName?: string;
  startDate?: string;
  endDate?: string;
  picName?: string;
  picPhone?: string;
  docPath?: string;
  compensationValue?: number;
  notes?: string;
  workspaceId: string;
}

export async function saveMou(
  payload: MouSavePayload,
  existingId?: string
): Promise<MarcomMou> {
  const url = existingId
    ? `/api/marcom/mous/${existingId}`
    : "/api/marcom/mous";
  const method = existingId ? "PATCH" : "POST";
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Failed to save MOU (${res.status})`);
  }
  const resJson = await res.json().catch(() => ({}));
  return (resJson.data ?? resJson) as MarcomMou;
}

export async function transitionMouStatus(
  mouId: string,
  nextStatus: MouStatus
): Promise<void> {
  const res = await fetch(`/api/marcom/mous/${mouId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: nextStatus }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      data.error || `Failed to transition MOU to ${nextStatus}`
    );
  }
}

export async function deleteMou(mouId: string): Promise<boolean> {
  const res = await fetch(`/api/marcom/mous/${mouId}`, {
    method: "DELETE",
  });
  return res.ok;
}

export async function uploadMouDocument(
  rawFile: File,
  mouId: string
): Promise<string> {
  const file = await compressImageFile(rawFile);
  const fd = new FormData();
  fd.append("kind", "documents");
  fd.append("id", mouId);
  fd.append("file", file);
  const res = await fetch("/api/marcom/uploads", {
    method: "POST",
    body: fd,
  });
  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.error || "Failed to upload file");
  }
  const data = await res.json();
  return data.filePath;
}
