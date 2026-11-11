import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireMember } from "@/lib/marcom/auth";
import { hasPermission } from "@/lib/marcom/guards";
import {
  MAX_UPLOAD_BYTES,
  sanitizeFilename,
  validateUpload,
} from "@/lib/marcom/upload";
import { uploadToSupabase } from "@/lib/server/supabaseStorage";

const VALID_KINDS = [
  "documents",
  "mou-documents",
  "placements",
  "outlets",
  "inventory-damage",
  "inventory-proofs",
] as const;
type UploadKind = (typeof VALID_KINDS)[number];

const BUCKET_MAP: Record<UploadKind, string> = {
  documents: "marcom-documents",
  "mou-documents": "mou-documents",
  placements: "placement-photos",
  outlets: "outlet-photos",
  "inventory-damage": "inventory-damage",
  "inventory-proofs": "inventory-damage",
};

const KIND_PREFIX: Record<UploadKind, string> = {
  documents: "documents",
  "mou-documents": "mou-documents",
  placements: "placements",
  outlets: "outlets",
  "inventory-damage": "damage",
  "inventory-proofs": "settlement",
};

const PERMISSION_MAP: Record<UploadKind, string> = {
  documents: "UPLOAD_DOCUMENT",
  "mou-documents": "UPLOAD_DOCUMENT",
  placements: "CREATE_PLACEMENT",
  outlets: "SUBMIT_DRAFT_OUTLET",
  "inventory-damage": "PROCESS_RETURN",
  "inventory-proofs": "PROCESS_RETURN",
};

// Derive MIME type from file extension for storage Content-Type header
const EXT_TO_MIME: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  mp4: "video/mp4",
};

export async function POST(request: Request) {
  let role;
  try {
    role = await requireMember();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart body" }, { status: 400 });
  }

  const kind = form.get("kind");
  const id = form.get("id");
  const file = form.get("file");

  if (
    typeof kind !== "string" ||
    !(VALID_KINDS as readonly string[]).includes(kind)
  ) {
    return NextResponse.json(
      { error: "Invalid kind: expected documents, mou-documents, placements, outlets, inventory-damage, or inventory-proofs" },
      { status: 400 },
    );
  }

  const uploadKind = kind as UploadKind;

  if (typeof id !== "string" || !id || id.includes("..") || id.includes("/") || id.includes("\\")) {
    return NextResponse.json({ error: "Missing or invalid field: id" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing required field: file" }, { status: 400 });
  }

  if (!hasPermission(role, PERMISSION_MAP[uploadKind] as Parameters<typeof hasPermission>[1])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const validation = validateUpload({ filename: file.name, sizeBytes: file.size });
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.byteLength > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "File exceeds 25 MB limit" }, { status: 400 });
  }

  const stored = `${randomUUID()}-${sanitizeFilename(file.name)}`;
  const storagePath = `${KIND_PREFIX[uploadKind]}/${id}/${stored}`;
  const bucket = BUCKET_MAP[uploadKind];

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const mimeType = file.type || EXT_TO_MIME[ext] || "application/octet-stream";

  try {
    const { publicUrl } = await uploadToSupabase(bucket, storagePath, bytes, mimeType);
    return NextResponse.json(
      {
        filePath: publicUrl,
        filename: stored,
        originalName: file.name,
        sizeBytes: file.size,
      },
      { status: 201 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Storage upload failed";
    console.error("[/api/marcom/uploads] Storage error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
