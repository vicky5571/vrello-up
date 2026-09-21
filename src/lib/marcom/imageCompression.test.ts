import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateTargetDimensions,
  isCompressibleImage,
  compressImageFile,
} from "@/lib/marcom/imageCompression";

describe("Image Compression Helpers", () => {
  describe("calculateTargetDimensions", () => {
    it("resizes landscape 4000x3000 camera photo to 1920x1440 preserving 4:3 aspect ratio", () => {
      const { width, height, wasResized } = calculateTargetDimensions(4000, 3000, 1920);
      assert.equal(width, 1920);
      assert.equal(height, 1440);
      assert.equal(wasResized, true);
    });

    it("resizes portrait 3000x4000 camera photo to 1440x1920 preserving 3:4 aspect ratio", () => {
      const { width, height, wasResized } = calculateTargetDimensions(3000, 4000, 1920);
      assert.equal(width, 1440);
      assert.equal(height, 1920);
      assert.equal(wasResized, true);
    });

    it("leaves images under maxDimension untouched without resizing", () => {
      const { width, height, wasResized } = calculateTargetDimensions(1280, 720, 1920);
      assert.equal(width, 1280);
      assert.equal(height, 720);
      assert.equal(wasResized, false);
    });

    it("handles square 3000x3000 photo to 1920x1920", () => {
      const { width, height, wasResized } = calculateTargetDimensions(3000, 3000, 1920);
      assert.equal(width, 1920);
      assert.equal(height, 1920);
      assert.equal(wasResized, true);
    });

    it("handles non-positive inputs safely", () => {
      const { width, height, wasResized } = calculateTargetDimensions(0, -100, 1920);
      assert.equal(width, 1920);
      assert.equal(height, 1920);
      assert.equal(wasResized, false);
    });
  });

  describe("isCompressibleImage", () => {
    it("recognizes common camera photo MIME types", () => {
      assert.equal(isCompressibleImage({ type: "image/jpeg" }), true);
      assert.equal(isCompressibleImage({ type: "image/png" }), true);
      assert.equal(isCompressibleImage({ type: "image/webp" }), true);
    });

    it("recognizes photo file extensions when MIME is missing", () => {
      assert.equal(isCompressibleImage({ name: "toko_depan.JPG" }), true);
      assert.equal(isCompressibleImage({ name: "bukti_posm.png" }), true);
      assert.equal(isCompressibleImage({ name: "outlet.webp" }), true);
    });

    it("rejects non-compressible files such as PDF, MP4, and SVG", () => {
      assert.equal(isCompressibleImage({ type: "application/pdf", name: "mou.pdf" }), false);
      assert.equal(isCompressibleImage({ type: "video/mp4", name: "clip.mp4" }), false);
      assert.equal(isCompressibleImage({ type: "image/svg+xml", name: "logo.svg" }), false);
    });
  });

  describe("compressImageFile in Node environment", () => {
    it("gracefully falls back to returning the original file when window is not defined", async () => {
      // Mock File object
      const dummyFile = {
        name: "test.jpg",
        size: 5 * 1024 * 1024,
        type: "image/jpeg",
      } as unknown as File;

      const result = await compressImageFile(dummyFile);
      assert.equal(result, dummyFile);
    });
  });
});
