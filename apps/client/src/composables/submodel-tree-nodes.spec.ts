import type { SubmodelTreeElement } from "./submodel-tree";
import { describe, expect, it, vi } from "vitest";
import { computed, ref } from "vue";
import { useSubmodelTreeNodes } from "./submodel-tree-nodes";
import type { LanguageTextDto, LanguageType } from "@open-dpp/dto";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    locale: ref("en-US"),
    t: (key: string) => key,
  }),
}));

function createDisplayName(language: LanguageType, text: string): LanguageTextDto {
  return { language, text };
}

function createElement(
  idShort: string,
  name: LanguageTextDto[] = [],
  children: SubmodelTreeElement[] = [],
): SubmodelTreeElement {
  return { idShort, name, children, submodelElements: [] };
}

describe("useSubmodelTreeNodes", () => {
  it("maps a flat list of elements to tree nodes", () => {
    const elements = [
      createElement("sm1", [createDisplayName("en-US", "Submodel One")]),
      createElement("sm2", [createDisplayName("en-US", "Submodel Two")]),
    ];
    const submodelTree = computed(() => elements);

    const { treeNodes } = useSubmodelTreeNodes(submodelTree);

    expect(treeNodes.value).toEqual([
      { key: "sm1", label: "Submodel One", data: { parentId: undefined }, children: [] },
      { key: "sm2", label: "Submodel Two", data: { parentId: undefined }, children: [] },
    ]);
  });

  it("maps nested elements with correct parentId references", () => {
    const elements = [
      createElement(
        "root",
        [createDisplayName("en-US", "Root")],
        [createElement("child", [createDisplayName("en-US", "Child")])],
      ),
    ];
    const submodelTree = computed(() => elements);

    const { treeNodes } = useSubmodelTreeNodes(submodelTree);

    expect(treeNodes.value).toEqual([
      {
        key: "root",
        label: "Root",
        data: { parentId: undefined },
        children: [{ key: "child", label: "Child", data: { parentId: "root" }, children: [] }],
      },
    ]);
  });

  it("uses fallback label when display name is empty", () => {
    const elements = [createElement("noname")];
    const submodelTree = computed(() => elements);

    const { treeNodes } = useSubmodelTreeNodes(submodelTree);

    expect(treeNodes.value[0]!.label).toBe("common.untitled");
  });

  it("returns empty array for empty submodel tree", () => {
    const submodelTree = computed<SubmodelTreeElement[]>(() => []);

    const { treeNodes } = useSubmodelTreeNodes(submodelTree);

    expect(treeNodes.value).toEqual([]);
  });

  it("propagates parentId through deeply nested levels", () => {
    const elements = [
      createElement(
        "l0",
        [createDisplayName("en-US", "Level 0")],
        [
          createElement(
            "l1",
            [createDisplayName("en-US", "Level 1")],
            [createElement("l2", [createDisplayName("en-US", "Level 2")])],
          ),
        ],
      ),
    ];
    const submodelTree = computed(() => elements);

    const { treeNodes } = useSubmodelTreeNodes(submodelTree);

    const level1 = treeNodes.value[0]!.children![0]!;
    const level2 = level1.children![0]!;

    expect(level1.data).toEqual({ parentId: "l0" });
    expect(level2.data).toEqual({ parentId: "l1" });
  });
});
