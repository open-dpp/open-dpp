import type { AasNamespace } from "@open-dpp/api-client";
import type {
  LanguageTextDto,
  LanguageType,
  PagingParamsDto,
  PropertyRequestDto,
  SubmodelRequestDto,
  SubmodelResponseDto,
} from "@open-dpp/dto";
import type { TreeTableSelectionKeys } from "primevue";
import type { MenuItem } from "primevue/menuitem";
import type { TreeNode } from "primevue/treenode";
import type { IErrorHandlingStore } from "../stores/error.handling.ts";
import type { AasEditorPath } from "./aas-drawer.ts";
import type { PagingResult } from "./pagination.ts";
import { AasSubmodelElements, DataTypeDef, KeyTypes } from "@open-dpp/dto";
import { omit } from "lodash";
import { ref, toRaw } from "vue";
import { EditorMode, useAasDrawer } from "./aas-drawer.ts";
import { usePagination } from "./pagination.ts";

interface AasEditorProps {
  id: string;
  aasNamespace: AasNamespace;
  initialSelectedKeys?: string;
  initialCursor?: string;
  changeQueryParams: (params: Record<string, string>) => void;
  errorHandlingStore: IErrorHandlingStore;
  selectedLanguage: LanguageType;
}
export function useAasEditor({
  id,
  aasNamespace,
  initialSelectedKeys,
  initialCursor,
  changeQueryParams,
  errorHandlingStore,
  selectedLanguage,
}: AasEditorProps) {
  const submodels = ref<TreeNode[]>();
  const selectedKeys = ref<TreeTableSelectionKeys | null>();

  const onHideDrawer = () => {
    selectedKeys.value = null;
    changeQueryParams({ edit: undefined });
  };

  const drawer = useAasDrawer({ onHideDrawer });

  const loading = ref(false);
  const submodelElementsToAdd = ref<MenuItem[]>([]);

  const buildAddSubmodelElementMenu = (node: TreeNode) => {
    const path = toRaw(node.data.path);
    submodelElementsToAdd.value = [
      {
        label: "Textfeld hinzufügen",
        icon: "pi pi-pencil",
        command: () => {
          drawer.openDrawer({
            type: KeyTypes.Property,
            data: { valueType: DataTypeDef.String },
            mode: EditorMode.CREATE,
            title: "Textfeld hinzufügen",
            path,
            callback: async (data: PropertyRequestDto) =>
              createProperty(path, data),
          });
        },
      },
    ];
  };

  const findTreeNodeByKey = (key: string, treeNodes: TreeNode[] = submodels.value): TreeNode | undefined => {
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

  const selectTreeNode = (key: string) => {
    if (submodels.value) {
      const node = findTreeNodeByKey(key);
      if (!node) {
        errorHandlingStore.logErrorWithNotification("Fails to select node");
        return;
      }
      selectedKeys.value = { [key]: true };

      drawer.openDrawer({
        type: node.data.modelType,
        data: toRaw(node.data.plain),
        title: node.data.idShort,
        mode: EditorMode.EDIT,
        path: toRaw(node.data.path),
      });

      changeQueryParams({ edit: key });
    }
  };

  const translateDisplayName = (displayName: LanguageTextDto[]): string | undefined => {
    return displayName.find(d => d.language === selectedLanguage)?.text;
  };

  const getVisualType = (modelType: string, valueType?: string): string => {
    if (modelType === AasSubmodelElements.Submodel || modelType === AasSubmodelElements.SubmodelElementCollection) {
      return "Abschnitt";
    }
    if (modelType === AasSubmodelElements.Property) {
      if (valueType === DataTypeDef.String) {
        return "Textfeld";
      }
    }
    return modelType;
  };

  const convertSubmodelsToTree = (submodels: SubmodelResponseDto[]) => {
    return submodels.map(submodel => ({
      key: submodel.id,
      data: {
        label: translateDisplayName(submodel.displayName) ?? submodel.idShort,
        type: getVisualType(submodel.modelType, submodel.valueType),
        modelType: KeyTypes.Submodel,
        plain: omit(submodel, "submodelElements"),
        path: { submodelId: submodel.id },
      },
      children: submodel.submodelElements.map(submodelElement => ({
        key: `${submodel.idShort}.${submodelElement.idShort}`,
        data: {
          type: getVisualType(submodelElement.modelType, submodelElement.valueType),
          label: translateDisplayName(submodelElement.displayName) ?? submodelElement.idShort,
          modelType: submodelElement.modelType,
          plain: submodelElement,
          path: {
            submodelId: submodel.id,
            idShortPath: `${submodel.idShort}.${submodelElement.idShort}`,
          },
        },
      })),
    }));
  };

  const fetchSubmodels = async (
    pagingParams: PagingParamsDto,
  ): Promise<PagingResult> => {
    loading.value = true;
    const response = await aasNamespace.getSubmodels(id, pagingParams);
    submodels.value = convertSubmodelsToTree(response.data.result);
    loading.value = false;
    return response.data;
  };

  const pagination
    = usePagination({ initialCursor, limit: 10, fetchCallback: fetchSubmodels, changeQueryParams });

  const createSubmodel = async () => {
    async function createCallback(data: SubmodelRequestDto) {
      const response = await aasNamespace.createSubmodel(id, data);
      if (response.status === 201) {
        await pagination.reloadCurrentPage();
        drawer.hideDrawer();
      }
    }
    drawer.openDrawer({
      type: KeyTypes.Submodel,
      data: {},
      title: "Abschnitt hinzufügen",
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
        { modelType: AasSubmodelElements.Property, ...data },
      );
      if (response.status === 201) {
        await pagination.reloadCurrentPage();
        drawer.hideDrawer();
      }
    }
  }

  async function init() {
    await pagination.nextPage();
    if (initialSelectedKeys) {
      await selectTreeNode(initialSelectedKeys);
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
