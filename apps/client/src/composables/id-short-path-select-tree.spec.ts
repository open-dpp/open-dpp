import type { SubmodelElementSharedResponseDto, SubmodelResponseDto } from "@open-dpp/dto";
import { describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { useIdShortPathSelectTree } from "./id-short-path-select-tree.ts";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    locale: ref("en"),
    t: (key: string) => key,
  }),
}));

function displayName(text: string) {
  return [{ language: "en" as const, text }];
}

function property(idShort: string, displayNameText?: string): SubmodelElementSharedResponseDto {
  return {
    idShort,
    modelType: "Property",
    displayName: displayNameText ? displayName(displayNameText) : [],
  } as unknown as SubmodelElementSharedResponseDto;
}

function multiLanguageProperty(idShort: string): SubmodelElementSharedResponseDto {
  return {
    idShort,
    modelType: "MultiLanguageProperty",
    displayName: [],
  } as unknown as SubmodelElementSharedResponseDto;
}

function file(idShort: string): SubmodelElementSharedResponseDto {
  return {
    idShort,
    modelType: "File",
    displayName: [],
  } as unknown as SubmodelElementSharedResponseDto;
}

function collection(
  idShort: string,
  value: SubmodelElementSharedResponseDto[],
  displayNameText?: string,
): SubmodelElementSharedResponseDto {
  return {
    idShort,
    modelType: "SubmodelElementCollection",
    displayName: displayNameText ? displayName(displayNameText) : [],
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
  displayNameText?: string,
): SubmodelResponseDto {
  return {
    id,
    idShort: "submodel",
    displayName: displayNameText ? displayName(displayNameText) : [],
    submodelElements,
  } as unknown as SubmodelResponseDto;
}

describe("useIdShortPathSelectTree", () => {
  it("builds a nested tree mirroring collections/lists, with only scalar leaves selectable", () => {
    const submodels = [
      submodel("sm-1", [
        collection("technicalData", [
          list("measurements", [property("value"), multiLanguageProperty("unit")]),
          property("topLevelSku"),
        ]),
      ]),
    ];

    const { treeNodes } = useIdShortPathSelectTree(submodels);

    expect(treeNodes.value).toHaveLength(1);
    const submodelNode = treeNodes.value[0]!;
    expect(submodelNode.selectable).toBe(false);
    expect(submodelNode.children).toHaveLength(1);

    const technicalData = submodelNode.children![0]!;
    expect(technicalData.label).toBe("technicalData");
    expect(technicalData.selectable).toBe(false);
    expect(technicalData.children).toHaveLength(2);

    const measurements = technicalData.children!.find((n) => n.label === "measurements")!;
    expect(measurements.selectable).toBe(false);
    expect(measurements.children).toHaveLength(2);
    expect(measurements.children!.map((n) => n.label)).toEqual(["value", "unit"]);
    expect(measurements.children![0]!.selectable).toBeUndefined();

    const topLevelSku = technicalData.children!.find((n) => n.label === "topLevelSku")!;
    expect(topLevelSku.selectable).toBeUndefined();
  });

  it("does not emit a node for a container with no scalar leaves anywhere in its subtree", () => {
    const submodels = [submodel("sm-1", [collection("emptyGroup", [collection("nested", [])])])];

    const { treeNodes } = useIdShortPathSelectTree(submodels);

    expect(treeNodes.value).toEqual([]);
  });

  it("skips excluded model types entirely, both as leaves and as containers", () => {
    const submodels = [
      submodel("sm-1", [
        collection("technicalData", [property("keep"), file("attachment")]),
        list("measurements", [property("insideList")]),
      ]),
    ];

    const { treeNodes } = useIdShortPathSelectTree(submodels, {
      excludeModelTypes: () => ["File", "SubmodelElementList"],
    });

    expect(treeNodes.value).toHaveLength(1);
    const technicalData = treeNodes.value[0]!.children!.find((n) => n.label === "technicalData")!;
    expect(technicalData.children!.map((n) => n.label)).toEqual(["keep"]);
    expect(treeNodes.value[0]!.children!.find((n) => n.label === "measurements")).toBeUndefined();
  });

  it("returns an empty list for no submodels", () => {
    const { treeNodes } = useIdShortPathSelectTree([]);

    expect(treeNodes.value).toEqual([]);
  });

  it("uses the displayName in the current language when present, falling back to idShort", () => {
    const submodels = [
      submodel(
        "sm-1",
        [collection("group", [property("field", "Field Label")], "Group Label")],
        "Submodel Label",
      ),
    ];

    const { treeNodes } = useIdShortPathSelectTree(submodels);

    expect(treeNodes.value[0]!.label).toBe("Submodel Label");
    expect(treeNodes.value[0]!.children![0]!.label).toBe("Group Label");
    expect(treeNodes.value[0]!.children![0]!.children![0]!.label).toBe("Field Label");
  });

  it("falls back to idShort when no displayName is present", () => {
    const submodels = [submodel("sm-1", [collection("group", [property("field")])])];

    const { treeNodes } = useIdShortPathSelectTree(submodels);

    expect(treeNodes.value[0]!.label).toBe("submodel");
    expect(treeNodes.value[0]!.children![0]!.label).toBe("group");
    expect(treeNodes.value[0]!.children![0]!.children![0]!.label).toBe("field");
  });

  it("resolveTarget and resolveKey round-trip a leaf's key and { submodelId, output }", () => {
    const submodels = [submodel("sm-1", [collection("group", [property("field")])])];

    const { treeNodes, resolveNode, resolveKey } = useIdShortPathSelectTree(submodels);

    const leafKey = treeNodes.value[0]!.children![0]!.children![0]!.key;
    const target = resolveNode(leafKey);
    expect(target).toEqual({ submodelIdShort: "sm-1", output: "group.field" });
    expect(resolveKey(target)).toBe(leafKey);
    expect(resolveNode(undefined)).toBeNull();
    expect(resolveKey(null)).toBeNull();
  });

  it("pre-expands only the submodel root keys by default", () => {
    const submodels = [submodel("sm-1", [collection("group", [property("field")])])];

    const { treeNodes, expandedKeys } = useIdShortPathSelectTree(submodels);

    expect(Object.keys(expandedKeys.value)).toEqual([treeNodes.value[0]!.key]);
  });
});
