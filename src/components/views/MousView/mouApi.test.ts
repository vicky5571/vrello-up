import test from "node:test";
import assert from "node:assert/strict";
import {
  saveMou,
  transitionMouStatus,
  deleteMou,
  uploadMouDocument,
} from "@/components/views/MousView/mouApi";

test("mouApi exports all 4 functions", () => {
  assert.equal(typeof saveMou, "function");
  assert.equal(typeof transitionMouStatus, "function");
  assert.equal(typeof deleteMou, "function");
  assert.equal(typeof uploadMouDocument, "function");
});

test("uploadMouDocument sends kind mou-documents to /api/marcom/uploads", async () => {
  const origFetch = globalThis.fetch;
  try {
    let capturedBody: unknown = null;
    let capturedUrl = "";

    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      capturedUrl = String(input);
      capturedBody = init?.body as FormData;
      return new Response(JSON.stringify({ filePath: "https://example.supabase.co/file.pdf" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    const file = new File(["dummy"], "contract.pdf", { type: "application/pdf" });
    const result = await uploadMouDocument(file, "mou-123");

    assert.equal(capturedUrl, "/api/marcom/uploads");
    assert.ok(capturedBody instanceof FormData);
    assert.equal(capturedBody.get("kind"), "mou-documents");
    assert.equal(capturedBody.get("id"), "mou-123");
    assert.equal(result, "https://example.supabase.co/file.pdf");
  } finally {
    globalThis.fetch = origFetch;
  }
});
