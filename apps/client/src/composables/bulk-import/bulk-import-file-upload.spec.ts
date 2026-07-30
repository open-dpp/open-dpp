import type { FileUploadSelectEvent } from "primevue";
import { describe, expect, it, vi } from "vitest";
import { useBulkImportFileUpload } from "./bulk-import-file-upload.ts";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

// jsdom's Blob/File.text() implementation is unreliable in this test environment,
// so fake just the .text() method the composable actually calls.
function selectEventFor(content: string): FileUploadSelectEvent {
  const file = { text: () => Promise.resolve(content) } as unknown as File;
  return { files: [file] } as unknown as FileUploadSelectEvent;
}

describe("useBulkImportFileUpload", () => {
  it("parses a valid JSON array of records", async () => {
    const { onFileSelect, parsedRows, fileError, firstRow } = useBulkImportFileUpload();

    await onFileSelect(selectEventFor(JSON.stringify([{ sku: "a" }, { sku: "b" }])));

    expect(fileError.value).toBeNull();
    expect(parsedRows.value).toEqual([{ sku: "a" }, { sku: "b" }]);
    expect(firstRow.value).toEqual({ sku: "a" });
  });

  it("returns null for firstRow when no rows are parsed yet", () => {
    const { firstRow } = useBulkImportFileUpload();

    expect(firstRow.value).toBeNull();
  });

  it("rejects a JSON payload that isn't an array", async () => {
    const { onFileSelect, parsedRows, fileError } = useBulkImportFileUpload();

    await onFileSelect(selectEventFor(JSON.stringify({ sku: "a" })));

    expect(fileError.value).toBe("integrations.bulkImport.invalidFile");
    expect(parsedRows.value).toEqual([]);
  });

  it("rejects an empty array", async () => {
    const { onFileSelect, fileError } = useBulkImportFileUpload();

    await onFileSelect(selectEventFor(JSON.stringify([])));

    expect(fileError.value).toBe("integrations.bulkImport.invalidFile");
  });

  it("rejects an array containing non-object entries", async () => {
    const { onFileSelect, fileError } = useBulkImportFileUpload();

    await onFileSelect(selectEventFor(JSON.stringify([{ sku: "a" }, "not-an-object"])));

    expect(fileError.value).toBe("integrations.bulkImport.invalidFile");
  });

  it("rejects malformed JSON", async () => {
    const { onFileSelect, fileError, parsedRows } = useBulkImportFileUpload();

    await onFileSelect(selectEventFor("{not valid json"));

    expect(fileError.value).toBe("integrations.bulkImport.invalidFile");
    expect(parsedRows.value).toEqual([]);
  });

  it("clears a previous error once a valid file is selected", async () => {
    const { onFileSelect, fileError } = useBulkImportFileUpload();

    await onFileSelect(selectEventFor("not json"));
    expect(fileError.value).not.toBeNull();

    await onFileSelect(selectEventFor(JSON.stringify([{ sku: "a" }])));
    expect(fileError.value).toBeNull();
  });

  it("does nothing when no file was selected", async () => {
    const { onFileSelect, parsedRows, fileError } = useBulkImportFileUpload();

    await onFileSelect({ files: [] } as unknown as FileUploadSelectEvent);

    expect(parsedRows.value).toEqual([]);
    expect(fileError.value).toBeNull();
  });

  it("resets rows and error", async () => {
    const { onFileSelect, reset, parsedRows, fileError } = useBulkImportFileUpload();
    await onFileSelect(selectEventFor(JSON.stringify([{ sku: "a" }])));

    reset();

    expect(parsedRows.value).toEqual([]);
    expect(fileError.value).toBeNull();
  });
});
