import { describe, expect, it } from "vitest";
import { KeyTypes } from "@open-dpp/dto";
import type {
  SubmodelElementCollectionResponseDto,
  SubmodelElementResponseDto,
} from "@open-dpp/dto";
import { resolveNestedTablePath } from "./nested-table-path";

function property(idShort: string, value: string): SubmodelElementResponseDto {
  return {
    modelType: KeyTypes.Property,
    idShort,
    displayName: [],
    description: [],
    supplementalSemanticIds: [],
    qualifiers: [],
    embeddedDataSpecifications: [],
    value,
  } as unknown as SubmodelElementResponseDto;
}

function collectionRow(
  idShort: string,
  value: SubmodelElementResponseDto[],
): SubmodelElementCollectionResponseDto {
  return {
    modelType: KeyTypes.SubmodelElementCollection,
    idShort,
    displayName: [],
    description: [],
    supplementalSemanticIds: [],
    qualifiers: [],
    embeddedDataSpecifications: [],
    value,
  } as unknown as SubmodelElementCollectionResponseDto;
}

function tableCell(
  idShort: string,
  rows: SubmodelElementCollectionResponseDto[],
): SubmodelElementResponseDto {
  return {
    modelType: KeyTypes.SubmodelElementList,
    idShort,
    displayName: [],
    description: [],
    supplementalSemanticIds: [],
    qualifiers: [],
    embeddedDataSpecifications: [],
    value: rows,
  } as unknown as SubmodelElementResponseDto;
}

/** A single-level table: two rows, each with a "name" cell and a "SubTable" nested-table cell. */
function makeTableWithNestedColumn(nestedRowsByRow: Record<string, SubmodelElementCollectionResponseDto[]>) {
  return Object.entries(nestedRowsByRow).map(([rowIdShort, nestedRows]) =>
    collectionRow(rowIdShort, [property("name", rowIdShort), tableCell("SubTable", nestedRows)]),
  );
}

describe("resolveNestedTablePath", () => {
  it("returns the root content and no resolved steps for an empty path", () => {
    const root = makeTableWithNestedColumn({ row0: [] });
    const result = resolveNestedTablePath(root, []);
    expect(result).toEqual({ content: root, resolvedSteps: [] });
  });

  it("resolves a single-level nested table", () => {
    const nested = [collectionRow("nested_row0", [property("weight", "10")])];
    const root = makeTableWithNestedColumn({ row0: nested, row1: [] });

    const result = resolveNestedTablePath(root, [{ field: "SubTable", rowIdShort: "row0" }]);

    expect(result.content).toBe(nested);
    expect(result.resolvedSteps).toEqual([{ field: "SubTable", rowIdShort: "row0" }]);
  });

  it("resolves two levels of nesting", () => {
    const grandchild = [collectionRow("gc_row0", [property("color", "red")])];
    const child = [
      collectionRow("child_row0", [property("name", "child_row0"), tableCell("SubSubTable", grandchild)]),
    ];
    const root = makeTableWithNestedColumn({ row0: child });

    const result = resolveNestedTablePath(root, [
      { field: "SubTable", rowIdShort: "row0" },
      { field: "SubSubTable", rowIdShort: "child_row0" },
    ]);

    expect(result.content).toBe(grandchild);
    expect(result.resolvedSteps).toEqual([
      { field: "SubTable", rowIdShort: "row0" },
      { field: "SubSubTable", rowIdShort: "child_row0" },
    ]);
  });

  it("falls back to the root when the first step's row idShort is stale", () => {
    const nested = [collectionRow("nested_row0", [property("weight", "10")])];
    const root = makeTableWithNestedColumn({ row0: nested });

    const result = resolveNestedTablePath(root, [{ field: "SubTable", rowIdShort: "deleted_row" }]);

    expect(result.content).toBe(root);
    expect(result.resolvedSteps).toEqual([]);
  });

  it("falls back to the root when the column field no longer exists", () => {
    const nested = [collectionRow("nested_row0", [property("weight", "10")])];
    const root = makeTableWithNestedColumn({ row0: nested });

    const result = resolveNestedTablePath(root, [{ field: "RenamedColumn", rowIdShort: "row0" }]);

    expect(result.content).toBe(root);
    expect(result.resolvedSteps).toEqual([]);
  });

  it("falls back to the root when the cell is no longer a table", () => {
    const root = [collectionRow("row0", [property("name", "row0"), property("SubTable", "not a table anymore")])];

    const result = resolveNestedTablePath(root, [{ field: "SubTable", rowIdShort: "row0" }]);

    expect(result.content).toBe(root);
    expect(result.resolvedSteps).toEqual([]);
  });

  it("falls back to the nearest resolvable ancestor when a deeper step is stale", () => {
    const child = [collectionRow("child_row0", [property("name", "child_row0")])];
    const root = makeTableWithNestedColumn({ row0: child });

    const result = resolveNestedTablePath(root, [
      { field: "SubTable", rowIdShort: "row0" },
      { field: "SubSubTable", rowIdShort: "child_row0" },
    ]);

    expect(result.content).toBe(child);
    expect(result.resolvedSteps).toEqual([{ field: "SubTable", rowIdShort: "row0" }]);
  });

  it("falls back to the root when the requested content is empty", () => {
    const result = resolveNestedTablePath([], [{ field: "SubTable", rowIdShort: "row0" }]);
    expect(result).toEqual({ content: [], resolvedSteps: [] });
  });
});
