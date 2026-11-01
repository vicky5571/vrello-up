import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDriveAccessToken } from "@/lib/server/driveAuth";
import {
  buildResumableSessionHeaders,
  extractUploadUrl,
  sanitizeUploadFileName,
} from "@/lib/marcom/driveUploadHelpers";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Silakan masuk terlebih dahulu." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const rawName = typeof body.name === "string" ? body.name : "";
    const mimeType = typeof body.mimeType === "string" ? body.mimeType : "application/octet-stream";
    const sizeBytes = typeof body.sizeBytes === "number" ? body.sizeBytes : 0;

    const name = sanitizeUploadFileName(rawName);
    if (!name || name === "unnamed-file") {
      return NextResponse.json(
        { error: "Nama file tidak valid." },
        { status: 400 }
      );
    }

    const rawFolderId = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID || "";
    const folderId = rawFolderId.split(/[?#]/)[0].trim();
    const accessToken = await getDriveAccessToken();

    const headers = buildResumableSessionHeaders({
      accessToken,
      mimeType,
      sizeBytes,
    });

    const metadata: Record<string, unknown> = {
      name,
    };
    if (folderId) {
      metadata.parents = [folderId];
    }

    const googleRes = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable",
      {
        method: "POST",
        headers,
        body: JSON.stringify(metadata),
      }
    );

    if (!googleRes.ok) {
      const errText = await googleRes.text().catch(() => "");
      console.error("Google Drive resumable session initiation failed:", googleRes.status, errText);
      return NextResponse.json(
        { error: `Gagal membuat sesi upload Google Drive (${googleRes.status}).` },
        { status: googleRes.status }
      );
    }

    const locationHeader = googleRes.headers.get("Location");
    const uploadUrl = extractUploadUrl(locationHeader);

    return NextResponse.json({
      uploadUrl,
      name,
      folderId: folderId || undefined,
    });
  } catch (err) {
    console.error("Drive upload-session error:", err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan internal server.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

