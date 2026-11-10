import { Buffer } from "node:buffer";
import { MediaMimeType } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import sharp from "sharp";
import { fileTypeFromBuffer } from "../file-type-util";
import { sanitizeSvg } from "./svg-sanitizer";

export interface ProcessedMediaUpload {
  readonly buffer: Buffer;
  readonly mimeType: string;
  readonly fileExtension: string;
}

interface DetectedMediaType {
  readonly mimeType: string;
  readonly fileExtension: string;
}

const WEBP_QUALITY = 85;
const RASTER_MIME_TYPES: ReadonlySet<string> = new Set([
  MediaMimeType.JPEG,
  MediaMimeType.PNG,
  MediaMimeType.WEBP,
]);
// file-type reports an SVG with an XML declaration as XML, and one without as nothing at all.
const XML_MIME_TYPE = "application/xml";
const SVG_ELEMENT_START = /<svg[\s/>]/;

/** Detects the type from the content only; the client's MIME type and file name are ignored. */
async function detectMediaType(buffer: Buffer): Promise<DetectedMediaType | null> {
  const detected = await fileTypeFromBuffer(buffer);
  if (detected && detected.mime !== XML_MIME_TYPE) {
    return { mimeType: detected.mime, fileExtension: detected.ext };
  }
  // Only routes the file to the sanitizer, which decides whether it really is an SVG.
  if (SVG_ELEMENT_START.test(buffer.toString("latin1"))) {
    return { mimeType: MediaMimeType.SVG, fileExtension: "svg" };
  }
  return null;
}

/** Bakes the EXIF orientation into the pixels and drops all metadata (EXIF, GPS, XMP). */
async function normalizeRasterImage(buffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(buffer).autoOrient().webp({ quality: WEBP_QUALITY }).toBuffer();
  } catch (error) {
    throw new ValueError("The image could not be decoded.", { cause: error });
  }
}

/**
 * Turns an uploaded file into what gets stored: raster images become WebP, SVGs are sanitized,
 * other allowed types (PDF) are kept unchanged.
 *
 * @throws ValueError if the type cannot be detected, is not in `allowedMimeTypes`, or the
 * content cannot be processed.
 */
export async function processMediaUpload(
  buffer: Buffer,
  allowedMimeTypes: readonly string[],
): Promise<ProcessedMediaUpload> {
  const detected = await detectMediaType(buffer);
  if (!detected) {
    throw new ValueError("The file type could not be detected or is not supported.");
  }
  if (!allowedMimeTypes.includes(detected.mimeType)) {
    throw new ValueError(`The file type ${detected.mimeType} is not supported here.`);
  }
  if (detected.mimeType === MediaMimeType.SVG) {
    return { ...detected, buffer: sanitizeSvg(buffer) };
  }
  if (RASTER_MIME_TYPES.has(detected.mimeType)) {
    return {
      buffer: await normalizeRasterImage(buffer),
      mimeType: MediaMimeType.WEBP,
      fileExtension: "webp",
    };
  }
  return { ...detected, buffer };
}
