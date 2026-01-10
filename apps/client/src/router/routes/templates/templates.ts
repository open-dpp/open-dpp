import type {
  RouteLocationNormalizedGeneric,
  RouteRecordRaw,
} from "vue-router";
import { localizedBreadcrumb } from "../../../lib/breadcrumbs.ts";
import { useLayoutStore } from "../../../stores/layout";

export const TEMPLATES_LIST: RouteRecordRaw = {
  path: "",
  name: "templates",
  component: () => import("../../../view/templates/TemplateListView.vue"),
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

export const TEMPLATE: RouteRecordRaw = {
  path: "",
  name: "template",
  component: () => import("../../../view/templates/TemplateView.vue"),
  beforeEnter: async (to: RouteLocationNormalizedGeneric) => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = await templateBreadcrumbs(to);
  },
};

export async function templateBreadcrumbs(to: RouteLocationNormalizedGeneric) {
  const text = to.params.templateId ? String(to.params.templateId) : "Editor";
  return [
    ...(await templatesListBreadcrumbs(to)),
    {
      name: {
        text,
        localized: false,
      },
      route: TEMPLATE,
      params: to.params,
    },
  ];
}

const TEMPLATE_PARENT: RouteRecordRaw = {
  path: ":templateId",
  children: [TEMPLATE],
};

export const ORGANIZATION_TEMPLATES_PARENT: RouteRecordRaw = {
  path: "templates",
  children: [TEMPLATES_LIST, TEMPLATE_PARENT],
};
