import type { RouteLocationNormalizedGeneric, RouteRecordRaw } from "vue-router";
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

export const TEMPLATE_ACTIVITY_HISTORY: RouteRecordRaw = {
  path: "activities",
  name: "templateActivities",
  component: () => import("../../../view/activity-history/TemplateActivityHistoryView.vue"),
  beforeEnter: async (to: RouteLocationNormalizedGeneric) => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = [
      ...(await templateBreadcrumbs(to)),
      {
        name: localizedBreadcrumb("activityHistory.label"),
        route: TEMPLATE_ACTIVITY_HISTORY,
      },
    ];
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
  children: [TEMPLATE, TEMPLATE_ACTIVITY_HISTORY],
};

export const ORGANIZATION_TEMPLATES_PARENT: RouteRecordRaw = {
  path: "templates",
  children: [TEMPLATES_LIST, TEMPLATE_PARENT],
};
