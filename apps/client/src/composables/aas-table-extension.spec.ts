import type { ConfirmationOptions } from "primevue/confirmationoptions";
import type { MenuItemCommandEvent } from "primevue/menuitem";
import {
  AasSubmodelElements,
  DataTypeDef,
  Language,
  PropertyJsonSchema,
  SubmodelElementListJsonSchema,
  SubmodelElementSchema,
} from "@open-dpp/dto";
import { waitFor } from "@testing-library/vue";
import { HttpStatusCode } from "axios";
import { expect, it, vi } from "vitest";
import PropertyCreateEditor from "../components/aas/PropertyCreateEditor.vue";
import PropertyEditor from "../components/aas/PropertyEditor.vue";
import SubmodelElementListEditor from "../components/aas/SubmodelElementListEditor.vue";
import apiClient from "../lib/api-client.ts";
import { HTTPCode } from "../stores/http-codes.ts";
import { useAasDrawer } from "./aas-drawer.ts";
import { useAasTableExtension } from "./aas-table-extension.ts";

const mocks = vi.hoisted(() => {
  return {
    createSubmodel: vi.fn(),
    addColumnToSubmodelElementList: vi.fn(),
    deleteColumnFromSubmodelElementList: vi.fn(),
    modifyColumnOfSubmodelElementList: vi.fn(),
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
          deleteColumnFromSubmodelElementList: mocks.deleteColumnFromSubmodelElementList,
          modifyColumnOfSubmodelElementList: mocks.modifyColumnOfSubmodelElementList,
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
  const errorHandlingStore = {
    logErrorWithNotification: vi.fn(),
    withErrorHandling: vi.fn(),
  };

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

  it("should add column", async () => {
    const mockOnHideDrawer = vi.fn();
    const mockOpenConfirmDialog = vi.fn();

    const { openDrawer, editorVNode, drawerVisible } = useAasDrawer({ onHideDrawer: mockOnHideDrawer });
    const pathToList = { submodelId: "s1", idShortPath: "Path.To.List" };
    const { columnsToAdd, buildColumnsToAdd } = useAasTableExtension({
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
    buildColumnsToAdd({ position: 1 });
    const textFieldColumn = columnsToAdd.value.find(e => e.label === "aasEditor.textField")!;
    textFieldColumn.command!({} as MenuItemCommandEvent);
    expect(drawerVisible.value).toBeTruthy();
    expect(editorVNode.value!.props.path).toEqual(pathToList);
    expect(editorVNode.value!.component).toEqual(PropertyCreateEditor);
    expect(editorVNode.value!.props.data).toEqual({ valueType: DataTypeDef.String });
    expect(editorVNode.value!.props.asColumn).toBeTruthy();

    const columnData = { idShort: "column 3", valueType: DataTypeDef.String };

    const submodelElementListModified = {
      ...submodelElementList,
      value: [...submodelElementList.value, { ...columnData, modelType: AasSubmodelElements.Property }],
    };

    mocks.addColumnToSubmodelElementList.mockResolvedValue({ data: submodelElementListModified, status: HttpStatusCode.Created });

    await editorVNode.value!.props.callback!(columnData);

    expect(mocks.addColumnToSubmodelElementList).toHaveBeenCalledWith(
      aasId,
      pathToList.submodelId,
      pathToList.idShortPath,
      SubmodelElementSchema.parse({ ...columnData, modelType: AasSubmodelElements.Property }),
      { position: 1 },
    );

    // navigates back to list view after adding a column
    expect(drawerVisible.value).toBeTruthy();
    expect(editorVNode.value!.props.path).toEqual(pathToList);
    expect(editorVNode.value!.component).toEqual(SubmodelElementListEditor);
    expect(editorVNode.value!.props.data).toEqual(SubmodelElementListJsonSchema.parse(submodelElementListModified));
  });

  it("should modify column", async () => {
    const mockOnHideDrawer = vi.fn();
    const mockOpenConfirmDialog = vi.fn();

    const { openDrawer, editorVNode, drawerVisible } = useAasDrawer({ onHideDrawer: mockOnHideDrawer });
    const pathToList = { submodelId: "s1", idShortPath: "Path.To.List" };
    const { columnsToAdd, buildColumnsToAdd } = useAasTableExtension({
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
    buildColumnsToAdd({ position: 1, addColumnActions: true });
    const editMenuItem = columnsToAdd.value.find(c => c.label === "common.actions")!.items!.find(e => e.label === "common.edit")!;
    editMenuItem.command!({} as MenuItemCommandEvent);
    expect(drawerVisible.value).toBeTruthy();
    expect(editorVNode.value!.props.path).toEqual(pathToList);
    expect(editorVNode.value!.component).toEqual(PropertyEditor);
    expect(editorVNode.value!.props.data).toEqual(PropertyJsonSchema.parse(cols[1]));
    expect(editorVNode.value!.props.asColumn).toBeTruthy();

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
    const { columnsToAdd, buildColumnsToAdd, columns } = useAasTableExtension({
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
    buildColumnsToAdd({ position: 1, addColumnActions: true });

    const removeColumnButton = columnsToAdd.value.find(c => c.label === "common.actions")!.items!.find(e => e.label === "common.remove")!;

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
});
