import type { AasNamespace } from "@open-dpp/api-client";
import type { PagingParamsDto, PropertyRequestDto, SubmodelResponseDto } from "@open-dpp/dto";
import type { MenuItem } from "primevue/menuitem";
import type { TreeNode } from "primevue/treenode";
import type { AasEditorPath, EditorModeType, EditorType, OpenDrawerCallback } from "./aas-drawer.ts";
import {
  AasSubmodelElements,
  DataTypeDef,
  KeyTypes,

} from "@open-dpp/dto";
import { omit } from "lodash";
import { v4 as uuid4 } from "uuid";
import { ref, toRaw } from "vue";
import { EditorMode } from "./aas-drawer.ts";
import { usePagination } from "./pagination.ts";

export type Cursor = string | null;

export interface Page {
  from: number;
  to: number;
  itemCount: number;
  cursor: Cursor;
}

export interface PagingResult {
  paging_metadata: { cursor: Cursor };
  result: any[];
}
interface AasEditorProps {
  id: string;
  aasNamespace: AasNamespace;
  openDrawer: OpenDrawerCallback<EditorType, EditorModeType>;
  hideDrawer: () => void;
}
export function useAasEditor({ id, aasNamespace, openDrawer, hideDrawer }: AasEditorProps) {
  const submodels = ref<TreeNode[]>();

  const loading = ref(false);
  const submodelElementsToAdd = ref<MenuItem[]>([
  ]);

  const buildAddSubmodelElementMenu = (node: TreeNode) => {
    const path = toRaw(node.data.path);
    submodelElementsToAdd.value = [
      {
        label: "Textfeld hinzufügen",
        icon: "pi pi-pencil",
        command: () => {
          openDrawer({
            type: KeyTypes.Property,
            data: { valueType: DataTypeDef.String, idShort: "test" },
            mode: EditorMode.CREATE,
            title: "Textfeld hinzufügen",
            path,
            callback: async (data: PropertyRequestDto) => createProperty(path, data),
          });
        },
      },
    ];
  };

  const convertSubmodelsToTree = (submodels: SubmodelResponseDto[]) => {
    return submodels.map(submodel => ({
      key: submodel.id,
      data: {
        idShort: submodel.idShort,
        modelType: KeyTypes.Submodel,
        plain: omit(submodel, "submodelElements"),
        path: { submodelId: submodel.id },
      },
      children: submodel.submodelElements.map(submodelElement => ({
        key: `${submodel.idShort}.${submodelElement.idShort}`,
        data: {
          idShort: submodelElement.idShort,
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

  const { previousPage, nextPage, currentPage, reloadCurrentPage }
    = usePagination({ limit: 10, fetchCallback: fetchSubmodels });

  const createSubmodel = async () => {
    const response = await aasNamespace.createSubmodel(id, {
      idShort: uuid4(),
    });
    if (response.status === 201) {
      await reloadCurrentPage();
    }
  };

  async function createProperty(path: AasEditorPath, data: PropertyRequestDto) {
    console.log("Calling create propert");
    const response = await aasNamespace.createSubmodelElement(
      id,
      path.submodelId,
      { modelType: AasSubmodelElements.Property, ...data },
    );
    if (response.status === 201) {
      await reloadCurrentPage();
      hideDrawer();
    }
  };

  return { submodels, submodelElementsToAdd, buildAddSubmodelElementMenu, nextPage, createSubmodel, createProperty, loading };
};
