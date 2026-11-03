import test from "node:test";
import assert from "node:assert/strict";
import { uploadToSupabase } from "./supabaseStorage";

test("uploadToSupabase throws if env vars are missing", async () => {
  const origUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const origKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  try {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    await assert.rejects(
      async () => {
        await uploadToSupabase(
          "marcom-documents",
          "test/file.pdf",
          Buffer.from("dummy"),
          "application/pdf",
        );
      },
      {
        message: /Supabase env vars not configured/,
      },
    );
  } finally {
    if (origUrl !== undefined) process.env.NEXT_PUBLIC_SUPABASE_URL = origUrl;
    if (origKey !== undefined) process.env.SUPABASE_SERVICE_ROLE_KEY = origKey;
  }
});

test("uploadToSupabase uploads buffer and returns publicUrl", async () => {
  const origUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const origKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const origFetch = globalThis.fetch;

  try {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "dummy-service-role-key";

    let interceptedUrl = "";
    let interceptedMethod = "";
    let interceptedHeaders: Record<string, string> = {};

    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      interceptedUrl = String(input);
      interceptedMethod = init?.method || "GET";
      interceptedHeaders = (init?.headers as Record<string, string>) || {};
      return new Response(JSON.stringify({ Key: "test" }), { status: 200 });
    }) as typeof fetch;

    const result = await uploadToSupabase(
      "marcom-documents",
      "documents/abc123/uuid-file.pdf",
      Buffer.from("test content"),
      "application/pdf",
    );

    assert.equal(
      interceptedUrl,
      "https://example.supabase.co/storage/v1/object/marcom-documents/documents/abc123/uuid-file.pdf",
    );
    assert.equal(interceptedMethod, "POST");
    assert.equal(
      interceptedHeaders["Authorization"],
      "Bearer dummy-service-role-key",
    );
    assert.equal(interceptedHeaders["Content-Type"], "application/pdf");
    assert.equal(interceptedHeaders["x-upsert"], "true");
    assert.equal(
      result.publicUrl,
      "https://example.supabase.co/storage/v1/object/public/marcom-documents/documents/abc123/uuid-file.pdf",
    );
  } finally {
    globalThis.fetch = origFetch;
    if (origUrl !== undefined) process.env.NEXT_PUBLIC_SUPABASE_URL = origUrl;
    else delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (origKey !== undefined) process.env.SUPABASE_SERVICE_ROLE_KEY = origKey;
    else delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  }
});

test("uploadToSupabase throws on HTTP error from Supabase", async () => {
  const origUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const origKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const origFetch = globalThis.fetch;

  try {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "dummy-service-role-key";

    globalThis.fetch = (async () => {
      return new Response("Bucket not found", { status: 404 });
    }) as typeof fetch;

    await assert.rejects(
      async () => {
        await uploadToSupabase(
          "invalid-bucket",
          "test.pdf",
          Buffer.from("test"),
          "application/pdf",
        );
      },
      {
        message: /Supabase Storage upload failed: 404 Bucket not found/,
      },
    );
  } finally {
    globalThis.fetch = origFetch;
    if (origUrl !== undefined) process.env.NEXT_PUBLIC_SUPABASE_URL = origUrl;
    else delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (origKey !== undefined) process.env.SUPABASE_SERVICE_ROLE_KEY = origKey;
    else delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  }
});

