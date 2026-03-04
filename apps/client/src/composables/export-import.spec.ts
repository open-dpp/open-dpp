import type { FileUploadSelectEvent } from "primevue";
import { beforeEach, expect, it, vi } from "vitest";
import { generatedErrorHandlingStoreMock } from "../testing-utils/error-handling-store-mock.ts";
import { useExportImport } from "./export-import.ts";

const logErrorWithNotification = vi.fn();

vi.mock("../stores/error.handling.ts", () => ({
  useErrorHandlingStore: () => generatedErrorHandlingStoreMock(logErrorWithNotification),
}));

vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

describe("useExportImport", () => {
  const exportFn = vi.fn();
  const importFn = vi.fn();
  const defaultOptions = {
    exportFn,
    importFn,
    filenamePrefix: "test-entity",
    exportErrorKey: "common.exportFailed",
    importErrorKey: "common.importFailed",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("exportItem", () => {
    it("should create a download link with correct filename", async () => {
      const mockData = { key: "value" };
      exportFn.mockResolvedValue(mockData);

      const createObjectURL = vi.fn(() => "blob:mock-url");
      const revokeObjectURL = vi.fn();
      vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });

      const clickSpy = vi.fn();
      const removeSpy = vi.fn();
      vi.spyOn(document, "createElement").mockReturnValue({
        href: "",
        setAttribute: vi.fn(),
        click: clickSpy,
        remove: removeSpy,
      } as unknown as HTMLElement);
      vi.spyOn(document.body, "appendChild").mockImplementation(node => node);

      const { exportItem } = useExportImport(defaultOptions);
      await exportItem("abc-123");

      expect(exportFn).toHaveBeenCalledWith("abc-123");
      expect(createObjectURL).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(removeSpy).toHaveBeenCalled();
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
    });

    it("should log error with notification when export fails", async () => {
      const error = new Error("network error");
      exportFn.mockRejectedValue(error);

      const { exportItem } = useExportImport(defaultOptions);
      await exportItem("abc-123");

      expect(logErrorWithNotification).toHaveBeenCalledWith("common.exportFailed", error);
    });

    it("should revoke object URL even when click fails", async () => {
      const mockData = { key: "value" };
      exportFn.mockResolvedValue(mockData);

      const revokeObjectURL = vi.fn();
      vi.stubGlobal("URL", { createObjectURL: () => "blob:mock-url", revokeObjectURL });

      vi.spyOn(document, "createElement").mockReturnValue({
        href: "",
        setAttribute: vi.fn(),
        click: vi.fn(() => { throw new Error("click failed"); }),
        remove: vi.fn(),
      } as unknown as HTMLElement);
      vi.spyOn(document.body, "appendChild").mockImplementation(node => node);

      const { exportItem } = useExportImport(defaultOptions);
      await exportItem("abc-123");

      expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
    });
  });

  describe("onFileSelect", () => {
    function createFileSelectEvent(content: string): FileUploadSelectEvent {
      const file = { text: () => Promise.resolve(content) };
      return { files: [file], originalEvent: new Event("select") } as unknown as FileUploadSelectEvent;
    }

    it("should parse file and call importFn", async () => {
      importFn.mockResolvedValue(undefined);

      const { onFileSelect, importing } = useExportImport(defaultOptions);
      const event = createFileSelectEvent(JSON.stringify({ data: "test" }));

      await onFileSelect(event);

      expect(importFn).toHaveBeenCalledWith({ data: "test" });
      expect(importing.value).toBe(false);
    });

    it("should set importing to true during import and false after", async () => {
      const { onFileSelect, importing } = useExportImport(defaultOptions);

      let importingDuringCall = false;
      importFn.mockImplementation(() => {
        importingDuringCall = importing.value;
        return Promise.resolve();
      });

      const event = createFileSelectEvent(JSON.stringify({ data: "test" }));
      await onFileSelect(event);

      expect(importingDuringCall).toBe(true);
      expect(importing.value).toBe(false);
    });

    it("should log error with notification when import fails", async () => {
      const error = new Error("import error");
      importFn.mockRejectedValue(error);

      const { onFileSelect, importing } = useExportImport(defaultOptions);
      const event = createFileSelectEvent(JSON.stringify({ data: "test" }));

      await onFileSelect(event);

      expect(logErrorWithNotification).toHaveBeenCalledWith("common.importFailed", error);
      expect(importing.value).toBe(false);
    });

    it("should log error with notification when JSON parsing fails", async () => {
      const { onFileSelect } = useExportImport(defaultOptions);
      const event = createFileSelectEvent("not valid json");

      await onFileSelect(event);

      expect(logErrorWithNotification).toHaveBeenCalledWith("common.importFailed", expect.any(SyntaxError));
      expect(importFn).not.toHaveBeenCalled();
    });

    it("should do nothing when no file is selected", async () => {
      const { onFileSelect } = useExportImport(defaultOptions);
      const event = { files: [], originalEvent: new Event("select") } as unknown as FileUploadSelectEvent;

      await onFileSelect(event);

      expect(importFn).not.toHaveBeenCalled();
    });
  });
});
