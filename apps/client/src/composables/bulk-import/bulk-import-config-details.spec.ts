import { describe, expect, it } from "vitest";
import { useBulkImportConfigDetails } from "./bulk-import-config-details.ts";

describe("useBulkImportConfigDetails", () => {
  it("starts with an empty name and no id field", () => {
    const { configName, idField } = useBulkImportConfigDetails();

    expect(configName.value).toBe("");
    expect(idField.value).toBeNull();
  });

  it("resets name and id field", () => {
    const { configName, idField, reset } = useBulkImportConfigDetails();
    configName.value = "ERP export";
    idField.value = "sku";

    reset();

    expect(configName.value).toBe("");
    expect(idField.value).toBeNull();
  });
});
