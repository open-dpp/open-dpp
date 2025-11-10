import type { MediaInfo } from "../components/media/MediaInfo.interface.ts";

export function createObjectUrl(blob: Blob) {
  return URL.createObjectURL(blob);
}

export function revokeObjectUrl(url: string) {
  URL.revokeObjectURL(url);
}

export interface MediaFile {
  blob: Blob | null;
  mediaInfo: MediaInfo;
  url: string;
}
