import type { RouteLocationNormalizedGeneric, RouteRecordRaw } from "vue-router";
import { localizedBreadcrumb } from "../../lib/breadcrumbs.ts";
import { useLayoutStore } from "../../stores/layout";
import { passportBreadcrumbs } from "./passports/passports.ts";

export const PASSPORT_PERMALINKS_LIST: RouteRecordRaw = {
  path: "permalinks",
  name: "passportPermalinks",
  component: () => import("../../view/permalinks/PermalinkListView.vue"),
  beforeEnter: async (to: RouteLocationNormalizedGeneric) => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = [
      ...(await passportBreadcrumbs(to)),
      {
        name: localizedBreadcrumb("permalink.list.label"),
        route: PASSPORT_PERMALINKS_LIST,
        params: to.params,
      },
    ];
  },
};
