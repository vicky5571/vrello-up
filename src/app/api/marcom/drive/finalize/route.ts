import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDriveAccessToken } from "@/lib/server/driveAuth";
import {
  sanitizeUploadFileName,
  buildDriveAttachment,
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
    const fileId = typeof body.fileId === "string" ? body.fileId.trim() : "";
    const rawName = typeof body.name === "string" ? body.name : "";
    const mimeType = typeof body.mimeType === "string" ? body.mimeType : "application/octet-stream";
    const sizeBytes = typeof body.sizeBytes === "number" ? body.sizeBytes : 0;

    if (!fileId) {
      return NextResponse.json(
        { error: "fileId is required to finalize attachment." },
        { status: 400 }
      );
    }

    const name = sanitizeUploadFileName(rawName);

    // Make file readable by anyone with link so in-app iframe previews never 403
    try {
      const accessToken = await getDriveAccessToken();
      const permRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/permissions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role: "reader",
            type: "anyone",
          }),
        }
      );

      if (!permRes.ok) {
        const errText = await permRes.text().catch(() => "");
        console.warn(`Failed to set public read permission on Drive file ${fileId}:`, permRes.status, errText);
      }
    } catch (permErr) {
      console.warn(`Could not set public permissions on Drive file ${fileId}:`, permErr);
    }

    const attachment = buildDriveAttachment({
      fileId,
      name,
      mimeType,
      sizeBytes,
    });

    return NextResponse.json({
      success: true,
      attachment,
    });
  } catch (err) {
    console.error("Drive finalize error:", err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan internal server.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

