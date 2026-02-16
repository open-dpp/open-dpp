import type { AasNamespace } from "@open-dpp/api-client";
import type {
  DataTypeDefType,
  FileRequestDto,
  LanguageTextDto,
  LanguageType,
  PagingParamsDto,
  PropertyRequestDto,
  ReferenceElementRequestDto,
  SubmodelElementCollectionRequestDto,
  SubmodelElementListRequestDto,
  SubmodelElementModificationDto,
  SubmodelElementSharedRequestDto,
  SubmodelElementSharedResponseDto,
  SubmodelModificationDto,
  SubmodelRequestDto,
  SubmodelResponseDto,
} from "@open-dpp/dto";
import type { TreeTableSelectionKeys } from "primevue";
import type { MenuItem, MenuItemCommandEvent } from "primevue/menuitem";
import type { TreeNode } from "primevue/treenode";
import type { Ref } from "vue";
import type { IErrorHandlingStore } from "../stores/error.handling.ts";
import type { AasEditorPath, IAasDrawer } from "./aas-drawer.ts";
import type { IPagination, PagingResult } from "./pagination.ts";
import {

  AasSubmodelElements,

  AasSubmodelElementsEnum,

  DataTypeDef,
  KeyTypes,
  PropertyJsonSchema,
  SubmodelElementSchema,
  SubmodelElementSharedSchema,
  SubmodelJsonSchema,

} from "@open-dpp/dto";
import { omit } from "lodash";
import { ref, toRaw } from "vue";
import { z } from "zod/v4";
import { HTTPCode } from "../stores/http-codes.ts";
import {

  EditorMode,
  LinkEditorKey,
  useAasDrawer,
} from "./aas-drawer.ts";
import { usePagination } from "./pagination.ts";

interface AasEditorProps {
  id: string;
  aasNamespace: AasNamespace;
  initialSelectedKeys?: string;
  initialCursor?: string;
  changeQueryParams: (params: Record<string, string | undefined>) => void;
  errorHandlingStore: IErrorHandlingStore;
  selectedLanguage: LanguageType;
  translate: (label: string, ...args: unknown[]) => string;
}

export interface IAasEditor extends IAasDrawer, IPagination {
  init: () => Promise<void>;
  findTreeNodeByKey: (key: string, children?: TreeNode[]) => (TreeNode | undefined);
  submodels: Ref<TreeNode[]>;
  buildAddSubmodelElementMenu: (node: TreeNode) => void;
  submodelElementsToAdd: Ref<MenuItem[]>;
  createSubmodel: () => Promise<void>;
  loading: Ref<boolean>;
  selectedKeys: Ref<TreeTableSelectionKeys | undefined>;
  selectTreeNode: (key: string) => void;
}

export function useAasEditor({
  id,
  aasNamespace,
  initialSelectedKeys,
  initialCursor,
  changeQueryParams,
  errorHandlingStore,
  selectedLanguage,
  translate,
}: AasEditorProps): IAasEditor {
  const submodels = ref<TreeNode[]>([]);
  const selectedKeys = ref<TreeTableSelectionKeys | undefined>(undefined);
  const translatePrefix = "aasEditor";

  const onHideDrawer = () => {
    selectedKeys.value = undefined;
    changeQueryParams({ edit: undefined });
  };

  const drawer = useAasDrawer({ onHideDrawer });

  const loading = ref(false);
  const submodelElementsToAdd = ref<MenuItem[]>([]);

  const fetchSubmodels = async (
    pagingParams: PagingParamsDto,
  ): Promise<PagingResult> => {
    loading.value = true;
    const errorMessage = translate(`${translatePrefix}.errorLoadingSubmodels`);
    try {
      const response = await aasNamespace.getSubmodels(id, pagingParams);
      if (response.status === HTTPCode.OK) {
        submodels.value = convertSubmodelsToTree(SubmodelJsonSchema.array().parse(response.data.result));
        return response.data;
      }
      else {
        errorHandlingStore.logErrorWithNotification(errorMessage);
      }
    }
    catch (e) {
      errorHandlingStore.logErrorWithNotification(errorMessage, e);
    }
    finally {
      loading.value = false;
    }
    return { paging_metadata: { cursor: null }, result: [] };
  };

  const pagination
    = usePagination({ initialCursor, limit: 10, fetchCallback: fetchSubmodels, changeQueryParams });

  const findTreeNodeByKey = (key: string, children?: TreeNode[]): TreeNode | undefined => {
    if (!submodels.value) {
      return undefined;
    }
    const treeNodes = children ?? submodels.value;
    const node = treeNodes.find(n => n.key === key);
    if (node) {
      return node;
    }
    for (const treeNode of treeNodes) {
      if (treeNode.children && treeNode.children.length > 0) {
        const foundNode = findTreeNodeByKey(key, treeNode.children);
        if (foundNode) {
          return foundNode;
        }
      }
    }
    return undefined;
  };

  async function finalizeApiRequest(response: { status: number }) {
    if (response.status === HTTPCode.OK || response.status === HTTPCode.CREATED) {
      await pagination.reloadCurrentPage();
      drawer.hideDrawer();
    }
  }

  async function modifySubmodel(path: AasEditorPath, data: SubmodelModificationDto) {
    if (path.submodelId) {
      const response = await aasNamespace.modifySubmodel(
        id,
        path.submodelId,
        data,
      );
      await finalizeApiRequest(response);
    }
  }

  async function modifySubmodelElement(
    path: AasEditorPath,
    data: SubmodelElementModificationDto,
  ) {
    if (path.submodelId && path.idShortPath) {
      const response = await aasNamespace.modifySubmodelElement(
        id,
        path.submodelId,
        path.idShortPath,
        data,
      );
      await finalizeApiRequest(response);
    }
  }

  function getEditCallback(node: TreeNode, title: string) {
    const errorMessage = translate(`${translatePrefix}.error`, { method: title });
    if (node.data.modelType === KeyTypes.Submodel) {
      return async (data: any) => {
        try {
          await modifySubmodel(toRaw(node.data.path), data);
        }
        catch (e) {
          errorHandlingStore.logErrorWithNotification(errorMessage, e);
        }
      };
    }
    else if (AasSubmodelElementsEnum.safeParse(node.data.modelType).success) {
      return async (data: any) => {
        try {
          await modifySubmodelElement(toRaw(node.data.path), data);
        }
        catch (e) {
          errorHandlingStore.logErrorWithNotification(errorMessage, e);
        }
      };
    }
    return async (_data: any) => {};
  }

  function selectTreeNode(key: string) {
    if (submodels.value) {
      const node = findTreeNodeByKey(key);
      if (!node) {
        errorHandlingStore.logErrorWithNotification("Fails to select node");
        return;
      }
      selectedKeys.value = { [key]: true };

      const title = translate(`${translatePrefix}.edit`, { formItem: node.data.type });
      drawer.openDrawer({
        type: node.data.modelType,
        data: toRaw(node.data.plain),
        title,
        mode: EditorMode.EDIT,
        path: toRaw(node.data.path),
        callback: getEditCallback(node, title),
      });
      changeQueryParams({ edit: key });
    }
  }

  function convertSubmodelElementsToTree(submodelIdShort: string, pathOfParent: AasEditorPath, submodelElements: SubmodelElementSharedResponseDto[]) {
    return submodelElements.map((submodelElement): TreeNode => {
      const key = pathOfParent.idShortPath ? `${pathOfParent.idShortPath}.${submodelElement.idShort}` : `${submodelIdShort}.${submodelElement.idShort}`;
      const idShortPath = pathOfParent.idShortPath ? `${pathOfParent.idShortPath}.${submodelElement.idShort}` : submodelElement.idShort;
      const path = { submodelId: pathOfParent.submodelId, idShortPath };
      const canHaveChildren = submodelElementCanHaveChildren(submodelElement);
      const children = getChildrenOfSubmodelElement(submodelElement);
      return {
        key,
        data: {
          type: getVisualType(submodelElement),
          label: translateDisplayName(submodelElement.displayName) ?? submodelElement.idShort,
          modelType: submodelElement.modelType,
          plain: submodelElement,
          actions: {
            addChildren: canHaveChildren,
          },
          path,
        },
        children: children ? convertSubmodelElementsToTree(submodelIdShort, path, children) : undefined,
      };
    });
  }

  function translateDisplayName(displayName: LanguageTextDto[]): string | undefined {
    return displayName.find(d => d.language === selectedLanguage)?.text;
  }

  function getVisualType(submodelBase: SubmodelElementSharedResponseDto): string {
    if (submodelBase.modelType === KeyTypes.Submodel) {
      return translate(`${translatePrefix}.submodel`);
    }
    if (submodelBase.modelType === AasSubmodelElements.Property) {
      const { valueType } = PropertyJsonSchema.pick({ valueType: true }).parse(submodelBase);
      if (valueType === DataTypeDef.String) {
        return translate(`${translatePrefix}.textField`);
      }
      if (valueType === DataTypeDef.Double) {
        return translate(`${translatePrefix}.numberField`);
      }
    }
    if (submodelBase.modelType === AasSubmodelElements.SubmodelElementList) {
      return translate(`${translatePrefix}.submodelElementList`);
    }
    if (submodelBase.modelType === AasSubmodelElements.ReferenceElement) {
      return translate(`${translatePrefix}.link`);
    }
    if (submodelBase.modelType === AasSubmodelElements.File) {
      return translate(`${translatePrefix}.file`);
    }
    if (submodelBase.modelType === AasSubmodelElements.SubmodelElementCollection) {
      return translate(`${translatePrefix}.submodelElementCollection`);
    }
    return submodelBase.modelType;
  }

  function submodelElementCanHaveChildren(submodelElement: SubmodelElementSharedResponseDto): boolean {
    return submodelElement.modelType === AasSubmodelElements.SubmodelElementCollection;
  }

  function getChildrenOfSubmodelElement(submodelElement: SubmodelElementSharedResponseDto): SubmodelElementSharedResponseDto[] | undefined {
    const ChildrenParser = z.object({ value: SubmodelElementSharedSchema.array() });
    if (submodelElementCanHaveChildren(submodelElement)) {
      return ChildrenParser.parse(submodelElement).value;
    }
    return undefined;
  }

  function convertSubmodelsToTree(submodels: SubmodelResponseDto[]) {
    return submodels.map((submodel: SubmodelResponseDto) => ({
      key: submodel.id,
      data: {
        label: translateDisplayName(submodel.displayName) ?? submodel.idShort,
        type: getVisualType({ modelType: KeyTypes.Submodel, ...submodel }),
        modelType: KeyTypes.Submodel,
        plain: omit(submodel, "submodelElements"),
        actions: {
          addChildren: true,
        },
        path: { submodelId: submodel.id },
      },
      children: convertSubmodelElementsToTree(submodel.idShort, { submodelId: submodel.id }, submodel.submodelElements),
    }));
  }

  const buildAddSubmodelElementMenu = (node: TreeNode) => {
    const path = toRaw(node.data.path);
    function buildPropertyEntry(label: string, icon: string, valueType: DataTypeDefType) {
      return { label, icon, command: (_event: MenuItemCommandEvent) => {
        drawer.openDrawer({
          type: KeyTypes.Property,
          data: { valueType },
          mode: EditorMode.CREATE,
          title: label,
          path,
          callback: async (data: PropertyRequestDto) => createProperty(path, data, label),
        });
      } };
    }

    submodelElementsToAdd.value = [
      buildPropertyEntry(
        translate(`${translatePrefix}.textField`),
        "pi pi-align-left",
        DataTypeDef.String,
      ),
      buildPropertyEntry(
        translate(`${translatePrefix}.numberField`),
        "pi pi-calculator",
        DataTypeDef.Double,
      ),
      {
        label: translate(`${translatePrefix}.file`),
        icon: "pi pi-file-plus",
        command: (_event: MenuItemCommandEvent) => {
          drawer.openDrawer({
            type: KeyTypes.File,
            data: {},
            mode: EditorMode.CREATE,
            title: translate(`${translatePrefix}.file`),
            path,
            callback: async (data: FileRequestDto) => createFile(path, data),
          });
        },
      },
      {
        label: translate(`${translatePrefix}.link`),
        icon: "pi pi-link",
        command: (_event: MenuItemCommandEvent) => {
          drawer.openDrawer({
            type: LinkEditorKey,
            data: {},
            mode: EditorMode.CREATE,
            title: translate(`${translatePrefix}.link`),
            path,
            callback: async (data: any) => createLink(path, data),
          });
        },
      },
      {
        label: translate(`${translatePrefix}.submodelElementCollection`),
        icon: "pi pi-folder-plus",
        command: (_event: MenuItemCommandEvent) => {
          drawer.openDrawer({
            type: KeyTypes.SubmodelElementCollection,
            data: {},
            mode: EditorMode.CREATE,
            title: translate(`${translatePrefix}.submodelElementCollection`),
            path,
            callback: async (data: SubmodelElementCollectionRequestDto) =>
              createSubmodelElementCollection(path, data),
          });
        },
      },
      {
        label: translate(`${translatePrefix}.submodelElementList`),
        icon: "pi pi-list",
        command: (_event: MenuItemCommandEvent) => {
          drawer.openDrawer({
            type: KeyTypes.SubmodelElementList,
            data: {},
            mode: EditorMode.CREATE,
            title: translate(`${translatePrefix}.submodelElementList`),
            path,
            callback: async (data: SubmodelElementListRequestDto) =>
              createSubmodelElementList(path, data),
          });
        },
      },
    ];
  };

  const createSubmodel = async () => {
    async function createCallback(data: SubmodelRequestDto) {
      const response = await aasNamespace.createSubmodel(id, data);
      await finalizeApiRequest(response);
    }
    drawer.openDrawer({
      type: KeyTypes.Submodel,
      data: {},
      title: translate(`${translatePrefix}.addSubmodel`),
      mode: EditorMode.CREATE,
      path: {},
      callback: createCallback,
    });
  };

  async function createSubmodelElementList(path: AasEditorPath, data: SubmodelElementListRequestDto) {
    await createSubmodelElement(path, { modelType: AasSubmodelElements.SubmodelElementList, ...data }, "submodelElementList", true);
  }

  async function createSubmodelElementCollection(path: AasEditorPath, data: SubmodelElementCollectionRequestDto) {
    await createSubmodelElement(path, { modelType: AasSubmodelElements.SubmodelElementCollection, ...data }, "submodelElementCollection");
  }

  async function createLink(path: AasEditorPath, data: ReferenceElementRequestDto) {
    await createSubmodelElement(path, { ...data, modelType: AasSubmodelElements.ReferenceElement }, "link");
  }

  async function createFile(path: AasEditorPath, data: FileRequestDto) {
    await createSubmodelElement(path, { modelType: AasSubmodelElements.File, ...data }, "file");
  }

  async function createProperty(path: AasEditorPath, data: PropertyRequestDto, label: string) {
    await createSubmodelElement(path, { modelType: AasSubmodelElements.Property, ...data }, label);
  }

  async function createSubmodelElement(path: AasEditorPath, data: SubmodelElementSharedRequestDto, label: string, selectSubmodelElementAfterCreation: boolean = false) {
    const errorMessage = translate(`${translatePrefix}.error`, {
      method: translate(`${translatePrefix}.creation`, {
        formItem: label,
      }),
    });
    try {
      if (path.submodelId) {
        const requestBody = SubmodelElementSchema.parse({ ...data });
        const response = path.idShortPath
          ? await aasNamespace.createSubmodelElementAtIdShortPath(
              id,
              path.submodelId!,
              path.idShortPath,
              requestBody,
            )
          : await aasNamespace.createSubmodelElement(
              id,
              path.submodelId!,
              requestBody,
            );
        await finalizeApiRequest(response);

        if (selectSubmodelElementAfterCreation) {
          const submodelIdShort
            = submodels.value.find(n => n.key === path.submodelId)?.data.plain.idShort ?? "";
          const key = path.idShortPath
            ? `${path.idShortPath}.${data.idShort}`
            : `${submodelIdShort}.${data.idShort}`;
          selectTreeNode(key);
        }
      }
      else {
        errorHandlingStore.logErrorWithNotification(errorMessage);
      }
    }
    catch (e) {
      errorHandlingStore.logErrorWithNotification(errorMessage, e);
    }
  }

  async function init() {
    await pagination.nextPage();
    if (initialSelectedKeys) {
      selectTreeNode(initialSelectedKeys);
    }
  }

  return {
    init,
    submodels,
    submodelElementsToAdd,
    buildAddSubmodelElementMenu,
    createSubmodel,
    findTreeNodeByKey,
    loading,
    selectedKeys,
    selectTreeNode,
    ...pagination,
    ...drawer,
  };
}
