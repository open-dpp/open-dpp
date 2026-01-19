import type { AasNamespace } from "@open-dpp/api-client";
import type { DataTypeDefType, LanguageTextDto, LanguageType, PagingParamsDto, PropertyRequestDto, SubmodelElementCollectionRequestDto, SubmodelElementSharedResponseDto, SubmodelModificationDto, SubmodelRequestDto, SubmodelResponseDto } from "@open-dpp/dto";
import type { TreeTableSelectionKeys } from "primevue";
import type { MenuItem, MenuItemCommandEvent } from "primevue/menuitem";
import type { TreeNode } from "primevue/treenode";
import type { IErrorHandlingStore } from "../stores/error.handling.ts";
import type { AasEditorPath } from "./aas-drawer.ts";
import type { PagingResult } from "./pagination.ts";
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
import { EditorMode, useAasDrawer } from "./aas-drawer.ts";
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
export function useAasEditor({
  id,
  aasNamespace,
  initialSelectedKeys,
  initialCursor,
  changeQueryParams,
  errorHandlingStore,
  selectedLanguage,
  translate,
}: AasEditorProps) {
  const submodels = ref<TreeNode[]>();
  const selectedKeys = ref<TreeTableSelectionKeys | undefined>(undefined);

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
    const response = await aasNamespace.getSubmodels(id, pagingParams);
    if (response.status === 200) {
      submodels.value = convertSubmodelsToTree(SubmodelJsonSchema.array().parse(response.data.result));
      loading.value = false;
    }
    return response.data;
  };

  const pagination
    = usePagination({ initialCursor, limit: 10, fetchCallback: fetchSubmodels, changeQueryParams });

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
          callback: async (data: PropertyRequestDto) =>
            createProperty(path, data),
        });
      } };
    }
    const labelPrefix = "aasEditor";
    submodelElementsToAdd.value = [
      buildPropertyEntry(translate(`${labelPrefix}.textField`), "pi pi-pencil", DataTypeDef.String),
      buildPropertyEntry(translate(`${labelPrefix}.numberField`), "pi pi-pencil", DataTypeDef.Double),
      {
        label: translate(`${labelPrefix}.submodelElementCollection`),
        icon: "pi pi-pencil",
        command: (_event: MenuItemCommandEvent) => {
          drawer.openDrawer({
            type: KeyTypes.SubmodelElementCollection,
            data: { },
            mode: EditorMode.CREATE,
            title: translate(`${labelPrefix}.submodelElementCollection`),
            path,
            callback: async (data: SubmodelElementCollectionRequestDto) =>
              createSubmodelElementCollection(path, data),
          });
        },
      },
    ];
  };

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
    const response = await aasNamespace.modifySubmodel(id, path.submodelId!, data);
    await finalizeApiRequest(response);
  }

  async function modifySubmodelElement(path: AasEditorPath, data: SubmodelModificationDto) {
    const response = await aasNamespace.modifySubmodelElement(id, path.submodelId!, path.idShortPath!, data);
    await finalizeApiRequest(response);
  }

  function getEditCallback(node: TreeNode, title: string) {
    const errorMessage = translate("aasEditor.error", { method: title });
    if (node.data.modelType === KeyTypes.Submodel) {
      return (data: any) => errorHandlingStore.withErrorHandling(
        modifySubmodel(toRaw(node.data.path), data),
        { message: errorMessage },
      );
    }
    else if (AasSubmodelElementsEnum.safeParse(node.data.modelType).success) {
      return (data: any) => errorHandlingStore.withErrorHandling(
        modifySubmodelElement(toRaw(node.data.path), data),
        { message: errorMessage },
      );
    }
    return undefined;
  }

  const selectTreeNode = (key: string) => {
    if (submodels.value) {
      const node = findTreeNodeByKey(key);
      if (!node) {
        errorHandlingStore.logErrorWithNotification("Fails to select node");
        return;
      }
      selectedKeys.value = { [key]: true };

      const title = translate("aasEditor.edit", { formItem: node.data.type });
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
  };

  const translateDisplayName = (displayName: LanguageTextDto[]): string | undefined => {
    return displayName.find(d => d.language === selectedLanguage)?.text;
  };

  const getVisualType = (submodelBase: SubmodelElementSharedResponseDto): string => {
    if (submodelBase.modelType === KeyTypes.Submodel) {
      return translate("aasEditor.submodel");
    }
    if (submodelBase.modelType === AasSubmodelElements.Property) {
      const { valueType } = PropertyJsonSchema.pick({ valueType: true }).parse(submodelBase);
      if (valueType === DataTypeDef.String) {
        return translate("aasEditor.textField");
      }
      if (valueType === DataTypeDef.Double) {
        return translate("aasEditor.numberField");
      }
    }
    if (submodelBase.modelType === AasSubmodelElements.SubmodelElementCollection) {
      return translate("aasEditor.submodelElementCollection");
    }
    return submodelBase.modelType;
  };

  function submodelElementCanHaveChildren(submodelElement: SubmodelElementSharedResponseDto): boolean {
    if (submodelElement.modelType === AasSubmodelElements.SubmodelElementCollection) {
      return true;
    }
    return false;
  }

  function getChildrenOfSubmodelElement(submodelElement: SubmodelElementSharedResponseDto): SubmodelElementSharedResponseDto[] | undefined {
    const ChildrenParser = z.object({ value: SubmodelElementSharedSchema.array() });
    if (submodelElementCanHaveChildren(submodelElement)) {
      return ChildrenParser.parse(submodelElement).value;
    }
    return undefined;
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
  };

  const createSubmodel = async () => {
    async function createCallback(data: SubmodelRequestDto) {
      const response = await aasNamespace.createSubmodel(id, data);
      await finalizeApiRequest(response);
    }
    drawer.openDrawer({
      type: KeyTypes.Submodel,
      data: {},
      title: translate("aasEditor.addSubmodel"),
      mode: EditorMode.CREATE,
      path: {},
      callback: createCallback,
    });
  };

  async function createSubmodelElementCollection(path: AasEditorPath, data: SubmodelElementCollectionRequestDto) {
    const call = async () => {
      const requestBody = SubmodelElementSchema.parse({ modelType: AasSubmodelElements.SubmodelElementCollection, ...data });
      const response = path.idShortPath
        ? await aasNamespace.createSubmodelElementAtIdShortPath(id, path.submodelId!, path.idShortPath, requestBody)
        : await aasNamespace.createSubmodelElement(
            id,
            path.submodelId!,
            requestBody,
          );
      await finalizeApiRequest(response);
    };
    await errorHandlingStore.withErrorHandling(
      call(),
      { message: translate("aasEditor.error", {
        method: translate("aasEditor.creation", { formItem: translate("aasEditor.submodelElementCollection") }),
      }) },
    );
  }

  async function createProperty(path: AasEditorPath, data: PropertyRequestDto) {
    if (path.submodelId) {
      const requestBody = SubmodelElementSchema.parse({ modelType: AasSubmodelElements.Property, ...data });
      const response = path.idShortPath
        ? await aasNamespace.createSubmodelElementAtIdShortPath(id, path.submodelId, path.idShortPath, requestBody)
        : await aasNamespace.createSubmodelElement(
            id,
            path.submodelId,
            requestBody,
          );
      await finalizeApiRequest(response);
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
