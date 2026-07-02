import type {
  DataTypeDefType,
  FileRequestDto,
  LanguageType,
  PropertyRequestDto,
  SubmodelElementModificationDto,
  SubmodelElementSharedRequestDto,
  TableModificationParamsDto,
} from "@open-dpp/dto";
import { AasSubmodelElements, DataTypeDef, Language } from "@open-dpp/dto";
import type { ConfirmationOptions } from "primevue/confirmationoptions";
import type { MenuItem, MenuItemCommandEvent } from "primevue/menuitem";
import { match, P } from "ts-pattern";
import { toRaw } from "vue";
import type { IErrorHandlingStore } from "../../stores/error.handling.ts";
import type { AasEditorPath, EditorType, OpenDrawerCallback } from "../../composables/aas-drawer.ts";
import { ColumnEditorKey, EditorMode } from "../../composables/aas-drawer.ts";
import { isGroupColumn, type Column } from "./columns.ts";

const translatePrefix = "aasEditor";
const translateTablePrefix = `${translatePrefix}.table`;

export type ColumnMenuOptions = TableModificationParamsDto & {
  addColumnActions?: boolean;
  /** Set when the menu is opened for the group's own spanning header cell. */
  isGroupHeader?: boolean;
  /** Parent group idShort when operating on a sub-column or group header. */
  groupIdShort?: string;
};
export type RowMenuOptions = TableModificationParamsDto;

export interface TableMenuDeps {
  translate: (label: string, ...args: unknown[]) => string;
  openDrawer: OpenDrawerCallback<EditorType, "CREATE" | "EDIT">;
  openConfirm: (option: ConfirmationOptions) => void;
  pathToList: AasEditorPath;
  selectedLanguage: LanguageType;
  errorHandlingStore: IErrorHandlingStore;
  disableRowCreation?: boolean;
  disableRowDeletion?: boolean;
  disableColumnCreation?: boolean;
  disableColumnDeletion?: boolean;
  disableColumnEditing?: boolean;
  onCreateColumn: (
    colData: SubmodelElementSharedRequestDto,
    options: TableModificationParamsDto,
  ) => Promise<void>;
  onAddColumnToGroup: (
    groupIdShort: string,
    colData: SubmodelElementSharedRequestDto,
    options: TableModificationParamsDto,
  ) => Promise<void>;
  onModifyTopLevelColumn: (formData: SubmodelElementModificationDto, column: Column) => Promise<void>;
  onModifyColumnInGroup: (
    groupIdShort: string,
    subColumn: Column,
    formData: SubmodelElementModificationDto,
  ) => Promise<void>;
  onRemoveColumn: (column: Column) => Promise<void>;
  onDeleteColumnFromGroup: (groupIdShort: string, subColumn: Column) => Promise<void>;
  onMoveColumnToGroup: (column: Column, groupIdShort: string) => Promise<void>;
  onAddRow: (options: RowMenuOptions) => Promise<void>;
  onRemoveRow: (rowIndex: number) => Promise<void>;
}

function getColumnAtIndexOrFail(columns: Column[], index: number): Column {
  const column = columns[index];
  if (!column) {
    throw new Error(`Column with index ${index} not found`);
  }
  return column;
}

function getSubColumnAtIndexOrFail(columns: Column[], groupIdShort: string, index: number): Column {
  const group = columns.find((c) => c.idShort === groupIdShort);
  const subCol = group?.children?.[index];
  if (!subCol) {
    throw new Error(`Sub-column at index ${index} in group "${groupIdShort}" not found`);
  }
  return subCol;
}

function getGroupColumns(columns: Column[]): Column[] {
  return columns.filter(isGroupColumn);
}

function buildColumnTypeMenuItem(
  fieldLabel: string,
  icon: string,
  options: TableModificationParamsDto,
  type:
    | typeof AasSubmodelElements.File
    | typeof AasSubmodelElements.Property
    | typeof AasSubmodelElements.SubmodelElementCollection,
  deps: TableMenuDeps,
  valueType?: DataTypeDefType,
  groupIdShort?: string,
) {
  const { translate, openDrawer, pathToList, selectedLanguage, disableColumnCreation } = deps;
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
    ? (colData: SubmodelElementSharedRequestDto) =>
        deps.onAddColumnToGroup(groupIdShort, colData, options)
    : (colData: SubmodelElementSharedRequestDto) => deps.onCreateColumn(colData, options);

  return match({ type, valueType })
    .with({ type: AasSubmodelElements.SubmodelElementCollection }, ({ type }) => ({
      ...labelIconAndDisableOption,
      command: (_event: MenuItemCommandEvent) => {
        openDrawer({
          ...sharedDrawerProps,
          type: ColumnEditorKey,
          data: { modelType: type },
          callback: async (colData: any) => createFn({ modelType: type, ...colData }),
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
          callback: async (colData: FileRequestDto) => createFn({ modelType: type, ...colData }),
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
          callback: async (colData: PropertyRequestDto) => createFn({ modelType: type, ...colData }),
        });
      },
    }))
    .run();
}

function buildAllColumnTypeMenuItems(
  icon: string,
  options: TableModificationParamsDto,
  deps: TableMenuDeps,
  groupIdShort?: string,
): MenuItem[] {
  const { translate } = deps;
  return [
    buildColumnTypeMenuItem(
      translate(`${translatePrefix}.textField`),
      icon,
      options,
      AasSubmodelElements.Property,
      deps,
      DataTypeDef.String,
      groupIdShort,
    ),
    buildColumnTypeMenuItem(
      translate(`${translatePrefix}.numberField`),
      icon,
      options,
      AasSubmodelElements.Property,
      deps,
      DataTypeDef.Double,
      groupIdShort,
    ),
    buildColumnTypeMenuItem(
      translate(`${translatePrefix}.booleanField`),
      icon,
      options,
      AasSubmodelElements.Property,
      deps,
      DataTypeDef.Boolean,
      groupIdShort,
    ),
    buildColumnTypeMenuItem(
      translate(`${translatePrefix}.dateField`),
      icon,
      options,
      AasSubmodelElements.Property,
      deps,
      DataTypeDef.Date,
      groupIdShort,
    ),
    buildColumnTypeMenuItem(
      translate(`${translatePrefix}.dateTimeField`),
      icon,
      options,
      AasSubmodelElements.Property,
      deps,
      DataTypeDef.DateTime,
      groupIdShort,
    ),
    buildColumnTypeMenuItem(
      translate(`${translatePrefix}.link`),
      icon,
      options,
      AasSubmodelElements.Property,
      deps,
      DataTypeDef.AnyUri,
      groupIdShort,
    ),
    buildColumnTypeMenuItem(
      translate(`${translatePrefix}.file`),
      icon,
      options,
      AasSubmodelElements.File,
      deps,
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
            deps,
          ),
        ]
      : []),
  ];
}

function modifyColumnMenuItem(column: Column, deps: TableMenuDeps) {
  const { translate, openDrawer, pathToList, disableColumnEditing } = deps;
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
          deps.onModifyTopLevelColumn(data, column),
      });
    },
  };
}

function removeColumnMenuItem(column: Column, deps: TableMenuDeps) {
  const { translate, openConfirm, disableColumnDeletion } = deps;
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
          await deps.onRemoveColumn(column);
        },
      });
    },
  };
}

function moveToGroupMenuItem(deps: TableMenuDeps): MenuItem {
  const { translate } = deps;
  return {
    label: translate(`${translateTablePrefix}.moveToGroup`),
    icon: "pi pi-objects-column",
    disabled: true,
    tooltip: translate(`${translateTablePrefix}.noGroupsAvailable`),
  };
}

function modifySubColumnMenuItem(groupIdShort: string, subColumn: Column, deps: TableMenuDeps): MenuItem {
  const { translate, openDrawer, pathToList, disableColumnEditing } = deps;
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
          deps.onModifyColumnInGroup(groupIdShort, subColumn, formData),
      });
    },
  };
}

function removeFromGroupMenuItem(groupIdShort: string, subColumn: Column, deps: TableMenuDeps): MenuItem {
  const { translate, openConfirm, disableColumnDeletion } = deps;
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
          await deps.onDeleteColumnFromGroup(groupIdShort, subColumn);
        },
      });
    },
  };
}

function buildTopLevelColumnMenu(options: ColumnMenuOptions, columns: Column[], deps: TableMenuDeps): MenuItem[] {
  const { translate, errorHandlingStore, disableColumnEditing } = deps;
  const icon = `pi pi-arrow-${options.addColumnActions ? "left" : "right"}`;
  const colMenuItems = buildAllColumnTypeMenuItems(icon, options, deps);

  const menu: MenuItem[] = options.addColumnActions
    ? [
        {
          label: translate(`${translateTablePrefix}.addColumnLeft`),
          items: colMenuItems,
        },
      ]
    : colMenuItems;

  if (options.addColumnActions) {
    try {
      const column = getColumnAtIndexOrFail(columns, options.position ?? 0);
      const groups = getGroupColumns(columns);

      const commonActionItems: MenuItem[] = [
        modifyColumnMenuItem(column, deps),
        removeColumnMenuItem(column, deps),
      ];
      if (groups.length === 0) {
        commonActionItems.push(moveToGroupMenuItem(deps));
      }
      menu.push({ label: translate("common.actions"), items: commonActionItems });

      // PrimeVue Menu only supports 2 levels, so group targets live in a
      // separate top-level section rather than nested inside "common.actions".
      if (groups.length > 0) {
        menu.push({
          label: translate(`${translateTablePrefix}.moveToGroup`),
          items: groups.map((group) => ({
            label: group.label,
            icon: "pi pi-objects-column",
            disabled: !!disableColumnEditing,
            command: async () => {
              await deps.onMoveColumnToGroup(column, group.idShort);
            },
          })),
        });
      }
    } catch (e) {
      errorHandlingStore.logErrorWithNotification(translate(`common.errorOccurred`), e);
    }
  }
  return menu;
}

function buildGroupHeaderMenu(
  options: ColumnMenuOptions,
  columns: Column[],
  deps: TableMenuDeps,
): MenuItem[] | undefined {
  const { translate, errorHandlingStore } = deps;
  const groupIdShort = options.groupIdShort!;
  const groupColumn = columns.find((c) => c.idShort === groupIdShort);
  if (!groupColumn) {
    errorHandlingStore.logErrorWithNotification(translate("common.errorOccurred"));
    return undefined;
  }

  const subColPosition = groupColumn.children?.length ?? 0;
  const subColMenuItems = buildAllColumnTypeMenuItems(
    "pi pi-arrow-right",
    { position: subColPosition },
    deps,
    groupIdShort,
  );

  return [
    {
      label: translate(`${translateTablePrefix}.addSubColumn`),
      items: subColMenuItems,
    },
    {
      label: translate("common.actions"),
      items: [modifyColumnMenuItem(groupColumn, deps), removeColumnMenuItem(groupColumn, deps)],
    },
  ];
}

function buildSubColumnMenu(
  options: ColumnMenuOptions,
  columns: Column[],
  deps: TableMenuDeps,
): MenuItem[] | undefined {
  const { translate, errorHandlingStore } = deps;
  const { groupIdShort, position } = options;
  try {
    const subColumn = getSubColumnAtIndexOrFail(columns, groupIdShort!, position ?? 0);
    return [
      {
        label: translate("common.actions"),
        items: [
          modifySubColumnMenuItem(groupIdShort!, subColumn, deps),
          removeFromGroupMenuItem(groupIdShort!, subColumn, deps),
        ],
      },
    ];
  } catch (e) {
    errorHandlingStore.logErrorWithNotification(translate("common.errorOccurred"), e);
    return undefined;
  }
}

/**
 * Returns the menu items to show, or `undefined` when the requested column
 * couldn't be resolved — in that case the caller should leave the previously
 * displayed menu as-is rather than clearing it.
 */
export function buildColumnMenu(
  options: ColumnMenuOptions,
  columns: Column[],
  deps: TableMenuDeps,
): MenuItem[] | undefined {
  if (options.isGroupHeader && options.groupIdShort) {
    return buildGroupHeaderMenu(options, columns, deps);
  }
  if (options.groupIdShort && options.addColumnActions) {
    return buildSubColumnMenu(options, columns, deps);
  }
  return buildTopLevelColumnMenu(options, columns, deps);
}

function removeRowMenuItem(rowIndex: number, deps: TableMenuDeps) {
  const { translate, openConfirm, disableRowDeletion } = deps;
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
          await deps.onRemoveRow(rowIndex);
        },
      });
    },
  };
}

export function buildRowMenu(options: RowMenuOptions, rowsLength: number, deps: TableMenuDeps): MenuItem[] {
  const { translate, disableRowCreation } = deps;
  return [
    {
      label: translate(`${translateTablePrefix}.addRowAbove`),
      icon: "pi pi-arrow-up",
      command: async () => {
        await deps.onAddRow(options);
      },
      disabled: disableRowCreation,
    },
    {
      label: translate(`${translateTablePrefix}.addRowBelow`),
      icon: "pi pi-arrow-down",
      command: async () => {
        await deps.onAddRow({
          position: options.position !== undefined ? options.position + 1 : rowsLength,
        });
      },
      disabled: disableRowCreation,
    },
    removeRowMenuItem(options.position ?? 0, deps),
  ];
}
