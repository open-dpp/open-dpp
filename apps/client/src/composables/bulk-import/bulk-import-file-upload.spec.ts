import type { FileUploadSelectEvent } from "primevue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBulkImportFileUpload } from "./bulk-import-file-upload.ts";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

const mocks = vi.hoisted(() => {
  return {
    parseFile: vi.fn(),
  };
});

// Mock the API client's parseFile method
vi.mock("../../lib/api-client.ts", () => ({
  default: {
    dpp: {
      bulkImport: {
        parseFile: mocks.parseFile,
      },
    },
  },
}));

function selectEventFor(file: File): FileUploadSelectEvent {
  return { files: [file] } as unknown as FileUploadSelectEvent;
}

function createMockFile(name: string = "test.json"): File {
  return new File([], name, { type: "application/json" });
}

describe("useBulkImportFileUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("parses a valid file via server", async () => {
    const mockRows = [
      { sku: "a", name: "Product A" },
      { sku: "b", name: "Product B" },
    ];
    mocks.parseFile.mockResolvedValue({
      data: { rows: mockRows },
    });

    const { onFileSelect, parsedRows, selectedFile, fileError, firstRow, isLoading } = useBulkImportFileUpload();

    const file = createMockFile();
    await onFileSelect(selectEventFor(file));

    expect(isLoading.value).toBe(false);
    expect(fileError.value).toBeNull();
    expect(parsedRows.value).toEqual(mockRows);
    expect(selectedFile.value).toBe(file);
    expect(firstRow.value).toEqual({ sku: "a", name: "Product A" });
    expect(mocks.parseFile).toHaveBeenCalledWith(file);
  });

  it("returns null for firstRow when no rows are parsed yet", () => {
    const { firstRow } = useBulkImportFileUpload();

    expect(firstRow.value).toBeNull();
  });

  it("handles server validation errors", async () => {
    mocks.parseFile.mockRejectedValue(new Error("Validation failed"));

    const { onFileSelect, parsedRows, selectedFile, fileError, isLoading } = useBulkImportFileUpload();

    const file = createMockFile();
    await onFileSelect(selectEventFor(file));

    expect(isLoading.value).toBe(false);
    expect(fileError.value).toBe("integrations.bulkImport.invalidFile");
    expect(parsedRows.value).toEqual([]);
    expect(selectedFile.value).toBeNull();
  });

  it("handles empty rows array from server", async () => {
    mocks.parseFile.mockResolvedValue({
      data: { rows: [] },
    });

    const { onFileSelect, parsedRows, selectedFile, fileError, isLoading } = useBulkImportFileUpload();

    const file = createMockFile();
    await onFileSelect(selectEventFor(file));

    expect(isLoading.value).toBe(false);
    expect(fileError.value).toBeNull();
    expect(parsedRows.value).toEqual([]);
    expect(selectedFile.value).toBe(file);
  });

  it("sets loading state during file upload", async () => {
    const mockRows = [{ sku: "a" }];
    let resolveParseFile: () => void;
    mocks.parseFile.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveParseFile = () => resolve({ data: { rows: mockRows } });
        }),
    );

    const { onFileSelect, isLoading } = useBulkImportFileUpload();

    const file = createMockFile();
    const promise = onFileSelect(selectEventFor(file));

    expect(isLoading.value).toBe(true);

    resolveParseFile!();
    await promise;

    expect(isLoading.value).toBe(false);
  });

  it("clears a previous error once a valid file is selected", async () => {
    mocks.parseFile
      .mockRejectedValueOnce(new Error("Validation failed"))
      .mockResolvedValueOnce({ data: { rows: [{ sku: "a" }] } });

    const { onFileSelect, fileError } = useBulkImportFileUpload();

    const file1 = createMockFile();
    await onFileSelect(selectEventFor(file1));
    expect(fileError.value).toBe("integrations.bulkImport.invalidFile");

    const file2 = createMockFile();
    await onFileSelect(selectEventFor(file2));
    expect(fileError.value).toBeNull();
  });

  it("does nothing when no file was selected", async () => {
    const { onFileSelect, parsedRows, fileError } = useBulkImportFileUpload();

    await onFileSelect({ files: [] } as unknown as FileUploadSelectEvent);

    expect(parsedRows.value).toEqual([]);
    expect(fileError.value).toBeNull();
    expect(mocks.parseFile).not.toHaveBeenCalled();
  });

  it("resets rows, error, loading state, and selected file", async () => {
    mocks.parseFile.mockResolvedValue({
      data: { rows: [{ sku: "a" }] },
    });

    const { onFileSelect, reset, parsedRows, selectedFile, fileError, isLoading } = useBulkImportFileUpload();
    const file = createMockFile();
    await onFileSelect(selectEventFor(file));

    reset();

    expect(parsedRows.value).toEqual([]);
    expect(selectedFile.value).toBeNull();
    expect(fileError.value).toBeNull();
    expect(isLoading.value).toBe(false);
  });
});
