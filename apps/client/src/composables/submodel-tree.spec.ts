import type { SubmodelTreeElement } from "./submodel-tree";
import { describe, expect, it } from "vitest";
import { useSubmodelTree } from "./submodel-tree";

function createElement(idShort: string, children: SubmodelTreeElement[] = []): SubmodelTreeElement {
  return {
    idShort,
    name: [],
    children,
    submodelElements: [],
  };
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
