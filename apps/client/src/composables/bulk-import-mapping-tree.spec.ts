import type { SubmodelElementSharedResponseDto, SubmodelResponseDto } from "@open-dpp/dto";
import { describe, expect, it } from "vitest";
import { useBulkImportMappingTree } from "./bulk-import-mapping-tree";

function property(idShort: string): SubmodelElementSharedResponseDto {
  return { idShort, modelType: "Property", displayName: [] } as unknown as SubmodelElementSharedResponseDto;
}

function multiLanguageProperty(idShort: string): SubmodelElementSharedResponseDto {
  return {
    idShort,
    modelType: "MultiLanguageProperty",
    displayName: [],
  } as unknown as SubmodelElementSharedResponseDto;
}

function collection(
  idShort: string,
  value: SubmodelElementSharedResponseDto[],
): SubmodelElementSharedResponseDto {
  return {
    idShort,
    modelType: "SubmodelElementCollection",
    displayName: [],
    value,
  } as unknown as SubmodelElementSharedResponseDto;
}

function list(
  idShort: string,
  value: SubmodelElementSharedResponseDto[],
): SubmodelElementSharedResponseDto {
  return {
    idShort,
    modelType: "SubmodelElementList",
    displayName: [],
    value,
  } as unknown as SubmodelElementSharedResponseDto;
}

function submodel(
  id: string,
  submodelElements: SubmodelElementSharedResponseDto[],
): SubmodelResponseDto {
  return {
    id,
    idShort: "submodel",
    displayName: [],
    submodelElements,
  } as unknown as SubmodelResponseDto;
}

describe("useBulkImportMappingTree", () => {
  it("flattens scalar leaves nested inside a collection inside a list, with full idShortPaths", () => {
    const submodels = [
      submodel("sm-1", [
        collection("technicalData", [
          list("measurements", [property("value"), multiLanguageProperty("unit")]),
          property("topLevelSku"),
        ]),
      ]),
    ];

    const { targets } = useBulkImportMappingTree(submodels);

    expect(targets.value).toEqual([
      expect.objectContaining({
        submodelId: "sm-1",
        idShortPath: "technicalData.measurements.value",
        idShort: "value",
        modelType: "Property",
      }),
      expect.objectContaining({
        submodelId: "sm-1",
        idShortPath: "technicalData.measurements.unit",
        idShort: "unit",
        modelType: "MultiLanguageProperty",
      }),
      expect.objectContaining({
        submodelId: "sm-1",
        idShortPath: "technicalData.topLevelSku",
        idShort: "topLevelSku",
        modelType: "Property",
      }),
    ]);
  });

  it("does not emit container nodes themselves, only their scalar leaves", () => {
    const submodels = [submodel("sm-1", [collection("group", [property("field")])])];

    const { targets } = useBulkImportMappingTree(submodels);

    expect(targets.value.map((t) => t.idShort)).toEqual(["field"]);
  });

  it("returns an empty list when a submodel has no scalar leaves", () => {
    const submodels = [submodel("sm-1", [collection("emptyGroup", [])])];

    const { targets } = useBulkImportMappingTree(submodels);

    expect(targets.value).toEqual([]);
  });

  it("returns an empty list for no submodels", () => {
    const { targets } = useBulkImportMappingTree([]);

    expect(targets.value).toEqual([]);
  });
});
