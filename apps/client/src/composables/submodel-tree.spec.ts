import type { SubmodelElementResponseDto, SubmodelResponseDto } from "@open-dpp/dto";
import type { SubmodelTreeElement } from "./submodel-tree";
import { describe, expect, it } from "vitest";
import { useSubmodelTree } from "./submodel-tree";
import type { LanguageTextDto } from "@open-dpp/dto";

function createElement(idShort: string, children: SubmodelTreeElement[] = []): SubmodelTreeElement {
  return {
    idShort,
    name: [],
    description: [],
    children,
    submodelElements: [],
  };
}

function createSubmodel(
  idShort: string,
  displayName: LanguageTextDto[] = [],
  submodelElements: SubmodelElementResponseDto[] = [],
  description: LanguageTextDto[] = [],
): SubmodelResponseDto {
  return {
    id: idShort,
    idShort,
    displayName,
    description,
    submodelElements,
    extensions: [],
    supplementalSemanticIds: [],
    qualifiers: [],
    embeddedDataSpecifications: [],
    semanticId: null,
    category: null,
    kind: null,
    administration: null,
  } as SubmodelResponseDto;
}

function createProperty(
  idShort: string,
  displayName: LanguageTextDto[] = [],
  description: LanguageTextDto[] = [],
): SubmodelElementResponseDto {
  return {
    modelType: "Property",
    idShort,
    displayName,
    description,
    supplementalSemanticIds: [],
    qualifiers: [],
    embeddedDataSpecifications: [],
    semanticId: null,
    category: null,
    valueType: "xs:string",
    value: null,
  } as SubmodelElementResponseDto;
}

describe("getSubmodelTreeElementsBefore", () => {
  const tree: SubmodelTreeElement[] = [
    createElement("A", [createElement("A1"), createElement("A2")]),
    createElement("B", [createElement("B1")]),
    createElement("C"),
  ];

  const { getSubmodelTreeElementsBefore } = useSubmodelTree([]);

  it("returns elements before a nested target in pre-order traversal", () => {
    const result = getSubmodelTreeElementsBefore(tree, "B1");

    expect(result.map((element) => element.idShort)).toEqual(["A", "A1", "A2", "B"]);
  });

  it("returns an empty array when target is first root element", () => {
    const result = getSubmodelTreeElementsBefore(tree, "A");

    expect(result).toEqual([]);
  });

  it("returns empty array when target is not found", () => {
    const result = getSubmodelTreeElementsBefore(tree, "UNKNOWN");

    expect(result).toEqual([]);
  });
});

describe("languageTags", () => {
  it("returns an empty set when no displayNames are set", () => {
    const { languageTags } = useSubmodelTree([createSubmodel("S1")]);
    expect(languageTags.value.size).toBe(0);
  });

  it("collects language tags from submodel displayNames", () => {
    const { languageTags } = useSubmodelTree([
      createSubmodel("S1", [{ language: "en", text: "My Submodel" }]),
    ]);
    expect(languageTags.value).toEqual(new Set(["en"]));
  });

  it("collects language tags from submodelElement displayNames", () => {
    const { languageTags } = useSubmodelTree([
      createSubmodel(
        "S1",
        [],
        [createProperty("Prop1", [{ language: "de", text: "Eigenschaft" }])],
      ),
    ]);
    expect(languageTags.value).toEqual(new Set(["de"]));
  });

  it("deduplicates language tags across multiple sources", () => {
    const { languageTags } = useSubmodelTree([
      createSubmodel(
        "S1",
        [{ language: "en", text: "Submodel" }],
        [
          createProperty("Prop1", [{ language: "en", text: "Property" }]),
          createProperty("Prop2", [{ language: "de", text: "Eigenschaft" }]),
        ],
      ),
    ]);
    expect(languageTags.value).toEqual(new Set(["en", "de"]));
  });

  it("collects language tags from submodel descriptions", () => {
    const { languageTags } = useSubmodelTree([
      createSubmodel("S1", [], [], [{ language: "de", text: "Beschreibung" }]),
    ]);
    expect(languageTags.value).toEqual(new Set(["de"]));
  });

  it("collects language tags from submodelElement descriptions", () => {
    const { languageTags } = useSubmodelTree([
      createSubmodel(
        "S1",
        [],
        [createProperty("Prop1", [], [{ language: "fr", text: "Description" }])],
      ),
    ]);
    expect(languageTags.value).toEqual(new Set(["fr"]));
  });

  it("collects language tags from multiple submodels", () => {
    const { languageTags } = useSubmodelTree([
      createSubmodel("S1", [{ language: "en", text: "English" }]),
      createSubmodel("S2", [{ language: "fr", text: "Français" }]),
    ]);
    expect(languageTags.value).toEqual(new Set(["en", "fr"]));
  });
});
