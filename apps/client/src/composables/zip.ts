/** Saves a ZIP file the server sent as blob through the browser's download. */
export function useZip() {
  function downloadZip(data: Blob, filename: string) {
    const url = globalThis.URL.createObjectURL(new Blob([data], { type: "application/zip" }));
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

  return { downloadZip };
}
