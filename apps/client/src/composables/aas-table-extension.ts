import type { AasNamespace } from "@open-dpp/api-client";

import type { DataTypeDefType, PropertyRequestDto } from "@open-dpp/dto";
import type { MenuItem, MenuItemCommandEvent } from "primevue/menuitem";
import type { Ref } from "vue";
import type { IErrorHandlingStore } from "../stores/error.handling.ts";
import type {
  AasEditorPath,
  EditorType,
  OpenDrawerCallback,
  SubmodelElementListEditorProps,
} from "./aas-drawer.ts";
import { AasSubmodelElements, DataTypeDef, KeyTypes, SubmodelElementListJsonSchema, SubmodelElementSchema } from "@open-dpp/dto";
import { ref } from "vue";
import { EditorMode } from "./aas-drawer.ts";

interface AasTableExtensionProps {
  id: string;
  pathToList: AasEditorPath;
  aasNamespace: AasNamespace;
  errorHandlingStore: IErrorHandlingStore;
  openDrawer: OpenDrawerCallback<EditorType, "CREATE" | "EDIT">;
  translate: (label: string, ...args: unknown[]) => string;
}

export interface IAasTableExtension {
  columnsToAdd: Ref<MenuItem[]>;
}

export function useAasTableExtension({
  id,
  pathToList,
  aasNamespace,
  errorHandlingStore,
  openDrawer,
  translate,
}: AasTableExtensionProps): IAasTableExtension {
  const translatePrefix = "aasEditor";
  const columnsToAdd = ref<MenuItem[]>([]);

  function buildPropertyEntry(label: string, icon: string, valueType: DataTypeDefType) {
    return { label, icon, command: (_event: MenuItemCommandEvent) => {
      openDrawer({
        type: KeyTypes.Property,
        data: { valueType },
        mode: EditorMode.CREATE,
        title: label,
        path: pathToList,
        callback: async (data: PropertyRequestDto) => createPropertyColumn(data),
      });
    } };
  }

  const init = () => {
    columnsToAdd.value = [buildPropertyEntry(translate(`${translatePrefix}.textField`), "pi pi-pencil", DataTypeDef.String)];
  };

  async function createPropertyColumn(data: PropertyRequestDto) {
    const errorMessage = translate(`${translatePrefix}.table.errorAddColumn`);
    const callback = async (data: PropertyRequestDto) => {
      const requestBody = SubmodelElementSchema.parse({ modelType: AasSubmodelElements.Property, ...data });
      const response = await aasNamespace.addColumnToSubmodelElementList(id, pathToList.submodelId!, pathToList.idShortPath!, requestBody, {});
      if (response.status === 201) {
        await navigateBackToListView(pathToList, SubmodelElementListJsonSchema.parse(response.data));
      }
    };
    await errorHandlingStore.withErrorHandling(
      callback(data),
      { message: errorMessage },
    );
  }

  async function navigateBackToListView(path: AasEditorPath, newListData: SubmodelElementListEditorProps) {
    const formItemLabel = translate(`${translatePrefix}.submodelElementList`);
    const callback = async (data: any) => {
      await aasNamespace.modifySubmodelElement(id, path.submodelId!, path.idShortPath!, data);
    };
    openDrawer({
      type: KeyTypes.SubmodelElementList,
      data: newListData,
      mode: EditorMode.EDIT,
      title: translate(`${translatePrefix}.edit`, { formItem: formItemLabel }),
      path,
      callback,
    });
  }

  init();

  return {
    columnsToAdd,
  };
}
