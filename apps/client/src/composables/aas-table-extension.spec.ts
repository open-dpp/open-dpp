import type { MenuItemCommandEvent } from "primevue/menuitem";
import {
  AasSubmodelElements,
  DataTypeDef,
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

  it("should add column", async () => {
    const mockOnHideDrawer = vi.fn();

    const { openDrawer, editorVNode, drawerVisible } = useAasDrawer({ onHideDrawer: mockOnHideDrawer });
    const pathToList = { submodelId: "s1", idShortPath: "Path.To.List" };
    const { columnsToAdd } = useAasTableExtension({
      id: aasId,
      pathToList,
      aasNamespace: apiClient.dpp.templates.aas,
      errorHandlingStore,
      translate,
      openDrawer,
    });
    const textFieldColumn = columnsToAdd.value.find(e => e.label === "aasEditor.textField")!;
    textFieldColumn.command!({} as MenuItemCommandEvent);
    expect(drawerVisible.value).toBeTruthy();
    expect(editorVNode.value!.props.path).toEqual(pathToList);
    expect(editorVNode.value!.component).toEqual(PropertyCreateEditor);
    expect(editorVNode.value!.props.data).toEqual({ valueType: DataTypeDef.String });
    const columnData = { idShort: "newColumn", valueType: DataTypeDef.String };

    const submodelElementList = {
      idShort: "List",
      typeValueListElement: AasSubmodelElements.SubmodelElementCollection,
      value: [{ ...columnData, modelType: AasSubmodelElements.Property }],
    };

    mocks.addColumnToSubmodelElementList.mockResolvedValue({ data: submodelElementList, status: HttpStatusCode.Created });

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
    expect(editorVNode.value!.props.data).toEqual(SubmodelElementListJsonSchema.parse(submodelElementList));
  });
});
