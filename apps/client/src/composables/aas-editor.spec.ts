import type { SubmodelResponseDto } from "@open-dpp/dto";
import type { MenuItem, MenuItemCommandEvent } from "primevue/menuitem";
import { DataTypeDef, KeyTypes, Language } from "@open-dpp/dto";
import {
  submodelCarbonFootprintPlainFactory,
  submodelDesignOfProductPlainFactory,
  submodelPlainToResponse,
} from "@open-dpp/testing";
import { omit } from "lodash";
import { v4 as uuid4 } from "uuid";
import { expect, it, vi } from "vitest";
import PropertyCreateEditor from "../components/aas/PropertyCreateEditor.vue";
import SubmodelCreateEditor from "../components/aas/SubmodelCreateEditor.vue";
import SubmodelEditor from "../components/aas/SubmodelEditor.vue";
import SubmodelElementCollectionEditor from "../components/aas/SubmodelElementCollectionEditor.vue";
import apiClient from "../lib/api-client.ts";
import { HTTPCode } from "../stores/http-codes.ts";
import { useAasEditor } from "./aas-editor.ts";

const mocks = vi.hoisted(() => {
  return {
    createSubmodel: vi.fn(),
    createSubmodelElement: vi.fn(),
    getSubmodels: vi.fn(),
  };
});

vi.mock("../lib/api-client", () => ({
  default: {
    setActiveOrganizationId: vi.fn(),
    dpp: {
      templates: {
        aas: {
          createSubmodel: mocks.createSubmodel,
          getSubmodels: mocks.getSubmodels,
          createSubmodelElement: mocks.createSubmodelElement,
        },
      },
    },
  },
}));

describe("aasEditor composable", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  const changeQueryParams = vi.fn();
  const errorHandlingStore = {
    logErrorWithNotification: vi.fn(),
  };

  const aasId = "1";
  const iriDomain = `https://open-dpp.de/${uuid4()}`;
  const submodel1: SubmodelResponseDto = submodelPlainToResponse(
    submodelDesignOfProductPlainFactory.transient({ iriDomain }).build(),
  );
  const submodel2: SubmodelResponseDto = submodelPlainToResponse(
    submodelCarbonFootprintPlainFactory.transient({ iriDomain }).build(),
  );
  const selectedLanguage = Language.en;
  it("should initialize submodels", async () => {
    const response = { paging_metadata: { cursor: null }, result: [submodel1, submodel2] };
    mocks.getSubmodels.mockResolvedValue({
      data: response,
    });

    const { init, submodels } = useAasEditor({
      id: aasId,
      aasNamespace: apiClient.dpp.templates.aas,
      changeQueryParams,
      errorHandlingStore,
      selectedLanguage,
    });
    await init();
    expect(mocks.getSubmodels).toHaveBeenCalledWith(aasId, {
      cursor: undefined,
      limit: 10,
    });
    expect(changeQueryParams).toHaveBeenCalledWith({ cursor: undefined });
    const expectedSubmodel1TreeNodes = {
      key: `${submodel1.id}`,
      data: {
        idShort: submodel1.idShort,
        modelType: KeyTypes.Submodel,
        plain: omit(submodel1, "submodelElements"),
        path: { submodelId: submodel1.id },
      },
      children: [
        {
          key: `${submodel1.idShort}.Design_V01`,
          data: {
            idShort: "Design_V01",
            modelType: "SubmodelElementCollection",
            path: { submodelId: submodel1.id, idShortPath: `${submodel1.idShort}.Design_V01` },
            plain: submodel1.submodelElements[0],
          },
        },
      ],
    };
    const expectedSubmodel2TreeNodes = {
      key: `${submodel2.id}`,
      data: {
        idShort: submodel2.idShort,
        modelType: KeyTypes.Submodel,
        plain: omit(submodel2, "submodelElements"),
        path: { submodelId: submodel2.id },
      },
      children: [
        {
          key: `${submodel2.idShort}.ProductCarbonFootprint_A1A3`,
          data: {
            idShort: "ProductCarbonFootprint_A1A3",
            modelType: "SubmodelElementCollection",
            path: { submodelId: submodel2.id, idShortPath: `${submodel2.idShort}.ProductCarbonFootprint_A1A3` },
            plain: submodel2.submodelElements[0],
          },
        },
        {
          key: `${submodel2.idShort}.ProductCarbonFootprint_A4`,
          data: {
            idShort: "ProductCarbonFootprint_A4",
            modelType: "SubmodelElementCollection",
            path: { submodelId: submodel2.id, idShortPath: `${submodel2.idShort}.ProductCarbonFootprint_A4` },
            plain: submodel2.submodelElements[1],
          },
        },
        {
          key: `${submodel2.idShort}.ProductCarbonFootprint_B5`,
          data: {
            idShort: "ProductCarbonFootprint_B5",
            modelType: "SubmodelElementCollection",
            path: { submodelId: submodel2.id, idShortPath: `${submodel2.idShort}.ProductCarbonFootprint_B5` },
            plain: submodel2.submodelElements[2],
          },
        },
      ],
    };

    expect(submodels.value).toEqual([
      expectedSubmodel1TreeNodes,
      expectedSubmodel2TreeNodes,
    ]);
  });

  it.each([
    { keyToSelect: submodel2.id, expected: { path: { submodelId: submodel2.id }, component: SubmodelEditor } },
    {
      keyToSelect: `${submodel2.idShort}.ProductCarbonFootprint_A4`,
      expected: { path: { submodelId: submodel2.id, idShortPath: `${submodel2.idShort}.ProductCarbonFootprint_A4` }, component: SubmodelElementCollectionEditor },
    },
  ])("should select node $keyToSelect", async ({ keyToSelect, expected }) => {
    const response = { paging_metadata: { cursor: null }, result: [submodel1, submodel2] };
    mocks.getSubmodels.mockResolvedValue({
      data: response,
    });

    const { init, selectTreeNode, selectedKeys, editorVNode } = useAasEditor({
      id: aasId,
      aasNamespace: apiClient.dpp.templates.aas,
      changeQueryParams,
      errorHandlingStore,
      selectedLanguage,
    });
    await init();
    selectTreeNode(keyToSelect);
    expect(changeQueryParams).toHaveBeenCalledWith({ edit: keyToSelect });
    expect(selectedKeys.value).toEqual({ [keyToSelect]: true });
    expect(editorVNode.value!.props.path).toEqual(expected.path);
    expect(editorVNode.value!.component).toEqual(expected.component);
  });

  describe("should create", () => {
    const submodel: SubmodelResponseDto = submodelPlainToResponse(
      submodelDesignOfProductPlainFactory.transient({ iriDomain }).build(),
    );
    const paginationResponse = {
      paging_metadata: { cursor: null },
      result: [submodel],
    };
    beforeEach(() => {
      mocks.getSubmodels.mockResolvedValue({ data: paginationResponse });
    });
    it("should create submodel", async () => {
      mocks.createSubmodel.mockResolvedValue({ status: HTTPCode.CREATED });
      const { createSubmodel, init, drawerVisible, editorVNode } = useAasEditor({
        id: aasId,
        aasNamespace: apiClient.dpp.templates.aas,
        changeQueryParams,
        errorHandlingStore,
        selectedLanguage,
      });
      await init();
      await createSubmodel();
      expect(drawerVisible.value).toBeTruthy();
      expect(editorVNode.value!.props.path).toEqual({});
      expect(editorVNode.value!.props.data).toEqual({ });
      expect(editorVNode.value!.component).toEqual(SubmodelCreateEditor);
      const data = { idShort: "newSubmodel" };
      await editorVNode.value!.props.callback!(data);
      expect(mocks.createSubmodel).toHaveBeenCalledWith(aasId, data);
    });

    it("should create property", async () => {
      mocks.createSubmodelElement.mockResolvedValue({ status: HTTPCode.CREATED });

      const { submodels, submodelElementsToAdd, init, drawerVisible, buildAddSubmodelElementMenu, editorVNode } = useAasEditor({
        id: aasId,
        aasNamespace: apiClient.dpp.templates.aas,
        changeQueryParams,
        errorHandlingStore,
        selectedLanguage,
      });
      await init();
      buildAddSubmodelElementMenu(submodels.value!.find(s => s.key === submodel1.id)!);
      const addPropertyMenuItem: MenuItem = submodelElementsToAdd.value.find(e => e.label === "Textfeld hinzufügen")!;
      addPropertyMenuItem.command!({} as MenuItemCommandEvent);
      expect(drawerVisible.value).toBeTruthy();
      expect(editorVNode.value!.props.path).toEqual({ submodelId: submodel1.id });
      expect(editorVNode.value!.props.data).toEqual({ valueType: DataTypeDef.String });
      expect(editorVNode.value!.component).toEqual(PropertyCreateEditor);
      const data = { idShort: "newProperty" };
      await editorVNode.value!.props.callback!(data);
      expect(mocks.createSubmodelElement).toHaveBeenCalledWith(aasId, submodel1.id, { ...data, modelType: KeyTypes.Property });
    });
  });
});
