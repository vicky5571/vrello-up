import { NextResponse } from "next/server";
import { requireMember } from "@/lib/marcom/auth";
import { getUploadRootDir } from "@/lib/marcom/upload";
import { getStorageStatus } from "@/lib/marcom/storageMetrics";

export async function GET() {
  try {
    await requireMember("ws-main");
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const rootDir = getUploadRootDir();
  const metrics = await getStorageStatus(rootDir);

  return NextResponse.json({
    ok: true,
    data: {
      ...metrics,
      // Sembunyikan absolute path sensitif di response publik, hanya tampilkan nama folder
      storageRootName: "uploads",
      isCustomDirConfigured: Boolean(process.env.UPLOADS_DIR),
    },
  });
}
