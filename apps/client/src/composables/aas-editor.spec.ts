import type { SubmodelResponseDto } from "@open-dpp/dto";
import type { MenuItem, MenuItemCommandEvent } from "primevue/menuitem";
import type { Component } from "vue";
import type { IAasEditor } from "./aas-editor.ts";
import { AasSubmodelElements, DataTypeDef, KeyTypes, Language, SubmodelElementCollectionJsonSchema } from "@open-dpp/dto";
import {
  submodelCarbonFootprintPlainFactory,
  submodelDesignOfProductPlainFactory,
  submodelPlainToResponse,
} from "@open-dpp/testing";
import { omit } from "lodash";
import { v4 as uuid4 } from "uuid";
import { expect, it, vi } from "vitest";
import FileCreateEditor from "../components/aas/FileCreateEditor.vue";
import FileEditor from "../components/aas/FileEditor.vue";
import PropertyCreateEditor from "../components/aas/PropertyCreateEditor.vue";
import PropertyEditor from "../components/aas/PropertyEditor.vue";
import SubmodelCreateEditor from "../components/aas/SubmodelCreateEditor.vue";
import SubmodelEditor from "../components/aas/SubmodelEditor.vue";
import SubmodelElementCollectionCreateEditor from "../components/aas/SubmodelElementCollectionCreateEditor.vue";
import SubmodelElementCollectionEditor from "../components/aas/SubmodelElementCollectionEditor.vue";
import SubmodelElementListCreateEditor from "../components/aas/SubmodelElementListCreateEditor.vue";
import apiClient from "../lib/api-client.ts";
import { HTTPCode } from "../stores/http-codes.ts";
import { useAasEditor } from "./aas-editor.ts";

const mocks = vi.hoisted(() => {
  return {
    createSubmodel: vi.fn(),
    createSubmodelElement: vi.fn(),
    createSubmodelElementAtIdShortPath: vi.fn(),
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
          createSubmodelElementAtIdShortPath: mocks.createSubmodelElementAtIdShortPath,
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

    const { init, submodels, findTreeNodeByKey } = useAasEditor({
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
    const actionsOfParent = { addChildren: true };
    const actionsOfLeaveNode = { addChildren: false };

    const withoutChildren = (value: any) => omit(value, "children");
    const expectedSubmodel1 = {
      key: `${submodel1.id}`,
      data: {
        label: submodel1.idShort,
        modelType: KeyTypes.Submodel,
        plain: omit(submodel1, "submodelElements"),
        path: { submodelId: submodel1.id },
        type: "aasEditor.submodel",
        actions: actionsOfParent,
      },
    };

    const expectedSubmodel2 = {
      key: `${submodel2.id}`,
      data: {
        label: "Carbon Footprint",
        modelType: KeyTypes.Submodel,
        plain: omit(submodel2, "submodelElements"),
        path: { submodelId: submodel2.id },
        type: "aasEditor.submodel",
        actions: {
          addChildren: true,
        },
      },
    };
    expect(submodels.value!.map(withoutChildren)).toEqual([expectedSubmodel1, expectedSubmodel2]);
    const actualDesignV01 = findTreeNodeByKey(`${submodel1.idShort}.Design_V01`);
    const expectedDesignV01 = {
      key: `${submodel1.idShort}.Design_V01`,
      data: {
        label: "Design_V01",
        modelType: "SubmodelElementCollection",
        path: { submodelId: submodel1.id, idShortPath: `Design_V01` },
        plain: submodel1.submodelElements[0],
        type: "aasEditor.submodelElementCollection",
        actions: actionsOfParent,
      },
    };
    expect(withoutChildren(actualDesignV01)).toEqual(expectedDesignV01);

    // Test property
    const actualAuthorName = findTreeNodeByKey(`Design_V01.Author.AuthorName`);
    const expectedAuthorName = {
      key: `Design_V01.Author.AuthorName`,
      data: {
        label: "AuthorName",
        modelType: "Property",
        path: { submodelId: submodel1.id, idShortPath: `Design_V01.Author.AuthorName` },
        plain: SubmodelElementCollectionJsonSchema.parse(SubmodelElementCollectionJsonSchema.parse(submodel1.submodelElements[0]).value[0]).value[0],
        type: "aasEditor.textField",
        actions: actionsOfLeaveNode,
      },
    };
    expect(withoutChildren(actualAuthorName)).toEqual(expectedAuthorName);

    // Test file
    let key = `Design_V01.AdditionalInformation.FileProp`;
    const actualFile = findTreeNodeByKey(key);
    const expectedFile = {
      key,
      data: {
        label: "FileProp",
        modelType: KeyTypes.File,
        path: { submodelId: submodel1.id, idShortPath: key },
        plain: SubmodelElementCollectionJsonSchema.parse(SubmodelElementCollectionJsonSchema.parse(submodel1.submodelElements[0]).value[1]).value[3],
        type: "aasEditor.file",
        actions: actionsOfLeaveNode,
      },
    };
    expect(withoutChildren(actualFile)).toEqual(expectedFile);

    key = `Design_V01.Author.ListProp`;
    const actualListProp = findTreeNodeByKey(key);
    const expectedListProp = {
      key,
      data: {
        label: "ListProp",
        modelType: KeyTypes.SubmodelElementList,
        path: { submodelId: submodel1.id, idShortPath: `Design_V01.Author.ListProp` },
        plain: SubmodelElementCollectionJsonSchema.parse(SubmodelElementCollectionJsonSchema.parse(submodel1.submodelElements[0]).value[0]).value[2],
        type: "aasEditor.submodelElementList",
        actions: actionsOfLeaveNode,
      },
    };
    expect(withoutChildren(actualListProp)).toEqual(expectedListProp);
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
        haveBeenCalled: mocks.modifySubmodelElement,
      },
    },
    {
      keyToSelect: `Design_V01.Author.AuthorName`,
      expected: {
        path: { submodelId: submodel1.id, idShortPath: `Design_V01.Author.AuthorName` },
        component: PropertyEditor,
        haveBeenCalled: mocks.modifySubmodelElement,
      },
    },
    {
      keyToSelect: `Design_V01.AdditionalInformation.FileProp`,
      expected: {
        path: { submodelId: submodel1.id, idShortPath: `Design_V01.AdditionalInformation.FileProp` },
        component: FileEditor,
        haveBeenCalled: mocks.modifySubmodelElement,
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
      vi.resetAllMocks();
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
      expect(editorVNode.value!.props.data).toEqual({});
      expect(editorVNode.value!.component).toEqual(SubmodelCreateEditor);
      const data = { idShort: "newSubmodel" };
      await editorVNode.value!.props.callback!(data);
      expect(mocks.createSubmodel).toHaveBeenCalledWith(aasId, data);
    });

    const sharedCreationProps = {
      description: [],
      displayName: [],
      embeddedDataSpecifications: [],
      qualifiers: [],
      supplementalSemanticIds: [],
      extensions: [],
    };

    async function assertCreationOfSubmodelElement(aasEditor: IAasEditor, data: any, expectedRequestBody: any, label: string, expectedEditor: Component, expectedCreationData?: any) {
      await aasEditor.init();

      aasEditor.buildAddSubmodelElementMenu(aasEditor.findTreeNodeByKey(submodel1.id)!);
      let addPropertyMenuItem: MenuItem = aasEditor.submodelElementsToAdd.value.find(e => e.label === label)!;
      addPropertyMenuItem.command!({} as MenuItemCommandEvent);
      expect(aasEditor.drawerVisible.value).toBeTruthy();
      expect(aasEditor.editorVNode.value!.props.path).toEqual({ submodelId: submodel1.id });
      expect(aasEditor.editorVNode.value!.props.data).toEqual(expectedCreationData ?? {});
      expect(aasEditor.editorVNode.value!.component).toEqual(expectedEditor);
      await aasEditor.editorVNode.value!.props.callback!(data);
      expect(mocks.createSubmodelElement).toHaveBeenCalledWith(aasId, submodel1.id, expectedRequestBody);

      expect(mocks.createSubmodelElement).toHaveBeenCalledWith(aasId, submodel1.id, expectedRequestBody);
      aasEditor.buildAddSubmodelElementMenu(aasEditor.findTreeNodeByKey("Design_V01.Author")!);
      addPropertyMenuItem = aasEditor.submodelElementsToAdd.value.find(e => e.label === label)!;
      addPropertyMenuItem.command!({} as MenuItemCommandEvent);
      await aasEditor.editorVNode.value!.props.callback!(data);
      expect(mocks.createSubmodelElementAtIdShortPath).toHaveBeenCalledWith(aasId, submodel1.id, "Design_V01.Author", expectedRequestBody);
    }

    it.each([
      { label: "aasEditor.textField", valueType: DataTypeDef.String },
      { label: "aasEditor.numberField", valueType: DataTypeDef.Double },
    ])("should create property for %label", async ({ label, valueType }) => {
      mocks.createSubmodelElement.mockResolvedValue({ status: HTTPCode.CREATED });
      mocks.createSubmodelElementAtIdShortPath.mockResolvedValue({ status: HTTPCode.CREATED });

      const aasEditor = useAasEditor({
        id: aasId,
        aasNamespace: apiClient.dpp.templates.aas,
        changeQueryParams,
        errorHandlingStore,
        selectedLanguage,
        translate,
      });

      const data = { idShort: "newProperty", valueType };
      const expectedRequestBody = {
        ...data,
        modelType: KeyTypes.Property,
        valueType,
        ...sharedCreationProps,
      };
      await assertCreationOfSubmodelElement(aasEditor, data, expectedRequestBody, label, PropertyCreateEditor, { valueType });
    });

    it("should create submodel element collection", async () => {
      mocks.createSubmodelElement.mockResolvedValue({ status: HTTPCode.CREATED });
      mocks.createSubmodelElementAtIdShortPath.mockResolvedValue({ status: HTTPCode.CREATED });

      const aasEditor = useAasEditor({
        id: aasId,
        aasNamespace: apiClient.dpp.templates.aas,
        changeQueryParams,
        errorHandlingStore,
        selectedLanguage,
        translate,
      });

      const data = { idShort: "newProperty" };
      const expectedRequestBody = {
        ...data,
        modelType: KeyTypes.SubmodelElementCollection,
        ...sharedCreationProps,
        value: [],
      };
      await assertCreationOfSubmodelElement(aasEditor, data, expectedRequestBody, "aasEditor.submodelElementCollection", SubmodelElementCollectionCreateEditor);
    });

    it("should create submodel element list", async () => {
      mocks.createSubmodelElement.mockResolvedValue({ status: HTTPCode.CREATED });
      mocks.createSubmodelElementAtIdShortPath.mockResolvedValue({ status: HTTPCode.CREATED });

      const aasEditor = useAasEditor({
        id: aasId,
        aasNamespace: apiClient.dpp.templates.aas,
        changeQueryParams,
        errorHandlingStore,
        selectedLanguage,
        translate,
      });

      const data = { idShort: "newProperty", typeValueListElement: AasSubmodelElements.SubmodelElementCollection };
      const expectedRequestBody = {
        ...data,
        modelType: KeyTypes.SubmodelElementList,
        ...sharedCreationProps,
        value: [],
      };
      await assertCreationOfSubmodelElement(aasEditor, data, expectedRequestBody, "aasEditor.submodelElementList", SubmodelElementListCreateEditor);
    });

    it("should create file", async () => {
      mocks.createSubmodelElement.mockResolvedValue({ status: HTTPCode.CREATED });
      mocks.createSubmodelElementAtIdShortPath.mockResolvedValue({ status: HTTPCode.CREATED });

      const aasEditor = useAasEditor({
        id: aasId,
        aasNamespace: apiClient.dpp.templates.aas,
        changeQueryParams,
        errorHandlingStore,
        selectedLanguage,
        translate,
      });

      const data = { idShort: "newProperty", contentType: "application/pdf", value: "path" };
      const expectedRequestBody = {
        ...data,
        modelType: KeyTypes.File,
        ...sharedCreationProps,
      };
      await assertCreationOfSubmodelElement(aasEditor, data, expectedRequestBody, "aasEditor.file", FileCreateEditor);
    });
  });
});
