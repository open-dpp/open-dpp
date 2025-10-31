import type { RouteLocationNormalizedGeneric, RouteRecordRaw } from "vue-router";
import { localizedBreadcrumb } from "../../lib/breadcrumbs";
import { useLayoutStore } from "../../stores/layout";

export const Analytics: RouteRecordRaw = {
  path: "",
  name: "Analytics",
  props: true,
  component: () => import("../../view/analytics/AnalyticsView.vue"),
  beforeEnter: (to: RouteLocationNormalizedGeneric) => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = analyticsBreadcrumbs(to);
  },
};

export function analyticsBreadcrumbs(to: RouteLocationNormalizedGeneric) {
  return [
    {
      name: localizedBreadcrumb("analytics.analytics"),
      route: Analytics,
      params: to.params,
    },
  ];
}

export const ORGANIZATION_ANALYTICS_PARENT: RouteRecordRaw = {
  path: "analytics",
  children: [Analytics],
};
