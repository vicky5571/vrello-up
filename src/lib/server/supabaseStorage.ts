/**
 * Shared helper for server-side Supabase Storage uploads via REST API.
 * Uses fetch — no @supabase/supabase-js SDK required.
 */

export interface SupabaseUploadResult {
  publicUrl: string;
}

export async function uploadToSupabase(
  bucket: string,
  storagePath: string,
  buffer: Buffer,
  mimeType: string,
): Promise<SupabaseUploadResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Supabase env vars not configured (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)",
    );
  }

  const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${storagePath}`;

  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": mimeType,
      "x-upsert": "true",
    },
    body: new Uint8Array(buffer),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Supabase Storage upload failed: ${res.status} ${errText}`);
  }

  return {
    publicUrl: `${supabaseUrl}/storage/v1/object/public/${bucket}/${storagePath}`,
  };
}

