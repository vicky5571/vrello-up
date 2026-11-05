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

test("transitionMouStatus sends PATCH with status REVISION", async () => {
  const origFetch = globalThis.fetch;
  try {
    let capturedBody: unknown = null;
    let capturedUrl = "";
    let capturedMethod = "";

    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      capturedUrl = String(input);
      capturedMethod = init?.method || "GET";
      capturedBody = JSON.parse(String(init?.body || "{}"));
      return new Response(JSON.stringify({ ok: true, status: "REVISION" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    await transitionMouStatus("mou-123", "REVISION");

    assert.equal(capturedUrl, "/api/marcom/mous/mou-123");
    assert.equal(capturedMethod, "PATCH");
    assert.deepEqual(capturedBody, { status: "REVISION" });
  } finally {
    globalThis.fetch = origFetch;
  }
});

test("transitionMouStatus throws with error message on HTTP 422 approval guard failure", async () => {
  const origFetch = globalThis.fetch;
  try {
    globalThis.fetch = (async () => {
      return new Response(
        JSON.stringify({ error: "Cannot approve or complete MOU without uploaded signed document / proof" }),
        {
          status: 422,
          headers: { "Content-Type": "application/json" },
        }
      );
    }) as typeof fetch;

    await assert.rejects(
      async () => {
        await transitionMouStatus("mou-no-doc", "APPROVED");
      },
      /Cannot approve or complete MOU without uploaded signed document \/ proof/
    );
  } finally {
    globalThis.fetch = origFetch;
  }
});

test("saveMou sends docPaths when multi-document array is provided", async () => {
  const origFetch = globalThis.fetch;
  try {
    let capturedBody: unknown = null;

    globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      capturedBody = JSON.parse(String(init?.body || "{}"));
      return new Response(JSON.stringify({ data: { id: "mou-999", ...(capturedBody as object) } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    await saveMou(
      {
        branchId: "branch-1",
        partnerName: "Partner A",
        mouType: "BRANDING",
        docPaths: ["/uploads/page1.jpg", "/uploads/page2.jpg"],
      },
      "mou-999"
    );

    assert.deepEqual((capturedBody as Record<string, unknown>).docPaths, [
      "/uploads/page1.jpg",
      "/uploads/page2.jpg",
    ]);
  } finally {
    globalThis.fetch = origFetch;
  }
});
