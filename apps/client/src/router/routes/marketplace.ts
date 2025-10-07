import type { RouteLocationNormalizedGeneric, RouteRecordRaw } from "vue-router";
import { localizedBreadcrumb } from "../../lib/breadcrumbs.ts";
import { useLayoutStore } from "../../stores/layout";

export const MARKETPLACE: RouteRecordRaw = {
  path: "",
  name: "Marketplace",
  component: () => import("../../view/marketplace/MarketplaceView.vue"),
  beforeEnter: (to: RouteLocationNormalizedGeneric) => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = marketplaceListBreadCrumbs(to);
  },
};

function marketplaceListBreadCrumbs(to: RouteLocationNormalizedGeneric) {
  return [
    { name: localizedBreadcrumb("marketplace.marketplace"), route: MARKETPLACE, params: to.params },
  ];
}

export const MARKETPLACE_PARENT: RouteRecordRaw = {
  path: "/marketplace",
  children: [MARKETPLACE],
};

export const MARKETPLACE_ROUTES = [MARKETPLACE_PARENT];
