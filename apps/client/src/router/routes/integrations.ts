import type { RouteLocationNormalizedGeneric, RouteRecordRaw } from "vue-router";
import { localizedBreadcrumb } from "../../lib/breadcrumbs.ts";
import { useLayoutStore } from "../../stores/layout";

export const INTEGRATIONS: RouteRecordRaw = {
  path: "",
  name: "Integrationen",
  component: () => import("../../view/integrations/IntegrationView.vue"),
  beforeEnter: (to: RouteLocationNormalizedGeneric) => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = integrationBreadcrumbs(to);
  },
};

export function integrationBreadcrumbs(to: RouteLocationNormalizedGeneric) {
  return [
    {
      name: {
        text: "integrations.integrations",
        localized: true,
      },
      route: INTEGRATIONS,
      params: to.params,
    },
  ];
}

export const AI_INTEGRATION: RouteRecordRaw = {
  path: "ai-integration",
  name: "KI-Integration",
  component: () => import("../../view/integrations/AiIntegrationView.vue"),
  beforeEnter: (to: RouteLocationNormalizedGeneric) => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = aiIntegrationBreadcrumbs(to);
  },
};

export function aiIntegrationBreadcrumbs(to: RouteLocationNormalizedGeneric) {
  return [
    ...integrationBreadcrumbs(to),
    {
      name: localizedBreadcrumb("integrations.ai.label"),
      route: AI_INTEGRATION,
      params: to.params,
    },
  ];
}

export const ORGANIZATION_INTEGRATIONS_PARENT: RouteRecordRaw = {
  path: "integrations",
  children: [INTEGRATIONS, AI_INTEGRATION],
};
