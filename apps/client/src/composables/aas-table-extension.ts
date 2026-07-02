import type { AasNamespace } from "@open-dpp/api-client";

import type {
  LanguageType,
  SubmodelElementListResponseDto,
  SubmodelElementModificationDto,
  SubmodelElementSharedRequestDto,
  TableModificationParamsDto,
} from "@open-dpp/dto";
import { KeyTypes, SubmodelElementListJsonSchema } from "@open-dpp/dto";
import type { ConfirmationOptions } from "primevue/confirmationoptions";
import type { MenuItem } from "primevue/menuitem";
import type { Ref } from "vue";
import { computed, ref } from "vue";
import type { IErrorHandlingStore } from "../stores/error.handling.ts";
import type {
  AasEditorPath,
  EditorType,
  OpenDrawerCallback,
  SubmodelElementListEditorProps,
} from "./aas-drawer.ts";
import { EditorMode } from "./aas-drawer.ts";
import { formatPropertyValue } from "../lib/property-value.ts";
import type { Column, FlatColumn, Row, RowContext, Value } from "../lib/table/columns.ts";
import {
  convertDataToColumns,
  convertDataToRows,
  convertRowToRequestDto,
  flattenColumns,
  isGroupColumn,
  resolveFieldValue,
  setFieldValue,
} from "../lib/table/columns.ts";
import type { ColumnMenuOptions, RowMenuOptions, TableMenuDeps } from "../lib/table/menu.ts";
import {
  buildColumnMenu as computeColumnMenu,
  buildRowMenu as computeRowMenu,
} from "../lib/table/menu.ts";
import type { TableMutationsDeps } from "../lib/table/mutations.ts";
import * as tableMutations from "../lib/table/mutations.ts";

export type { Column, FlatColumn, Row } from "../lib/table/columns.ts";
export type { ColumnMenuOptions, RowMenuOptions } from "../lib/table/menu.ts";

interface AasTableExtensionProps {
  id: string;
  initialData: SubmodelElementListResponseDto;
  pathToList: AasEditorPath;
  aasNamespace: AasNamespace;
  errorHandlingStore: IErrorHandlingStore;
  openDrawer: OpenDrawerCallback<EditorType, "CREATE" | "EDIT">;
  callbackOfSubmodelElementListEditor: (data: SubmodelElementModificationDto) => Promise<void>;
  translate: (label: string, ...args: unknown[]) => string;
  selectedLanguage: LanguageType;
  openConfirm: (option: ConfirmationOptions) => void;
  disableRowCreation?: boolean;
  disableColumnCreation?: boolean;
  disableRowDeletion?: boolean;
  disableColumnDeletion?: boolean;
  disableColumnEditing?: boolean;
  /**
   * IANA timezone for formatting DateTime cell values. Defaults to the
   * runtime-resolved viewer timezone. Injected so tests can pin it.
   */
  timezone?: string;
}

export interface CellEditProps {
  data: Row;
  newValue: Value;
  field: string;
  index: number;
}

export interface IAasTableExtension {
  columns: Ref<Column[]>;
  flatColumns: Ref<FlatColumn[]>;
  hasGroups: Ref<boolean>;
  rows: Ref<Row[]>;
  rowsContext: Ref<RowContext[]>;
  columnMenu: Ref<MenuItem[]>;
  rowMenu: Ref<MenuItem[]>;
  buildColumnMenu: (options: ColumnMenuOptions) => void;
  buildRowMenu: (options: RowMenuOptions) => void;
  onCellEditComplete: (event: CellEditProps) => Promise<void>;
  formatCellValue: (value: string, column: Column) => Value;
  resolveFieldValue: (data: Row, field: string) => Value;
  setFieldValue: (data: Row, field: string, value: Value) => void;
  save: () => Promise<void>;
}

export function useAasTableExtension({
  id,
  pathToList,
  initialData,
  aasNamespace,
  errorHandlingStore,
  openDrawer,
  callbackOfSubmodelElementListEditor,
  translate,
  selectedLanguage,
  openConfirm,
  disableColumnCreation,
  disableRowCreation,
  disableRowDeletion,
  disableColumnDeletion,
  disableColumnEditing,
  timezone,
}: AasTableExtensionProps): IAasTableExtension {
  const translatePrefix = "aasEditor";
  const translateTablePrefix = `${translatePrefix}.table`;
  const columnMenu = ref<MenuItem[]>([]);
  const rowMenu = ref<MenuItem[]>([]);
  const data = ref<SubmodelElementListResponseDto>(initialData);

  const rows = ref<Row[]>([]);
  const rowsContext = ref<RowContext[]>([]);
  const columns = ref<Column[]>([]);

  const flatColumns = computed<FlatColumn[]>(() => flattenColumns(columns.value));
  const hasGroups = computed(() => columns.value.some(isGroupColumn));

  const mutationDeps: TableMutationsDeps = { aasNamespace, id, pathToList, errorHandlingStore };

  function updateListData(newListData: SubmodelElementListResponseDto) {
    data.value = newListData;
    convertDataToColumns(columns.value, data.value, selectedLanguage);
    convertDataToRows(rows.value, rowsContext.value, data.value);
  }

  function getRowIdShortAtIndexOrFail(index: number): string {
    const row = data.value.value[index];
    if (!row) {
      throw new Error(`Row with index ${index} not found`);
    }
    return row.idShort;
  }

  async function navigateBackToListView(
    path: AasEditorPath,
    newListData: SubmodelElementListEditorProps,
  ) {
    const formItemLabel = translate(`${translatePrefix}.submodelElementList`);
    openDrawer({
      type: KeyTypes.SubmodelElementList,
      data: newListData,
      mode: EditorMode.EDIT,
      title: translate(`${translatePrefix}.edit`, { formItem: formItemLabel }),
      path,
      callback: callbackOfSubmodelElementListEditor,
    });
  }

  async function onCreateColumn(
    colData: SubmodelElementSharedRequestDto,
    options: TableModificationParamsDto,
  ) {
    await tableMutations.createColumn(
      colData,
      options,
      mutationDeps,
      translate(`${translatePrefix}.table.errorAddColumn`),
      async (listData) => {
        await navigateBackToListView(pathToList, SubmodelElementListJsonSchema.parse(listData));
      },
    );
  }

  async function onAddColumnToGroup(
    groupIdShort: string,
    colData: SubmodelElementSharedRequestDto,
    options: TableModificationParamsDto,
  ) {
    await tableMutations.addColumnToGroup(
      groupIdShort,
      colData,
      options,
      mutationDeps,
      translate(`${translatePrefix}.table.errorAddColumn`),
      async (listData) => {
        await navigateBackToListView(pathToList, SubmodelElementListJsonSchema.parse(listData));
      },
    );
  }

  async function onModifyTopLevelColumn(formData: SubmodelElementModificationDto, column: Column) {
    await tableMutations.modifyTopLevelColumn(
      column.idShort,
      formData,
      mutationDeps,
      translate(`${translatePrefix}.table.errorEditColumn`),
      async (listData) => {
        await navigateBackToListView(pathToList, SubmodelElementListJsonSchema.parse(listData));
      },
    );
  }

  async function onModifyColumnInGroup(
    groupIdShort: string,
    subColumn: Column,
    formData: SubmodelElementModificationDto,
  ) {
    await tableMutations.modifyColumnInGroup(
      groupIdShort,
      subColumn.idShort,
      formData,
      mutationDeps,
      translate(`${translatePrefix}.table.errorEditColumn`),
      async (listData) => {
        await navigateBackToListView(pathToList, SubmodelElementListJsonSchema.parse(listData));
      },
    );
  }

  async function onRemoveColumn(column: Column) {
    await tableMutations.deleteColumn(
      column.idShort,
      mutationDeps,
      translate(`${translateTablePrefix}.errorRemoveColumn`),
      (listData) => {
        columns.value.splice(
          columns.value.findIndex((c) => c.idShort === column.idShort),
          1,
        );
        updateListData(listData);
      },
    );
  }

  async function onDeleteColumnFromGroup(groupIdShort: string, subColumn: Column) {
    await tableMutations.deleteColumnFromGroup(
      groupIdShort,
      subColumn.idShort,
      mutationDeps,
      translate(`${translateTablePrefix}.errorRemoveColumn`),
      (listData) => {
        const group = columns.value.find((c) => c.idShort === groupIdShort);
        if (group?.children) {
          group.children = group.children.filter((c) => c.idShort !== subColumn.idShort);
        }
        updateListData(listData);
      },
    );
  }

  async function onMoveColumnToGroup(column: Column, groupIdShort: string) {
    await tableMutations.moveColumnToGroup(
      column.idShort,
      groupIdShort,
      mutationDeps,
      translate(`${translateTablePrefix}.errorMoveColumn`),
      (listData) => {
        updateListData(SubmodelElementListJsonSchema.parse(listData));
      },
    );
  }

  async function onAddRow(options: RowMenuOptions) {
    await tableMutations.addRow(
      options,
      mutationDeps,
      translate(`${translateTablePrefix}.errorAddRow`),
      (listData) => {
        updateListData(listData);
      },
    );
  }

  async function onRemoveRow(rowIndex: number) {
    await tableMutations.deleteRow(
      getRowIdShortAtIndexOrFail(rowIndex),
      mutationDeps,
      translate(`${translateTablePrefix}.errorRemoveRow`),
      (listData) => {
        data.value = listData;
        rows.value.splice(rowIndex, 1);
        rowsContext.value.splice(rowIndex, 1);
      },
    );
  }

  const menuDeps: TableMenuDeps = {
    translate,
    openDrawer,
    openConfirm,
    pathToList,
    selectedLanguage,
    errorHandlingStore,
    disableRowCreation,
    disableRowDeletion,
    disableColumnCreation,
    disableColumnDeletion,
    disableColumnEditing,
    onCreateColumn,
    onAddColumnToGroup,
    onModifyTopLevelColumn,
    onModifyColumnInGroup,
    onRemoveColumn,
    onDeleteColumnFromGroup,
    onMoveColumnToGroup,
    onAddRow,
    onRemoveRow,
  };

  function buildColumnMenu(options: ColumnMenuOptions) {
    const menu = computeColumnMenu(options, columns.value, menuDeps);
    // `undefined` means the requested column couldn't be resolved — leave the
    // previously displayed menu as-is rather than clearing it.
    if (menu !== undefined) {
      columnMenu.value = menu;
    }
  }

  function buildRowMenu(options: RowMenuOptions) {
    rowMenu.value = computeRowMenu(options, rows.value.length, menuDeps);
  }

  async function save() {
    await tableMutations.saveRows(
      rows.value.map((row) => convertRowToRequestDto(row, rowsContext.value)),
      mutationDeps,
      translate(`${translateTablePrefix}.errorEditEntries`),
    );
  }

  async function onCellEditComplete(event: CellEditProps) {
    const { data: rowData, newValue, field, index: editedRowIndex } = event;
    const errorMessage = translate(`${translateTablePrefix}.errorEditEntries`);
    if (resolveFieldValue(rowData, field) !== newValue) {
      try {
        const modifications = rows.value.map((row, index) => {
          if (index === editedRowIndex) {
            const updated = { ...row };
            setFieldValue(updated, field, newValue);
            return convertRowToRequestDto(updated, rowsContext.value);
          }
          return convertRowToRequestDto(row, rowsContext.value);
        });
        const success = await tableMutations.saveRows(modifications, mutationDeps, errorMessage);
        if (success) {
          setFieldValue(rowData, field, newValue);
        } else {
          errorHandlingStore.logErrorWithNotification(errorMessage);
        }
      } catch (e) {
        errorHandlingStore.logErrorWithNotification(errorMessage, e);
      }
    }
  }

  function formatCellValue(value: Value, column: Column) {
    return formatPropertyValue(value, column.plain.valueType, selectedLanguage, timezone);
  }

  function init() {
    convertDataToRows(rows.value, rowsContext.value, initialData);
    convertDataToColumns(columns.value, initialData, selectedLanguage);
  }
  init();

  return {
    rows,
    rowsContext,
    columns,
    flatColumns,
    hasGroups,
    columnMenu,
    rowMenu,
    formatCellValue,
    resolveFieldValue,
    setFieldValue,
    save,
    buildColumnMenu,
    buildRowMenu,
    onCellEditComplete,
  };
}
