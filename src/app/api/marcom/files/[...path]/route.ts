import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { requireMember } from "@/lib/marcom/auth";

const CONTENT_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  mp4: "video/mp4",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    await requireMember("ws-main");
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const { path: segments } = await params;
  const root = path.join(process.cwd(), "uploads");
  const resolved = path.resolve(root, ...(segments ?? []));
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let data: Buffer;
  try {
    data = await readFile(resolved);
  } catch (e) {
    const code = (e as NodeJS.ErrnoException)?.code;
    if (code === "ENOENT" || code === "EISDIR" || code === "ENOTDIR") {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    throw e;
  }

  const ext = path.extname(resolved).slice(1).toLowerCase();
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
    },
  });
}
