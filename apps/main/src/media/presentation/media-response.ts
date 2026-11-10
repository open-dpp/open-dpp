import type express from "express";
import type { Readable } from "node:stream";
import type { Media } from "../domain/media";
import { MediaMimeType } from "@open-dpp/dto";

/**
 * An SVG opened directly is a document that can run script. Its content is sanitized on upload;
 * this policy keeps it inert even if something slipped through: no script, no network, sandboxed.
 * Not used for PDFs, because `sandbox` stops Chrome's built-in PDF viewer.
 */
export const SVG_CONTENT_SECURITY_POLICY =
  "default-src 'none'; style-src 'unsafe-inline'; img-src data:; sandbox";

function setMediaHeaders(res: express.Response, media: Media): void {
  res.setHeader("Content-Type", media.mimeType);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  if (media.mimeType === MediaMimeType.SVG) {
    res.setHeader("Content-Security-Policy", SVG_CONTENT_SECURITY_POLICY);
  }
  if (media.updatedAt) {
    res.setHeader("Last-Modified", media.updatedAt.toUTCString());
  }
  res.setHeader("Cache-Control", "private, max-age=31536000");
}

/** Streams a stored media file with the headers every media download gets. */
export function sendMediaFile(
  res: express.Response,
  file: { readonly media: Media; readonly stream: Readable },
): void {
  setMediaHeaders(res, file.media);
  file.stream.pipe(res);
  file.stream.on("error", () => {
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to retrieve file" });
    }
  });
}
