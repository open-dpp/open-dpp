import { Buffer } from "node:buffer";
import { gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import {
  MEDIA_UPLOAD_MIME_TYPES,
  MediaMimeType,
  ORGANIZATION_PROFILE_UPLOAD_MIME_TYPES,
} from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import sharp from "sharp";
import { processMediaUpload } from "./media-upload-processor";

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><script>alert(1)</script><rect width="10" height="10"/></svg>`;
const MINIMAL_PDF = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");
// The ftyp box file-type uses to recognize HEIC; sharp's prebuilt libheif only decodes AVIF.
const HEIC_HEADER = Buffer.concat([
  Buffer.from([0x00, 0x00, 0x00, 0x18]),
  Buffer.from("ftypheic"),
  Buffer.from([0x00, 0x00, 0x00, 0x00]),
  Buffer.from("mif1heic"),
]);

function rasterImage(format: "jpeg" | "png" | "webp", width = 20, height = 10): Promise<Buffer> {
  return sharp({ create: { width, height, channels: 3, background: "#3366ff" } })
    [format]()
    .toBuffer();
}

describe("processMediaUpload", () => {
  it.each(["jpeg", "png", "webp"] as const)("re-encodes a %s image as WebP", async (format) => {
    const result = await processMediaUpload(await rasterImage(format), MEDIA_UPLOAD_MIME_TYPES);

    expect(result.mimeType).toBe(MediaMimeType.WEBP);
    expect(result.fileExtension).toBe("webp");
    const metadata = await sharp(result.buffer).metadata();
    expect(metadata.format).toBe("webp");
    expect([metadata.width, metadata.height]).toEqual([20, 10]);
  });

  it("rotates the pixels of an image tagged with an EXIF orientation", async () => {
    const landscapeTaggedAsRotated = await sharp(await rasterImage("jpeg", 200, 100))
      .withMetadata({ orientation: 6 })
      .toBuffer();

    const result = await processMediaUpload(landscapeTaggedAsRotated, MEDIA_UPLOAD_MIME_TYPES);

    const metadata = await sharp(result.buffer).metadata();
    expect([metadata.width, metadata.height]).toEqual([100, 200]);
    expect(metadata.orientation).toBeUndefined();
  });

  it("strips EXIF metadata including the GPS position", async () => {
    const withGps = await sharp(await rasterImage("jpeg"))
      .withExif({
        IFD0: { Artist: "Jane Doe" },
        IFD3: { GPSLatitudeRef: "N", GPSLatitude: "52/1 31/1 0/1" },
      })
      .toBuffer();
    expect((await sharp(withGps).metadata()).exif).toBeDefined();

    const result = await processMediaUpload(withGps, MEDIA_UPLOAD_MIME_TYPES);

    expect((await sharp(result.buffer).metadata()).exif).toBeUndefined();
  });

  it("stores a PDF unchanged", async () => {
    const result = await processMediaUpload(MINIMAL_PDF, MEDIA_UPLOAD_MIME_TYPES);

    expect(result).toEqual({
      buffer: MINIMAL_PDF,
      mimeType: MediaMimeType.PDF,
      fileExtension: "pdf",
    });
  });

  it("keeps an SVG as a sanitized vector", async () => {
    const result = await processMediaUpload(Buffer.from(SVG), MEDIA_UPLOAD_MIME_TYPES);

    expect(result.mimeType).toBe(MediaMimeType.SVG);
    expect(result.fileExtension).toBe("svg");
    const text = result.buffer.toString("utf8");
    expect(text).toContain("<rect");
    expect(text).not.toContain("script");
  });

  it("detects an SVG that starts with an XML declaration", async () => {
    const input = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>\n${SVG}`);

    const result = await processMediaUpload(input, MEDIA_UPLOAD_MIME_TYPES);

    expect(result.mimeType).toBe(MediaMimeType.SVG);
  });

  it("accepts an SVG as an organization profile picture", async () => {
    const result = await processMediaUpload(
      Buffer.from(SVG),
      ORGANIZATION_PROFILE_UPLOAD_MIME_TYPES,
    );

    expect(result.mimeType).toBe(MediaMimeType.SVG);
  });

  it("rejects a PDF as an organization profile picture", async () => {
    await expect(
      processMediaUpload(MINIMAL_PDF, ORGANIZATION_PROFILE_UPLOAD_MIME_TYPES),
    ).rejects.toThrow(ValueError);
  });

  it("rejects a HEIC image", async () => {
    await expect(processMediaUpload(HEIC_HEADER, MEDIA_UPLOAD_MIME_TYPES)).rejects.toThrow(
      /image\/heic/,
    );
  });

  it("rejects a gzipped SVG", async () => {
    await expect(
      processMediaUpload(gzipSync(Buffer.from(SVG)), MEDIA_UPLOAD_MIME_TYPES),
    ).rejects.toThrow(ValueError);
  });

  it("rejects a file whose type cannot be detected", async () => {
    await expect(
      processMediaUpload(Buffer.from("just some text"), MEDIA_UPLOAD_MIME_TYPES),
    ).rejects.toThrow(ValueError);
  });

  it("rejects an image that cannot be decoded", async () => {
    const truncatedPng = (await rasterImage("png")).subarray(0, 40);

    await expect(processMediaUpload(truncatedPng, MEDIA_UPLOAD_MIME_TYPES)).rejects.toThrow(
      ValueError,
    );
  });
});
