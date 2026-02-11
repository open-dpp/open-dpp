import type { ConfirmationOptions } from "primevue/confirmationoptions";
import type { MenuItemCommandEvent } from "primevue/menuitem";
import {
  AasSubmodelElements,
  DataTypeDef,
  Language,
  SubmodelElementListJsonSchema,
  SubmodelElementSchema,
} from "@open-dpp/dto";
import { waitFor } from "@testing-library/vue";
import { expect, it, vi } from "vitest";
import ColumnCreateEditor from "../components/aas/ColumnCreateEditor.vue";
import ColumnEditor from "../components/aas/ColumnEditor.vue";
import SubmodelElementListEditor from "../components/aas/SubmodelElementListEditor.vue";
import apiClient from "../lib/api-client.ts";
import { HTTPCode } from "../stores/http-codes.ts";
import { generatedErrorHandlingStoreMock } from "../testing-utils/error-handling-store-mock.ts";
import { useAasDrawer } from "./aas-drawer.ts";
import { useAasTableExtension } from "./aas-table-extension.ts";

const mocks = vi.hoisted(() => {
  return {
    createSubmodel: vi.fn(),
    addColumnToSubmodelElementList: vi.fn(),
    addRowToSubmodelElementList: vi.fn(),
    deleteColumnFromSubmodelElementList: vi.fn(),
    deleteRowFromSubmodelElementList: vi.fn(),
    modifyColumnOfSubmodelElementList: vi.fn(),
    modifyValueOfSubmodelElement: vi.fn(),
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

  const aasId = "1";
  const cols = [
    { idShort: "Column1", valueType: DataTypeDef.String, modelType: AasSubmodelElements.Property, displayName: [{ language: "en", text: "Material" }] },
    { idShort: "Column2", valueType: DataTypeDef.Double, modelType: AasSubmodelElements.Property, displayName: [{ language: "en", text: "Amount in percentage" }] },
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
        value: [...cols],
      },
    ],
  });

  it("should compute columns", async () => {
    const mockOnHideDrawer = vi.fn();
    const mockOpenConfirmDialog = vi.fn();

    const { openDrawer } = useAasDrawer({ onHideDrawer: mockOnHideDrawer });
    const pathToList = { submodelId: "s1", idShortPath: "Path.To.List" };
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
    });

    expect(columns.value).toEqual([
      { idShort: "Column1", label: "Material", plain: SubmodelElementSchema.parse(cols[0]) },
      { idShort: "Column2", label: "Amount in percentage", plain: SubmodelElementSchema.parse(cols[1]) },
    ]);
  });

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
  ])("should formatCellValue $value", async ({ value, column, expected }) => {
    const mockOnHideDrawer = vi.fn();
    const mockOpenConfirmDialog = vi.fn();

    const { openDrawer } = useAasDrawer({ onHideDrawer: mockOnHideDrawer });
    const pathToList = { submodelId: "s1", idShortPath: "Path.To.List" };
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
    });
    expect(formatCellValue(value, column)).toBe(expected);
  });

  it("should compute rows", async () => {
    const mockOnHideDrawer = vi.fn();
    const mockOpenConfirmDialog = vi.fn();
    const initialData = SubmodelElementListJsonSchema.parse({
      ...submodelElementList,
      value: [
        ...submodelElementList.value,
        {
          idShort: "row2",
          modelType: AasSubmodelElements.SubmodelElementCollection,
          value: [{ ...cols[0], value: "Wood" }, { ...cols[1], value: "80" }],
        },
      ],
    });
    const { openDrawer } = useAasDrawer({ onHideDrawer: mockOnHideDrawer });
    const pathToList = { submodelId: "s1", idShortPath: "Path.To.List" };
    const { rows } = useAasTableExtension({
      id: aasId,
      pathToList,
      initialData,
      aasNamespace: apiClient.dpp.templates.aas,
      openConfirm: mockOpenConfirmDialog,
      errorHandlingStore,
      translate,
      selectedLanguage: Language.en,
      openDrawer,
    });

    expect(rows.value).toEqual([
      { Column1: undefined, Column2: undefined },
      { Column1: undefined, Column2: undefined },
      { Column1: "Wood", Column2: "80" },
    ]);
  });

  it.each([
    {
      label: "aasEditor.textField",
      component: ColumnCreateEditor,
      data: { valueType: DataTypeDef.String },
    },
    {
      label: "aasEditor.numberField",
      component: ColumnCreateEditor,
      data: { valueType: DataTypeDef.Double },
    },
  ])("should add $label column", async ({ label, component, data }) => {
    const mockOnHideDrawer = vi.fn();
    const mockOpenConfirmDialog = vi.fn();

    const { openDrawer, editorVNode, drawerVisible } = useAasDrawer({
      onHideDrawer: mockOnHideDrawer,
    });
    const pathToList = { submodelId: "s1", idShortPath: "Path.To.List" };
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
    });
    buildColumnMenu({ position: 1 });
    const textFieldColumn = columnMenu.value.find(e => e.label === label)!;
    textFieldColumn.command!({} as MenuItemCommandEvent);
    expect(drawerVisible.value).toBeTruthy();
    expect(editorVNode.value!.props.path).toEqual(pathToList);
    expect(editorVNode.value!.component).toEqual(component);
    expect(editorVNode.value!.props.data).toEqual({
      modelType: AasSubmodelElements.Property,
      ...data,
    });

    const columnData = { idShort: "column 3", ...data };

    const submodelElementListModified = {
      ...submodelElementList,
      value: submodelElementList.value.map((row: any) => ({
        ...row,
        value: [
          ...row.value,
          { ...columnData, modelType: AasSubmodelElements.Property },
        ],
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
        modelType: AasSubmodelElements.Property,
      }),
      { position: 1 },
    );

    // navigates back to list view after adding a column
    expect(drawerVisible.value).toBeTruthy();
    expect(editorVNode.value!.props.path).toEqual(pathToList);
    expect(editorVNode.value!.component).toEqual(SubmodelElementListEditor);
    expect(editorVNode.value!.props.data).toEqual(
      SubmodelElementListJsonSchema.parse(submodelElementListModified),
    );
  });

  it("should modify cell", async () => {
    const mockOnHideDrawer = vi.fn();
    const mockOpenConfirmDialog = vi.fn();

    const { openDrawer } = useAasDrawer({ onHideDrawer: mockOnHideDrawer });
    const pathToList = { submodelId: "s1", idShortPath: "Path.To.List" };
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

    mocks.modifyValueOfSubmodelElement.mockResolvedValue(
      {
        data: submodelElementListModified,
        status: HTTPCode.OK,
      },
    );

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
      [rows.value[0], { Column2: undefined, Column1: "My material" }],
    );
  });

  it("should modify column", async () => {
    const mockOnHideDrawer = vi.fn();
    const mockOpenConfirmDialog = vi.fn();

    const { openDrawer, editorVNode, drawerVisible } = useAasDrawer({ onHideDrawer: mockOnHideDrawer });
    const pathToList = { submodelId: "s1", idShortPath: "Path.To.List" };
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
    });
    buildColumnMenu({ position: 1, addColumnActions: true });
    const editMenuItem = columnMenu.value.find(c => c.label === "common.actions")!.items!.find(e => e.label === "common.edit")!;
    editMenuItem.command!({} as MenuItemCommandEvent);
    expect(drawerVisible.value).toBeTruthy();
    expect(editorVNode.value!.props.path).toEqual(pathToList);
    expect(editorVNode.value!.component).toEqual(ColumnEditor);
    expect(editorVNode.value!.props.data).toEqual(SubmodelElementSchema.parse(cols[1]));

    const columnData = { ...cols[1], displayName: [{ language: "en", text: "Modified Amount in percentage" }] };

    const submodelElementListModified = {
      ...submodelElementList,
      value: submodelElementList.value.map(row => ({
        ...row,
        value: [cols[0], columnData],
      })),
    };

    mocks.modifyColumnOfSubmodelElementList.mockResolvedValue({ data: submodelElementListModified, status: HTTPCode.OK });

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
    expect(editorVNode.value!.props.data).toEqual(SubmodelElementListJsonSchema.parse(submodelElementListModified));
  });

  it("should delete column", async () => {
    const mockOnHideDrawer = vi.fn();
    const openAutoConfirm = async (data: ConfirmationOptions) => {
      data.accept!();
    };

    const { openDrawer } = useAasDrawer({ onHideDrawer: mockOnHideDrawer });
    const pathToList = { submodelId: "s1", idShortPath: "Path.To.List" };
    const { columnMenu, buildColumnMenu, columns } = useAasTableExtension({
      id: aasId,
      pathToList,
      initialData: submodelElementList,
      aasNamespace: apiClient.dpp.templates.aas,
      errorHandlingStore,
      openConfirm: openAutoConfirm,
      selectedLanguage: Language.en,
      translate,
      openDrawer,
    });
    buildColumnMenu({ position: 1, addColumnActions: true });

    const removeColumnButton = columnMenu.value.find(c => c.label === "common.actions")!.items!.find(e => e.label === "common.remove")!;

    mocks.deleteColumnFromSubmodelElementList.mockResolvedValue({
      status: HTTPCode.OK,
      data: {
        ...submodelElementList,
        value: submodelElementList.value.map(
          row => ({
            ...row,
            value: cols.filter(col => col.idShort !== "Column2"),
          }),
        ),
      },
    });
    removeColumnButton.command!({} as MenuItemCommandEvent);

    expect(mocks.deleteColumnFromSubmodelElementList).toHaveBeenCalledWith(
      aasId,
      pathToList.submodelId,
      pathToList.idShortPath,
      "Column2",
    );
    await waitFor(() => expect(columns.value).toEqual([
      { idShort: "Column1", label: "Material", plain: SubmodelElementSchema.parse(cols[0]) },
    ]));
  });

  it("should delete row", async () => {
    const mockOnHideDrawer = vi.fn();
    const openAutoConfirm = async (data: ConfirmationOptions) => {
      data.accept!();
    };

    const { openDrawer } = useAasDrawer({ onHideDrawer: mockOnHideDrawer });
    const pathToList = { submodelId: "s1", idShortPath: "Path.To.List" };
    const { rowMenu, buildRowMenu, rows } = useAasTableExtension({
      id: aasId,
      pathToList,
      initialData: submodelElementList,
      aasNamespace: apiClient.dpp.templates.aas,
      errorHandlingStore,
      openConfirm: openAutoConfirm,
      selectedLanguage: Language.en,
      translate,
      openDrawer,
    });
    buildRowMenu({ position: 1 });

    const removeRowButton = rowMenu.value
      .find(e => e.label === "common.remove")!;

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
          Column1: undefined,
          Column2: undefined,
        },
      ]),
    );
  });

  it("should add row", async () => {
    const mockOnHideDrawer = vi.fn();
    const openConfirm = vi.fn();
    const { openDrawer } = useAasDrawer({ onHideDrawer: mockOnHideDrawer });
    const pathToList = { submodelId: "s1", idShortPath: "Path.To.List" };
    const { rowMenu, buildRowMenu, rows } = useAasTableExtension({
      id: aasId,
      pathToList,
      initialData: submodelElementList,
      aasNamespace: apiClient.dpp.templates.aas,
      errorHandlingStore,
      openConfirm,
      selectedLanguage: Language.en,
      translate,
      openDrawer,
    });
    buildRowMenu({ position: 1 });

    const addRowButton = rowMenu.value
      .find(e => e.label === "aasEditor.table.addRow")!;

    mocks.addRowToSubmodelElementList.mockResolvedValue({
      status: HTTPCode.CREATED,
      data: {
        ...submodelElementList,
        value: [
          ...submodelElementList.value,
          {
            idShort: "new row",
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
          Column1: undefined,
          Column2: undefined,
        },
        {
          Column1: undefined,
          Column2: undefined,
        },
        {
          Column1: undefined,
          Column2: undefined,
        },
      ]),
    );
  });
});
