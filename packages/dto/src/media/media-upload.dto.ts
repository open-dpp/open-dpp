/**
 * The MIME types a media upload may have. The backend detects the type from the file content,
 * never from the client's MIME type or the file extension.
 */
export const MediaMimeType = {
  JPEG: "image/jpeg",
  PNG: "image/png",
  WEBP: "image/webp",
  SVG: "image/svg+xml",
  PDF: "application/pdf",
} as const;

export type MediaMimeTypeValue = (typeof MediaMimeType)[keyof typeof MediaMimeType];

/** Types accepted by the media library and the media picker. */
export const MEDIA_UPLOAD_MIME_TYPES: readonly MediaMimeTypeValue[] = [
  MediaMimeType.JPEG,
  MediaMimeType.PNG,
  MediaMimeType.WEBP,
  MediaMimeType.SVG,
  MediaMimeType.PDF,
];

/** Types accepted for an organization profile picture: the media types without documents. */
export const ORGANIZATION_PROFILE_UPLOAD_MIME_TYPES: readonly MediaMimeTypeValue[] =
  MEDIA_UPLOAD_MIME_TYPES.filter((mimeType) => mimeType !== MediaMimeType.PDF);

/** Largest accepted upload, for every media type. */
export const MEDIA_UPLOAD_MAX_SIZE_BYTES = 15 * 1024 * 1024;
