import type { SubmodelResponseDto } from "@open-dpp/dto";
import { SubmodelJsonSchema } from "@open-dpp/dto";
import { computed, ref } from "vue";
import IssueEditor from "../components/aas/IssueEditor.vue";
import ProjectEditor from "../components/aas/ProjectEditor.vue";
import SubmodelEditor from "../components/aas/SubmodelEditor.vue";

export type SubmodelEditorProps = Omit<SubmodelResponseDto, "submodelElements">;

interface EditorDataMap {
  issue: Issue;
  project: Project;
  Submodel: SubmodelEditorProps;
}
export type EditorType = "issue" | "project" | "Submodel";

export interface Issue {
  id: string;
  title: string;
  assigneeId?: string;
}

export interface Project {
  id: string;
  name: string;
  visibility: "public" | "private";
}
export function useAasDrawer() {
  const drawerHeader = ref<string>("");
  const drawerVisible = ref(false);
  const activeEditor = ref<EditorType | null>(null);
  const activeData = ref<Issue | Project | SubmodelEditorProps | null>(null);

  const openDrawer = <K extends EditorType>(
    type: K,
    data: EditorDataMap[K],
    title: string,
  ) => {
    activeEditor.value = type;
    activeData.value = structuredClone(data);
    drawerHeader.value = title;
    drawerVisible.value = true;
  };

  const editorVNode = computed(() => {
    if (!activeEditor.value || !activeData.value)
      return null;

    switch (activeEditor.value) {
      case "issue":
        return {
          component: IssueEditor,
          props: {
            data: activeData.value as Issue,
          },
        };

      case "project":
        return {
          component: ProjectEditor,
          props: {
            data: activeData.value as Project,
          },
        };
      case "Submodel":
        return {
          component: SubmodelEditor,
          props: {
            data: SubmodelJsonSchema.omit({ submodelElements: true }).parse(activeData.value),
          },
        };
      default:
        return null;
    }
  });

  return { openDrawer, drawerHeader, drawerVisible, editorVNode };
}
