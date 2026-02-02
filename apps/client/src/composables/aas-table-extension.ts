import type { AasNamespace } from "@open-dpp/api-client";

import type { DataTypeDefType, LanguageType, PropertyRequestDto, SubmodelElementListResponseDto } from "@open-dpp/dto";
import type { MenuItem, MenuItemCommandEvent } from "primevue/menuitem";
import type { ComputedRef, Ref } from "vue";
import type { IErrorHandlingStore } from "../stores/error.handling.ts";
import type {
  AasEditorPath,
  EditorType,
  OpenDrawerCallback,
  SubmodelElementListEditorProps,
} from "./aas-drawer.ts";
import {

  AasSubmodelElements,

  DataTypeDef,
  KeyTypes,
  Language,
  SubmodelElementCollectionJsonSchema,
  SubmodelElementListJsonSchema,
  SubmodelElementSchema,

} from "@open-dpp/dto";
import { computed, ref } from "vue";
import { EditorMode } from "./aas-drawer.ts";

interface AasTableExtensionProps {
  id: string;
  listData: SubmodelElementListResponseDto;
  pathToList: AasEditorPath;
  aasNamespace: AasNamespace;
  errorHandlingStore: IErrorHandlingStore;
  openDrawer: OpenDrawerCallback<EditorType, "CREATE" | "EDIT">;
  translate: (label: string, ...args: unknown[]) => string;
  selectedLanguage: LanguageType;
}

interface Column { idShort: string; label: string }
export interface IAasTableExtension {
  columnsToAdd: Ref<MenuItem[]>;
  columns: ComputedRef<Column[]>;
}

export function useAasTableExtension({
  id,
  pathToList,
  listData,
  aasNamespace,
  errorHandlingStore,
  openDrawer,
  translate,
  selectedLanguage,
}: AasTableExtensionProps): IAasTableExtension {
  const translatePrefix = "aasEditor";
  const columnsToAdd = ref<MenuItem[]>([]);

  function buildPropertyEntry(fieldLabel: string, icon: string, valueType: DataTypeDefType) {
    const addColumLabel = translate("aasEditor.table.addFieldAsColumn", { field: selectedLanguage === Language.de ? fieldLabel : fieldLabel.toLowerCase() });
    return { label: fieldLabel, icon, command: (_event: MenuItemCommandEvent) => {
      openDrawer({
        type: KeyTypes.Property,
        data: { valueType },
        mode: EditorMode.CREATE,
        title: addColumLabel,
        path: pathToList,
        callback: async (data: PropertyRequestDto) => createPropertyColumn(data),
        asColumn: true,
      });
    } };
  }

  const init = () => {
    columnsToAdd.value = [buildPropertyEntry(translate(`${translatePrefix}.textField`), "pi pi-pencil", DataTypeDef.String)];
  };

  const columns = computed<Column[]>((): Column[] => {
    if (listData.value.length > 0) {
      return SubmodelElementCollectionJsonSchema.parse(listData.value[0]).value.map(v => ({
        idShort: v.idShort,
        label: v.displayName.find(d => d.language === selectedLanguage)?.text ?? v.idShort,
      }));
    }
    return [];
  });

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
    columns,
    columnsToAdd,
  };
}
