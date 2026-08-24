import { describe, expect, it } from "vitest";
import { ref } from "vue";
import { AasSubmodelElements } from "@open-dpp/dto";
import type { SubmodelElementResponseDto, SubmodelResponseDto } from "@open-dpp/dto";
import type { MappingRow } from "../composables/bulk-import/bulk-import-mapping.ts";
import { removeMappingsFromRow, removeMappingsFromSubmodels } from "./bulk-import.ts";

function property(idShort: string, value: string): SubmodelElementResponseDto {
  return {
    modelType: AasSubmodelElements.Property,
    idShort,
    displayName: [],
    description: [],
    supplementalSemanticIds: [],
    qualifiers: [],
    embeddedDataSpecifications: [],
    value,
  } as unknown as SubmodelElementResponseDto;
}

function collection(
  idShort: string,
  value: SubmodelElementResponseDto[],
): SubmodelElementResponseDto {
  return {
    modelType: AasSubmodelElements.SubmodelElementCollection,
    idShort,
    displayName: [],
    description: [],
    supplementalSemanticIds: [],
    qualifiers: [],
    embeddedDataSpecifications: [],
    value,
  } as unknown as SubmodelElementResponseDto;
}

function submodel(
  id: string,
  idShort: string,
  submodelElements: SubmodelElementResponseDto[],
): SubmodelResponseDto {
  return {
    id,
    idShort,
    displayName: [],
    description: [],
    supplementalSemanticIds: [],
    qualifiers: [],
    embeddedDataSpecifications: [],
    extensions: [],
    submodelElements,
  } as unknown as SubmodelResponseDto;
}

function mappingRow(
  input: string,
  submodelIdShort: string,
  output: string,
): MappingRow {
  return { input, submodelIdShort, output };
}

describe("removeMappingsFromRow", () => {
  it("returns an empty object for a null row", () => {
    expect(removeMappingsFromRow(null, [])).toEqual({});
  });

  it("returns a clone of the row unchanged when there are no mappings", () => {
    const row = { name: "Widget", price: "10" };
    const result = removeMappingsFromRow(row, []);
    expect(result).toEqual(row);
    expect(result).not.toBe(row);
  });

  it("removes top-level fields that are already mapped", () => {
    const row = { name: "Widget", price: "10", sku: "abc" };
    const mappings = [mappingRow("price", "Nameplate", "Weight")];

    const result = removeMappingsFromRow(row, mappings);

    expect(result).toEqual({ name: "Widget", sku: "abc" });
  });

  it("removes nested fields addressed by a dotted path", () => {
    const row = { nested: { a: "1", b: "2" } };
    const mappings = [mappingRow("nested.a", "Nameplate", "Weight")];

    const result = removeMappingsFromRow(row, mappings);

    expect(result).toEqual({ nested: { b: "2" } });
  });

  it("does not mutate the original row", () => {
    const row = { name: "Widget" };
    removeMappingsFromRow(row, [mappingRow("name", "Nameplate", "Weight")]);
    expect(row).toEqual({ name: "Widget" });
  });

  it("accepts refs and getters for both arguments", () => {
    const row = ref({ name: "Widget", price: "10" });
    const mappings = ref([mappingRow("price", "Nameplate", "Weight")]);

    const result = removeMappingsFromRow(row, mappings);

    expect(result).toEqual({ name: "Widget" });
  });
});

describe("removeMappingsFromSubmodels", () => {
  it("returns a clone of the submodels unchanged when there are no mappings", () => {
    const submodels = [submodel("sm-1", "Nameplate", [property("Weight", "10")])];

    const result = removeMappingsFromSubmodels(submodels, []);

    expect(result).toEqual(submodels);
    expect(result).not.toBe(submodels);
    expect(result[0]).not.toBe(submodels[0]);
  });

  it("removes a top-level leaf element that is already mapped", () => {
    const submodels = [
      submodel("sm-1", "Nameplate", [property("Weight", "10"), property("Color", "red")]),
    ];
    const mappings = [mappingRow("weight", "Nameplate", "Weight")];

    const result = removeMappingsFromSubmodels(submodels, mappings);

    expect(result[0]!.submodelElements.map((e) => e.idShort)).toEqual(["Color"]);
  });

  it("removes a nested leaf element inside a collection, keeping its siblings", () => {
    const submodels = [
      submodel("sm-1", "Nameplate", [
        collection("Dimensions", [property("Width", "1"), property("Height", "2")]),
      ]),
    ];
    const mappings = [mappingRow("width", "Nameplate", "Dimensions.Width")];

    const result = removeMappingsFromSubmodels(submodels, mappings);

    const dimensions = result[0]!.submodelElements[0]!;
    expect(dimensions.idShort).toBe("Dimensions");
    expect((dimensions as unknown as { value: SubmodelElementResponseDto[] }).value).toEqual([
      property("Height", "2"),
    ]);
  });

  it("leaves an emptied collection in place rather than removing it", () => {
    const submodels = [
      submodel("sm-1", "Nameplate", [collection("Dimensions", [property("Width", "1")])]),
    ];
    const mappings = [mappingRow("width", "Nameplate", "Dimensions.Width")];

    const result = removeMappingsFromSubmodels(submodels, mappings);

    const dimensions = result[0]!.submodelElements[0]!;
    expect(dimensions.idShort).toBe("Dimensions");
    expect((dimensions as unknown as { value: SubmodelElementResponseDto[] }).value).toEqual([]);
  });

  it("only removes elements from the submodel the mapping targets", () => {
    const submodels = [
      submodel("sm-1", "Nameplate", [property("Weight", "10")]),
      submodel("sm-2", "TechnicalData", [property("Weight", "20")]),
    ];
    const mappings = [mappingRow("weight", "Nameplate", "Weight")];

    const result = removeMappingsFromSubmodels(submodels, mappings);

    expect(result[0]!.submodelElements).toEqual([]);
    expect(result[1]!.submodelElements).toEqual([property("Weight", "20")]);
  });

  it("does not mutate the original submodels", () => {
    const submodels = [submodel("sm-1", "Nameplate", [property("Weight", "10")])];
    removeMappingsFromSubmodels(submodels, [mappingRow("weight", "Nameplate", "Weight")]);
    expect(submodels[0]!.submodelElements).toEqual([property("Weight", "10")]);
  });

  it("accepts refs and getters for both arguments", () => {
    const submodels = ref([submodel("sm-1", "Nameplate", [property("Weight", "10")])]);
    const mappings = ref([mappingRow("weight", "Nameplate", "Weight")]);

    const result = removeMappingsFromSubmodels(submodels, mappings);

    expect(result[0]!.submodelElements).toEqual([]);
  });
});
