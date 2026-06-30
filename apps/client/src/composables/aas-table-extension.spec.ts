import type { ConfirmationOptions } from "primevue/confirmationoptions";
import type { MenuItemCommandEvent } from "primevue/menuitem";
import {
  AasSubmodelElements,
  DataTypeDef,
  KeyTypes,
  Language,
  SubmodelElementListJsonSchema,
  SubmodelElementSchema,
} from "@open-dpp/dto";
import { waitFor } from "@testing-library/vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ColumnCreateEditor from "../components/aas/ColumnCreateEditor.vue";
import ColumnEditor from "../components/aas/ColumnEditor.vue";
import SubmodelElementListEditor from "../components/aas/SubmodelElementListEditor.vue";
import apiClient from "../lib/api-client.ts";
import { HTTPCode } from "../stores/http-codes.ts";
import { generatedErrorHandlingStoreMock } from "../testing-utils/error-handling-store-mock.ts";
import { useAasDrawer } from "./aas-drawer.ts";
import { useAasTableExtension } from "./aas-table-extension.ts";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";

dayjs.extend(localizedFormat);

const mocks = vi.hoisted(() => {
  return {
    createSubmodel: vi.fn(),
    addColumnToSubmodelElementList: vi.fn(),
    addRowToSubmodelElementList: vi.fn(),
    deleteColumnFromSubmodelElementList: vi.fn(),
    deleteRowFromSubmodelElementList: vi.fn(),
    modifyColumnOfSubmodelElementList: vi.fn(),
    modifyValueOfSubmodelElement: vi.fn(),
    addColumnToGroupInSubmodelElementList: vi.fn(),
    modifyColumnInGroupOfSubmodelElementList: vi.fn(),
    deleteColumnFromGroupInSubmodelElementList: vi.fn(),
    moveColumnToGroupInSubmodelElementList: vi.fn(),
  };
});

vi.mock("../lib/api-client", () => ({
  default: {
    setActiveOrganizationId: vi.fn(),
    dpp: {
      templates: {
        aas: {
          createSubmodel: mocks.createSubmodel,
          addColumnToSubmodelElementList: mocks.addColumnToSubmodelElementList,
          addRowToSubmodelElementList: mocks.addRowToSubmodelElementList,
          deleteColumnFromSubmodelElementList: mocks.deleteColumnFromSubmodelElementList,
          deleteRowFromSubmodelElementList: mocks.deleteRowFromSubmodelElementList,
          modifyColumnOfSubmodelElementList: mocks.modifyColumnOfSubmodelElementList,
          modifyValueOfSubmodelElement: mocks.modifyValueOfSubmodelElement,
          addColumnToGroupInSubmodelElementList: mocks.addColumnToGroupInSubmodelElementList,
          modifyColumnInGroupOfSubmodelElementList: mocks.modifyColumnInGroupOfSubmodelElementList,
          deleteColumnFromGroupInSubmodelElementList:
            mocks.deleteColumnFromGroupInSubmodelElementList,
          moveColumnToGroupInSubmodelElementList: mocks.moveColumnToGroupInSubmodelElementList,
        },
      },
    },
  },
}));

describe("aasTableExtension composable", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const translate = (key: string) => key;
  const errorHandlingStore = generatedErrorHandlingStoreMock();
  const callbackOfSubmodelElementListEditor = vi.fn();

  const aasId = "1";
  const cols = [
    {
      idShort: "Column1",
      valueType: DataTypeDef.String,
      modelType: AasSubmodelElements.Property,
      displayName: [{ language: "en", text: "Material" }],
    },
    {
      idShort: "Column2",
      valueType: DataTypeDef.Double,
      modelType: AasSubmodelElements.Property,
      displayName: [{ language: "en", text: "Amount in percentage" }],
    },
    {
      idShort: "Column3",
      modelType: AasSubmodelElements.File,
      contentType: "application/octet-stream",
      displayName: [{ language: "en", text: "File" }],
    },
    {
      idShort: "Column4",
      modelType: AasSubmodelElements.Property,
      displayName: [{ language: "en", text: "Link" }],
      valueType: DataTypeDef.AnyUri,
    },
  ];
  const colsWithValue = [
    {
      ...cols[0],
      value: "Wood",
    },
    {
      ...cols[1],
      value: "50",
    },
    {
      ...cols[2],
      value: "pathToFile",
      contentType: "text/plain",
    },
    {
      ...cols[3],
      value: "https://example.com/my-link",
    },
  ];
  const submodelElementList = SubmodelElementListJsonSchema.parse({
    idShort: "List",
    typeValueListElement: AasSubmodelElements.SubmodelElementCollection,
    value: [
      {
        idShort: "row0",
        modelType: AasSubmodelElements.SubmodelElementCollection,
        value: [...cols],
      },
      {
        idShort: "row1",
        modelType: AasSubmodelElements.SubmodelElementCollection,
        value: [...colsWithValue],
      },
    ],
  });

  it("should init rows correctly", async () => {
    const mockOnHideDrawer = vi.fn();
    const mockOpenConfirmDialog = vi.fn();
    const mockCan = vi.fn();

    const { openDrawer } = useAasDrawer({ onHideDrawer: mockOnHideDrawer, can: mockCan });
    const pathToList = {
      submodelId: "s1",
      idShortPath: "Path.To.List",
      idShortPathIncludingSubmodel: "s1p.Path.To.List",
    };
    const { rows, rowsContext } = useAasTableExtension({
      id: aasId,
      pathToList,
      initialData: submodelElementList,
      aasNamespace: apiClient.dpp.templates.aas,
      openConfirm: mockOpenConfirmDialog,
      errorHandlingStore,
      translate,
      selectedLanguage: Language.en,
      openDrawer,
      callbackOfSubmodelElementListEditor,
    });
    expect(rows.value).toEqual([
      {
        idShort: "row0",
        Column1: null,
        Column2: null,
        Column3: null,
        Column4: null,
      },
      {
        idShort: "row1",
        Column1: "Wood",
        Column2: "50",
        Column3: "pathToFile",
        Column4: "https://example.com/my-link",
      },
    ]);

    expect(rowsContext.value).toEqual([
      {
        idShort: "row0",
        Column1: { modelType: AasSubmodelElements.Property },
        Column2: { modelType: AasSubmodelElements.Property },
        Column3: {
          modelType: AasSubmodelElements.File,
          contentType: "application/octet-stream",
        },
        Column4: { modelType: AasSubmodelElements.Property },
      },
      {
        idShort: "row1",
        Column1: { modelType: AasSubmodelElements.Property },
        Column2: { modelType: AasSubmodelElements.Property },
        Column3: {
          modelType: AasSubmodelElements.File,
          contentType: "text/plain",
        },
        Column4: {
          modelType: AasSubmodelElements.Property,
        },
      },
    ]);
  });

  it("should compute columns", async () => {
    const mockOnHideDrawer = vi.fn();
    const mockOpenConfirmDialog = vi.fn();
    const mockCan = vi.fn();

    const { openDrawer } = useAasDrawer({ onHideDrawer: mockOnHideDrawer, can: mockCan });
    const pathToList = {
      submodelId: "s1",
      idShortPath: "Path.To.List",
      idShortPathIncludingSubmodel: "s1p.Path.To.List",
    };
    const { columns } = useAasTableExtension({
      id: aasId,
      pathToList,
      initialData: submodelElementList,
      aasNamespace: apiClient.dpp.templates.aas,
      openConfirm: mockOpenConfirmDialog,
      errorHandlingStore,
      translate,
      selectedLanguage: Language.en,
      openDrawer,
      callbackOfSubmodelElementListEditor,
    });

    expect(columns.value).toEqual([
      {
        idShort: "Column1",
        label: "Material",
        plain: SubmodelElementSchema.parse(cols[0]),
      },
      {
        idShort: "Column2",
        label: "Amount in percentage",
        plain: SubmodelElementSchema.parse(cols[1]),
      },
      {
        idShort: "Column3",
        label: "File",
        plain: SubmodelElementSchema.parse(cols[2]),
      },
      {
        idShort: "Column4",
        label: "Link",
        plain: SubmodelElementSchema.parse(cols[3]),
      },
    ]);
  });

  const dateCol = {
    idShort: "ColumnDate",
    valueType: DataTypeDef.Date,
    modelType: AasSubmodelElements.Property,
    displayName: [{ language: "en", text: "Produced on" }],
  };
  const dateTimeCol = {
    idShort: "ColumnDateTime",
    valueType: DataTypeDef.DateTime,
    modelType: AasSubmodelElements.Property,
    displayName: [{ language: "en", text: "Produced at" }],
  };

  it.each([
    {
      value: "mein wert",
      column: {
        idShort: "Column1",
        label: "Material",
        plain: SubmodelElementSchema.parse(cols[0]),
      },
      expected: "mein wert",
    },
    {
      value: "9843928.8",
      column: {
        idShort: "Column2",
        label: "Amount in percentage",
        plain: SubmodelElementSchema.parse(cols[1]),
      },
      expected: "9,843,928.8",
    },
    {
      // Date renders as a calendar day with the viewer's zone appended so
      // the UI is symmetric with DateTime rendering.
      value: "2026-04-10",
      column: {
        idShort: "ColumnDate",
        label: "Produced on",
        plain: SubmodelElementSchema.parse(dateCol),
      },
      expected: "04/10/2026 Europe/Berlin",
    },
    {
      // DateTime is stored as ISO-8601 UTC, displayed in the viewer's zone
      // (Europe/Berlin in CI / dev machine), always suffixed with the zone name.
      // 14:00 UTC on 2026-04-10 → 16:00 Europe/Berlin (CEST, +02:00).
      value: "2026-04-10T14:00:00Z",
      column: {
        idShort: "ColumnDateTime",
        label: "Produced at",
        plain: SubmodelElementSchema.parse(dateTimeCol),
      },
      expected: "04/10/2026 4:00 PM Europe/Berlin",
    },
  ])("should formatCellValue $value", async ({ value, column, expected }) => {
    const mockOnHideDrawer = vi.fn();
    const mockOpenConfirmDialog = vi.fn();
    const mockCan = vi.fn();

    const { openDrawer } = useAasDrawer({ onHideDrawer: mockOnHideDrawer, can: mockCan });
    const pathToList = {
      submodelId: "s1",
      idShortPath: "Path.To.List",
      idShortPathIncludingSubmodel: "s1p.Path.To.List",
    };
    const { formatCellValue } = useAasTableExtension({
      id: aasId,
      pathToList,
      initialData: submodelElementList,
      aasNamespace: apiClient.dpp.templates.aas,
      openConfirm: mockOpenConfirmDialog,
      errorHandlingStore,
      translate,
      selectedLanguage: Language.en,
      openDrawer,
      callbackOfSubmodelElementListEditor,
      timezone: "Europe/Berlin",
    });
    expect(formatCellValue(value, column)).toBe(expected);
  });

  it.each([
    {
      label: "aasEditor.textField",
      component: ColumnCreateEditor,
      data: { valueType: DataTypeDef.String },
      modelType: AasSubmodelElements.Property,
    },
    {
      label: "aasEditor.numberField",
      component: ColumnCreateEditor,
      data: { valueType: DataTypeDef.Double },
      modelType: AasSubmodelElements.Property,
    },
    {
      label: "aasEditor.file",
      component: ColumnCreateEditor,
      data: { contentType: "application/octet-stream" },
      modelType: AasSubmodelElements.File,
    },
    {
      label: "aasEditor.link",
      component: ColumnCreateEditor,
      data: { valueType: DataTypeDef.AnyUri },
      modelType: AasSubmodelElements.Property,
    },
  ])("should add $label column", async ({ label, component, data, modelType }) => {
    const mockOnHideDrawer = vi.fn();
    const mockOpenConfirmDialog = vi.fn();
    const mockCan = vi.fn();

    const { openDrawer, editorVNode, drawerVisible } = useAasDrawer({
      onHideDrawer: mockOnHideDrawer,
      can: mockCan,
    });
    const pathToList = {
      submodelId: "s1",
      idShortPath: "Path.To.List",
      idShortPathIncludingSubmodel: "s1p.Path.To.List",
    };
    const { columnMenu, buildColumnMenu } = useAasTableExtension({
      id: aasId,
      pathToList,
      initialData: submodelElementList,
      aasNamespace: apiClient.dpp.templates.aas,
      openConfirm: mockOpenConfirmDialog,
      errorHandlingStore,
      selectedLanguage: Language.en,
      translate,
      openDrawer,
      callbackOfSubmodelElementListEditor,
    });
    buildColumnMenu({ position: 1 });
    const textFieldColumn = columnMenu.value.find((e) => e.label === label)!;
    textFieldColumn.command!({} as MenuItemCommandEvent);
    expect(drawerVisible.value).toBeTruthy();
    expect(editorVNode.value!.props.path).toEqual(pathToList);
    expect(editorVNode.value!.component).toEqual(component);
    await waitFor(() =>
      expect(editorVNode.value!.props.data).toEqual({
        modelType,
        ...data,
      }),
    );

    const columnData = { idShort: "column 3", ...data };

    const submodelElementListModified = {
      ...submodelElementList,
      value: submodelElementList.value.map((row: any) => ({
        ...row,
        value: [...row.value, { ...columnData, modelType }],
      })),
    };

    mocks.addColumnToSubmodelElementList.mockResolvedValue({
      data: submodelElementListModified,
      status: HTTPCode.CREATED,
    });

    await editorVNode.value!.props.callback!(columnData);

    expect(mocks.addColumnToSubmodelElementList).toHaveBeenCalledWith(
      aasId,
      pathToList.submodelId,
      pathToList.idShortPath,
      SubmodelElementSchema.parse({
        ...columnData,
        modelType,
      }),
      { position: 1 },
    );

    // navigates back to list view after adding a column
    expect(drawerVisible.value).toBeTruthy();
    expect(editorVNode.value!.props.path).toEqual(pathToList);
    expect(editorVNode.value!.component).toEqual(SubmodelElementListEditor);
    expect(editorVNode.value!.props.data).toEqual({
      ...SubmodelElementListJsonSchema.parse(submodelElementListModified),
      modelType: KeyTypes.SubmodelElementList,
    });
    expect(editorVNode.value!.props.callback).toEqual(callbackOfSubmodelElementListEditor);
  });

  it("should modify cell", async () => {
    const mockOnHideDrawer = vi.fn();
    const mockOpenConfirmDialog = vi.fn();
    const mockCan = vi.fn();

    const { openDrawer } = useAasDrawer({ onHideDrawer: mockOnHideDrawer, can: mockCan });
    const pathToList = {
      submodelId: "s1",
      idShortPath: "Path.To.List",
      idShortPathIncludingSubmodel: "s1p.Path.To.List",
    };
    const { rows, onCellEditComplete } = useAasTableExtension({
      id: aasId,
      pathToList,
      initialData: submodelElementList,
      aasNamespace: apiClient.dpp.templates.aas,
      openConfirm: mockOpenConfirmDialog,
      errorHandlingStore,
      selectedLanguage: Language.en,
      translate,
      openDrawer,
      callbackOfSubmodelElementListEditor,
    });

    const submodelElementListModified = {
      ...submodelElementList,
      value: [
        submodelElementList.value[0],
        {
          ...submodelElementList.value[1],
          value: [cols[0], { ...cols[1], value: "My material" }],
        },
      ],
    };

    mocks.modifyValueOfSubmodelElement.mockResolvedValue({
      data: submodelElementListModified,
      status: HTTPCode.OK,
    });

    await onCellEditComplete({
      data: { ...rows.value[1]! },
      newValue: "My material",
      field: "Column1",
      index: 1,
    });

    expect(mocks.modifyValueOfSubmodelElement).toHaveBeenCalledWith(
      aasId,
      pathToList.submodelId,
      pathToList.idShortPath,
      [
        {
          Column1: null,
          Column2: null,
          Column3: { contentType: "application/octet-stream", value: null },
          Column4: null,
        },
        {
          Column1: "My material",
          Column2: "50",
          Column3: { contentType: "text/plain", value: "pathToFile" },
          Column4: "https://example.com/my-link",
        },
      ],
    );
  });

  it("should modify column", async () => {
    const mockOnHideDrawer = vi.fn();
    const mockOpenConfirmDialog = vi.fn();
    const mockCan = vi.fn();

    const { openDrawer, editorVNode, drawerVisible } = useAasDrawer({
      onHideDrawer: mockOnHideDrawer,
      can: mockCan,
    });
    const pathToList = {
      submodelId: "s1",
      idShortPath: "Path.To.List",
      idShortPathIncludingSubmodel: "s1p.Path.To.List",
    };
    const { columnMenu, buildColumnMenu } = useAasTableExtension({
      id: aasId,
      pathToList,
      initialData: submodelElementList,
      aasNamespace: apiClient.dpp.templates.aas,
      openConfirm: mockOpenConfirmDialog,
      errorHandlingStore,
      selectedLanguage: Language.en,
      translate,
      openDrawer,
      callbackOfSubmodelElementListEditor,
    });
    buildColumnMenu({ position: 1, addColumnActions: true });
    const editMenuItem = columnMenu.value
      .find((c) => c.label === "common.actions")!
      .items!.find((e) => e.label === "common.edit")!;
    editMenuItem.command!({} as MenuItemCommandEvent);
    expect(drawerVisible.value).toBeTruthy();
    expect(editorVNode.value!.props.path).toEqual(pathToList);
    expect(editorVNode.value!.component).toEqual(ColumnEditor);
    expect(editorVNode.value!.props.data).toEqual(SubmodelElementSchema.parse(cols[1]));

    const columnData = {
      ...cols[1],
      displayName: [{ language: "en", text: "Modified Amount in percentage" }],
    };

    const submodelElementListModified = {
      ...submodelElementList,
      value: submodelElementList.value.map((row) => ({
        ...row,
        value: [cols[0], columnData],
      })),
    };

    mocks.modifyColumnOfSubmodelElementList.mockResolvedValue({
      data: submodelElementListModified,
      status: HTTPCode.OK,
    });

    await editorVNode.value!.props.callback!(columnData);

    expect(mocks.modifyColumnOfSubmodelElementList).toHaveBeenCalledWith(
      aasId,
      pathToList.submodelId,
      pathToList.idShortPath,
      cols[1]!.idShort,
      columnData,
    );

    // navigates back to list view after modifying a column
    expect(drawerVisible.value).toBeTruthy();
    expect(editorVNode.value!.props.path).toEqual(pathToList);
    await waitFor(() => expect(editorVNode.value!.component).toEqual(SubmodelElementListEditor));
    expect(editorVNode.value!.props.data).toEqual({
      ...SubmodelElementListJsonSchema.parse(submodelElementListModified),
      modelType: KeyTypes.SubmodelElementList,
    });
  });

  it("should delete column", async () => {
    const mockOnHideDrawer = vi.fn();
    const openAutoConfirm = async (data: ConfirmationOptions) => {
      data.accept!();
    };
    const mockCan = vi.fn();

    const { openDrawer } = useAasDrawer({ onHideDrawer: mockOnHideDrawer, can: mockCan });
    const pathToList = {
      submodelId: "s1",
      idShortPath: "Path.To.List",
      idShortPathIncludingSubmodel: "s1p.Path.To.List",
    };
    const { columnMenu, rows, rowsContext, buildColumnMenu, columns } = useAasTableExtension({
      id: aasId,
      pathToList,
      initialData: submodelElementList,
      aasNamespace: apiClient.dpp.templates.aas,
      errorHandlingStore,
      openConfirm: openAutoConfirm,
      selectedLanguage: Language.en,
      translate,
      openDrawer,
      callbackOfSubmodelElementListEditor,
    });
    buildColumnMenu({ position: 1, addColumnActions: true });

    const removeColumnButton = columnMenu.value
      .find((c) => c.label === "common.actions")!
      .items!.find((e) => e.label === "common.remove")!;

    const columnToDelete = "Column2";

    mocks.deleteColumnFromSubmodelElementList.mockResolvedValue({
      status: HTTPCode.OK,
      data: {
        ...submodelElementList,
        value: submodelElementList.value.map((row) => ({
          ...row,
          value: cols.filter((col) => col.idShort !== columnToDelete),
        })),
      },
    });

    expect(rows.value.every((r) => Object.hasOwn(r, columnToDelete))).toBeTruthy();
    expect(rowsContext.value.every((r) => Object.hasOwn(r, columnToDelete))).toBeTruthy();

    removeColumnButton.command!({} as MenuItemCommandEvent);

    expect(mocks.deleteColumnFromSubmodelElementList).toHaveBeenCalledWith(
      aasId,
      pathToList.submodelId,
      pathToList.idShortPath,
      columnToDelete,
    );
    await waitFor(() =>
      expect(columns.value).toEqual([
        {
          idShort: "Column1",
          label: "Material",
          plain: SubmodelElementSchema.parse(cols[0]),
        },
        {
          idShort: "Column3",
          label: "File",
          plain: SubmodelElementSchema.parse(cols[2]),
        },
        {
          idShort: "Column4",
          label: "Link",
          plain: SubmodelElementSchema.parse(cols[3]),
        },
      ]),
    );
    expect(rows.value.every((r) => !Object.hasOwn(r, columnToDelete))).toBeTruthy();
    expect(rowsContext.value.every((r) => !Object.hasOwn(r, columnToDelete))).toBeTruthy();
  });

  it("should delete row", async () => {
    const mockOnHideDrawer = vi.fn();
    const openAutoConfirm = async (data: ConfirmationOptions) => {
      data.accept!();
    };
    const mockCan = vi.fn();

    const { openDrawer } = useAasDrawer({ onHideDrawer: mockOnHideDrawer, can: mockCan });
    const pathToList = {
      submodelId: "s1",
      idShortPath: "Path.To.List",
      idShortPathIncludingSubmodel: "s1p.Path.To.List",
    };
    const { rowMenu, buildRowMenu, rows, rowsContext } = useAasTableExtension({
      id: aasId,
      pathToList,
      initialData: submodelElementList,
      aasNamespace: apiClient.dpp.templates.aas,
      errorHandlingStore,
      openConfirm: openAutoConfirm,
      selectedLanguage: Language.en,
      translate,
      openDrawer,
      callbackOfSubmodelElementListEditor,
    });
    buildRowMenu({ position: 1 });

    const removeRowButton = rowMenu.value.find((e) => e.label === "common.remove")!;

    mocks.deleteRowFromSubmodelElementList.mockResolvedValue({
      status: HTTPCode.OK,
      data: {
        ...submodelElementList,
        value: [submodelElementList.value[0]],
      },
    });
    removeRowButton.command!({} as MenuItemCommandEvent);

    expect(mocks.deleteRowFromSubmodelElementList).toHaveBeenCalledWith(
      aasId,
      pathToList.submodelId,
      pathToList.idShortPath,
      "row1",
    );
    await waitFor(() =>
      expect(rows.value).toEqual([
        {
          idShort: "row0",
          Column1: null,
          Column2: null,
          Column3: null,
          Column4: null,
        },
      ]),
    );
    await waitFor(() =>
      expect(rowsContext.value).toEqual([
        {
          idShort: "row0",
          Column1: { modelType: AasSubmodelElements.Property },
          Column2: { modelType: AasSubmodelElements.Property },
          Column3: {
            modelType: AasSubmodelElements.File,
            contentType: "application/octet-stream",
          },
          Column4: { modelType: AasSubmodelElements.Property },
        },
      ]),
    );
  });

  const groupCol = {
    idShort: "Group1",
    modelType: AasSubmodelElements.SubmodelElementCollection,
    displayName: [{ language: "en", text: "Dimensions" }],
    value: [
      {
        idShort: "SubCol1",
        valueType: DataTypeDef.String,
        modelType: AasSubmodelElements.Property,
        displayName: [{ language: "en", text: "Width" }],
      },
      {
        idShort: "SubCol2",
        valueType: DataTypeDef.Double,
        modelType: AasSubmodelElements.Property,
        displayName: [{ language: "en", text: "Height" }],
      },
    ],
  };

  const submodelElementListWithGroup = SubmodelElementListJsonSchema.parse({
    idShort: "List",
    typeValueListElement: AasSubmodelElements.SubmodelElementCollection,
    value: [
      {
        idShort: "row0",
        modelType: AasSubmodelElements.SubmodelElementCollection,
        value: [
          { ...cols[0] },
          {
            ...groupCol,
            value: [
              { ...groupCol.value[0] },
              { ...groupCol.value[1] },
            ],
          },
        ],
      },
      {
        idShort: "row1",
        modelType: AasSubmodelElements.SubmodelElementCollection,
        value: [
          { ...colsWithValue[0] },
          {
            ...groupCol,
            value: [
              { ...groupCol.value[0], value: "120" },
              { ...groupCol.value[1], value: "80" },
            ],
          },
        ],
      },
    ],
  });

  it("should init rows correctly with a group column", async () => {
    const mockOnHideDrawer = vi.fn();
    const mockOpenConfirmDialog = vi.fn();
    const mockCan = vi.fn();

    const { openDrawer } = useAasDrawer({ onHideDrawer: mockOnHideDrawer, can: mockCan });
    const pathToList = {
      submodelId: "s1",
      idShortPath: "Path.To.List",
      idShortPathIncludingSubmodel: "s1p.Path.To.List",
    };
    const { rows, rowsContext } = useAasTableExtension({
      id: aasId,
      pathToList,
      initialData: submodelElementListWithGroup,
      aasNamespace: apiClient.dpp.templates.aas,
      openConfirm: mockOpenConfirmDialog,
      errorHandlingStore,
      translate,
      selectedLanguage: Language.en,
      openDrawer,
      callbackOfSubmodelElementListEditor,
    });

    expect(rows.value).toEqual([
      { idShort: "row0", Column1: null, Group1: { SubCol1: null, SubCol2: null } },
      { idShort: "row1", Column1: "Wood", Group1: { SubCol1: "120", SubCol2: "80" } },
    ]);
    expect(rowsContext.value).toEqual([
      {
        idShort: "row0",
        Column1: { modelType: AasSubmodelElements.Property },
        Group1: {
          SubCol1: { modelType: AasSubmodelElements.Property },
          SubCol2: { modelType: AasSubmodelElements.Property },
        },
      },
      {
        idShort: "row1",
        Column1: { modelType: AasSubmodelElements.Property },
        Group1: {
          SubCol1: { modelType: AasSubmodelElements.Property },
          SubCol2: { modelType: AasSubmodelElements.Property },
        },
      },
    ]);
  });

  it("should compute columns with a group (children)", async () => {
    const mockOnHideDrawer = vi.fn();
    const mockOpenConfirmDialog = vi.fn();
    const mockCan = vi.fn();

    const { openDrawer } = useAasDrawer({ onHideDrawer: mockOnHideDrawer, can: mockCan });
    const pathToList = {
      submodelId: "s1",
      idShortPath: "Path.To.List",
      idShortPathIncludingSubmodel: "s1p.Path.To.List",
    };
    const { columns, flatColumns, hasGroups } = useAasTableExtension({
      id: aasId,
      pathToList,
      initialData: submodelElementListWithGroup,
      aasNamespace: apiClient.dpp.templates.aas,
      openConfirm: mockOpenConfirmDialog,
      errorHandlingStore,
      translate,
      selectedLanguage: Language.en,
      openDrawer,
      callbackOfSubmodelElementListEditor,
    });

    expect(hasGroups.value).toBe(true);
    expect(columns.value).toEqual([
      { idShort: "Column1", label: "Material", plain: SubmodelElementSchema.parse(cols[0]), children: undefined },
      {
        idShort: "Group1",
        label: "Dimensions",
        plain: expect.objectContaining({ idShort: "Group1", modelType: AasSubmodelElements.SubmodelElementCollection }),
        children: [
          { idShort: "SubCol1", label: "Width", plain: expect.objectContaining({ idShort: "SubCol1" }), children: undefined },
          { idShort: "SubCol2", label: "Height", plain: expect.objectContaining({ idShort: "SubCol2" }), children: undefined },
        ],
      },
    ]);
    expect(flatColumns.value).toEqual([
      expect.objectContaining({ idShort: "Column1", field: "Column1" }),
      expect.objectContaining({ idShort: "SubCol1", field: "Group1.SubCol1", groupIdShort: "Group1" }),
      expect.objectContaining({ idShort: "SubCol2", field: "Group1.SubCol2", groupIdShort: "Group1" }),
    ]);
  });

  it("should add a group column type", async () => {
    const mockOnHideDrawer = vi.fn();
    const mockOpenConfirmDialog = vi.fn();
    const mockCan = vi.fn();

    const { openDrawer, editorVNode, drawerVisible } = useAasDrawer({
      onHideDrawer: mockOnHideDrawer,
      can: mockCan,
    });
    const pathToList = {
      submodelId: "s1",
      idShortPath: "Path.To.List",
      idShortPathIncludingSubmodel: "s1p.Path.To.List",
    };
    const { columnMenu, buildColumnMenu } = useAasTableExtension({
      id: aasId,
      pathToList,
      initialData: submodelElementList,
      aasNamespace: apiClient.dpp.templates.aas,
      openConfirm: mockOpenConfirmDialog,
      errorHandlingStore,
      selectedLanguage: Language.en,
      translate,
      openDrawer,
      callbackOfSubmodelElementListEditor,
    });

    buildColumnMenu({ position: 2 });
    const groupItem = columnMenu.value.find((e) => e.label === "aasEditor.columnGroup")!;
    expect(groupItem).toBeDefined();
    groupItem.command!({} as MenuItemCommandEvent);
    expect(drawerVisible.value).toBeTruthy();
    await waitFor(() =>
      expect(editorVNode.value!.props.data).toEqual({
        modelType: AasSubmodelElements.SubmodelElementCollection,
      }),
    );

    const groupColumnData = {
      idShort: "MyGroup",
      modelType: AasSubmodelElements.SubmodelElementCollection,
      displayName: [{ language: "en", text: "My Group" }],
    };
    const submodelElementListWithNewGroup = {
      ...submodelElementList,
      value: submodelElementList.value.map((row: any) => ({
        ...row,
        value: [...row.value, { ...groupColumnData, value: [] }],
      })),
    };

    mocks.addColumnToSubmodelElementList.mockResolvedValue({
      data: submodelElementListWithNewGroup,
      status: HTTPCode.CREATED,
    });

    await editorVNode.value!.props.callback!(groupColumnData);

    expect(mocks.addColumnToSubmodelElementList).toHaveBeenCalledWith(
      aasId,
      pathToList.submodelId,
      pathToList.idShortPath,
      SubmodelElementSchema.parse(groupColumnData),
      { position: 2 },
    );
  });

  it("should add a sub-column to a group via the group header menu", async () => {
    const mockOnHideDrawer = vi.fn();
    const mockOpenConfirmDialog = vi.fn();
    const mockCan = vi.fn();

    const { openDrawer, editorVNode, drawerVisible } = useAasDrawer({
      onHideDrawer: mockOnHideDrawer,
      can: mockCan,
    });
    const pathToList = {
      submodelId: "s1",
      idShortPath: "Path.To.List",
      idShortPathIncludingSubmodel: "s1p.Path.To.List",
    };
    const { columnMenu, buildColumnMenu } = useAasTableExtension({
      id: aasId,
      pathToList,
      initialData: submodelElementListWithGroup,
      aasNamespace: apiClient.dpp.templates.aas,
      openConfirm: mockOpenConfirmDialog,
      errorHandlingStore,
      selectedLanguage: Language.en,
      translate,
      openDrawer,
      callbackOfSubmodelElementListEditor,
    });

    buildColumnMenu({ position: 1, isGroupHeader: true, groupIdShort: "Group1" });
    const addSubColumnSection = columnMenu.value.find(
      (c) => c.label === "aasEditor.table.addSubColumn",
    )!;
    expect(addSubColumnSection).toBeDefined();
    const textItem = addSubColumnSection.items!.find((e) => e.label === "aasEditor.textField")!;
    textItem.command!({} as MenuItemCommandEvent);
    expect(drawerVisible.value).toBeTruthy();
    await waitFor(() =>
      expect(editorVNode.value!.props.data).toEqual({
        modelType: AasSubmodelElements.Property,
        valueType: DataTypeDef.String,
      }),
    );

    const newSubColData = {
      idShort: "SubCol3",
      modelType: AasSubmodelElements.Property,
      valueType: DataTypeDef.String,
      displayName: [{ language: "en", text: "Depth" }],
    };
    const updatedList = {
      ...submodelElementListWithGroup,
      value: submodelElementListWithGroup.value.map((row: any) => ({
        ...row,
        value: row.value.map((col: any) =>
          col.idShort === "Group1"
            ? { ...col, value: [...col.value, newSubColData] }
            : col,
        ),
      })),
    };

    mocks.addColumnToGroupInSubmodelElementList.mockResolvedValue({
      data: updatedList,
      status: HTTPCode.CREATED,
    });

    await editorVNode.value!.props.callback!(newSubColData);

    expect(mocks.addColumnToGroupInSubmodelElementList).toHaveBeenCalledWith(
      aasId,
      pathToList.submodelId,
      pathToList.idShortPath,
      "Group1",
      SubmodelElementSchema.parse(newSubColData),
      { position: 2 },
    );
  });

  it("should modify a sub-column in a group", async () => {
    const mockOnHideDrawer = vi.fn();
    const mockOpenConfirmDialog = vi.fn();
    const mockCan = vi.fn();

    const { openDrawer, editorVNode, drawerVisible } = useAasDrawer({
      onHideDrawer: mockOnHideDrawer,
      can: mockCan,
    });
    const pathToList = {
      submodelId: "s1",
      idShortPath: "Path.To.List",
      idShortPathIncludingSubmodel: "s1p.Path.To.List",
    };
    const { columnMenu, buildColumnMenu } = useAasTableExtension({
      id: aasId,
      pathToList,
      initialData: submodelElementListWithGroup,
      aasNamespace: apiClient.dpp.templates.aas,
      openConfirm: mockOpenConfirmDialog,
      errorHandlingStore,
      selectedLanguage: Language.en,
      translate,
      openDrawer,
      callbackOfSubmodelElementListEditor,
    });

    buildColumnMenu({ position: 0, addColumnActions: true, groupIdShort: "Group1" });
    const editItem = columnMenu.value
      .find((c) => c.label === "common.actions")!
      .items!.find((e) => e.label === "common.edit")!;
    editItem.command!({} as MenuItemCommandEvent);
    expect(drawerVisible.value).toBeTruthy();
    expect(editorVNode.value!.component).toEqual(ColumnEditor);

    const updatedSubColData = {
      ...groupCol.value[0],
      displayName: [{ language: "en", text: "Width (cm)" }],
    };
    const updatedList = {
      ...submodelElementListWithGroup,
      value: submodelElementListWithGroup.value.map((row: any) => ({
        ...row,
        value: row.value.map((col: any) =>
          col.idShort === "Group1"
            ? { ...col, value: [updatedSubColData, col.value[1]] }
            : col,
        ),
      })),
    };

    mocks.modifyColumnInGroupOfSubmodelElementList.mockResolvedValue({
      data: updatedList,
      status: HTTPCode.OK,
    });

    await editorVNode.value!.props.callback!(updatedSubColData);

    expect(mocks.modifyColumnInGroupOfSubmodelElementList).toHaveBeenCalledWith(
      aasId,
      pathToList.submodelId,
      pathToList.idShortPath,
      "Group1",
      "SubCol1",
      updatedSubColData,
    );
    await waitFor(() => expect(editorVNode.value!.component).toEqual(SubmodelElementListEditor));
  });

  it("should remove a sub-column from a group (ungroup)", async () => {
    const mockOnHideDrawer = vi.fn();
    const openAutoConfirm = async (data: ConfirmationOptions) => {
      data.accept!();
    };
    const mockCan = vi.fn();

    const { openDrawer } = useAasDrawer({ onHideDrawer: mockOnHideDrawer, can: mockCan });
    const pathToList = {
      submodelId: "s1",
      idShortPath: "Path.To.List",
      idShortPathIncludingSubmodel: "s1p.Path.To.List",
    };
    const { columnMenu, buildColumnMenu, columns } = useAasTableExtension({
      id: aasId,
      pathToList,
      initialData: submodelElementListWithGroup,
      aasNamespace: apiClient.dpp.templates.aas,
      openConfirm: openAutoConfirm,
      errorHandlingStore,
      selectedLanguage: Language.en,
      translate,
      openDrawer,
      callbackOfSubmodelElementListEditor,
    });

    buildColumnMenu({ position: 0, addColumnActions: true, groupIdShort: "Group1" });
    const removeFromGroupItem = columnMenu.value
      .find((c) => c.label === "common.actions")!
      .items!.find((e) => e.label === "aasEditor.table.removeFromGroup")!;

    const updatedList = {
      ...submodelElementListWithGroup,
      value: submodelElementListWithGroup.value.map((row: any) => ({
        ...row,
        value: [
          row.value[0],
          { ...row.value[1], value: [row.value[1].value[1]] },
        ],
      })),
    };

    mocks.deleteColumnFromGroupInSubmodelElementList.mockResolvedValue({
      status: HTTPCode.OK,
      data: updatedList,
    });

    removeFromGroupItem.command!({} as MenuItemCommandEvent);

    expect(mocks.deleteColumnFromGroupInSubmodelElementList).toHaveBeenCalledWith(
      aasId,
      pathToList.submodelId,
      pathToList.idShortPath,
      "Group1",
      "SubCol1",
    );
    await waitFor(() => {
      const group = columns.value.find((c) => c.idShort === "Group1");
      expect(group?.children).toHaveLength(1);
      expect(group?.children![0]!.idShort).toBe("SubCol2");
    });
  });

  it("should move a top-level column into a group", async () => {
    const mockOnHideDrawer = vi.fn();
    const mockOpenConfirmDialog = vi.fn();
    const mockCan = vi.fn();

    const { openDrawer } = useAasDrawer({
      onHideDrawer: mockOnHideDrawer,
      can: mockCan,
    });
    const pathToList = {
      submodelId: "s1",
      idShortPath: "Path.To.List",
      idShortPathIncludingSubmodel: "s1p.Path.To.List",
    };
    const { columnMenu, buildColumnMenu, columns, rows } = useAasTableExtension({
      id: aasId,
      pathToList,
      initialData: submodelElementListWithGroup,
      aasNamespace: apiClient.dpp.templates.aas,
      openConfirm: mockOpenConfirmDialog,
      errorHandlingStore,
      selectedLanguage: Language.en,
      translate,
      openDrawer,
      callbackOfSubmodelElementListEditor,
    });

    buildColumnMenu({ position: 0, addColumnActions: true });
    // When groups exist, group targets are rendered as a separate top-level section
    // (PrimeVue Menu only supports 2 levels — nesting inside "common.actions" would break clicks)
    const moveToGroupSection = columnMenu.value
      .find((c) => c.label === "aasEditor.table.moveToGroup")!;

    expect(moveToGroupSection.items).toHaveLength(1);
    const firstGroupItem = moveToGroupSection.items![0]!;
    expect(firstGroupItem.label).toBe("Dimensions");

    const updatedList = {
      ...submodelElementListWithGroup,
      value: submodelElementListWithGroup.value.map((row: any) => ({
        ...row,
        value: [
          {
            ...row.value[1],
            value: [...row.value[1].value, row.value[0]],
          },
        ],
      })),
    };

    mocks.moveColumnToGroupInSubmodelElementList.mockResolvedValue({
      data: updatedList,
      status: HTTPCode.CREATED,
    });

    await firstGroupItem.command!({} as MenuItemCommandEvent);

    expect(mocks.moveColumnToGroupInSubmodelElementList).toHaveBeenCalledWith(
      aasId,
      pathToList.submodelId,
      pathToList.idShortPath,
      "Group1",
      "Column1",
    );
    // updateListData is called directly so the reactive state reflects the move immediately
    await waitFor(() => {
      expect(columns.value).toHaveLength(1);
      const group = columns.value.find((c) => c.idShort === "Group1");
      expect(group?.children).toHaveLength(3);
      expect(group?.children?.map((c) => c.idShort)).toEqual(["SubCol1", "SubCol2", "Column1"]);
    });
    await waitFor(() => {
      expect(rows.value[0]).toEqual(
        expect.objectContaining({ Group1: { SubCol1: null, SubCol2: null, Column1: null } }),
      );
      expect(rows.value[1]).toEqual(
        expect.objectContaining({ Group1: { SubCol1: "120", SubCol2: "80", Column1: "Wood" } }),
      );
    });
  });

  it("should show move-to-group disabled when no groups exist", () => {
    const mockOnHideDrawer = vi.fn();
    const mockOpenConfirmDialog = vi.fn();
    const mockCan = vi.fn();

    const { openDrawer } = useAasDrawer({ onHideDrawer: mockOnHideDrawer, can: mockCan });
    const pathToList = {
      submodelId: "s1",
      idShortPath: "Path.To.List",
      idShortPathIncludingSubmodel: "s1p.Path.To.List",
    };
    const { columnMenu, buildColumnMenu } = useAasTableExtension({
      id: aasId,
      pathToList,
      initialData: submodelElementList,
      aasNamespace: apiClient.dpp.templates.aas,
      openConfirm: mockOpenConfirmDialog,
      errorHandlingStore,
      selectedLanguage: Language.en,
      translate,
      openDrawer,
      callbackOfSubmodelElementListEditor,
    });

    buildColumnMenu({ position: 0, addColumnActions: true });
    const moveToGroupItem = columnMenu.value
      .find((c) => c.label === "common.actions")!
      .items!.find((e) => e.label === "aasEditor.table.moveToGroup")!;

    expect(moveToGroupItem.disabled).toBe(true);
    expect(moveToGroupItem.items).toBeUndefined();
  });

  it("should modify cell in a group column using dot-notation field", async () => {
    const mockOnHideDrawer = vi.fn();
    const mockOpenConfirmDialog = vi.fn();
    const mockCan = vi.fn();

    const { openDrawer } = useAasDrawer({ onHideDrawer: mockOnHideDrawer, can: mockCan });
    const pathToList = {
      submodelId: "s1",
      idShortPath: "Path.To.List",
      idShortPathIncludingSubmodel: "s1p.Path.To.List",
    };
    const { rows, onCellEditComplete } = useAasTableExtension({
      id: aasId,
      pathToList,
      initialData: submodelElementListWithGroup,
      aasNamespace: apiClient.dpp.templates.aas,
      openConfirm: mockOpenConfirmDialog,
      errorHandlingStore,
      selectedLanguage: Language.en,
      translate,
      openDrawer,
      callbackOfSubmodelElementListEditor,
    });

    mocks.modifyValueOfSubmodelElement.mockResolvedValue({
      data: submodelElementListWithGroup,
      status: HTTPCode.OK,
    });

    await onCellEditComplete({
      data: { ...rows.value[1]! },
      newValue: "200",
      field: "Group1.SubCol1",
      index: 1,
    });

    expect(mocks.modifyValueOfSubmodelElement).toHaveBeenCalledWith(
      aasId,
      pathToList.submodelId,
      pathToList.idShortPath,
      [
        { Column1: null, Group1: { SubCol1: null, SubCol2: null } },
        { Column1: "Wood", Group1: { SubCol1: "200", SubCol2: "80" } },
      ],
    );
  });

  it("should add row", async () => {
    const mockOnHideDrawer = vi.fn();
    const openConfirm = vi.fn();
    const mockCan = vi.fn();

    const { openDrawer } = useAasDrawer({ onHideDrawer: mockOnHideDrawer, can: mockCan });
    const pathToList = {
      submodelId: "s1",
      idShortPath: "Path.To.List",
      idShortPathIncludingSubmodel: "s1p.Path.To.List",
    };
    const { rowMenu, rowsContext, buildRowMenu, rows } = useAasTableExtension({
      id: aasId,
      pathToList,
      initialData: submodelElementList,
      aasNamespace: apiClient.dpp.templates.aas,
      errorHandlingStore,
      openConfirm,
      selectedLanguage: Language.en,
      translate,
      openDrawer,
      callbackOfSubmodelElementListEditor,
    });
    buildRowMenu({ position: 1 });

    const addRowButton = rowMenu.value.find((e) => e.label === "aasEditor.table.addRowAbove")!;

    mocks.addRowToSubmodelElementList.mockResolvedValue({
      status: HTTPCode.CREATED,
      data: {
        ...submodelElementList,
        value: [
          ...submodelElementList.value,
          {
            idShort: "newRow",
            modelType: AasSubmodelElements.SubmodelElementCollection,
            value: [...cols],
          },
        ],
      },
    });
    addRowButton.command!({} as MenuItemCommandEvent);

    expect(mocks.addRowToSubmodelElementList).toHaveBeenCalledWith(
      aasId,
      pathToList.submodelId,
      pathToList.idShortPath,
      { position: 1 },
    );
    await waitFor(() =>
      expect(rows.value).toEqual([
        {
          idShort: "row0",
          Column1: null,
          Column2: null,
          Column3: null,
          Column4: null,
        },
        {
          idShort: "row1",
          Column1: "Wood",
          Column2: "50",
          Column3: "pathToFile",
          Column4: "https://example.com/my-link",
        },
        {
          idShort: "newRow",
          Column1: null,
          Column2: null,
          Column3: null,
          Column4: null,
        },
      ]),
    );

    await waitFor(() =>
      expect(rowsContext.value).toEqual([
        {
          idShort: "row0",
          Column1: { modelType: AasSubmodelElements.Property },
          Column2: { modelType: AasSubmodelElements.Property },
          Column3: {
            modelType: AasSubmodelElements.File,
            contentType: "application/octet-stream",
          },
          Column4: { modelType: AasSubmodelElements.Property },
        },
        {
          idShort: "row1",
          Column1: { modelType: AasSubmodelElements.Property },
          Column2: { modelType: AasSubmodelElements.Property },
          Column3: {
            modelType: AasSubmodelElements.File,
            contentType: "text/plain",
          },
          Column4: {
            modelType: AasSubmodelElements.Property,
          },
        },
        {
          idShort: "newRow",
          Column1: { modelType: AasSubmodelElements.Property },
          Column2: { modelType: AasSubmodelElements.Property },
          Column3: {
            modelType: AasSubmodelElements.File,
            contentType: "application/octet-stream",
          },
          Column4: { modelType: AasSubmodelElements.Property },
        },
      ]),
    );
  });
});
