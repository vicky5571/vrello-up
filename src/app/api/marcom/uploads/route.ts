import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { requireMember } from "@/lib/marcom/auth";
import { hasPermission } from "@/lib/marcom/guards";
import {
  MAX_UPLOAD_BYTES,
  UPLOAD_ROOT_DIRNAME,
  resolveUploadPath,
  sanitizeFilename,
  validateUpload,
} from "@/lib/marcom/upload";

const VALID_KINDS = ["documents", "events"] as const;

export async function POST(request: Request) {
  let role;
  try {
    role = await requireMember("ws-main");
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
      { error: "Invalid kind: expected documents or events" },
      { status: 400 },
    );
  }
  if (typeof id !== "string" || !id || id.includes("..") || id.includes("/") || id.includes("\\")) {
    return NextResponse.json({ error: "Missing or invalid field: id" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing required field: file" }, { status: 400 });
  }

  const required = kind === "documents" ? "UPLOAD_DOCUMENT" : "UPLOAD_VIDEO_FOOTAGE";
  if (!hasPermission(role, required)) {
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
  const root = path.join(process.cwd(), UPLOAD_ROOT_DIRNAME);
  const dest = resolveUploadPath(root, kind, id, stored);
  if (!dest) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const dir = path.join(root, kind, id);
  await mkdir(dir, { recursive: true });
  await writeFile(dest, bytes);

  return NextResponse.json(
    { filePath: `/api/marcom/files/${kind}/${id}/${stored}`, filename: stored },
    { status: 201 },
  );
}
