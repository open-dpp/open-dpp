import type { FileUploadSelectEvent } from "primevue";
import type { Ref } from "vue";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useErrorHandlingStore } from "../stores/error.handling.ts";

interface ExportImportOptions {
  exportFn: (id: string) => Promise<Record<string, unknown>>;
  importFn: (json: Record<string, unknown>) => Promise<void>;
  filenamePrefix: string;
  exportErrorKey: string;
  importErrorKey: string;
}

interface ExportImportReturn {
  importing: Ref<boolean>;
  exportItem: (id: string) => Promise<void>;
  onFileSelect: (event: FileUploadSelectEvent) => Promise<void>;
}

export function useExportImport(options: ExportImportOptions): ExportImportReturn {
  const { logErrorWithNotification } = useErrorHandlingStore();
  const { t } = useI18n();
  const importing = ref(false);

  async function exportItem(id: string) {
    let url: string | undefined;
    try {
      const data = await options.exportFn(id);
      const dataStr = JSON.stringify(data, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      url = globalThis.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${options.filenamePrefix}-${id}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
    catch (error) {
      logErrorWithNotification(t(options.exportErrorKey), error);
    }
    finally {
      if (url) {
        globalThis.URL.revokeObjectURL(url);
      }
    }
  }

  async function onFileSelect(event: FileUploadSelectEvent) {
    const file = event.files?.[0] as File | undefined;
    if (!file)
      return;

    importing.value = true;
    try {
      const json = JSON.parse(await file.text());
      await options.importFn(json);
    }
    catch (error) {
      logErrorWithNotification(t(options.importErrorKey), error);
    }
    finally {
      importing.value = false;
    }
  }

  return { importing, exportItem, onFileSelect };
}
