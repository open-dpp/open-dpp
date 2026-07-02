import type { LanguageType, SubmodelElementListResponseDto, ValueRequestDto } from "@open-dpp/dto";
import {
  AasSubmodelElements,
  SubmodelElementCollectionJsonSchema,
  ValueSchema,
} from "@open-dpp/dto";
import { match, P } from "ts-pattern";
import { resolveLanguageTexts } from "../../composables/language-text.ts";

export interface Column {
  idShort: string;
  label: string;
  plain: any;
  /** Sub-columns for group (SubmodelElementCollection) columns. */
  children?: Column[];
}

/** Flat column used for DataTable data Column components. */
export interface FlatColumn extends Column {
  /** Dot-notation field: "ColIdShort" or "GroupIdShort.SubColIdShort". */
  field: string;
  groupIdShort?: string;
}

export type Value = string | null;
export type GroupFieldValue = Record<string, Value>;
export type RowFieldValue = Value | GroupFieldValue;
export type Row = Record<string, RowFieldValue>;
export type RowContext = Record<string, any>;

const ValueMatcher = P.optional(P.union(P.string, null));

/**
 * Distinguishes a "group" column (flattened into N inline-editable sub-cells)
 * from a "scalar" one (a single inline-editable cell). Internal to the
 * conversion logic below — not part of the public Column shape, since
 * nothing outside this module needs to branch on it (yet).
 */
type ColumnKind = "scalar" | "group";

function columnKindOf(modelType: unknown): ColumnKind {
  return modelType === AasSubmodelElements.SubmodelElementCollection ? "group" : "scalar";
}

export function isGroupColumn(column: Column): boolean {
  return column.children !== undefined;
}

export function resolveFieldValue(rowData: Row, field: string): Value {
  const dotIndex = field.indexOf(".");
  if (dotIndex === -1) return rowData[field] as Value;
  const groupKey = field.slice(0, dotIndex);
  const subKey = field.slice(dotIndex + 1);
  const group = rowData[groupKey] as GroupFieldValue | undefined;
  return group?.[subKey] ?? null;
}

export function setFieldValue(rowData: Row, field: string, value: Value): void {
  const dotIndex = field.indexOf(".");
  if (dotIndex === -1) {
    rowData[field] = value;
    return;
  }
  const groupKey = field.slice(0, dotIndex);
  const subKey = field.slice(dotIndex + 1);
  if (!rowData[groupKey]) rowData[groupKey] = {};
  (rowData[groupKey] as GroupFieldValue)[subKey] = value;
}

export function convertCell(value: Value, context: RowContext) {
  return match({ value, ...context })
    .with(
      {
        value: ValueMatcher,
        modelType: AasSubmodelElements.File,
        contentType: P.string,
      },
      ({ value, contentType }) => ({ value, contentType }),
    )
    .with(
      {
        value: ValueMatcher,
        modelType: AasSubmodelElements.Property,
      },
      ({ value }) => value,
    )
    .otherwise(() => null);
}

function isGroupContext(context: any): boolean {
  return context !== null && typeof context === "object" && !("modelType" in context);
}

export function convertRowToRequestDto(row: Row, rowsContext: RowContext[]): ValueRequestDto {
  const rowContext = rowsContext.find((r) => r.idShort === row.idShort);
  if (!rowContext) {
    throw new Error(`Row context not found for idShort: ${row.idShort}`);
  }

  const requestDto = Object.entries(row)
    .filter(([field]) => field !== "idShort")
    .reduce((acc, [field, value]) => {
      const context = rowContext[field];
      const fieldValue = isGroupContext(context)
        ? Object.entries(value as GroupFieldValue).reduce(
            (groupAcc, [subField, subValue]) => ({
              ...groupAcc,
              [subField]: convertCell(subValue, context[subField]),
            }),
            {},
          )
        : convertCell(value as Value, context);
      return { ...acc, [field]: fieldValue };
    }, {});

  return ValueSchema.parse(requestDto);
}

/** Adds/updates `columns` in place from the list's header row, removing columns no longer present. */
export function convertDataToColumns(
  columns: Column[],
  newData: SubmodelElementListResponseDto,
  selectedLanguage: LanguageType,
): void {
  if (newData.value.length === 0) return;

  const headerRow = SubmodelElementCollectionJsonSchema.parse(newData.value[0]);
  const newColIds = new Set(headerRow.value.map((col: any) => col.idShort));
  // Remove top-level columns no longer present (e.g. moved into a group)
  for (let i = columns.length - 1; i >= 0; i--) {
    if (!newColIds.has(columns[i]!.idShort)) {
      columns.splice(i, 1);
    }
  }

  for (const [index, col] of headerRow.value.entries()) {
    const children: Column[] | undefined =
      columnKindOf(col.modelType) === "group"
        ? ((col.value as any[]) ?? []).map((subCol: any) => ({
            idShort: subCol.idShort,
            label: resolveLanguageTexts(subCol.displayName, selectedLanguage, subCol.idShort),
            plain: subCol,
          }))
        : undefined;

    const column: Column = {
      idShort: col.idShort,
      label: resolveLanguageTexts(col.displayName, selectedLanguage, col.idShort),
      plain: col,
      children,
    };

    const foundColumn = columns.find((c) => c.idShort === col.idShort);
    if (!foundColumn) {
      columns.splice(index, 0, column);
    } else {
      if (foundColumn.label !== column.label) foundColumn.label = column.label;
      foundColumn.plain = column.plain;
      foundColumn.children = children;
    }
  }
}

function convertLeafColumn(v: any): { value: Value; context: any } {
  return match(v)
    .returnType<{ value: Value; context: any }>()
    .with(
      {
        contentType: P.string,
        modelType: AasSubmodelElements.File,
        value: ValueMatcher,
      },
      ({ value, contentType, modelType }) => ({
        value: value ?? null,
        context: { contentType, modelType },
      }),
    )
    .with(
      {
        modelType: AasSubmodelElements.Property,
        value: ValueMatcher,
      },
      ({ value, modelType }) => ({
        value: value ?? null,
        context: { modelType },
      }),
    )
    .otherwise(() => {
      throw new Error(`Unsupported model type: ${v.modelType}`);
    });
}

/** Adds/updates `rows`/`rowsContext` in place from the list's data rows. */
export function convertDataToRows(
  rows: Row[],
  rowsContext: RowContext[],
  newData: SubmodelElementListResponseDto,
): void {
  for (const [index, row] of newData.value.entries()) {
    const parsedRow = SubmodelElementCollectionJsonSchema.parse(row);
    const foundRow = rows.find((r) => r.idShort === row.idShort);
    const foundRowContext = rowsContext.find((r) => r.idShort === row.idShort);
    const rowToModify: Row = foundRow || { idShort: row.idShort };
    const rowContextToModify: RowContext = foundRowContext || { idShort: row.idShort };

    const newColIds = new Set(parsedRow.value.map((col: any) => col.idShort));
    for (const key of Object.keys(rowToModify)) {
      if (key !== "idShort" && !newColIds.has(key)) {
        delete rowToModify[key];
        delete rowContextToModify[key];
      }
    }

    for (const col of parsedRow.value) {
      if (columnKindOf(col.modelType) === "group") {
        const groupValue: GroupFieldValue = {};
        const groupContext: Record<string, any> = {};
        for (const subCol of (col.value as any[]) ?? []) {
          const { value, context } = convertLeafColumn(subCol);
          groupValue[subCol.idShort] = value;
          groupContext[subCol.idShort] = context;
        }
        rowToModify[col.idShort] = groupValue;
        rowContextToModify[col.idShort] = groupContext;
      } else {
        const { value, context } = convertLeafColumn(col);
        rowToModify[col.idShort] = value;
        rowContextToModify[col.idShort] = context;
      }
    }

    if (!foundRow) {
      rows.splice(index, 0, rowToModify);
    }
    if (!foundRowContext) {
      rowsContext.splice(index, 0, rowContextToModify);
    }
  }
}
