import type { KeyTypes, PropertyResponseDto, SubmodelResponseDto } from "@open-dpp/dto";
import { KeyTypes as AasKeyTypes, PropertyJsonSchema, SubmodelJsonSchema, ValueTypeSchema } from "@open-dpp/dto";

import { computed, ref } from "vue";
import { z } from "zod";
import PropertyCreateEditor from "../components/aas/PropertyCreateEditor.vue";
import PropertyEditor from "../components/aas/PropertyEditor.vue";
import SubmodelCreateEditor from "../components/aas/SubmodelCreateEditor.vue";
import SubmodelEditor from "../components/aas/SubmodelEditor.vue";

export type SubmodelEditorProps = Omit<SubmodelResponseDto, "submodelElements">;

const PropertyCreateEditorPropsSchema = z.object({
  idShort: z.string(),
  valueType: ValueTypeSchema,
});
export type PropertyEditorProps = PropertyResponseDto;
export type PropertyCreateEditorProps = z.infer<typeof PropertyCreateEditorPropsSchema>;

export const EditorMode = {
  CREATE: "CREATE",
  EDIT: "EDIT",
} as const;
export const EditorModeEnum = z.enum(EditorMode);
export type EditorModeType = z.infer<typeof EditorModeEnum>;

interface EditorDataMap {
  [EditorMode.CREATE]: {
    [AasKeyTypes.Submodel]: SubmodelEditorProps;
    [AasKeyTypes.Property]: PropertyCreateEditorProps;
  };
  [EditorMode.EDIT]: {
    [AasKeyTypes.Submodel]: SubmodelEditorProps;
    [AasKeyTypes.Property]: PropertyEditorProps;
  };
}
export type EditorType = typeof KeyTypes.Submodel | typeof KeyTypes.Property;

export interface AasEditorPath { submodelId?: string; idShortPath?: string }

export type OpenDrawerCallback<K extends EditorType, M extends EditorModeType> = (config: {
  type: K;
  data: EditorDataMap[M][K];
  title: string;
  mode: M;
  path: AasEditorPath;
},
) => void;

export function useAasDrawer() {
  const drawerHeader = ref<string>("");
  const drawerVisible = ref(false);
  const activeEditor = ref<EditorType | null>(null);
  const activeMode = ref<EditorModeType>(EditorMode.EDIT);
  const activeData = ref<SubmodelEditorProps | PropertyCreateEditorProps | PropertyEditorProps | null>(null);
  const activePath = ref<AasEditorPath>({ idShortPath: "" });

  const openDrawer: OpenDrawerCallback<EditorType, EditorModeType> = (
    { type, data, title, mode, path },
  ) => {
    activeEditor.value = type;
    activeData.value = structuredClone(data);
    activeMode.value = structuredClone(mode);
    activePath.value = structuredClone(path);
    drawerHeader.value = title;
    drawerVisible.value = true;
  };

  const Editors: Record<EditorModeType, Record<EditorType, { parser: z.ZodTypeAny; component: any }>> = {
    [EditorMode.CREATE]: {
      [AasKeyTypes.Submodel]: { component: SubmodelCreateEditor, parser: SubmodelJsonSchema.omit({ submodelElements: true }) },
      [AasKeyTypes.Property]: { component: PropertyCreateEditor, parser: PropertyCreateEditorPropsSchema },
    },
    [EditorMode.EDIT]: {
      [AasKeyTypes.Submodel]: { component: SubmodelEditor, parser: SubmodelJsonSchema.omit({ submodelElements: true }) },
      [AasKeyTypes.Property]: { component: PropertyEditor, parser: PropertyJsonSchema },
    },
  };

  const editorVNode = computed(() => {
    if (!activeEditor.value || !activeData.value)
      return null;

    const foundEditor = Editors[activeMode.value][activeEditor.value];
    return {
      component: foundEditor.component,
      props: {
        path: activePath.value,
        data: foundEditor.parser.parse(activeData.value),
      },
    };
  });

  return { openDrawer, drawerHeader, drawerVisible, editorVNode };
}
