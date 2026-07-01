import type { Response } from "express";
import type { Readable } from "node:stream";
import type { Media } from "../domain/media";

/**
 * Content-types the upload pipeline can ever produce: images are normalized to webp
 * and PDFs are kept as-is (see `MediaService.uploadMedia`). The original image
 * extensions are listed too so legacy rows still render.
 */
const ALLOWED_MEDIA_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
]);

/**
 * Set hardened response headers for serving user-uploaded media.
 *
 * Defends against stored-XSS via MIME sniffing: `X-Content-Type-Options: nosniff`
 * stops the browser from re-interpreting the bytes, and the Content-Type is clamped to
 * the upload allowlist so a crafted file can never be served as an HTML/script type.
 * Anything outside the allowlist is forced to a non-rendering attachment download.
 */
export function setSafeMediaHeaders(res: Response, media: Media): void {
  const isAllowed = ALLOWED_MEDIA_CONTENT_TYPES.has(media.mimeType);
  const safeContentType = isAllowed ? media.mimeType : "application/octet-stream";

  res.setHeader("Content-Type", safeContentType);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  if (!isAllowed) {
    res.setHeader("Content-Disposition", "attachment");
  }
  if (media.updatedAt) {
    res.setHeader("Last-Modified", media.updatedAt.toUTCString());
  }
  res.setHeader("Cache-Control", "private, max-age=31536000");
}

/** Public-safe projection of a Media — exactly the api-client `MediaInfoDto` shape. */
export interface PublicMediaInfo {
  id: string;
  title: string;
  mimeType: string;
  size: number;
}

/**
 * Project a Media down to the fields an anonymous caller may see. The raw domain object
 * would otherwise serialize internal storage and ownership details (bucket, objectName,
 * eTag, versionId, ownedByOrganizationId, createdByUserId, …) to the public `/info` routes.
 */
export function toPublicMediaInfo(media: Media): PublicMediaInfo {
  return {
    id: media.id,
    title: media.title,
    mimeType: media.mimeType,
    size: media.size,
  };
}

/**
 * Stream user-uploaded media to the response with hardened headers, finalizing the
 * connection on a mid-stream source error.
 *
 * Once headers are flushed the error guard can no longer send a status code, so the
 * socket must be destroyed — otherwise a failed S3 read leaves a hung, half-open
 * response (a socket/FD leak that a reverse proxy only reaps on idle timeout).
 */
export function streamMedia(res: Response, media: Media, stream: Readable): void {
  setSafeMediaHeaders(res, media);
  stream.pipe(res);
  stream.on("error", (err: Error) => {
    if (res.headersSent) {
      res.destroy(err);
    } else {
      res.status(500).json({ error: "Failed to retrieve file" });
    }
  });
}
