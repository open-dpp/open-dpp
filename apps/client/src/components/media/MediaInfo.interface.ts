export interface MediaInfo {
  id: string;
  mimeType: string;
  size: number;
  title: string;
}

export interface MediaResult {
  blob: Blob | null;
  mediaInfo: MediaInfo;
}
