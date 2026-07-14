import type {
  SubmodelElementCollectionResponseDto,
  SubmodelElementResponseDto,
} from "@open-dpp/dto";
import { AasSubmodelElements } from "@open-dpp/dto";
import { resolveLanguageTexts } from "../../composables/language-text.ts";
import {
  columnKindOf,
  flattenColumns,
  isGroupColumn,
  type Column,
} from "../../lib/table/columns.ts";

export interface ColumnDef {
  header: string;
  field: string;
  /** Present only for columns that need a minimum width (e.g. File elements). */
  style?: { minWidth: string };
  /** Set when this column is a sub-column of a group, holding the group's idShort. */
  groupIdShort?: string;
}

export interface GroupHeaderDef {
  idShort: string;
  header: string;
  /** Number of sub-columns spanned; 1 for a plain (non-group) column. */
  colspan: number;
  isGroup: boolean;
}

const FILE_MIN_WIDTH = "200px";

function buildLabel(element: SubmodelElementResponseDto, locale: string): string {
  return resolveLanguageTexts(element.displayName, locale, element.idShort);
}

/**
 * Returns `element.value` narrowed to a specific `modelType`, or `undefined`
 * if `element` isn't that type.
 */
export function childElementsOf<T = SubmodelElementResponseDto>(
  element: SubmodelElementResponseDto,
  modelType: string,
): T[] | undefined {
  if (element.modelType !== modelType) return undefined;
  return (element as unknown as { value: T[] }).value;
}

function groupChildren(
  element: SubmodelElementResponseDto,
): SubmodelElementResponseDto[] | undefined {
  return childElementsOf(element, AasSubmodelElements.SubmodelElementCollection);
}

/**
 * Derives structured columns (with `children` for group columns) from the
 * list's first row. Pure function — no Vue reactivity, safe to call from a
 * `computed` or a test.
 */
function buildStructuredColumns(
  content: SubmodelElementCollectionResponseDto[],
  locale: string,
): Column[] {
  if (content.length < 1 || !content[0] || !content[0].value) {
    return [];
  }

  return content[0].value.map((col) => {
    const children = groupChildren(col)?.map((subCol) => ({
      idShort: subCol.idShort,
      label: buildLabel(subCol, locale),
      plain: subCol,
    }));

    return { idShort: col.idShort, label: buildLabel(col, locale), plain: col, children };
  });
}

/** Flat, DataTable-ready column definitions — group columns expanded into their sub-columns. */
export function buildColumns(
  content: SubmodelElementCollectionResponseDto[],
  locale = "en",
): ColumnDef[] {
  return flattenColumns(buildStructuredColumns(content, locale)).map((col) => ({
    header: col.label,
    field: col.field,
    groupIdShort: col.groupIdShort,
    ...(col.plain.modelType === "File" ? { style: { minWidth: FILE_MIN_WIDTH } } : {}),
  }));
}

/** True when any column is a group column, i.e. a spanning header row is needed. */
export function hasGroupColumns(content: SubmodelElementCollectionResponseDto[]): boolean {
  if (content.length < 1 || !content[0] || !content[0].value) return false;
  return content[0].value.some((col) => columnKindOf(col.modelType) === "group");
}

/** One entry per top-level column, for rendering the spanning group header row. */
export function buildGroupHeaders(
  content: SubmodelElementCollectionResponseDto[],
  locale = "en",
): GroupHeaderDef[] {
  return buildStructuredColumns(content, locale).map((col) => ({
    idShort: col.idShort,
    header: col.label,
    colspan: isGroupColumn(col) ? col.children!.length : 1,
    isGroup: isGroupColumn(col),
  }));
}

/**
 * Builds one record per data row, keyed by the same dot-notation field
 * `buildColumns` produces (e.g. "Group1.SubCol1" for a group's sub-column).
 * Group cells are expanded into their children's leaf elements so each flat
 * field maps directly to a renderable `SubmodelElementResponseDto`.
 */
export function buildRows(
  content: SubmodelElementCollectionResponseDto[],
  locale = "en",
): Record<string, SubmodelElementResponseDto>[] {
  const structured = buildStructuredColumns(content, locale);
  const result: Record<string, SubmodelElementResponseDto>[] = [];

  for (let rowIndex = 0; rowIndex < content.length; rowIndex++) {
    const row = content[rowIndex];
    if (!row || !row.value) continue;

    const rowRecord: Record<string, SubmodelElementResponseDto> = {};
    for (let colIndex = 0; colIndex < row.value.length; colIndex++) {
      const col = structured[colIndex];
      const cellValue = row.value[colIndex];
      if (!col || !cellValue) continue;

      if (col.children) {
        const subValues = groupChildren(cellValue) ?? [];
        for (let subIndex = 0; subIndex < col.children.length; subIndex++) {
          const subCol = col.children[subIndex];
          const subValue = subValues[subIndex];
          if (subCol && subValue) {
            rowRecord[`${col.idShort}.${subCol.idShort}`] = subValue;
          }
        }
      } else {
        rowRecord[col.idShort] = cellValue;
      }
    }
    result[rowIndex] = rowRecord;
  }

  return result;
}
