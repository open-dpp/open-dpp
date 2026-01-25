import type { DataTypeDefType, PropertyRequestDto, SubmodelElementListResponseDto } from "@open-dpp/dto";
import type { MenuItem, MenuItemCommandEvent } from "primevue/menuitem";
import type { AasEditorPath } from "./aas-drawer.ts";
import type { IAasEditor } from "./aas-editor.ts";
import {
  AasSubmodelElements,

  DataTypeDef,
  KeyTypes,
  PropertyJsonSchema,
  SubmodelElementCollectionJsonSchema,

} from "@open-dpp/dto";
import { computed, ref, toRaw } from "vue";
import { EditorMode } from "./aas-drawer.ts";

interface AasListProps {
  initialList: SubmodelElementListResponseDto;
  path: AasEditorPath;
  aasEditor: IAasEditor;
}

export function useAasList({
  initialList,
  aasEditor,
  path,
}: AasListProps) {
  const list = ref<SubmodelElementListResponseDto>(initialList);
  const columns = computed(() => {
    if (list.value.value.length > 0 && list.value.value[0]?.modelType === AasSubmodelElements.SubmodelElementCollection) {
      const firstRow = SubmodelElementCollectionJsonSchema.parse(list.value.value[0]);
      return firstRow.value.filter(prop => prop.modelType === AasSubmodelElements.Property).map(
        prop => PropertyJsonSchema.parse(prop),
      );
    }
    return [];
  });
  const columnsToAdd = ref<MenuItem[]>(
    buildAddSubmodelElementMenu(),
  );

  async function createColumn(data: any) {
    aasEditor.createSubm(path.submodelId!, path.idShortPath!, data);
  }

  function buildAddSubmodelElementMenu() {
    function buildPropertyEntry(label: string, icon: string, valueType: DataTypeDefType): MenuItem {
      return { label, icon, command: (_event: MenuItemCommandEvent) => {
        aasEditor.openDrawer({
          type: KeyTypes.Property,
          data: { valueType },
          mode: EditorMode.CREATE,
          title: label,
          path: toRaw(path),
          callback: async (data: PropertyRequestDto) =>
            createColumn(data, path),
        });
      } };
    }
    return [
      buildPropertyEntry("Textfeld", "pi pi-pencil", DataTypeDef.String),
    ];
  };

  function addColumn(valueType: DataTypeDefType) {

  }
  return { columns, columnsToAdd };
}
