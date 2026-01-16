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
    modifySubmodel: vi.fn(),
    modifySubmodelElement: vi.fn(),
  };
});

vi.mock("../lib/api-client", () => ({
  default: {
    setActiveOrganizationId: vi.fn(),
    dpp: {
      templates: {
        aas: {
          createSubmodel: mocks.createSubmodel,
          modifySubmodel: mocks.modifySubmodel,
          getSubmodels: mocks.getSubmodels,
          createSubmodelElement: mocks.createSubmodelElement,
          modifySubmodelElement: mocks.modifySubmodelElement,
        },
      },
    },
  },
}));

describe("aasEditor composable", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  const translate = (key: string) => key;
  const changeQueryParams = vi.fn();
  const errorHandlingStore = {
    logErrorWithNotification: vi.fn(),
    withErrorHandling: vi.fn(),
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
      status: HTTPCode.OK,
    });

    const { init, submodels } = useAasEditor({
      id: aasId,
      aasNamespace: apiClient.dpp.templates.aas,
      changeQueryParams,
      errorHandlingStore,
      selectedLanguage,
      translate,
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
        label: submodel1.idShort,
        modelType: KeyTypes.Submodel,
        plain: omit(submodel1, "submodelElements"),
        path: { submodelId: submodel1.id },
        type: "aasEditor.submodel",
      },
      children: [
        {
          key: `${submodel1.idShort}.Design_V01`,
          data: {
            label: "Design_V01",
            modelType: "SubmodelElementCollection",
            path: { submodelId: submodel1.id, idShortPath: `Design_V01` },
            plain: submodel1.submodelElements[0],
            type: "aasEditor.submodelElementCollection",
          },
        },
      ],
    };
    const expectedSubmodel2TreeNodes = {
      key: `${submodel2.id}`,
      data: {
        label: "Carbon Footprint",
        modelType: KeyTypes.Submodel,
        plain: omit(submodel2, "submodelElements"),
        path: { submodelId: submodel2.id },
        type: "aasEditor.submodel",
      },
      children: [
        {
          key: `${submodel2.idShort}.ProductCarbonFootprint_A1A3`,
          data: {
            label: "Product carbon footprint",
            modelType: "SubmodelElementCollection",
            path: { submodelId: submodel2.id, idShortPath: `ProductCarbonFootprint_A1A3` },
            plain: submodel2.submodelElements[0],
            type: "aasEditor.submodelElementCollection",
          },
        },
        {
          key: `${submodel2.idShort}.ProductCarbonFootprint_A4`,
          data: {
            label: "Product carbon footprint",
            modelType: "SubmodelElementCollection",
            path: { submodelId: submodel2.id, idShortPath: `ProductCarbonFootprint_A4` },
            plain: submodel2.submodelElements[1],
            type: "aasEditor.submodelElementCollection",
          },
        },
        {
          key: `${submodel2.idShort}.ProductCarbonFootprint_B5`,
          data: {
            label: "Product carbon footprint",
            modelType: "SubmodelElementCollection",
            path: { submodelId: submodel2.id, idShortPath: `ProductCarbonFootprint_B5` },
            plain: submodel2.submodelElements[2],
            type: "aasEditor.submodelElementCollection",
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
    {
      keyToSelect: submodel2.id,
      expected: {
        path: { submodelId: submodel2.id },
        component: SubmodelEditor,
        haveBeenCalled: mocks.modifySubmodel,
      },
    },
    {
      keyToSelect: `${submodel2.idShort}.ProductCarbonFootprint_A4`,
      expected: {
        path: { submodelId: submodel2.id, idShortPath: `ProductCarbonFootprint_A4` },
        component: SubmodelElementCollectionEditor,
        haveBeenCalled: null,
      },
    },
  ])("should select node $keyToSelect", async ({ keyToSelect, expected }) => {
    const response = { paging_metadata: { cursor: null }, result: [submodel1, submodel2] };
    mocks.getSubmodels.mockResolvedValue({
      data: response,
      status: HTTPCode.OK,
    });

    const { init, selectTreeNode, selectedKeys, editorVNode } = useAasEditor({
      id: aasId,
      aasNamespace: apiClient.dpp.templates.aas,
      changeQueryParams,
      errorHandlingStore,
      selectedLanguage,
      translate,
    });
    await init();
    selectTreeNode(keyToSelect);
    expect(changeQueryParams).toHaveBeenCalledWith({ edit: keyToSelect, cursor: undefined });
    expect(selectedKeys.value).toEqual({ [keyToSelect]: true });
    expect(editorVNode.value!.props.path).toEqual(expected.path);
    expect(editorVNode.value!.component).toEqual(expected.component);
    if (expected.haveBeenCalled) {
      expected.haveBeenCalled.mockResolvedValue({ status: HTTPCode.OK });
      const data = { displayName: [] };
      await editorVNode.value!.props.callback!(data);
      expect(expected.haveBeenCalled).toHaveBeenCalled();
    }
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
      mocks.getSubmodels.mockResolvedValue({ data: paginationResponse, status: HTTPCode.OK });
    });
    it("should create submodel", async () => {
      mocks.createSubmodel.mockResolvedValue({ status: HTTPCode.CREATED });
      const { createSubmodel, init, drawerVisible, editorVNode } = useAasEditor({
        id: aasId,
        aasNamespace: apiClient.dpp.templates.aas,
        changeQueryParams,
        errorHandlingStore,
        selectedLanguage,
        translate,
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

    it.each([
      { label: "aasEditor.textField", valueType: DataTypeDef.String },
      { label: "aasEditor.numberField", valueType: DataTypeDef.Double },
    ])("should create property for %label", async ({ label, valueType }) => {
      mocks.createSubmodelElement.mockResolvedValue({ status: HTTPCode.CREATED });

      const { submodels, submodelElementsToAdd, init, drawerVisible, buildAddSubmodelElementMenu, editorVNode } = useAasEditor({
        id: aasId,
        aasNamespace: apiClient.dpp.templates.aas,
        changeQueryParams,
        errorHandlingStore,
        selectedLanguage,
        translate,
      });
      await init();
      buildAddSubmodelElementMenu(submodels.value!.find(s => s.key === submodel1.id)!);
      const addPropertyMenuItem: MenuItem = submodelElementsToAdd.value.find(e => e.label === label)!;
      addPropertyMenuItem.command!({} as MenuItemCommandEvent);
      expect(drawerVisible.value).toBeTruthy();
      expect(editorVNode.value!.props.path).toEqual({ submodelId: submodel1.id });
      expect(editorVNode.value!.props.data).toEqual({ valueType });
      expect(editorVNode.value!.component).toEqual(PropertyCreateEditor);
      const data = { idShort: "newProperty" };
      await editorVNode.value!.props.callback!(data);
      expect(mocks.createSubmodelElement).toHaveBeenCalledWith(aasId, submodel1.id, {
        ...data,
        modelType: KeyTypes.Property,
        description: [],
        displayName: [],
        embeddedDataSpecifications: [],
        qualifiers: [],
        supplementalSemanticIds: [],
      });
    });

    it("should create submodel element collection", async () => {
      mocks.createSubmodelElement.mockResolvedValue({ status: HTTPCode.CREATED });

      const { submodels, submodelElementsToAdd, init, drawerVisible, buildAddSubmodelElementMenu, editorVNode } = useAasEditor({
        id: aasId,
        aasNamespace: apiClient.dpp.templates.aas,
        changeQueryParams,
        errorHandlingStore,
        selectedLanguage,
        translate,
      });
      await init();
      buildAddSubmodelElementMenu(submodels.value!.find(s => s.key === submodel1.id)!);
      const addPropertyMenuItem: MenuItem = submodelElementsToAdd.value.find(e => e.label === "aasEditor.submodelElementCollection")!;
      addPropertyMenuItem.command!({} as MenuItemCommandEvent);
      expect(drawerVisible.value).toBeTruthy();
      expect(editorVNode.value!.props.path).toEqual({ submodelId: submodel1.id });
      expect(editorVNode.value!.props.data).toEqual({ });
      expect(editorVNode.value!.component).toEqual(SubmodelElementCollectionEditor);
      const data = { idShort: "newProperty" };
      await editorVNode.value!.props.callback!(data);
      expect(mocks.createSubmodelElement).toHaveBeenCalledWith(aasId, submodel1.id, {
        ...data,
        modelType: KeyTypes.SubmodelElementCollection,
        description: [],
        displayName: [],
        embeddedDataSpecifications: [],
        qualifiers: [],
        supplementalSemanticIds: [],
      });
    });
  });
});
