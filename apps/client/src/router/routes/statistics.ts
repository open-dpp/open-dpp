import type { RouteLocationNormalizedGeneric, RouteRecordRaw } from "vue-router";
import { localizedBreadcrumb } from "../../lib/breadcrumbs.ts";
import { useLayoutStore } from "../../stores/layout";

export const STATISTICS: RouteRecordRaw = {
  path: "",
  name: "Auswertungen",
  props: true,
  component: () => import("../../view/underConstruction/StatisticDummy.vue"),
  beforeEnter: (to: RouteLocationNormalizedGeneric) => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = statisticBreadcrumbs(to);
  },
};

export function statisticBreadcrumbs(to: RouteLocationNormalizedGeneric) {
  return [
    {
      name: localizedBreadcrumb("statistics.statistics"),
      route: STATISTICS,
      params: to.params,
    },
  ];
}

export const ORGANIZATION_STATISTICS_PARENT: RouteRecordRaw = {
  path: "statistics",
  children: [STATISTICS],
};
