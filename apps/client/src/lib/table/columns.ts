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
/**
 * Keyed by the same dot-notation string `flattenColumns` produces as a
 * `FlatColumn.field` — including sub-columns, stored as a literal top-level
 * key (e.g. "Group1.SubCol1"), not nested. This matches what PrimeVue's own
 * `field`-based lookups expect; only `convertRowToRequestDto` reconstructs
 * the nested shape the backend DTO actually needs.
 */
export type Row = Record<string, Value>;
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

/** Flattens group columns into their sub-columns for DataTable rendering. */
export function flattenColumns(columns: Column[]): FlatColumn[] {
  return columns.flatMap((col) =>
    col.children
      ? col.children.map((subCol) => ({
          ...subCol,
          field: `${col.idShort}.${subCol.idShort}`,
          groupIdShort: col.idShort,
        }))
      : [{ ...col, field: col.idShort }],
  );
}

export function resolveFieldValue(rowData: Row, field: string): Value {
  return rowData[field] ?? null;
}

export function setFieldValue(rowData: Row, field: string, value: Value): void {
  rowData[field] = value;
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

/** Converts a flat row (dot-notation keys) into the nested request DTO the backend expects. */
export function convertRowToRequestDto(row: Row, rowsContext: RowContext[]): ValueRequestDto {
  const rowContext = rowsContext.find((r) => r.idShort === row.idShort);
  if (!rowContext) {
    throw new Error(`Row context not found for idShort: ${row.idShort}`);
  }

  const requestDto: Record<string, any> = {};
  for (const [field, value] of Object.entries(row)) {
    if (field === "idShort") continue; // skip Id of row
    const converted = convertCell(value, rowContext[field]);
    const dotIndex = field.indexOf(".");
    if (dotIndex === -1) {
      requestDto[field] = converted;
    } else {
      const groupKey = field.slice(0, dotIndex);
      const subKey = field.slice(dotIndex + 1);
      requestDto[groupKey] = { ...requestDto[groupKey], [subKey]: converted };
    }
  }

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

    // dot-notation flat key (e.g. "Group1.SubCol1"), matching FlatColumn.field.
    const newFieldKeys = new Set<string>();

    for (const col of parsedRow.value) {
      if (columnKindOf(col.modelType) === "group") {
        for (const subCol of (col.value as any[]) ?? []) {
          const { value, context } = convertLeafColumn(subCol);
          const flatKey = `${col.idShort}.${subCol.idShort}`;
          rowToModify[flatKey] = value;
          rowContextToModify[flatKey] = context;
          newFieldKeys.add(flatKey);
        }
      } else {
        const { value, context } = convertLeafColumn(col);
        rowToModify[col.idShort] = value;
        rowContextToModify[col.idShort] = context;
        newFieldKeys.add(col.idShort);
      }
    }

    for (const key of Object.keys(rowToModify)) {
      if (key !== "idShort" && !newFieldKeys.has(key)) {
        delete rowToModify[key];
        delete rowContextToModify[key];
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
