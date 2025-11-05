import type { MediaInfo } from "../components/media/MediaInfo.interface.ts";

export function createObjectUrl(blob: Blob) {
  return URL.createObjectURL(blob);
}

export interface MediaFile {
  blob: Blob | null;
  mediaInfo: MediaInfo;
  url: string;
}
