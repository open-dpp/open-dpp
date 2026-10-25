import { describe, expect, it } from "@jest/globals";
import { EuRegistryProductGroup, RegistryExportFile } from "./registry-export-file";
import { RegistryExportItem } from "./registry-export-item";

const items = (count: number) =>
  Array.from({ length: count }, (_, i) =>
    RegistryExportItem.create({ uniqueProductIdentifier: `https://x.eu/${i}` }),
  );

describe("registryExportFile.fromExportItems", () => {
  it("builds no file for no items", () => {
    expect(RegistryExportFile.fromExportItems(EuRegistryProductGroup.Batteries, [])).toEqual([]);
  });

  it("builds one file in the registry format", () => {
    const [file] = RegistryExportFile.fromExportItems(EuRegistryProductGroup.Batteries, items(2));
    expect(file.toPlain()).toEqual({
      schemaVersion: "1.0.0",
      productGroup: "BATTERIES",
      items: [
        { uniqueProductIdentifier: "https://x.eu/0" },
        { uniqueProductIdentifier: "https://x.eu/1" },
      ],
    });
  });

  it("keeps 100 items in one file", () => {
    const files = RegistryExportFile.fromExportItems(EuRegistryProductGroup.Batteries, items(100));
    expect(files.map((f) => f.items.length)).toEqual([100]);
  });

  it("starts a second file at 101 items and keeps the order", () => {
    const files = RegistryExportFile.fromExportItems(EuRegistryProductGroup.Batteries, items(101));
    expect(files.map((f) => f.items.length)).toEqual([100, 1]);
    expect(files[1].items[0].uniqueProductIdentifier).toBe("https://x.eu/100");
  });
});
