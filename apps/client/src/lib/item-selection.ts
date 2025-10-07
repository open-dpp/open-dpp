import type { FunctionalComponent, HTMLAttributes, VNodeProps } from "vue";
import type { SidebarContentType } from "../stores/draftSidebar";

export interface SelectOption {
  title: string;
  description: string;
  icon: FunctionalComponent<HTMLAttributes & VNodeProps>;
  background: string;
  type: string;
  sidebarType: SidebarContentType;
}
