import { describe, expect, it } from "vitest";
import { KeyTypes } from "@open-dpp/dto";
import type {
  SubmodelElementCollectionResponseDto,
  SubmodelElementResponseDto,
} from "@open-dpp/dto";
import { buildColumns, buildGroupHeaders, buildRows, hasGroupColumns } from "./table.ts";

function makeFileRow(): SubmodelElementCollectionResponseDto {
  const value: SubmodelElementResponseDto[] = [
    {
      modelType: KeyTypes.File,
      idShort: "photo",
      displayName: [{ language: "en", text: "Photo" }],
      description: [],
      supplementalSemanticIds: [],
      qualifiers: [],
      embeddedDataSpecifications: [],
      value: "some-media-id",
    } as unknown as SubmodelElementResponseDto,
    {
      modelType: KeyTypes.Property,
      idShort: "name",
      displayName: [{ language: "en", text: "Name" }],
      description: [],
      supplementalSemanticIds: [],
      qualifiers: [],
      embeddedDataSpecifications: [],
      value: "Alice",
    } as unknown as SubmodelElementResponseDto,
  ];
  return {
    modelType: KeyTypes.SubmodelElementCollection,
    idShort: "row0",
    displayName: [],
    description: [],
    supplementalSemanticIds: [],
    qualifiers: [],
    embeddedDataSpecifications: [],
    value,
  } as unknown as SubmodelElementCollectionResponseDto;
}

function makePropertyOnlyRow(): SubmodelElementCollectionResponseDto {
  const value: SubmodelElementResponseDto[] = [
    {
      modelType: KeyTypes.Property,
      idShort: "name",
      displayName: [{ language: "en", text: "Name" }],
      description: [],
      supplementalSemanticIds: [],
      qualifiers: [],
      embeddedDataSpecifications: [],
      value: "Alice",
    } as unknown as SubmodelElementResponseDto,
  ];
  return {
    modelType: KeyTypes.SubmodelElementCollection,
    idShort: "row0",
    displayName: [],
    description: [],
    supplementalSemanticIds: [],
    qualifiers: [],
    embeddedDataSpecifications: [],
    value,
  } as unknown as SubmodelElementCollectionResponseDto;
}

function makeGroupRow(): SubmodelElementCollectionResponseDto {
  const group = {
    modelType: KeyTypes.SubmodelElementCollection,
    idShort: "Group1",
    displayName: [{ language: "en", text: "Group" }],
    description: [],
    supplementalSemanticIds: [],
    qualifiers: [],
    embeddedDataSpecifications: [],
    value: [
      {
        modelType: KeyTypes.Property,
        idShort: "Sub1",
        displayName: [{ language: "en", text: "Sub 1" }],
        description: [],
        supplementalSemanticIds: [],
        qualifiers: [],
        embeddedDataSpecifications: [],
        value: "Wood",
      },
      {
        modelType: KeyTypes.Property,
        idShort: "Sub2",
        displayName: [{ language: "en", text: "Sub 2" }],
        description: [],
        supplementalSemanticIds: [],
        qualifiers: [],
        embeddedDataSpecifications: [],
        value: "50",
      },
    ],
  } as unknown as SubmodelElementResponseDto;

  const name = {
    modelType: KeyTypes.Property,
    idShort: "name",
    displayName: [{ language: "en", text: "Name" }],
    description: [],
    supplementalSemanticIds: [],
    qualifiers: [],
    embeddedDataSpecifications: [],
    value: "Alice",
  } as unknown as SubmodelElementResponseDto;

  return {
    modelType: KeyTypes.SubmodelElementCollection,
    idShort: "row0",
    displayName: [],
    description: [],
    supplementalSemanticIds: [],
    qualifiers: [],
    embeddedDataSpecifications: [],
    value: [name, group],
  } as unknown as SubmodelElementCollectionResponseDto;
}

describe("buildColumns", () => {
  it("returns an empty array when content is empty", () => {
    expect(buildColumns([])).toEqual([]);
  });

  it("returns an empty array when the first row has no value", () => {
    const row = {
      modelType: KeyTypes.SubmodelElementCollection,
      idShort: "row0",
      displayName: [],
      description: [],
      supplementalSemanticIds: [],
      qualifiers: [],
      embeddedDataSpecifications: [],
      value: undefined,
    } as unknown as SubmodelElementCollectionResponseDto;
    expect(buildColumns([row])).toEqual([]);
  });

  it("sets minWidth on File-type columns", () => {
    const cols = buildColumns([makeFileRow()]);
    const fileCol = cols.find((c) => c.field === "photo");
    expect(fileCol).toBeDefined();
    expect(fileCol?.style).toMatchObject({ minWidth: "200px" });
  });

  it("does not set minWidth on non-File columns", () => {
    const cols = buildColumns([makeFileRow()]);
    const nameCol = cols.find((c) => c.field === "name");
    expect(nameCol).toBeDefined();
    expect(nameCol?.style).toBeUndefined();
  });

  it("no column has minWidth when there are only Property columns", () => {
    const cols = buildColumns([makePropertyOnlyRow()]);
    for (const col of cols) {
      expect(col.style).toBeUndefined();
    }
  });

  it("uses the first available displayName as header", () => {
    const cols = buildColumns([makeFileRow()]);
    const fileCol = cols.find((c) => c.field === "photo");
    expect(fileCol?.header).toBe("Photo");
  });

  it("resolves the header in the requested locale", () => {
    const row = makePropertyOnlyRow();
    row.value![0]!.displayName = [
      { language: "en", text: "Name" },
      { language: "de", text: "Name (DE)" },
    ];
    expect(buildColumns([row], "en").find((c) => c.field === "name")?.header).toBe("Name");
    expect(buildColumns([row], "de").find((c) => c.field === "name")?.header).toBe("Name (DE)");
  });

  it("flattens a group column into dot-notation sub-columns", () => {
    const cols = buildColumns([makeGroupRow()]);
    expect(cols.map((c) => c.field)).toEqual(["name", "Group1.Sub1", "Group1.Sub2"]);
    expect(cols.find((c) => c.field === "Group1.Sub1")).toMatchObject({
      header: "Sub 1",
      groupIdShort: "Group1",
    });
    expect(cols.find((c) => c.field === "name")?.groupIdShort).toBeUndefined();
  });
});

describe("hasGroupColumns", () => {
  it("is false when no column is a group", () => {
    expect(hasGroupColumns([makeFileRow()])).toBe(false);
  });

  it("is true when a column is a SubmodelElementCollection", () => {
    expect(hasGroupColumns([makeGroupRow()])).toBe(true);
  });
});

describe("buildGroupHeaders", () => {
  it("returns colspan 1 for plain columns and N for group columns", () => {
    const headers = buildGroupHeaders([makeGroupRow()]);
    expect(headers).toEqual([
      { idShort: "name", header: "Name", colspan: 1, isGroup: false },
      { idShort: "Group1", header: "Group", colspan: 2, isGroup: true },
    ]);
  });
});

describe("buildRows", () => {
  it("expands a group cell into its children under dot-notation keys", () => {
    const rows = buildRows([makeGroupRow()]);
    expect(rows[0]!.name).toMatchObject({ idShort: "name", value: "Alice" });
    expect(rows[0]!["Group1.Sub1"]).toMatchObject({ idShort: "Sub1", value: "Wood" });
    expect(rows[0]!["Group1.Sub2"]).toMatchObject({ idShort: "Sub2", value: "50" });
    expect(rows[0]!.Group1).toBeUndefined();
  });

  it("keeps a plain scalar cell as-is", () => {
    const rows = buildRows([makeFileRow()]);
    expect(rows[0]!.name).toMatchObject({ idShort: "name", value: "Alice" });
  });

  it("returns an empty array for empty content", () => {
    expect(buildRows([])).toEqual([]);
  });
});
