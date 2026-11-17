import { downloadBlob } from "./download.ts";

/** Saves a ZIP file the server sent as blob through the browser's download. */
export function downloadZip(data: Blob, filename: string) {
  downloadBlob(new Blob([data], { type: "application/zip" }), filename);
}
