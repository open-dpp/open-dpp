import type { MenuItemCommandEvent } from "primevue/menuitem";
import {
  AasSubmodelElements,
  DataTypeDef,
  Language,
  SubmodelElementListJsonSchema,
  SubmodelElementSchema,
} from "@open-dpp/dto";
import { HttpStatusCode } from "axios";
import { expect, it, vi } from "vitest";
import PropertyCreateEditor from "../components/aas/PropertyCreateEditor.vue";
import SubmodelElementListEditor from "../components/aas/SubmodelElementListEditor.vue";
import apiClient from "../lib/api-client.ts";
import { useAasDrawer } from "./aas-drawer.ts";
import { useAasTableExtension } from "./aas-table-extension.ts";

const mocks = vi.hoisted(() => {
  return {
    createSubmodel: vi.fn(),
    addColumnToSubmodelElementList: vi.fn(),
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

    const { openDrawer } = useAasDrawer({ onHideDrawer: mockOnHideDrawer });
    const pathToList = { submodelId: "s1", idShortPath: "Path.To.List" };
    const { columns } = useAasTableExtension({
      id: aasId,
      pathToList,
      listData: submodelElementList,
      aasNamespace: apiClient.dpp.templates.aas,
      errorHandlingStore,
      translate,
      selectedLanguage: Language.en,
      openDrawer,
    });

    expect(columns.value).toEqual([
      { idShort: "Column1", label: "Material" },
      { idShort: "Column2", label: "Amount in percentage" },
    ]);
  });

  it("should add column", async () => {
    const mockOnHideDrawer = vi.fn();

    const { openDrawer, editorVNode, drawerVisible } = useAasDrawer({ onHideDrawer: mockOnHideDrawer });
    const pathToList = { submodelId: "s1", idShortPath: "Path.To.List" };
    const { columnsToAdd } = useAasTableExtension({
      id: aasId,
      pathToList,
      listData: submodelElementList,
      aasNamespace: apiClient.dpp.templates.aas,
      errorHandlingStore,
      selectedLanguage: Language.en,
      translate,
      openDrawer,
    });
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
      {},
    );

    // navigates back to list view after adding a column
    expect(drawerVisible.value).toBeTruthy();
    expect(editorVNode.value!.props.path).toEqual(pathToList);
    expect(editorVNode.value!.component).toEqual(SubmodelElementListEditor);
    expect(editorVNode.value!.props.data).toEqual(SubmodelElementListJsonSchema.parse(submodelElementListModified));
  });
});
