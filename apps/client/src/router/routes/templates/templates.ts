import type {
  RouteLocationNormalizedGeneric,
  RouteRecordRaw,
} from "vue-router";
import { localizedBreadcrumb } from "../../../lib/breadcrumbs.ts";
import { useLayoutStore } from "../../../stores/layout";

export const TEMPLATES_LIST: RouteRecordRaw = {
  path: "",
  name: "templates",
  component: () => import("../../../view/templates/TemplateView.vue"),
  beforeEnter: async (to: RouteLocationNormalizedGeneric) => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = await templatesListBreadcrumbs(to);
  },
};

async function templatesListBreadcrumbs(to: RouteLocationNormalizedGeneric) {
  return [
    {
      name: localizedBreadcrumb("templates.label"),
      route: TEMPLATES_LIST,
      params: to.params,
    },
  ];
}

export const ORGANIZATION_TEMPLATES_PARENT: RouteRecordRaw = {
  path: "templates",
  children: [TEMPLATES_LIST],
};
