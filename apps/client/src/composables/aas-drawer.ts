import type { FileResponseDto, KeyTypes, PropertyResponseDto, SubmodelElementCollectionResponseDto, SubmodelResponseDto } from "@open-dpp/dto";
import {
  KeyTypes as AasKeyTypes,
  FileJsonSchema,
  PropertyJsonSchema,
  SubmodelElementCollectionJsonSchema,
  SubmodelJsonSchema,
  ValueTypeSchema,

} from "@open-dpp/dto";
import { computed, ref } from "vue";
import { z } from "zod";
import FileCreateEditor from "../components/aas/FileCreateEditor.vue";
import FileEditor from "../components/aas/FileEditor.vue";
import PropertyCreateEditor from "../components/aas/PropertyCreateEditor.vue";
import PropertyEditor from "../components/aas/PropertyEditor.vue";
import SubmodelCreateEditor from "../components/aas/SubmodelCreateEditor.vue";
import SubmodelEditor from "../components/aas/SubmodelEditor.vue";
import SubmodelElementCollectionCreateEditor from "../components/aas/SubmodelElementCollectionCreateEditor.vue";
import SubmodelElementCollectionEditor from "../components/aas/SubmodelElementCollectionEditor.vue";

export type SubmodelEditorProps = SubmodelResponseDto;
const SubmodelBaseCreatePropsSchema = z.object({});
export type SubmodelCreateEditorProps = z.infer<
  typeof SubmodelBaseCreatePropsSchema
>;

export type SubmodelElementCollectionCreateEditorProps = z.infer<
  typeof SubmodelBaseCreatePropsSchema
>;

export type FileCreateEditorProps = z.infer<
  typeof SubmodelBaseCreatePropsSchema
>;

const PropertyCreateEditorPropsSchema = z.object({
  valueType: ValueTypeSchema,
});
export type PropertyEditorProps = PropertyResponseDto;
export type PropertyCreateEditorProps = z.infer<
  typeof PropertyCreateEditorPropsSchema
>;
export type FileEditorProps = FileResponseDto;
export type SubmodelElementCollectionEditorProps
  = SubmodelElementCollectionResponseDto;

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
    [AasKeyTypes.SubmodelElementCollection]: SubmodelElementCollectionCreateEditorProps;
    [AasKeyTypes.File]: FileCreateEditorProps;
  };
  [EditorMode.EDIT]: {
    [AasKeyTypes.Submodel]: SubmodelEditorProps;
    [AasKeyTypes.Property]: PropertyEditorProps;
    [AasKeyTypes.SubmodelElementCollection]: SubmodelElementCollectionEditorProps;
    [AasKeyTypes.File]: FileEditorProps;
  };
}

export type EditorType
  = | typeof KeyTypes.Submodel
    | typeof AasKeyTypes.Property
    | typeof AasKeyTypes.File
    | typeof AasKeyTypes.SubmodelElementCollection;

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
  const activeData = ref<any | null>(null);
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
        parse: data => SubmodelBaseCreatePropsSchema.parse(data),
      },
      [AasKeyTypes.Property]: {
        component: PropertyCreateEditor,
        parse: data => PropertyCreateEditorPropsSchema.parse(data),
      },
      [AasKeyTypes.SubmodelElementCollection]: {
        component: SubmodelElementCollectionCreateEditor,
        parse: data => SubmodelBaseCreatePropsSchema.parse(data),
      },
      [AasKeyTypes.File]: {
        component: FileCreateEditor,
        parse: data => SubmodelBaseCreatePropsSchema.parse(data),
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
      [AasKeyTypes.File]: {
        component: FileEditor,
        parse: data => FileJsonSchema.parse(data),
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
