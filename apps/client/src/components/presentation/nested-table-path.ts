import type { SubmodelElementCollectionResponseDto } from "@open-dpp/dto";
import { AasSubmodelElements } from "@open-dpp/dto";
import { childElementsOf } from "./list-columns.ts";

export interface TablePathStep {
  /** Column idShort identifying the nested-table cell within the current table. */
  field: string;
  /** idShort of the row (within the current table) that owns the nested-table cell. */
  rowIdShort: string;
}

export interface ResolvedTablePath {
  /** Rows of the deepest table reached. */
  content: SubmodelElementCollectionResponseDto[];
  /**
   * The prefix of the requested `steps` that was actually resolved — shorter
   * than requested when a step is stale (deleted row, renamed/removed
   * column, or a cell that's no longer a table).
   */
  resolvedSteps: TablePathStep[];
}

/**
 * Walks `steps` from `rootContent`, descending one nested table per step.
 * If a step can't be resolved, resolution stops there and the deepest
 * successfully-resolved table is returned instead of failing outright — a
 * stale link degrades to its nearest resolvable ancestor rather than
 * breaking the page.
 */
export function resolveNestedTablePath(
  rootContent: SubmodelElementCollectionResponseDto[],
  steps: TablePathStep[],
): ResolvedTablePath {
  let content = rootContent;
  const resolvedSteps: TablePathStep[] = [];

  for (const step of steps) {
    const headerRow = content[0];
    if (!headerRow?.value) break;

    const colIndex = headerRow.value.findIndex((col) => col.idShort === step.field);
    if (colIndex === -1) break;

    const row = content.find((r) => r.idShort === step.rowIdShort);
    const cell = row?.value?.[colIndex];
    if (!cell) break;

    const nestedRows = childElementsOf<SubmodelElementCollectionResponseDto>(
      cell,
      AasSubmodelElements.SubmodelElementList,
    );
    if (!nestedRows) break;

    content = nestedRows;
    resolvedSteps.push(step);
  }

  return { content, resolvedSteps };
}
