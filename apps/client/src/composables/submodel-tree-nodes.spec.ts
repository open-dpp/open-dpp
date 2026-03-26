import type { DisplayName } from "./display-name";
import type { SubmodelTreeElement } from "./submodel-tree";
import { describe, expect, it, vi } from "vitest";
import { computed, ref } from "vue";
import { resolveDisplayName } from "./display-name";
import { useSubmodelTreeNodes } from "./submodel-tree-nodes";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    locale: ref("en"),
    t: (key: string) => key,
  }),
}));

function createDisplayName(language: "en" | "de", text: string): DisplayName {
  return { language, text };
}

function createElement(
  idShort: string,
  name: DisplayName[] = [],
  children: SubmodelTreeElement[] = [],
): SubmodelTreeElement {
  return { idShort, name, children, submodelElements: [] };
}

describe("resolveDisplayName", () => {
  const fallback = "unknown";

  it("returns exact locale match", () => {
    const options = [createDisplayName("en", "English"), createDisplayName("de", "Deutsch")];

    expect(resolveDisplayName(options, "de", fallback)).toBe("Deutsch");
  });

  it("strips region suffix from locale before matching", () => {
    const options = [createDisplayName("en", "English"), createDisplayName("de", "Deutsch")];

    expect(resolveDisplayName(options, "de-AT", fallback)).toBe("Deutsch");
  });

  it("falls back to English when locale not found", () => {
    const options = [createDisplayName("en", "English")];

    expect(resolveDisplayName(options, "de", fallback)).toBe("English");
  });

  it("falls back to first option when neither locale nor English found", () => {
    const options = [createDisplayName("de", "Deutsch")];

    expect(resolveDisplayName(options, "fr", fallback)).toBe("Deutsch");
  });

  it("returns fallback string when options array is empty", () => {
    expect(resolveDisplayName([], "en", fallback)).toBe("unknown");
  });
});

describe("useSubmodelTreeNodes", () => {
  it("maps a flat list of elements to tree nodes", () => {
    const elements = [
      createElement("sm1", [createDisplayName("en", "Submodel One")]),
      createElement("sm2", [createDisplayName("en", "Submodel Two")]),
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
        [createDisplayName("en", "Root")],
        [
          createElement("child", [createDisplayName("en", "Child")]),
        ],
      ),
    ];
    const submodelTree = computed(() => elements);

    const { treeNodes } = useSubmodelTreeNodes(submodelTree);

    expect(treeNodes.value).toEqual([
      {
        key: "root",
        label: "Root",
        data: { parentId: undefined },
        children: [
          { key: "child", label: "Child", data: { parentId: "root" }, children: [] },
        ],
      },
    ]);
  });

  it("uses fallback label when display name is empty", () => {
    const elements = [createElement("noname")];
    const submodelTree = computed(() => elements);

    const { treeNodes } = useSubmodelTreeNodes(submodelTree);

    expect(treeNodes.value[0]!.label).toBe("common.unknownName");
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
        [createDisplayName("en", "Level 0")],
        [
          createElement(
            "l1",
            [createDisplayName("en", "Level 1")],
            [createElement("l2", [createDisplayName("en", "Level 2")])],
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
