import type { SubmodelElementSharedResponseDto, SubmodelResponseDto } from "@open-dpp/dto";
import { describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { classifyByModelType, useIdShortPathSelectTree } from "./id-short-path-select-tree.ts";
import { type IdShortPathPointer, SUBMODEL_MODEL_TYPE } from "../lib/id-short-path-select.ts";

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
    idShort: id,
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

    expect(treeNodes.value[0]!.label).toBe("sm-1");
    expect(treeNodes.value[0]!.children![0]!.label).toBe("group");
    expect(treeNodes.value[0]!.children![0]!.children![0]!.label).toBe("field");
  });

  it("resolveTarget and resolveKey round-trip a leaf's key and { submodelId, idShortPath }", () => {
    const submodels = [submodel("sm-1", [collection("group", [property("field")])])];

    const { treeNodes, resolveNodePointer, resolveKey } = useIdShortPathSelectTree(submodels);

    const leafKey = treeNodes.value[0]!.children![0]!.children![0]!.key;
    const target = resolveNodePointer(leafKey);
    expect(target).toEqual({ submodelIdShort: "sm-1", idShortPath: "group.field" });
    expect(resolveKey(target)).toBe(leafKey);
    expect(resolveNodePointer(undefined)).toBeNull();
    expect(resolveKey(null)).toBeNull();
  });

  it("pre-expands only the submodel root keys by default", () => {
    const submodels = [submodel("sm-1", [collection("group", [property("field")])])];

    const { treeNodes, expandedKeys } = useIdShortPathSelectTree(submodels);

    expect(Object.keys(expandedKeys.value)).toEqual([treeNodes.value[0]!.key]);
  });

  describe("classifyByModelType", () => {
    it("skips hidden model types entirely, both as leaves and as containers", () => {
      const submodels = [
        submodel("sm-1", [
          collection("technicalData", [property("keep"), file("attachment")]),
          list("measurements", [property("insideList")]),
        ]),
      ];

      const { treeNodes } = useIdShortPathSelectTree(submodels, {
        classify: classifyByModelType({ hidden: ["File", "SubmodelElementList"] }),
      });

      expect(treeNodes.value).toHaveLength(1);
      const technicalData = treeNodes.value[0]!.children!.find((n) => n.label === "technicalData")!;
      expect(technicalData.children!.map((n) => n.label)).toEqual(["keep"]);
      expect(treeNodes.value[0]!.children!.find((n) => n.label === "measurements")).toBeUndefined();
    });

    it("switches to container-picking mode: containers and the submodel root become selectable, scalar leaves are dropped", () => {
      const submodels = [
        submodel("sm-1", [collection("sectionA", [collection("subsection", [property("leaf")])])]),
      ];

      const { treeNodes, resolveNodePointer, resolveKey } = useIdShortPathSelectTree(submodels, {
        classify: classifyByModelType({
          // include the sentinel to also offer "move to the submodel's top level"
          selectable: ["SubmodelElementCollection", "SubmodelElementList", SUBMODEL_MODEL_TYPE],
        }),
      });

      const root = treeNodes.value[0]!;
      expect(root.selectable).toBeUndefined();
      const sectionA = root.children![0]!;
      expect(sectionA.selectable).toBeUndefined();
      const subsection = sectionA.children![0]!;
      expect(subsection.selectable).toBeUndefined();
      // the scalar leaf is a dead end once leaves aren't selectable — it's dropped
      expect(subsection.children).toBeUndefined();

      // the submodel root resolves via an empty idShortPath, e.g. "move to the top level"
      const target = resolveNodePointer(root.key);
      expect(target).toEqual({ submodelIdShort: "sm-1", idShortPath: "" });
      expect(resolveKey(target)).toBe(root.key);
    });

    it("only makes the submodel root selectable when its sentinel type is explicitly listed", () => {
      const submodels = [submodel("sm-1", [collection("sectionA", [property("leaf")])])];

      // container types are selectable, but SUBMODEL_MODEL_TYPE was not opted in
      const withoutRoot = useIdShortPathSelectTree(submodels, {
        classify: classifyByModelType({ selectable: ["SubmodelElementCollection"] }),
      });
      expect(withoutRoot.treeNodes.value[0]!.selectable).toBe(false);

      const withRoot = useIdShortPathSelectTree(submodels, {
        classify: classifyByModelType({
          selectable: ["SubmodelElementCollection", SUBMODEL_MODEL_TYPE],
        }),
      });
      expect(withRoot.treeNodes.value[0]!.selectable).toBeUndefined();
    });
  });

  describe("custom classify — the escape hatch for anything beyond simple type filtering", () => {
    it("can exclude a specific subtree, e.g. so a move picker can't offer an element as its own target", () => {
      const submodels = [
        submodel("sm-1", [
          collection("sectionA", [collection("subsection", [property("leaf")])]),
          collection("sectionB", [property("otherLeaf")]),
        ]),
      ];
      const excluded: IdShortPathPointer = { submodelIdShort: "sm-1", idShortPath: "sectionA" };
      const isExcluded = (node: IdShortPathPointer) =>
        node.submodelIdShort === excluded.submodelIdShort &&
        (node.idShortPath === excluded.idShortPath ||
          node.idShortPath.startsWith(`${excluded.idShortPath}.`));

      const { treeNodes } = useIdShortPathSelectTree(submodels, {
        classify: (node, modelType) => {
          if (isExcluded(node)) return "hidden";
          return classifyByModelType({ selectable: ["SubmodelElementCollection"] })(
            node,
            modelType,
          );
        },
      });

      const root = treeNodes.value[0]!;
      expect(root.children!.map((n) => n.label)).toEqual(["sectionB"]);
    });

    it("excludes the whole submodel when the excluded path is the submodel root itself", () => {
      const submodels = [
        submodel("sm-1", [collection("sectionA", [property("leaf")])]),
        submodel("sm-2", [collection("sectionB", [property("leaf2")])]),
      ];

      const { treeNodes } = useIdShortPathSelectTree(submodels, {
        classify: (node, modelType) => {
          if (node.submodelIdShort === "sm-1") return "hidden";
          return classifyByModelType({})(node, modelType);
        },
      });

      expect(treeNodes.value).toHaveLength(1);
      expect(treeNodes.value[0]!.key).toContain("sm-2");
    });

    it("can gate selectability on an arbitrary predicate, e.g. a permission check per path", () => {
      const submodels = [
        submodel("sm-1", [
          collection("group", [property("allowedField"), property("deniedField")]),
        ]),
      ];
      const allowedPaths = new Set(["group.allowedField"]);

      const { treeNodes } = useIdShortPathSelectTree(submodels, {
        classify: (node, modelType) => {
          if (modelType !== "Property") return classifyByModelType({})(node, modelType);
          return allowedPaths.has(node.idShortPath) ? "selectable" : "hidden";
        },
      });

      const group = treeNodes.value[0]!.children![0]!;
      const allowed = group.children!.find((n) => n.label === "allowedField");
      const denied = group.children!.find((n) => n.label === "deniedField");
      expect(allowed).toBeDefined();
      expect(allowed!.selectable).toBeUndefined();
      expect(denied).toBeUndefined();
    });
  });
});
