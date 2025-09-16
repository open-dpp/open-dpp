import type { FunctionalComponent, HTMLAttributes, VNodeProps } from "vue";
import { SidebarContentType } from "../stores/draftSidebar";

export type SelectOption = {
  title: string;
  description: string;
  icon: FunctionalComponent<HTMLAttributes & VNodeProps>;
  background: string;
  type: string;
  sidebarType: SidebarContentType;
};
