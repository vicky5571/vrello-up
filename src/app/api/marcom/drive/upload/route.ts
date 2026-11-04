import { NextResponse } from "next/server";
import sharp from "sharp";
import { auth } from "@/auth";
import { getDriveAccessToken } from "@/lib/server/driveAuth";
import {
  buildResumableSessionHeaders,
  extractUploadUrl,
  sanitizeUploadFileName,
} from "@/lib/marcom/driveUploadHelpers";

const COMPRESSIBLE_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

async function generateAndUploadThumbnail(
  fileBuffer: Buffer,
  mimeType: string,
  fileId: string,
  userId: string,
  context: "events" | "content" = "content"
): Promise<string | undefined> {
  if (!COMPRESSIBLE_IMAGE_TYPES.has(mimeType.toLowerCase())) {
    return undefined;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.warn("[Thumbnail] Supabase env vars not set — skipping thumbnail");
    return undefined;
  }

  try {
    const thumbnailBuffer = await sharp(fileBuffer)
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 75 })
      .toBuffer();

    const storagePath = `thumbnails/${context}/${userId}/${fileId}.webp`;
    const uploadUrl = `${supabaseUrl}/storage/v1/object/content-thumbnails/${storagePath}`;

    const storageRes = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000",
        "x-upsert": "true",
      },
      body: new Uint8Array(thumbnailBuffer),
    });

    if (!storageRes.ok) {
      const errText = await storageRes.text().catch(() => "");
      console.warn("[Thumbnail] Supabase Storage upload failed:", storageRes.status, errText);
      return undefined;
    }

    return `${supabaseUrl}/storage/v1/object/public/content-thumbnails/${storagePath}`;
  } catch (err) {
    console.warn("[Thumbnail] Generation failed — skipping:", err);
    return undefined;
  }
}

/**
 * Server-side upload proxy to Google Drive.
 * Bypasses browser CORS restrictions on Google's resumable upload endpoint
 * by receiving the file from client multipart form and streaming directly
 * from server to Google Drive CDN.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Silakan masuk terlebih dahulu." },
        { status: 401 }
      );
    }

    const formData = await request.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json(
        { error: "Permintaan tidak valid atau payload multipart kosong." },
        { status: 400 }
      );
    }

    const file = formData.get("file");
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "File tidak ditemukan dalam request." },
        { status: 400 }
      );
    }

    const rawName =
      (formData.get("name") as string) ||
      (file instanceof File ? file.name : "unnamed-file");
    const name = sanitizeUploadFileName(rawName);

    if (!name || name === "unnamed-file") {
      return NextResponse.json(
        { error: "Nama file tidak valid." },
        { status: 400 }
      );
    }

    const mimeType =
      (formData.get("mimeType") as string) ||
      file.type ||
      "application/octet-stream";
    const sizeBytes = file.size;

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

    // Step 1: Initiate resumable session with Google
    const sessionRes = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable",
      {
        method: "POST",
        headers,
        body: JSON.stringify(metadata),
      }
    );

    if (!sessionRes.ok) {
      const errText = await sessionRes.text().catch(() => "");
      console.error(
        "Google Drive resumable session initiation failed:",
        sessionRes.status,
        errText
      );
      return NextResponse.json(
        { error: `Gagal membuat sesi upload Google Drive (${sessionRes.status}).` },
        { status: sessionRes.status }
      );
    }

    const locationHeader = sessionRes.headers.get("Location");
    const uploadUrl = extractUploadUrl(locationHeader);

    // Step 2: Stream file binary to Google Drive (Server-to-Server, NO CORS)
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const googlePutRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Length": String(fileBuffer.length),
        "Content-Type": mimeType,
      },
      body: fileBuffer,
    });

    if (!googlePutRes.ok) {
      const putErrText = await googlePutRes.text().catch(() => "");
      console.error("Google Drive PUT failed:", googlePutRes.status, putErrText);
      return NextResponse.json(
        { error: `Unggahan ke Google Drive gagal (${googlePutRes.status}).` },
        { status: googlePutRes.status }
      );
    }

    const googleJson = await googlePutRes.json().catch(() => ({}));
    const fileId = googleJson.id;
    if (!fileId) {
      return NextResponse.json(
        { error: "Google Drive tidak mengembalikan file ID." },
        { status: 502 }
      );
    }

    const userId = session.user.id;
    const rawContext = formData.get("context");
    const context = rawContext === "events" ? "events" : "content";
    const thumbnailUrl = await generateAndUploadThumbnail(
      fileBuffer,
      mimeType,
      fileId,
      userId,
      context
    );

    return NextResponse.json({
      success: true,
      fileId,
      name,
      thumbnailUrl,
    });
  } catch (err) {
    console.error("Drive upload error:", err);
    const message =
      err instanceof Error ? err.message : "Terjadi kesalahan internal server.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

