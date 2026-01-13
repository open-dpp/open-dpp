import type {
  KeyTypes,
  PropertyResponseDto,
  SubmodelResponseDto,
} from "@open-dpp/dto";
import {
  KeyTypes as AasKeyTypes,
  PropertyJsonSchema,
  SubmodelElementCollectionJsonSchema,
  SubmodelJsonSchema,
  ValueTypeSchema,
} from "@open-dpp/dto";

import { data } from "autoprefixer";
import { computed, ref } from "vue";
import { z } from "zod";
import PropertyCreateEditor from "../components/aas/PropertyCreateEditor.vue";
import PropertyEditor from "../components/aas/PropertyEditor.vue";
import SubmodelCreateEditor from "../components/aas/SubmodelCreateEditor.vue";
import SubmodelEditor from "../components/aas/SubmodelEditor.vue";
import SubmodelElementCollectionEditor from "../components/aas/SubmodelElementCollectionEditor.vue";

export type SubmodelEditorProps = Omit<SubmodelResponseDto, "submodelElements">;
const SubmodelCreateEditorPropsSchema = z.object({
});
export type SubmodelCreateEditorProps = z.infer<typeof SubmodelCreateEditorPropsSchema>;

const PropertyCreateEditorPropsSchema = z.object({
  valueType: ValueTypeSchema,
});
export type PropertyEditorProps = PropertyResponseDto;
export type PropertyCreateEditorProps = z.infer<
  typeof PropertyCreateEditorPropsSchema
>;
export type SubmodelElementCollectionEditorProps = z.infer<
  typeof SubmodelElementCollectionJsonSchema
>;

export const EditorMode = {
  CREATE: "CREATE",
  EDIT: "EDIT",
} as const;
export const EditorModeEnum = z.enum(EditorMode);
export type EditorModeType = z.infer<typeof EditorModeEnum>;

interface EditorDataMap {
  [EditorMode.CREATE]: {
    [AasKeyTypes.Submodel]: SubmodelCreateEditorProps;
    [AasKeyTypes.Property]: PropertyCreateEditorProps;
    [AasKeyTypes.SubmodelElementCollection]: SubmodelElementCollectionEditorProps;
  };
  [EditorMode.EDIT]: {
    [AasKeyTypes.Submodel]: SubmodelEditorProps;
    [AasKeyTypes.Property]: PropertyEditorProps;
    [AasKeyTypes.SubmodelElementCollection]: SubmodelElementCollectionEditorProps;
  };
}

export type EditorType = typeof KeyTypes.Submodel | typeof KeyTypes.Property | typeof AasKeyTypes.SubmodelElementCollection;

export interface AasEditorPath {
  submodelId?: string;
  idShortPath?: string;
}

type callbackType = (data: any) => Promise<void>;

export type OpenDrawerCallback<
  K extends EditorType,
  M extends EditorModeType,
> = (config: {
  type: K;
  data: EditorDataMap[M][K];
  title: string;
  mode: M;
  path: AasEditorPath;
  callback?: callbackType;
}) => void;
interface AasDrawerProps {
  onHideDrawer: () => void;
}

export function useAasDrawer({ onHideDrawer }: AasDrawerProps) {
  const drawerHeader = ref<string>("");
  const drawerVisible = ref(false);
  const activeEditor = ref<EditorType | null>(null);
  const activeMode = ref<EditorModeType>(EditorMode.EDIT);
  const activeData = ref<
    any | null
  >(null);
  const activePath = ref<AasEditorPath>({ idShortPath: "" });
  const activeCallback = ref<callbackType | null>(null);

  const openDrawer: OpenDrawerCallback<EditorType, EditorModeType> = ({
    type,
    data,
    title,
    mode,
    path,
    callback,
  }) => {
    activeEditor.value = type;
    activeData.value = structuredClone(data);
    activeMode.value = structuredClone(mode);
    activePath.value = structuredClone(path);
    activeCallback.value = callback ?? null;
    drawerHeader.value = title;
    drawerVisible.value = true;
  };

  const Editors: Record<
    EditorModeType,
    Record<EditorType, { parse: (data: any) => void; component: any }>
  > = {
    [EditorMode.CREATE]: {
      [AasKeyTypes.Submodel]: {
        component: SubmodelCreateEditor,
        parse: data => SubmodelCreateEditorPropsSchema.parse(data),
      },
      [AasKeyTypes.Property]: {
        component: PropertyCreateEditor,
        parse: data => PropertyCreateEditorPropsSchema.parse(data),
      },
      [AasKeyTypes.SubmodelElementCollection]: {
        component: SubmodelElementCollectionEditor,
        parse: data => SubmodelElementCollectionJsonSchema.parse(data),
      },
    },
    [EditorMode.EDIT]: {
      [AasKeyTypes.Submodel]: {
        component: SubmodelEditor,
        parse: data => SubmodelJsonSchema.parse(data),
      },
      [AasKeyTypes.Property]: {
        component: PropertyEditor,
        parse: data => PropertyJsonSchema.parse(data),
      },
      [AasKeyTypes.SubmodelElementCollection]: {
        component: SubmodelElementCollectionEditor,
        parse: data => SubmodelElementCollectionJsonSchema.parse(data),
      },
    },
  };

  const editorVNode = computed(() => {
    if (!activeEditor.value || !activeData.value)
      return null;

    const foundEditor = Editors[activeMode.value][activeEditor.value];
    if (!foundEditor) {
      throw new Error(`Not supported editor type ${activeEditor.value}`);
    }

    return {
      component: foundEditor.component,
      props: {
        path: activePath.value,
        data: foundEditor.parse(activeData.value),
        callback: activeCallback.value,
      },
    };
  });

  const hideDrawer = () => {
    drawerVisible.value = false;
    onHideDrawer();
  };

  return { openDrawer, hideDrawer, drawerHeader, drawerVisible, editorVNode };
}
