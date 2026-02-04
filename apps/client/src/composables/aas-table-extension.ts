import type { AasNamespace } from "@open-dpp/api-client";

import type { DataTypeDefType, LanguageType, PropertyRequestDto, SubmodelElementListResponseDto, TableModificationParamsDto } from "@open-dpp/dto";
import type { DataTableCellEditCompleteEvent } from "primevue";
import type { ConfirmationOptions } from "primevue/confirmationoptions";
import type { MenuItem, MenuItemCommandEvent } from "primevue/menuitem";
import type { ComputedRef, Ref } from "vue";
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
  SubmodelElementCollectionJsonSchema,
  SubmodelElementListJsonSchema,
  SubmodelElementSchema,

} from "@open-dpp/dto";
import { computed, ref } from "vue";
import { HTTPCode } from "../stores/http-codes.ts";
import { EditorMode } from "./aas-drawer.ts";

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

interface Column { idShort: string; label: string; plain: any }
type Row = Record<string, any>;
export interface IAasTableExtension {
  columns: ComputedRef<Column[]>;
  rows: ComputedRef<Row[]>;
  columnMenu: Ref<MenuItem[]>;
  rowMenu: Ref<MenuItem[]>;
  buildColumnMenu: (options: ColumnMenuOptions) => void;
  buildRowMenu: (options: RowMenuOptions) => void;
  onCellEditComplete: (
    event: DataTableCellEditCompleteEvent<any>,
  ) => Promise<void>;
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

  function buildPropertyEntry(fieldLabel: string, icon: string, valueType: DataTypeDefType, options: TableModificationParamsDto) {
    const addColumLabel = translate(`${translateTablePrefix}.addFieldAsColumn`, { field: selectedLanguage === Language.de ? fieldLabel : fieldLabel.toLowerCase() });
    return { label: fieldLabel, icon, command: (_event: MenuItemCommandEvent) => {
      openDrawer({
        type: KeyTypes.Property,
        data: { valueType },
        mode: EditorMode.CREATE,
        title: addColumLabel,
        path: pathToList,
        callback: async (data: PropertyRequestDto) => createPropertyColumn(data, options),
        asColumn: true,
      });
    } };
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
      SubmodelElementCollectionJsonSchema.parse(row).value.reduce((acc, v) => ({ ...acc, [v.idShort]: v.value }), {}),
    );
  });

  async function onCellEditComplete(
    event: DataTableCellEditCompleteEvent<any>,
  ) {
    const { data: rowData, newValue, field } = event;
    if (newValue != null && newValue.trim().length > 0 && rowData[field] !== newValue) {
      rowData[field] = newValue;
      await aasNamespace.modifyValueOfSubmodelElement(
        id,
        pathToList.submodelId!,
        pathToList.idShortPath!,
        rows.value,
      );
    }
    else {
      event.originalEvent.preventDefault();
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
          await addRow({ position: options.position !== undefined ? options.position + 1 : 0 });
        },
      },
    ];
  };

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
    await errorHandlingStore.withErrorHandling(addRowApiCall(), {
      message: translate(`${translateTablePrefix}.errorAddRow`),
    });
  }

  const buildColumnMenu = (options: ColumnMenuOptions) => {
    const colMenuItems = [
      buildPropertyEntry(
        translate(`${translatePrefix}.textField`),
        `pi pi-arrow-${options.addColumnActions ? "left" : "right"}`,
        DataTypeDef.String,
        options,
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
      const column = getColumnAtIndexOrFail(options.position ?? 0);
      columnMenu.value.push(
        {
          label: translate("common.actions"),
          items: [
            modifyColumnMenuItem(column),
            removeColumnMenuItem(column),
          ],
        },
      );
    }
  };

  function modifyColumnMenuItem(column: Column) {
    return {
      label: translate(`common.edit`),
      icon: "pi pi-pencil",
      command: (_event: MenuItemCommandEvent) => {
        openDrawer({
          type: KeyTypes.Property,
          data: column.plain,
          mode: EditorMode.EDIT,
          title: translate(`${translatePrefix}.table.editColumn`),
          path: pathToList,
          callback: async (data: PropertyRequestDto) => modifyPropertyColumn(data, column),
          asColumn: true,
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
            await errorHandlingStore.withErrorHandling(
              removeColumnApiCall(),
              { message: translate(`${translateTablePrefix}.errorRemoveColumn`) },
            );
          },
        });
      },
    };
  }

  async function modifyPropertyColumn(data: PropertyRequestDto, column: Column) {
    const errorMessage = translate(`${translatePrefix}.table.errorEditColumn`);
    const callback = async (data: PropertyRequestDto) => {
      const response = await aasNamespace.modifyColumnOfSubmodelElementList(id, pathToList.submodelId!, pathToList.idShortPath!, column.idShort, data);
      if (response.status === HTTPCode.OK) {
        await navigateBackToListView(pathToList, SubmodelElementListJsonSchema.parse(response.data));
      }
    };
    await errorHandlingStore.withErrorHandling(
      callback(data),
      { message: errorMessage },
    );
  }

  async function createPropertyColumn(data: PropertyRequestDto, options: TableModificationParamsDto) {
    const errorMessage = translate(`${translatePrefix}.table.errorAddColumn`);
    const callback = async (data: PropertyRequestDto) => {
      const requestBody = SubmodelElementSchema.parse({ modelType: AasSubmodelElements.Property, ...data });
      const response = await aasNamespace.addColumnToSubmodelElementList(id, pathToList.submodelId!, pathToList.idShortPath!, requestBody, options);
      if (response.status === HTTPCode.CREATED) {
        await navigateBackToListView(pathToList, SubmodelElementListJsonSchema.parse(response.data));
      }
    };
    await errorHandlingStore.withErrorHandling(
      callback(data),
      { message: errorMessage },
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

  return {
    rows,
    columns,
    columnMenu,
    rowMenu,
    buildColumnMenu,
    buildRowMenu,
    onCellEditComplete,
  };
}
