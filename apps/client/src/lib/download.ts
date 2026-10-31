/** Saves a file the server sent as blob through the browser's download. */
export function downloadBlob(data: Blob, filename: string) {
  const url = globalThis.URL.createObjectURL(data);
  try {
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    globalThis.URL.revokeObjectURL(url);
  }
}
