import { randomUUID } from "node:crypto";
import { describe, expect, it } from "@jest/globals";
import { BulkImportConfig } from "./bulk-import-config";
import { FieldMapping } from "./field-mapping";
import { JsonTransformer } from "./json-transformer";

describe("BulkImportConfig", () => {
  const technicalDataSubmodelId = randomUUID();

  function buildConfig() {
    return BulkImportConfig.create({
      organizationId: randomUUID(),
      templateId: randomUUID(),
      name: "ERP export",
      idField: "sku",
      submodelMappings: new Map([
        [
          technicalDataSubmodelId,
          JsonTransformer.create({
            fieldMappings: [FieldMapping.create({ input: "weightKg", output: "weight" })],
          }),
        ],
      ]),
    });
  }

  it("round-trips through toPlain/fromPlain", () => {
    const config = buildConfig();
    const restored = BulkImportConfig.fromPlain(config.toPlain());
    expect(restored.toPlain()).toEqual(config.toPlain());
  });

  it("applies each submodel's mapping to a row", async () => {
    const config = buildConfig();
    const result = await config.applyToRow({ sku: "4711", weightKg: 12 });
    expect(result[technicalDataSubmodelId]).toEqual({ weight: 12 });
  });

  it("extracts and trims the id field value", async () => {
    const config = buildConfig();
    expect(await config.extractIdValue({ sku: " 4711 " })).toEqual("4711");
  });

  it("returns undefined when the id field is missing or blank", async () => {
    const config = buildConfig();
    expect(await config.extractIdValue({})).toBeUndefined();
    expect(await config.extractIdValue({ sku: "  " })).toBeUndefined();
  });

  it("extracts the id value for a raw column name containing a hyphen", async () => {
    // Column headers like "Produkt-ID" are not valid bare JSONata identifiers - unquoted,
    // JSONata would otherwise parse the hyphen as subtraction ("Produkt" minus "ID") instead of
    // a field lookup. extractIdValue must quote the path internally so callers can pass the raw
    // column name as-is.
    const config = BulkImportConfig.create({
      organizationId: randomUUID(),
      templateId: randomUUID(),
      name: "ERP export",
      idField: "Produkt-ID",
      submodelMappings: new Map(),
    });
    expect(await config.extractIdValue({ "Produkt-ID": "4711" })).toEqual("4711");
  });

  it("updateMapping mutates the config in place", () => {
    const config = buildConfig();
    const id = config.id;
    const updatedAtBefore = config.updatedAt;
    config.updateMapping({ name: "Renamed" });
    expect(config.name).toEqual("Renamed");
    expect(config.id).toEqual(id);
    expect(config.updatedAt.getTime()).toBeGreaterThanOrEqual(updatedAtBefore.getTime());
  });
});
