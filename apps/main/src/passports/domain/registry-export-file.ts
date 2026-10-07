import { RegistryExportItem } from "./registry-export-item";

export const EuRegistryProductGroup = {
  Batteries: "BATTERIES",
} as const;
export type EuRegistryProductGroupType =
  (typeof EuRegistryProductGroup)[keyof typeof EuRegistryProductGroup];

export const REGISTRY_EXPORT_SCHEMA_VERSION = "1.0.0";
export const REGISTRY_EXPORT_MAX_ITEMS_PER_FILE = 100;

export class RegistryExportFile {
  private constructor(
    public readonly schemaVersion: string,
    public readonly productGroup: EuRegistryProductGroupType,
    public readonly items: ReadonlyArray<RegistryExportItem>,
  ) {}

  static create(data: {
    productGroup: EuRegistryProductGroupType;
    items: ReadonlyArray<RegistryExportItem>;
  }): RegistryExportFile {
    return new RegistryExportFile(REGISTRY_EXPORT_SCHEMA_VERSION, data.productGroup, data.items);
  }

  /** Splits the items, keeping their order, into files of at most `maxItemsPerFile` items. */
  static fromExportItems(
    productGroup: EuRegistryProductGroupType,
    items: ReadonlyArray<RegistryExportItem>,
    maxItemsPerFile: number = REGISTRY_EXPORT_MAX_ITEMS_PER_FILE,
  ): RegistryExportFile[] {
    const files: RegistryExportFile[] = [];
    for (let start = 0; start < items.length; start += maxItemsPerFile) {
      files.push(
        RegistryExportFile.create({
          productGroup,
          items: items.slice(start, start + maxItemsPerFile),
        }),
      );
    }
    return files;
  }

  toPlain() {
    return {
      schemaVersion: this.schemaVersion,
      productGroup: this.productGroup,
      items: this.items.map((item) => item.toPlain()),
    };
  }
}
