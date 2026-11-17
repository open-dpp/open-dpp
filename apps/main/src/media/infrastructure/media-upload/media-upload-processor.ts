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

export interface DetectedMediaType {
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

/**
 * Turns an uploaded file of one detected type into what gets stored. `process` is the template
 * method: it owns the check all types share, a subclass only says how its type is transformed.
 * Get the processor for a file from `detectMediaProcessor`.
 */
export abstract class MediaUploadProcessor {
  constructor(protected readonly detected: DetectedMediaType) {}

  /**
   * Not to be overridden: the type is checked before any content is decoded or parsed.
   *
   * @throws ValueError if the detected type is not in `allowedMimeTypes`, or the content cannot
   * be processed.
   */
  async process(
    buffer: Buffer,
    allowedMimeTypes: readonly string[],
  ): Promise<ProcessedMediaUpload> {
    if (!allowedMimeTypes.includes(this.detected.mimeType)) {
      throw new ValueError(`The file type ${this.detected.mimeType} is not supported here.`);
    }
    return this.transform(buffer);
  }

  protected abstract transform(
    buffer: Buffer,
  ): ProcessedMediaUpload | Promise<ProcessedMediaUpload>;
}

/**
 * JPEG, PNG and WebP become WebP. The EXIF orientation is baked into the pixels and all
 * metadata (EXIF, GPS, XMP) is dropped.
 */
export class RasterImageProcessor extends MediaUploadProcessor {
  protected async transform(buffer: Buffer): Promise<ProcessedMediaUpload> {
    try {
      return {
        buffer: await sharp(buffer).autoOrient().webp({ quality: WEBP_QUALITY }).toBuffer(),
        mimeType: MediaMimeType.WEBP,
        fileExtension: "webp",
      };
    } catch (error) {
      throw new ValueError("The image could not be decoded.", { cause: error });
    }
  }
}

/** An SVG stays a vector and is sanitized; the uploaded file itself is never stored. */
export class SvgProcessor extends MediaUploadProcessor {
  protected transform(buffer: Buffer): ProcessedMediaUpload {
    return { ...this.detected, buffer: sanitizeSvg(buffer) };
  }
}

/** Every other type (PDF) is stored unchanged. */
export class PassthroughProcessor extends MediaUploadProcessor {
  protected transform(buffer: Buffer): ProcessedMediaUpload {
    return { ...this.detected, buffer };
  }
}

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

/**
 * Sniffs the content once and returns the processor for its type. The only place that knows
 * about file-type and the SVG fallback.
 *
 * @throws ValueError if the type cannot be detected.
 */
export async function detectMediaProcessor(buffer: Buffer): Promise<MediaUploadProcessor> {
  const detected = await detectMediaType(buffer);
  if (!detected) {
    throw new ValueError("The file type could not be detected or is not supported.");
  }
  if (RASTER_MIME_TYPES.has(detected.mimeType)) {
    return new RasterImageProcessor(detected);
  }
  if (detected.mimeType === MediaMimeType.SVG) {
    return new SvgProcessor(detected);
  }
  return new PassthroughProcessor(detected);
}
