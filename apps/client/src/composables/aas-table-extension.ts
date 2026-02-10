import type { AasNamespace } from "@open-dpp/api-client";

import type {
  DataTypeDefType,
  FileRequestDto,
  LanguageType,
  PropertyRequestDto,
  SubmodelElementListResponseDto,
  SubmodelElementModificationDto,
  SubmodelElementSharedRequestDto,
  TableModificationParamsDto,
} from "@open-dpp/dto";
import type { ConfirmationOptions } from "primevue/confirmationoptions";
import type { MenuItem, MenuItemCommandEvent } from "primevue/menuitem";
import type { ComputedRef, Ref } from "vue";
import type { IErrorHandlingStore } from "../stores/error.handling.ts";
import type { AasEditorPath, EditorType, OpenDrawerCallback, SubmodelElementListEditorProps } from "./aas-drawer.ts";
import {
  AasSubmodelElements,

  DataTypeDef,
  KeyTypes,
  Language,
  SubmodelElementCollectionJsonSchema,
  SubmodelElementListJsonSchema,
  SubmodelElementSchema,

} from "@open-dpp/dto";
import { computed, ref } from "vue";
import { z } from "zod";
import { HTTPCode } from "../stores/http-codes.ts";
import {

  ColumnEditorKey,
  EditorMode,

} from "./aas-drawer.ts";

interface AasTableExtensionProps {
  id: string;
  initialData: SubmodelElementListResponseDto;
  pathToList: AasEditorPath;
  aasNamespace: AasNamespace;
  errorHandlingStore: IErrorHandlingStore;
  openDrawer: OpenDrawerCallback<EditorType, "CREATE" | "EDIT">;
  translate: (label: string, ...args: unknown[]) => string;
  selectedLanguage: LanguageType;
  openConfirm: (option: ConfirmationOptions) => void;
}

export type ColumnMenuOptions = TableModificationParamsDto & { addColumnActions?: boolean };
export type RowMenuOptions = TableModificationParamsDto;
type Value = string | null;
type CellContent = { value: Value; contentType: string } | Value;
type Row = Record<string, CellContent>;

export interface CellEditProps {
  data: Row;
  newValue: any;
  field: string;
  index: number;
}

interface Column { idShort: string; label: string; plain: any }
export interface IAasTableExtension {
  columns: ComputedRef<Column[]>;
  rows: ComputedRef<Row[]>;
  columnMenu: Ref<MenuItem[]>;
  rowMenu: Ref<MenuItem[]>;
  buildColumnMenu: (options: ColumnMenuOptions) => void;
  buildRowMenu: (options: RowMenuOptions) => void;
  onCellEditComplete: (event: CellEditProps) => Promise<void>;
  formatCellValue: (value: string, column: Column) => Value;
}

export function useAasTableExtension({
  id,
  pathToList,
  initialData,
  aasNamespace,
  errorHandlingStore,
  openDrawer,
  translate,
  selectedLanguage,
  openConfirm,
}: AasTableExtensionProps): IAasTableExtension {
  const translatePrefix = "aasEditor";
  const translateTablePrefix = `${translatePrefix}.table`;
  const columnMenu = ref<MenuItem[]>([]);
  const rowMenu = ref<MenuItem[]>([]);
  const data = ref<SubmodelElementListResponseDto>(initialData);

  function buildColumnMenuItem(
    fieldLabel: string,
    icon: string,
    options: TableModificationParamsDto,
    type: typeof AasSubmodelElements.File | typeof AasSubmodelElements.Property,
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
    const callback = type === AasSubmodelElements.Property
      ? async (data: PropertyRequestDto) =>
        createColumn({ modelType: type, ...data }, options)
      : async (data: FileRequestDto) => createColumn({ modelType: type, ...data }, options);

    return {
      label: fieldLabel,
      icon,
      command: (_event: MenuItemCommandEvent) => {
        openDrawer({
          type: ColumnEditorKey,
          data: valueType
            ? { valueType, modelType: type }
            : { modelType: type, contentType: "application/octet-stream" },
          mode: EditorMode.CREATE,
          title: addColumLabel,
          path: pathToList,
          callback,
        });
      },
    };
  }

  const columns = computed<Column[]>((): Column[] => {
    if (data.value.value.length > 0) {
      return SubmodelElementCollectionJsonSchema.parse(data.value.value[0]).value.map(v => ({
        idShort: v.idShort,
        label: v.displayName.find(d => d.language === selectedLanguage)?.text ?? v.idShort,
        plain: v,
      }));
    }
    return [];
  });

  const rows = computed<Row[]>((): Row[] => {
    return data.value.value.map(row =>
      SubmodelElementCollectionJsonSchema.parse(row).value.reduce((acc, v) => ({ ...acc, [v.idShort]: v.contentType ? { value: v.value, contentType: v.contentType } : v.value }), {}),
    );
  });

  async function onCellEditComplete(
    event: CellEditProps,
  ) {
    const { data: rowData, newValue, field, index: editedRowIndex } = event;
    const ValueSchema = z.string().min(1);
    const ValueParser = newValue.contentType ? z.object({ contentType: z.string(), value: ValueSchema }) : ValueSchema;

    const parsedNewValue = ValueParser.safeParse(newValue);
    if (parsedNewValue.success && rowData[field] !== parsedNewValue.data) {
      const modifications = rows.value.map((row, index) =>
        index === editedRowIndex
          ? { ...row, [field]: parsedNewValue.data }
          : row,
      );
      const response = await aasNamespace.modifyValueOfSubmodelElement(
        id,
        pathToList.submodelId!,
        pathToList.idShortPath!,
        modifications,
      );

      data.value = SubmodelElementListJsonSchema.parse(response.data);
    }
  }

  function updateListData(newListData: SubmodelElementListResponseDto) {
    data.value = newListData;
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
        label: translate(`${translateTablePrefix}.addRow`),
        icon: "pi pi-arrow-up",
        command: async () => {
          await addRow(options);
        },
      },
      {
        label: translate(`${translateTablePrefix}.addRow`),
        icon: "pi pi-arrow-down",
        command: async () => {
          await addRow({
            position: options.position !== undefined ? options.position + 1 : 0,
          });
        },
      },
      removeRowMenuItem(options.position ?? 0),
    ];
  };

  function removeRowMenuItem(rowIndex: number) {
    const removeLabel = translate("common.remove");
    const cancelLabel = translate("common.cancel");
    const removeRowApiCall = async () => {
      const response = await aasNamespace.deleteRowFromSubmodelElementList(
        id,
        pathToList.submodelId!,
        pathToList.idShortPath!,
        getRowIdShortAtIndexOrFail(rowIndex),
      );
      if (response.status === HTTPCode.OK) {
        updateListData(response.data);
      }
    };
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
            await errorHandlingStore.withErrorHandlingAsync(removeRowApiCall, {
              message: translate(`${translateTablePrefix}.errorRemoveRow`),
            });
          },
        });
      },
    };
  }

  async function addRow({ position = 0 }: RowMenuOptions) {
    const addRowApiCall = async () => {
      const response = await aasNamespace.addRowToSubmodelElementList(
        id,
        pathToList.submodelId!,
        pathToList.idShortPath!,
        { position },
      );
      if (response.status === HTTPCode.CREATED) {
        updateListData(response.data);
      }
    };
    await errorHandlingStore.withErrorHandlingAsync(addRowApiCall, {
      message: translate(`${translateTablePrefix}.errorAddRow`),
    });
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
    ];
    columnMenu.value
      = options.addColumnActions
        ? [{
            label: translate(`${translateTablePrefix}.addColumn`),
            items: colMenuItems,
          }]
        : colMenuItems;

    if (options.addColumnActions) {
      errorHandlingStore.withErrorHandlingSync(
        () => {
          const column = getColumnAtIndexOrFail(options.position ?? 0);
          columnMenu.value.push({
            label: translate("common.actions"),
            items: [modifyColumnMenuItem(column), removeColumnMenuItem(column)],
          });
        },
        { message: translate(`common.errorOccurred`) },
      );
    }
  };

  function modifyColumnMenuItem(column: Column) {
    return {
      label: translate(`common.edit`),
      icon: "pi pi-pencil",
      command: (_event: MenuItemCommandEvent) => {
        openDrawer({
          type: ColumnEditorKey,
          data: column.plain,
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
    const removeColumnApiCall = async () => {
      const response = await aasNamespace.deleteColumnFromSubmodelElementList(id, pathToList.submodelId!, pathToList.idShortPath!, column.idShort);
      if (response.status === HTTPCode.OK) {
        updateListData(response.data);
      }
    };
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
            await errorHandlingStore.withErrorHandlingAsync(
              removeColumnApiCall,
              { message: translate(`${translateTablePrefix}.errorRemoveColumn`) },
            );
          },
        });
      },
    };
  }

  async function modifyPropertyColumn(data: SubmodelElementModificationDto, column: Column) {
    const errorMessage = translate(`${translatePrefix}.table.errorEditColumn`);
    await errorHandlingStore.withErrorHandlingAsync(
      async () => {
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
      },
      { message: errorMessage },
    );
  }

  async function createColumn(
    data: SubmodelElementSharedRequestDto,
    options: TableModificationParamsDto,
  ) {
    const errorMessage = translate(`${translatePrefix}.table.errorAddColumn`);
    await errorHandlingStore.withErrorHandlingAsync(
      async () => {
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
      },
      {
        message: errorMessage,
      },
    );
  }

  async function navigateBackToListView(path: AasEditorPath, newListData: SubmodelElementListEditorProps) {
    const formItemLabel = translate(`${translatePrefix}.submodelElementList`);
    const callback = async (data: any) => {
      await aasNamespace.modifySubmodelElement(id, path.submodelId!, path.idShortPath!, data);
    };
    openDrawer({
      type: KeyTypes.SubmodelElementList,
      data: newListData,
      mode: EditorMode.EDIT,
      title: translate(`${translatePrefix}.edit`, { formItem: formItemLabel }),
      path,
      callback,
    });
  }

  function formatCellValue(value: string, column: Column) {
    switch (column.plain.valueType) {
      case DataTypeDef.Double:
        return new Intl.NumberFormat(selectedLanguage, {
          style: "decimal",
        }).format(Number(value));
      default:
        return value;
    }
  }

  return {
    rows,
    columns,
    columnMenu,
    rowMenu,
    formatCellValue,
    buildColumnMenu,
    buildRowMenu,
    onCellEditComplete,
  };
}
