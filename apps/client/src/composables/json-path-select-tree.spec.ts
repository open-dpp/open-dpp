import { describe, expect, it } from "vitest";
import { useJsonPathSelectTree } from "./json-path-select-tree.ts";

describe("useJsonPathSelectTree", () => {
  it("builds a nested tree mirroring plain-object nesting, with only leaves selectable", () => {
    const row = {
      sku: "abc",
      address: {
        city: "Berlin",
        geo: { lat: 52.5, lng: 13.4 },
      },
    };

    const { treeNodes } = useJsonPathSelectTree(row);

    expect(treeNodes.value.map((n) => n.label)).toEqual(["sku", "address"]);

    const sku = treeNodes.value[0]!;
    expect(sku.key).toBe("sku");
    expect(sku.selectable).toBeUndefined();

    const address = treeNodes.value[1]!;
    expect(address.key).toBe("address");
    expect(address.selectable).toBe(false);
    expect(address.children!.map((n) => n.label)).toEqual(["city", "geo"]);

    const city = address.children!.find((n) => n.label === "city")!;
    expect(city.key).toBe("address.city");
    expect(city.selectable).toBeUndefined();

    const geo = address.children!.find((n) => n.label === "geo")!;
    expect(geo.selectable).toBe(false);
    expect(geo.children!.map((n) => n.key)).toEqual(["address.geo.lat", "address.geo.lng"]);
  });

  it("treats arrays as opaque leaves, not recursing into elements", () => {
    const row = { items: [{ sku: "a" }, { sku: "b" }] };

    const { treeNodes } = useJsonPathSelectTree(row);

    expect(treeNodes.value).toHaveLength(1);
    expect(treeNodes.value[0]!.key).toBe("items");
    expect(treeNodes.value[0]!.selectable).toBeUndefined();
    expect(treeNodes.value[0]!.children).toBeUndefined();
  });

  it("treats null values as leaves", () => {
    const row = { note: null };

    const { treeNodes } = useJsonPathSelectTree(row);

    expect(treeNodes.value).toHaveLength(1);
    expect(treeNodes.value[0]!.key).toBe("note");
    expect(treeNodes.value[0]!.children).toBeUndefined();
  });

  it("does not emit a node for an object with no keys anywhere in its subtree", () => {
    const row = { empty: {}, nested: { alsoEmpty: {} } };

    const { treeNodes } = useJsonPathSelectTree(row);

    expect(treeNodes.value).toEqual([]);
  });

  it("returns an empty list for a null or undefined row", () => {
    expect(useJsonPathSelectTree(null).treeNodes.value).toEqual([]);
    expect(useJsonPathSelectTree(undefined).treeNodes.value).toEqual([]);
  });

  it("pre-expands only the top-level keys by default", () => {
    const row = { address: { city: "Berlin" } };

    const { treeNodes, expandedKeys } = useJsonPathSelectTree(row);

    expect(Object.keys(expandedKeys.value)).toEqual([treeNodes.value[0]!.key as string]);
  });
});
