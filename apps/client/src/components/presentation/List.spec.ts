import { describe, expect, it } from "vitest";
import { KeyTypes } from "@open-dpp/dto";
import type {
  SubmodelElementCollectionResponseDto,
  SubmodelElementResponseDto,
} from "@open-dpp/dto";
import { buildColumns } from "./list-columns";

function makeFileRow(): SubmodelElementCollectionResponseDto {
  const value: SubmodelElementResponseDto[] = [
    {
      modelType: KeyTypes.File,
      idShort: "photo",
      displayName: [{ language: "en-US", text: "Photo" }],
      description: [],
      supplementalSemanticIds: [],
      qualifiers: [],
      embeddedDataSpecifications: [],
      value: "some-media-id",
    } as unknown as SubmodelElementResponseDto,
    {
      modelType: KeyTypes.Property,
      idShort: "name",
      displayName: [{ language: "en-US", text: "Name" }],
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
      displayName: [{ language: "en-US", text: "Name" }],
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
    expect(buildColumns([row])).toEqual([])
;
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
});
