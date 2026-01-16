import type { AasNamespace } from "@open-dpp/api-client";
import type {
  LanguageTextDto,
  LanguageType,
  PagingParamsDto,
  PropertyRequestDto,
  SubmodelElementResponseDto,
  SubmodelModificationDto,
  SubmodelRequestDto,
  SubmodelResponseDto,
} from "@open-dpp/dto";
import type { TreeTableSelectionKeys } from "primevue";
import type { MenuItem, MenuItemCommandEvent } from "primevue/menuitem";
import type { TreeNode } from "primevue/treenode";
import type { IErrorHandlingStore } from "../stores/error.handling.ts";
import type { AasEditorPath } from "./aas-drawer.ts";
import type { PagingResult } from "./pagination.ts";
import {
  AasSubmodelElements,
  DataTypeDef,
  KeyTypes,
  PropertyJsonSchema,
  SubmodelElementSchema,
  SubmodelJsonSchema,
} from "@open-dpp/dto";
import { omit } from "lodash";
import { ref, toRaw } from "vue";
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
    submodelElementsToAdd.value = [
      {
        label: translate("aasEditor.addTextField"),
        icon: "pi pi-pencil",
        command: (_event: MenuItemCommandEvent) => {
          drawer.openDrawer({
            type: KeyTypes.Property,
            data: { valueType: DataTypeDef.String },
            mode: EditorMode.CREATE,
            title: translate("aasEditor.addTextField"),
            path,
            callback: async (data: PropertyRequestDto) =>
              createProperty(path, data),
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
    else if (node.data.modelType === AasSubmodelElements.Property) {
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

      const title = translate("aasEditor.editSubmodel");
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

  const getVisualType = (submodelBase: SubmodelElementResponseDto): string => {
    if (submodelBase.modelType === KeyTypes.Submodel) {
      return translate("aasEditor.submodel");
    }
    if (submodelBase.modelType === AasSubmodelElements.Property) {
      const { valueType } = PropertyJsonSchema.pick({ valueType: true }).parse(submodelBase);
      if (valueType === DataTypeDef.String) {
        return translate("aasEditor.textField");
      }
    }
    if (submodelBase.modelType === AasSubmodelElements.SubmodelElementCollection) {
      return translate("aasEditor.submodelElementCollection");
    }
    return submodelBase.modelType;
  };

  function convertSubmodelsToTree(submodels: SubmodelResponseDto[]) {
    return submodels.map((submodel: SubmodelResponseDto) => ({
      key: submodel.id,
      data: {
        label: translateDisplayName(submodel.displayName) ?? submodel.idShort,
        type: getVisualType({ modelType: KeyTypes.Submodel, ...submodel }),
        modelType: KeyTypes.Submodel,
        plain: omit(submodel, "submodelElements"),
        path: { submodelId: submodel.id },
      },
      children: submodel.submodelElements.map((sE) => {
        const submodelElement = SubmodelElementSchema.parse(sE);
        return {
          key: `${submodel.idShort}.${submodelElement.idShort}`,
          data: {
            type: getVisualType(submodelElement),
            label: translateDisplayName(submodelElement.displayName) ?? submodelElement.idShort,
            modelType: submodelElement.modelType,
            plain: submodelElement,
            path: {
              submodelId: submodel.id,
              idShortPath: `${submodelElement.idShort}`,
            },
          },
        };
      }),
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

  async function createProperty(path: AasEditorPath, data: PropertyRequestDto) {
    if (path.submodelId) {
      const response = await aasNamespace.createSubmodelElement(
        id,
        path.submodelId,
        SubmodelElementSchema.parse({ modelType: AasSubmodelElements.Property, ...data }),
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
    loading,
    selectedKeys,
    selectTreeNode,
    ...pagination,
    ...drawer,
  };
}
