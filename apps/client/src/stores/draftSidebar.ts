import type { Component, DefineComponent } from "vue";
import { defineStore } from "pinia";
import { markRaw, ref, shallowRef } from "vue";
import DataFieldForm from "../components/template-drafts/DataFieldForm.vue";
import DataFieldSelection from "../components/template-drafts/DataFieldSelection.vue";
import SectionForm from "../components/template-drafts/SectionForm.vue";
import SectionSelection from "../components/template-drafts/SectionSelection.vue";

export enum SidebarContentType {
  SECTION_SELECTION = "SECTION_SELECTION",
  DATA_FIELD_SELECTION = "DATA_FIELD_SELECTION",
  SECTION_FORM = "SECTION_FORM",
  DATA_FIELD_FORM = "DATA_FIELD_FORM",
}
type Comp = Component | DefineComponent;
type CompProps = Record<string, unknown>;
export const useDraftSidebarStore = defineStore("draftSidebar", () => {
  const isOpen = ref<boolean>(false);
  const title = ref<string>("Title");
  const subTitle = ref<string>("Sub Title");

  const content = shallowRef<Comp | null>(null);
  const contentProps = ref<CompProps>({});

  const sidebarContent = [
    {
      type: SidebarContentType.SECTION_SELECTION,
      title: "Abschnitt hinzufügen",
      subTitle: "Auswahl",
      content: SectionSelection,
    },
    {
      type: SidebarContentType.DATA_FIELD_SELECTION,
      title: "Datenfeld hinzufügen",
      subTitle: "Auswahl",
      content: DataFieldSelection,
    },
    {
      type: SidebarContentType.SECTION_FORM,
      title: "Abschnitt",
      subTitle: "Konfiguration",
      content: SectionForm,
    },
    {
      type: SidebarContentType.DATA_FIELD_FORM,
      title: "Datenfeld",
      subTitle: "Konfiguration",
      content: DataFieldForm,
    },
  ];

  const setContentWithProps = (
    type: SidebarContentType,
    newProps: CompProps,
  ) => {
    const found = sidebarContent.find(s => s.type === type);
    if (!found) {
      throw new Error(`Not supported sidebar content type ${type}`);
    }
    content.value = markRaw(found.content);
    title.value = found.title;
    subTitle.value = found.subTitle;
    contentProps.value = newProps;
  };

  const open = (type: SidebarContentType, initProps: CompProps) => {
    setContentWithProps(type, initProps);
    isOpen.value = true;
  };

  const close = () => {
    isOpen.value = false;
  };

  return {
    title,
    subTitle,
    content,
    isOpen,
    contentProps,
    open,
    setContentWithProps,
    close,
  };
});
