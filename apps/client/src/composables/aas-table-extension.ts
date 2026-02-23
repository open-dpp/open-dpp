import type { AasNamespace } from "@open-dpp/api-client";

import type {
  DataTypeDefType,
  FileRequestDto,
  LanguageType,
  PropertyRequestDto,
  ReferenceElementRequestDto,
  SubmodelElementListResponseDto,
  SubmodelElementModificationDto,
  SubmodelElementSharedRequestDto,
  TableModificationParamsDto,
  ValueRequestDto,
} from "@open-dpp/dto";
import type { ConfirmationOptions } from "primevue/confirmationoptions";
import type { MenuItem, MenuItemCommandEvent } from "primevue/menuitem";
import type { Ref } from "vue";
import type { IErrorHandlingStore } from "../stores/error.handling.ts";
import type {
  AasEditorPath,
  EditorType,
  OpenDrawerCallback,
  SubmodelElementListEditorProps,
} from "./aas-drawer.ts";
import {
  AasSubmodelElements,
  DataTypeDef,
  KeyTypes,
  Language,
  ReferenceTypes,
  SubmodelElementCollectionJsonSchema,
  SubmodelElementListJsonSchema,
  SubmodelElementSchema,
  ValueSchema,
} from "@open-dpp/dto";
import { match, P } from "ts-pattern";
import { ref, toRaw } from "vue";
import { HTTPCode } from "../stores/http-codes.ts";
import { ColumnEditorKey, EditorMode } from "./aas-drawer.ts";

interface AasTableExtensionProps {
  id: string;
  initialData: SubmodelElementListResponseDto;
  pathToList: AasEditorPath;
  aasNamespace: AasNamespace;
  errorHandlingStore: IErrorHandlingStore;
  openDrawer: OpenDrawerCallback<EditorType, "CREATE" | "EDIT">;
  callbackOfSubmodelElementListEditor: (
    data: SubmodelElementModificationDto,
  ) => Promise<void>;
  translate: (label: string, ...args: unknown[]) => string;
  selectedLanguage: LanguageType;
  openConfirm: (option: ConfirmationOptions) => void;
}

export type ColumnMenuOptions = TableModificationParamsDto & {
  addColumnActions?: boolean;
};
export type RowMenuOptions = TableModificationParamsDto;
type Value = string | null;
type Row = Record<string, Value>;

export interface CellEditProps {
  data: Row;
  newValue: Value;
  field: string;
  index: number;
}

interface Column {
  idShort: string;
  label: string;
  plain: any;
}

type RowContext = Record<string, any>;

export interface IAasTableExtension {
  columns: Ref<Column[]>;
  rows: Ref<Row[]>;
  rowsContext: Ref<RowContext[]>;
  columnMenu: Ref<MenuItem[]>;
  rowMenu: Ref<MenuItem[]>;
  buildColumnMenu: (options: ColumnMenuOptions) => void;
  buildRowMenu: (options: RowMenuOptions) => void;
  onCellEditComplete: (event: CellEditProps) => Promise<void>;
  formatCellValue: (value: string, column: Column) => Value;
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
}: AasTableExtensionProps): IAasTableExtension {
  const translatePrefix = "aasEditor";
  const translateTablePrefix = `${translatePrefix}.table`;
  const columnMenu = ref<MenuItem[]>([]);
  const rowMenu = ref<MenuItem[]>([]);
  const data = ref<SubmodelElementListResponseDto>(initialData);
  const ValueMatcher = P.optional(P.union(P.string, null));

  const rows = ref<Row[]>([]);
  const rowsContext = ref<RowContext[]>([]);

  function buildColumnMenuItem(
    fieldLabel: string,
    icon: string,
    options: TableModificationParamsDto,
    type:
      | typeof AasSubmodelElements.File
      | typeof AasSubmodelElements.Property
      | typeof AasSubmodelElements.ReferenceElement,
    valueType?: DataTypeDefType,
  ) {
    const addColumLabel = translate(
      `${translateTablePrefix}.addFieldAsColumn`,
      {
        field:
          selectedLanguage === Language.de
            ? fieldLabel
            : fieldLabel.toLowerCase(),
      },
    );
    const labelAndIcon = {
      label: fieldLabel,
      icon,
    };
    const sharedDrawerProps = {
      mode: EditorMode.CREATE,
      title: addColumLabel,
      path: pathToList,
    };

    return match({ type, valueType })
      .with({ type: AasSubmodelElements.File }, ({ type }) => ({
        ...labelAndIcon,
        command: (_event: MenuItemCommandEvent) => {
          openDrawer({
            ...sharedDrawerProps,
            type: ColumnEditorKey,
            data: { modelType: type, contentType: "application/octet-stream" },
            callback: async (data: FileRequestDto) =>
              createColumn({ modelType: type, ...data }, options),
          });
        },
      }))
      .with(
        { type: AasSubmodelElements.Property, valueType: P.string },
        ({ type, valueType }) => ({
          ...labelAndIcon,
          command: (_event: MenuItemCommandEvent) => {
            openDrawer({
              ...sharedDrawerProps,
              type: ColumnEditorKey,
              data: { modelType: type, valueType },
              callback: async (data: PropertyRequestDto) =>
                createColumn({ modelType: type, ...data }, options),
            });
          },
        }),
      )
      .with({ type: AasSubmodelElements.ReferenceElement }, ({ type }) => ({
        ...labelAndIcon,
        command: (_event: MenuItemCommandEvent) => {
          openDrawer({
            ...sharedDrawerProps,
            type: ColumnEditorKey,
            data: { modelType: type },
            callback: async (data: ReferenceElementRequestDto) =>
              createColumn({ modelType: type, ...data }, options),
          });
        },
      }))
      .run();
  }

  const columns = ref<Column[]>([]);

  async function saveRows(rowsToSave: ValueRequestDto) {
    const errorMessage = translate(`${translateTablePrefix}.errorEditEntries`);
    try {
      const response = await aasNamespace.modifyValueOfSubmodelElement(
        id,
        pathToList.submodelId!,
        pathToList.idShortPath!,
        rowsToSave,
      );
      if (response.status !== HTTPCode.OK) {
        errorHandlingStore.logErrorWithNotification(errorMessage);
        return false;
      }
      return true;
    }
    catch (e) {
      errorHandlingStore.logErrorWithNotification(errorMessage, e);
      return false;
    }
  }

  async function save() {
    await saveRows(rows.value.map(convertRowToRequestDto));
  }

  function convertRowToRequestDto(row: Row): ValueRequestDto {
    const rowContext = rowsContext.value.find(
      r => r.idShort === row.idShort,
    );
    if (!rowContext) {
      throw new Error(`Row context not found for idShort: ${row.idShort}`);
    }
    function convertCell(value: Value, context: RowContext) {
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
        .with(
          {
            modelType: AasSubmodelElements.ReferenceElement,
            value: ValueMatcher,
            type: P.optional(P.string),
            keyType: P.optional(P.string),
          },
          ({ value, type, keyType }) => {
            return value
              ? {
                  type: type ?? ReferenceTypes.ExternalReference,
                  keys: [{ type: keyType ?? KeyTypes.GlobalReference, value }],
                }
              : null;
          },
        )
        .otherwise(() => null);
    }
    const requestDto = Object.entries(row)
      .filter(([field]) => field !== "idShort")
      .reduce(
        (acc, [field, value]) => ({
          ...acc,
          [field]: convertCell(value, rowContext[field]),
        }),
        {},
      );

    return ValueSchema.parse(requestDto);
  }

  async function onCellEditComplete(event: CellEditProps) {
    const { data: rowData, newValue, field, index: editedRowIndex } = event;
    if (rowData[field] !== newValue) {
      const modifications = rows.value.map((row, index) =>
        index === editedRowIndex
          ? convertRowToRequestDto({ ...row, [field]: newValue })
          : convertRowToRequestDto(row),
      );
      if (await saveRows(modifications)) {
        rowData[field] = newValue;
      }
    }
  }

  function convertDataToColumns(newData: SubmodelElementListResponseDto) {
    if (newData.value.length > 0) {
      const headerRow = SubmodelElementCollectionJsonSchema.parse(
        newData.value[0],
      );
      for (const [index, col] of headerRow.value.entries()) {
        const foundColumn = columns.value.find(
          c => c.idShort === col.idShort,
        );
        const column = {
          idShort: col.idShort,
          label:
            col.displayName.find(d => d.language === selectedLanguage)
              ?.text ?? col.idShort,
          plain: col,
        };
        if (!foundColumn) {
          columns.value.splice(index, 0, column);
        }
        else if (foundColumn.label !== column.label) {
          foundColumn.label = column.label;
          foundColumn.plain = column.plain;
        }
      }
    }
    return [];
  }

  function convertDataToRows(newData: SubmodelElementListResponseDto) {
    function convertColumn(v: any): { value: Value; context: any } {
      return (
        match(v)
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
          // Currently, only ReferenceElement values which are global references are supported
          .with(
            {
              modelType: AasSubmodelElements.ReferenceElement,
              value: P.optional(
                P.union(
                  {
                    type: ReferenceTypes.ExternalReference,
                    keys: P.array({
                      type: KeyTypes.GlobalReference,
                      value: P.string,
                    }),
                  },
                  null,
                ),
              ),
            },
            ({ value }) => ({
              value: value?.keys[0]?.value ?? null,
              context: {
                modelType: AasSubmodelElements.ReferenceElement,
                type: value?.type,
                keyType: value?.keys[0]?.type,
              },
            }),
          )
          .otherwise(() => {
            throw new Error(`Unsupported model type: ${v.modelType}`);
          })
      );
    }
    for (const [index, row] of newData.value.entries()) {
      const parsedRow = SubmodelElementCollectionJsonSchema.parse(row);
      const foundRow = rows.value.find(r => r.idShort === row.idShort);
      const foundRowContext = rowsContext.value.find(
        r => r.idShort === row.idShort,
      );
      const rowToModify = foundRow || { idShort: row.idShort };
      const rowContextToModify = foundRowContext || { idShort: row.idShort };

      // Remove fields that are no longer present in the server data
      const newColIds = new Set(parsedRow.value.map(col => col.idShort));
      for (const key of Object.keys(rowToModify)) {
        if (key !== "idShort" && !newColIds.has(key)) {
          delete rowToModify[key];
          delete rowContextToModify[key];
        }
      }

      for (const col of parsedRow.value) {
        const { value, context } = convertColumn(col);
        if (rowToModify[col.idShort] !== value) {
          rowToModify[col.idShort] = value;
        }
        if (rowContextToModify[col.idShort] !== context) {
          rowContextToModify[col.idShort] = context;
        }
      }
      if (!foundRow) {
        rows.value.splice(index, 0, rowToModify);
      }
      if (!foundRowContext) {
        rowsContext.value.splice(index, 0, rowContextToModify);
      }
    }
  }

  function updateListData(newListData: SubmodelElementListResponseDto) {
    data.value = newListData;
    convertDataToColumns(data.value);
    convertDataToRows(data.value);
  }

  function getColumnAtIndexOrFail(index: number): Column {
    const column = columns.value[index];
    if (!column) {
      throw new Error(`Column with index ${index} not found`);
    }
    return column;
  }

  function getRowIdShortAtIndexOrFail(index: number): string {
    const row = data.value.value[index];
    if (!row) {
      throw new Error(`Row with index ${index} not found`);
    }
    return row.idShort;
  }

  const buildRowMenu = (options: RowMenuOptions) => {
    rowMenu.value = [
      {
        label: translate(`${translateTablePrefix}.addRowAbove`),
        icon: "pi pi-arrow-up",
        command: async () => {
          await addRow(options);
        },
      },
      {
        label: translate(`${translateTablePrefix}.addRowBelow`),
        icon: "pi pi-arrow-down",
        command: async () => {
          await addRow({
            position:
              options.position !== undefined
                ? options.position + 1
                : rows.value.length,
          });
        },
      },
      removeRowMenuItem(options.position ?? 0),
    ];
  };

  function removeRowMenuItem(rowIndex: number) {
    const removeLabel = translate("common.remove");
    const cancelLabel = translate("common.cancel");
    return {
      label: removeLabel,
      icon: "pi pi-trash",
      command: async () => {
        openConfirm({
          message: translate(`${translateTablePrefix}.removeRow`),
          header: removeLabel,
          icon: "pi pi-info-circle",
          rejectLabel: cancelLabel,
          rejectProps: {
            label: cancelLabel,
            severity: "secondary",
            outlined: true,
          },
          acceptProps: {
            label: removeLabel,
            severity: "danger",
          },
          accept: async () => {
            try {
              const response
                = await aasNamespace.deleteRowFromSubmodelElementList(
                  id,
                  pathToList.submodelId!,
                  pathToList.idShortPath!,
                  getRowIdShortAtIndexOrFail(rowIndex),
                );
              if (response.status === HTTPCode.OK) {
                rows.value.splice(rowIndex, 1);
                rowsContext.value.splice(rowIndex, 1);
              }
            }
            catch (e) {
              errorHandlingStore.logErrorWithNotification(
                translate(`${translateTablePrefix}.errorRemoveRow`),
                e,
              );
            }
          },
        });
      },
    };
  }

  async function addRow({ position = 0 }: RowMenuOptions) {
    const errorMessage = translate(`${translateTablePrefix}.errorAddRow`);
    try {
      const response = await aasNamespace.addRowToSubmodelElementList(
        id,
        pathToList.submodelId!,
        pathToList.idShortPath!,
        { position },
      );
      if (response.status === HTTPCode.CREATED) {
        updateListData(response.data);
      }
      else {
        errorHandlingStore.logErrorWithNotification(errorMessage);
      }
    }
    catch (e) {
      errorHandlingStore.logErrorWithNotification(errorMessage, e);
    }
  }

  const buildColumnMenu = (options: ColumnMenuOptions) => {
    const icon = `pi pi-arrow-${options.addColumnActions ? "left" : "right"}`;
    const colMenuItems = [
      buildColumnMenuItem(
        translate(`${translatePrefix}.textField`),
        icon,
        options,
        AasSubmodelElements.Property,
        DataTypeDef.String,
      ),
      buildColumnMenuItem(
        translate(`${translatePrefix}.numberField`),
        icon,
        options,
        AasSubmodelElements.Property,
        DataTypeDef.Double,
      ),
      buildColumnMenuItem(
        translate(`${translatePrefix}.file`),
        icon,
        options,
        AasSubmodelElements.File,
      ),
      buildColumnMenuItem(
        translate(`${translatePrefix}.link`),
        icon,
        options,
        AasSubmodelElements.ReferenceElement,
      ),
    ];
    columnMenu.value = options.addColumnActions
      ? [
          {
            label: translate(`${translateTablePrefix}.addColumnLeft`),
            items: colMenuItems,
          },
        ]
      : colMenuItems;

    if (options.addColumnActions) {
      try {
        const column = getColumnAtIndexOrFail(options.position ?? 0);
        columnMenu.value.push({
          label: translate("common.actions"),
          items: [modifyColumnMenuItem(column), removeColumnMenuItem(column)],
        });
      }
      catch (e) {
        errorHandlingStore.logErrorWithNotification(
          translate(`common.errorOccurred`),
          e,
        );
      }
    }
  };

  function modifyColumnMenuItem(column: Column) {
    return {
      label: translate(`common.edit`),
      icon: "pi pi-pencil",
      command: (_event: MenuItemCommandEvent) => {
        openDrawer({
          type: ColumnEditorKey,
          data: toRaw(column.plain),
          mode: EditorMode.EDIT,
          title: translate(`${translatePrefix}.table.editColumn`),
          path: pathToList,
          callback: async (data: SubmodelElementModificationDto) =>
            modifyPropertyColumn(data, column),
        });
      },
    };
  }

  function removeColumnMenuItem(column: Column) {
    const removeLabel = translate("common.remove");
    const cancelLabel = translate("common.cancel");

    return {
      label: removeLabel,
      icon: "pi pi-trash",
      command: async () => {
        openConfirm({
          message: translate(`${translateTablePrefix}.removeColumn`),
          header: removeLabel,
          icon: "pi pi-info-circle",
          rejectLabel: cancelLabel,
          rejectProps: {
            label: cancelLabel,
            severity: "secondary",
            outlined: true,
          },
          acceptProps: {
            label: removeLabel,
            severity: "danger",
          },
          accept: async () => {
            try {
              const response
                = await aasNamespace.deleteColumnFromSubmodelElementList(
                  id,
                  pathToList.submodelId!,
                  pathToList.idShortPath!,
                  column.idShort,
                );
              if (response.status === HTTPCode.OK) {
                columns.value.splice(
                  columns.value.findIndex(c => c.idShort === column.idShort),
                  1,
                );
                updateListData(response.data);
              }
            }
            catch (e) {
              errorHandlingStore.logErrorWithNotification(
                translate(`${translateTablePrefix}.errorRemoveColumn`),
                e,
              );
            }
          },
        });
      },
    };
  }

  async function modifyPropertyColumn(
    data: SubmodelElementModificationDto,
    column: Column,
  ) {
    const errorMessage = translate(`${translatePrefix}.table.errorEditColumn`);
    try {
      const response = await aasNamespace.modifyColumnOfSubmodelElementList(
        id,
        pathToList.submodelId!,
        pathToList.idShortPath!,
        column.idShort,
        data,
      );
      if (response.status === HTTPCode.OK) {
        await navigateBackToListView(
          pathToList,
          SubmodelElementListJsonSchema.parse(response.data),
        );
      }
      else {
        errorHandlingStore.logErrorWithNotification(errorMessage);
      }
    }
    catch (e) {
      errorHandlingStore.logErrorWithNotification(errorMessage, e);
    }
  }

  async function createColumn(
    data: SubmodelElementSharedRequestDto,
    options: TableModificationParamsDto,
  ) {
    const errorMessage = translate(`${translatePrefix}.table.errorAddColumn`);
    try {
      const requestBody = SubmodelElementSchema.parse({
        ...data,
      });
      const response = await aasNamespace.addColumnToSubmodelElementList(
        id,
        pathToList.submodelId!,
        pathToList.idShortPath!,
        requestBody,
        options,
      );
      if (response.status === HTTPCode.CREATED) {
        await navigateBackToListView(
          pathToList,
          SubmodelElementListJsonSchema.parse(response.data),
        );
      }
      else {
        errorHandlingStore.logErrorWithNotification(errorMessage);
      }
    }
    catch (e) {
      errorHandlingStore.logErrorWithNotification(errorMessage, e);
    }
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

  function formatCellValue(value: Value, column: Column) {
    if (value === null) {
      return "N/A";
    }
    switch (column.plain.valueType) {
      case DataTypeDef.Double:
        return new Intl.NumberFormat(selectedLanguage, {
          style: "decimal",
        }).format(Number(value));
      default:
        return value;
    }
  }

  function init() {
    convertDataToRows(initialData);
    convertDataToColumns(initialData);
  }
  init();

  return {
    rows,
    rowsContext,
    columns,
    columnMenu,
    rowMenu,
    formatCellValue,
    save,
    buildColumnMenu,
    buildRowMenu,
    onCellEditComplete,
  };
}
