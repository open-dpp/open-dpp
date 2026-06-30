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
  ValueRequestDto,
} from "@open-dpp/dto";
import {
  AasSubmodelElements,
  DataTypeDef,
  KeyTypes,
  Language,
  SubmodelElementCollectionJsonSchema,
  SubmodelElementListJsonSchema,
  SubmodelElementSchema,
  ValueSchema,
} from "@open-dpp/dto";
import type { ConfirmationOptions } from "primevue/confirmationoptions";
import type { MenuItem, MenuItemCommandEvent } from "primevue/menuitem";
import type { Ref } from "vue";
import { computed, ref, toRaw } from "vue";
import type { IErrorHandlingStore } from "../stores/error.handling.ts";
import type {
  AasEditorPath,
  EditorType,
  OpenDrawerCallback,
  SubmodelElementListEditorProps,
} from "./aas-drawer.ts";
import { ColumnEditorKey, EditorMode } from "./aas-drawer.ts";
import { match, P } from "ts-pattern";
import { HTTPCode } from "../stores/http-codes.ts";
import { formatPropertyValue } from "../lib/property-value.ts";

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

export type ColumnMenuOptions = TableModificationParamsDto & {
  addColumnActions?: boolean;
  /** Set when the menu is opened for the group's own spanning header cell. */
  isGroupHeader?: boolean;
  /** Parent group idShort when operating on a sub-column or group header. */
  groupIdShort?: string;
};
export type RowMenuOptions = TableModificationParamsDto;
type Value = string | null;
/**
 * Flat row: top-level columns use their idShort as key; sub-columns inside a
 * group use the compound key `${groupIdShort}__${subColIdShort}`.
 * No nested objects — PrimeVue DataTable cannot handle them in its value prop.
 */
type Row = Record<string, Value>;

export interface CellEditProps {
  data: Row;
  newValue: Value;
  field: string;
  index: number;
}

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

type RowContext = Record<string, any>;

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
  resolveField: (data: Row, field: string) => Value;
  setField: (data: Row, field: string, value: Value) => void;
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
  const ValueMatcher = P.optional(P.union(P.string, null));

  const rows = ref<Row[]>([]);
  const rowsContext = ref<RowContext[]>([]);
  const columns = ref<Column[]>([]);

  const flatColumns = computed<FlatColumn[]>(() =>
    columns.value.flatMap((col) =>
      col.children
        ? col.children.map((subCol) => ({
            ...subCol,
            field: `${col.idShort}__${subCol.idShort}`,
            groupIdShort: col.idShort,
          }))
        : [{ ...col, field: col.idShort }],
    ),
  );

  const hasGroups = computed(() => columns.value.some((col) => col.children !== undefined));

  function resolveField(rowData: Row, field: string): Value {
    return rowData[field] ?? null;
  }

  function setField(rowData: Row, field: string, value: Value): void {
    rowData[field] = value;
  }

  function buildColumnLabel(displayName: any[], idShort: string): string {
    return displayName?.find((d: any) => d.language === selectedLanguage)?.text ?? idShort;
  }

  function buildColumnTypeMenuItem(
    fieldLabel: string,
    icon: string,
    options: TableModificationParamsDto,
    type:
      | typeof AasSubmodelElements.File
      | typeof AasSubmodelElements.Property
      | typeof AasSubmodelElements.SubmodelElementCollection,
    valueType?: DataTypeDefType,
    groupIdShort?: string,
  ) {
    const addColumnLabel = translate(`${translateTablePrefix}.addFieldAsColumn`, {
      field: selectedLanguage === Language.de ? fieldLabel : fieldLabel.toLowerCase(),
    });
    const labelIconAndDisableOption = {
      label: fieldLabel,
      icon,
      disabled: disableColumnCreation,
    };
    const sharedDrawerProps = {
      mode: EditorMode.CREATE,
      title: addColumnLabel,
      path: pathToList,
    };

    const createFn = groupIdShort
      ? (colData: SubmodelElementSharedRequestDto) => addColumnToGroup(groupIdShort, colData, options)
      : (colData: SubmodelElementSharedRequestDto) => createColumn(colData, options);

    return match({ type, valueType })
      .with({ type: AasSubmodelElements.SubmodelElementCollection }, ({ type }) => ({
        ...labelIconAndDisableOption,
        command: (_event: MenuItemCommandEvent) => {
          openDrawer({
            ...sharedDrawerProps,
            type: ColumnEditorKey,
            data: { modelType: type },
            callback: async (colData: any) =>
              createFn({ modelType: type, ...colData }),
          });
        },
      }))
      .with({ type: AasSubmodelElements.File }, ({ type }) => ({
        ...labelIconAndDisableOption,
        command: (_event: MenuItemCommandEvent) => {
          openDrawer({
            ...sharedDrawerProps,
            type: ColumnEditorKey,
            data: { modelType: type, contentType: "application/octet-stream" },
            callback: async (colData: FileRequestDto) =>
              createFn({ modelType: type, ...colData }),
          });
        },
      }))
      .with({ type: AasSubmodelElements.Property, valueType: P.string }, ({ type, valueType }) => ({
        ...labelIconAndDisableOption,
        command: (_event: MenuItemCommandEvent) => {
          openDrawer({
            ...sharedDrawerProps,
            type: ColumnEditorKey,
            data: { modelType: type, valueType },
            callback: async (colData: PropertyRequestDto) =>
              createFn({ modelType: type, ...colData }),
          });
        },
      }))
      .run();
  }

  function buildAllColumnTypeMenuItems(
    icon: string,
    options: TableModificationParamsDto,
    groupIdShort?: string,
  ): MenuItem[] {
    return [
      buildColumnTypeMenuItem(
        translate(`${translatePrefix}.textField`),
        icon,
        options,
        AasSubmodelElements.Property,
        DataTypeDef.String,
        groupIdShort,
      ),
      buildColumnTypeMenuItem(
        translate(`${translatePrefix}.numberField`),
        icon,
        options,
        AasSubmodelElements.Property,
        DataTypeDef.Double,
        groupIdShort,
      ),
      buildColumnTypeMenuItem(
        translate(`${translatePrefix}.booleanField`),
        icon,
        options,
        AasSubmodelElements.Property,
        DataTypeDef.Boolean,
        groupIdShort,
      ),
      buildColumnTypeMenuItem(
        translate(`${translatePrefix}.dateField`),
        icon,
        options,
        AasSubmodelElements.Property,
        DataTypeDef.Date,
        groupIdShort,
      ),
      buildColumnTypeMenuItem(
        translate(`${translatePrefix}.dateTimeField`),
        icon,
        options,
        AasSubmodelElements.Property,
        DataTypeDef.DateTime,
        groupIdShort,
      ),
      buildColumnTypeMenuItem(
        translate(`${translatePrefix}.link`),
        icon,
        options,
        AasSubmodelElements.Property,
        DataTypeDef.AnyUri,
        groupIdShort,
      ),
      buildColumnTypeMenuItem(
        translate(`${translatePrefix}.file`),
        icon,
        options,
        AasSubmodelElements.File,
        undefined,
        groupIdShort,
      ),
      ...(!groupIdShort
        ? [
            buildColumnTypeMenuItem(
              translate(`${translatePrefix}.columnGroup`),
              icon,
              options,
              AasSubmodelElements.SubmodelElementCollection,
            ),
          ]
        : []),
    ];
  }

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
    } catch (e) {
      errorHandlingStore.logErrorWithNotification(errorMessage, e);
      return false;
    }
  }

  async function save() {
    await saveRows(rows.value.map(convertRowToRequestDto));
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
      .otherwise(() => null);
  }

  function convertRowToRequestDto(row: Row): ValueRequestDto {
    const rowContext = rowsContext.value.find((r) => r.idShort === row.idShort);
    if (!rowContext) {
      throw new Error(`Row context not found for idShort: ${row.idShort}`);
    }

    // Collect group sub-values separately so we can nest them in the DTO.
    const groups = new Map<string, Record<string, any>>();
    const requestDto: Record<string, any> = {};

    for (const [field, value] of Object.entries(row)) {
      if (field === "idShort") continue;
      const dunderIdx = field.indexOf("__");
      if (dunderIdx !== -1) {
        // Sub-column: key is `${groupIdShort}__${subColIdShort}`
        const groupKey = field.slice(0, dunderIdx);
        const subKey = field.slice(dunderIdx + 2);
        if (!groups.has(groupKey)) groups.set(groupKey, {});
        groups.get(groupKey)![subKey] = convertCell(value, rowContext[field]);
      } else {
        requestDto[field] = convertCell(value, rowContext[field]);
      }
    }

    for (const [groupKey, subValues] of groups) {
      requestDto[groupKey] = subValues;
    }

    return ValueSchema.parse(requestDto);
  }

  async function onCellEditComplete(event: CellEditProps) {
    const { data: rowData, newValue, field, index: editedRowIndex } = event;
    const errorMessage = translate(`${translateTablePrefix}.errorEditEntries`);
    if (resolveField(rowData, field) !== newValue) {
      try {
        const modifications = rows.value.map((row, index) => {
          if (index === editedRowIndex) {
            const updated = { ...row };
            setField(updated, field, newValue);
            return convertRowToRequestDto(updated);
          }
          return convertRowToRequestDto(row);
        });
        if (await saveRows(modifications)) {
          setField(rowData, field, newValue);
        } else {
          errorHandlingStore.logErrorWithNotification(errorMessage);
        }
      } catch (e) {
        errorHandlingStore.logErrorWithNotification(errorMessage, e);
      }
    }
  }

  function convertDataToColumns(newData: SubmodelElementListResponseDto) {
    if (newData.value.length > 0) {
      const headerRow = SubmodelElementCollectionJsonSchema.parse(newData.value[0]);
      for (const [index, col] of headerRow.value.entries()) {
        const isGroup = col.modelType === AasSubmodelElements.SubmodelElementCollection;
        const children: Column[] | undefined = isGroup
          ? ((col.value as any[]) ?? []).map((subCol: any) => ({
              idShort: subCol.idShort,
              label: buildColumnLabel(subCol.displayName, subCol.idShort),
              plain: subCol,
            }))
          : undefined;

        const column: Column = {
          idShort: col.idShort,
          label: buildColumnLabel(col.displayName, col.idShort),
          plain: col,
          children,
        };

        const foundColumn = columns.value.find((c) => c.idShort === col.idShort);
        if (!foundColumn) {
          columns.value.splice(index, 0, column);
        } else {
          if (foundColumn.label !== column.label) foundColumn.label = column.label;
          foundColumn.plain = column.plain;
          foundColumn.children = children;
        }
      }
    }
    return [];
  }

  function convertDataToRows(newData: SubmodelElementListResponseDto) {
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

    for (const [index, row] of newData.value.entries()) {
      const parsedRow = SubmodelElementCollectionJsonSchema.parse(row);
      const foundRow = rows.value.find((r) => r.idShort === row.idShort);
      const foundRowContext = rowsContext.value.find((r) => r.idShort === row.idShort);
      const rowToModify: Row = foundRow || { idShort: row.idShort };
      const rowContextToModify: RowContext = foundRowContext || { idShort: row.idShort };

      // Build the set of valid flat keys for this row from the new data.
      // Group sub-columns use compound key: `${groupIdShort}__${subColIdShort}`.
      const validFlatKeys = new Set<string>();
      for (const col of parsedRow.value) {
        if (col.modelType === AasSubmodelElements.SubmodelElementCollection) {
          for (const subCol of (col.value as any[]) ?? []) {
            validFlatKeys.add(`${col.idShort}__${subCol.idShort}`);
          }
        } else {
          validFlatKeys.add(col.idShort);
        }
      }

      // Remove stale keys no longer present in the updated data.
      for (const key of Object.keys(rowToModify)) {
        if (key !== "idShort" && !validFlatKeys.has(key)) {
          delete rowToModify[key];
          delete rowContextToModify[key];
        }
      }

      // Populate flat keys from the response.
      for (const col of parsedRow.value) {
        if (col.modelType === AasSubmodelElements.SubmodelElementCollection) {
          for (const subCol of (col.value as any[]) ?? []) {
            const flatKey = `${col.idShort}__${subCol.idShort}`;
            const { value, context } = convertLeafColumn(subCol);
            rowToModify[flatKey] = value;
            rowContextToModify[flatKey] = context;
          }
        } else {
          const { value, context } = convertLeafColumn(col);
          rowToModify[col.idShort] = value;
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

  function getSubColumnAtIndexOrFail(groupIdShort: string, index: number): Column {
    const group = columns.value.find((c) => c.idShort === groupIdShort);
    const subCol = group?.children?.[index];
    if (!subCol) {
      throw new Error(`Sub-column at index ${index} in group "${groupIdShort}" not found`);
    }
    return subCol;
  }

  function getRowIdShortAtIndexOrFail(index: number): string {
    const row = data.value.value[index];
    if (!row) {
      throw new Error(`Row with index ${index} not found`);
    }
    return row.idShort;
  }

  function getGroupColumns(): Column[] {
    return columns.value.filter((col) => col.children !== undefined);
  }

  const buildRowMenu = (options: RowMenuOptions) => {
    rowMenu.value = [
      {
        label: translate(`${translateTablePrefix}.addRowAbove`),
        icon: "pi pi-arrow-up",
        command: async () => {
          await addRow(options);
        },
        disabled: disableRowCreation,
      },
      {
        label: translate(`${translateTablePrefix}.addRowBelow`),
        icon: "pi pi-arrow-down",
        command: async () => {
          await addRow({
            position: options.position !== undefined ? options.position + 1 : rows.value.length,
          });
        },
        disabled: disableRowCreation,
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
      disabled: disableRowDeletion,
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
              const response = await aasNamespace.deleteRowFromSubmodelElementList(
                id,
                pathToList.submodelId!,
                pathToList.idShortPath!,
                getRowIdShortAtIndexOrFail(rowIndex),
              );
              if (response.status === HTTPCode.OK) {
                data.value = response.data;
                rows.value.splice(rowIndex, 1);
                rowsContext.value.splice(rowIndex, 1);
              }
            } catch (e) {
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
      } else {
        errorHandlingStore.logErrorWithNotification(errorMessage);
      }
    } catch (e) {
      errorHandlingStore.logErrorWithNotification(errorMessage, e);
    }
  }

  function modifyColumnMenuItem(column: Column) {
    return {
      label: translate(`common.edit`),
      icon: "pi pi-pencil",
      disabled: disableColumnEditing,
      command: (_event: MenuItemCommandEvent) => {
        openDrawer({
          type: ColumnEditorKey,
          data: toRaw(column.plain),
          mode: EditorMode.EDIT,
          title: translate(`${translatePrefix}.table.editColumn`),
          path: pathToList,
          callback: async (data: SubmodelElementModificationDto) =>
            modifyTopLevelColumn(data, column),
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
      disabled: disableColumnDeletion,
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
              const response = await aasNamespace.deleteColumnFromSubmodelElementList(
                id,
                pathToList.submodelId!,
                pathToList.idShortPath!,
                column.idShort,
              );
              if (response.status === HTTPCode.OK) {
                columns.value.splice(
                  columns.value.findIndex((c) => c.idShort === column.idShort),
                  1,
                );
                updateListData(response.data);
              }
            } catch (e) {
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

  function moveToGroupMenuItem(column: Column): MenuItem {
    const label = translate(`${translateTablePrefix}.moveToGroup`);
    const groups = getGroupColumns();

    if (groups.length === 0) {
      return {
        label,
        icon: "pi pi-objects-column",
        disabled: true,
        tooltip: translate(`${translateTablePrefix}.noGroupsAvailable`),
      };
    }

    return {
      label,
      icon: "pi pi-objects-column",
      disabled: disableColumnEditing,
      items: groups.map((group) => ({
        label: group.label,
        command: async () => {
          await moveColumnToGroup(column, group.idShort);
        },
      })),
    };
  }

  function modifySubColumnMenuItem(groupIdShort: string, subColumn: Column): MenuItem {
    return {
      label: translate(`common.edit`),
      icon: "pi pi-pencil",
      disabled: disableColumnEditing,
      command: (_event: MenuItemCommandEvent) => {
        openDrawer({
          type: ColumnEditorKey,
          data: toRaw(subColumn.plain),
          mode: EditorMode.EDIT,
          title: translate(`${translatePrefix}.table.editColumn`),
          path: pathToList,
          callback: async (formData: SubmodelElementModificationDto) =>
            modifyColumnInGroup(groupIdShort, subColumn, formData),
        });
      },
    };
  }

  function removeFromGroupMenuItem(groupIdShort: string, subColumn: Column): MenuItem {
    const removeLabel = translate(`${translateTablePrefix}.removeFromGroup`);
    const cancelLabel = translate("common.cancel");
    return {
      label: removeLabel,
      icon: "pi pi-sign-out",
      disabled: disableColumnDeletion,
      command: async () => {
        openConfirm({
          message: translate(`${translateTablePrefix}.removeFromGroupConfirm`),
          header: removeLabel,
          icon: "pi pi-info-circle",
          rejectLabel: cancelLabel,
          rejectProps: { label: cancelLabel, severity: "secondary", outlined: true },
          acceptProps: { label: removeLabel, severity: "danger" },
          accept: async () => {
            await deleteColumnFromGroup(groupIdShort, subColumn);
          },
        });
      },
    };
  }

  const buildColumnMenu = (options: ColumnMenuOptions) => {
    if (options.isGroupHeader && options.groupIdShort) {
      buildGroupHeaderMenu(options);
    } else if (options.groupIdShort && options.addColumnActions) {
      buildSubColumnMenu(options);
    } else {
      buildTopLevelColumnMenu(options);
    }
  };

  function buildTopLevelColumnMenu(options: ColumnMenuOptions) {
    const icon = `pi pi-arrow-${options.addColumnActions ? "left" : "right"}`;
    const colMenuItems = buildAllColumnTypeMenuItems(icon, options);

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
          items: [modifyColumnMenuItem(column), removeColumnMenuItem(column), moveToGroupMenuItem(column)],
        });
      } catch (e) {
        errorHandlingStore.logErrorWithNotification(translate(`common.errorOccurred`), e);
      }
    }
  }

  function buildGroupHeaderMenu(options: ColumnMenuOptions) {
    const groupIdShort = options.groupIdShort!;
    const groupColumn = columns.value.find((c) => c.idShort === groupIdShort);
    if (!groupColumn) {
      errorHandlingStore.logErrorWithNotification(translate("common.errorOccurred"));
      return;
    }

    const subColPosition = groupColumn.children?.length ?? 0;
    const subColMenuItems = buildAllColumnTypeMenuItems("pi pi-arrow-right", { position: subColPosition }, groupIdShort);

    columnMenu.value = [
      {
        label: translate(`${translateTablePrefix}.addSubColumn`),
        items: subColMenuItems,
      },
      {
        label: translate("common.actions"),
        items: [modifyColumnMenuItem(groupColumn), removeColumnMenuItem(groupColumn)],
      },
    ];
  }

  function buildSubColumnMenu(options: ColumnMenuOptions) {
    const { groupIdShort, position } = options;
    try {
      const subColumn = getSubColumnAtIndexOrFail(groupIdShort!, position ?? 0);
      columnMenu.value = [
        {
          label: translate("common.actions"),
          items: [
            modifySubColumnMenuItem(groupIdShort!, subColumn),
            removeFromGroupMenuItem(groupIdShort!, subColumn),
          ],
        },
      ];
    } catch (e) {
      errorHandlingStore.logErrorWithNotification(translate("common.errorOccurred"), e);
    }
  }

  async function modifyTopLevelColumn(formData: SubmodelElementModificationDto, column: Column) {
    const errorMessage = translate(`${translatePrefix}.table.errorEditColumn`);
    try {
      const response = await aasNamespace.modifyColumnOfSubmodelElementList(
        id,
        pathToList.submodelId!,
        pathToList.idShortPath!,
        column.idShort,
        formData,
      );
      if (response.status === HTTPCode.OK) {
        await navigateBackToListView(
          pathToList,
          SubmodelElementListJsonSchema.parse(response.data),
        );
      } else {
        errorHandlingStore.logErrorWithNotification(errorMessage);
      }
    } catch (e) {
      errorHandlingStore.logErrorWithNotification(errorMessage, e);
    }
  }

  async function modifyColumnInGroup(
    groupIdShort: string,
    subColumn: Column,
    formData: SubmodelElementModificationDto,
  ) {
    const errorMessage = translate(`${translatePrefix}.table.errorEditColumn`);
    try {
      const response = await aasNamespace.modifyColumnInGroupOfSubmodelElementList(
        id,
        pathToList.submodelId!,
        pathToList.idShortPath!,
        groupIdShort,
        subColumn.idShort,
        formData,
      );
      if (response.status === HTTPCode.OK) {
        await navigateBackToListView(
          pathToList,
          SubmodelElementListJsonSchema.parse(response.data),
        );
      } else {
        errorHandlingStore.logErrorWithNotification(errorMessage);
      }
    } catch (e) {
      errorHandlingStore.logErrorWithNotification(errorMessage, e);
    }
  }

  async function deleteColumnFromGroup(groupIdShort: string, subColumn: Column) {
    const errorMessage = translate(`${translateTablePrefix}.errorRemoveColumn`);
    try {
      const response = await aasNamespace.deleteColumnFromGroupInSubmodelElementList(
        id,
        pathToList.submodelId!,
        pathToList.idShortPath!,
        groupIdShort,
        subColumn.idShort,
      );
      if (response.status === HTTPCode.OK) {
        const group = columns.value.find((c) => c.idShort === groupIdShort);
        if (group?.children) {
          group.children = group.children.filter((c) => c.idShort !== subColumn.idShort);
        }
        updateListData(response.data);
      }
    } catch (e) {
      errorHandlingStore.logErrorWithNotification(errorMessage, e);
    }
  }

  async function moveColumnToGroup(column: Column, groupIdShort: string) {
    const errorMessage = translate(`${translateTablePrefix}.errorMoveColumn`);
    try {
      const response = await aasNamespace.moveColumnToGroupInSubmodelElementList(
        id,
        pathToList.submodelId!,
        pathToList.idShortPath!,
        groupIdShort,
        column.idShort,
      );
      if (response.status === HTTPCode.OK) {
        await navigateBackToListView(
          pathToList,
          SubmodelElementListJsonSchema.parse(response.data),
        );
      } else {
        errorHandlingStore.logErrorWithNotification(errorMessage);
      }
    } catch (e) {
      errorHandlingStore.logErrorWithNotification(errorMessage, e);
    }
  }

  async function createColumn(
    colData: SubmodelElementSharedRequestDto,
    options: TableModificationParamsDto,
  ) {
    const errorMessage = translate(`${translatePrefix}.table.errorAddColumn`);
    try {
      const requestBody = SubmodelElementSchema.parse({ ...colData });
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
      } else {
        errorHandlingStore.logErrorWithNotification(errorMessage);
      }
    } catch (e) {
      errorHandlingStore.logErrorWithNotification(errorMessage, e);
    }
  }

  async function addColumnToGroup(
    groupIdShort: string,
    colData: SubmodelElementSharedRequestDto,
    options: TableModificationParamsDto,
  ) {
    const errorMessage = translate(`${translatePrefix}.table.errorAddColumn`);
    try {
      const requestBody = SubmodelElementSchema.parse({ ...colData });
      const response = await aasNamespace.addColumnToGroupInSubmodelElementList(
        id,
        pathToList.submodelId!,
        pathToList.idShortPath!,
        groupIdShort,
        requestBody,
        options,
      );
      if (response.status === HTTPCode.CREATED) {
        await navigateBackToListView(
          pathToList,
          SubmodelElementListJsonSchema.parse(response.data),
        );
      } else {
        errorHandlingStore.logErrorWithNotification(errorMessage);
      }
    } catch (e) {
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
    return formatPropertyValue(value, column.plain.valueType, selectedLanguage, timezone);
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
    flatColumns,
    hasGroups,
    columnMenu,
    rowMenu,
    formatCellValue,
    resolveField,
    setField,
    save,
    buildColumnMenu,
    buildRowMenu,
    onCellEditComplete,
  };
}
