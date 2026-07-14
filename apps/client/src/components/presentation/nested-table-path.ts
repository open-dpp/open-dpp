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

/** Encodes `steps` onto `path` as `path.field1[row1].field2[row2]...` for the `table` query param. */
export function encodeTableQuery(path: string, steps: TablePathStep[]): string {
  return steps.reduce((acc, step) => `${acc}.${step.field}[${step.rowIdShort}]`, path);
}

/**
 * Parses the `table` query param back into steps, scoped to `path` — only
 * a value that starts with `${path}.` belongs to this list instance (a page
 * can render several tables, each matching only its own query segment). A
 * malformed segment stops parsing at that point, same graceful-degradation
 * behavior as `resolveNestedTablePath`.
 */
export function parseTableSteps(path: string, queryValue: unknown): TablePathStep[] {
  if (typeof queryValue !== "string" || !path) return [];

  const prefix = `${path}.`;
  if (!queryValue.startsWith(prefix)) return [];

  const remainder = queryValue.slice(prefix.length);
  if (!remainder) return [];

  const steps: TablePathStep[] = [];
  for (const segment of remainder.split(".")) {
    const match = /^(.+)\[(.+)]$/.exec(segment);
    if (!match) break;
    steps.push({ field: match[1]!, rowIdShort: match[2]! });
  }
  return steps;
}

/**
 * Builds the next `route.query`, preserving unrelated params: sets `table`
 * to the encoded `steps`, or removes it entirely when `steps` is empty
 * (navigating back to the root has no nested-table state to represent).
 */
export function buildTableQuery<Q extends Record<string, unknown>>(
  currentQuery: Q,
  path: string,
  steps: TablePathStep[],
): Q & { table?: string } {
  const query: Q & { table?: string } = { ...currentQuery };
  if (steps.length === 0) {
    delete query.table;
  } else {
    query.table = encodeTableQuery(path, steps);
  }
  return query;
}
