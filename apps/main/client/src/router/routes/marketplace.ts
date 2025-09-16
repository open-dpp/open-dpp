import { RouteLocationNormalizedGeneric, RouteRecordRaw } from "vue-router";
import { useLayoutStore } from "../../stores/layout";

const marketplaceListBreadCrumbs = (to: RouteLocationNormalizedGeneric) => [
  { name: "Marktplatz", route: MARKETPLACE, params: to.params },
];

export const MARKETPLACE: RouteRecordRaw = {
  path: "",
  name: "Marketplace",
  component: () => import("../../view/marketplace/MarketplaceView.vue"),
  beforeEnter: (to: RouteLocationNormalizedGeneric) => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = marketplaceListBreadCrumbs(to);
  },
};

export const MARKETPLACE_PARENT: RouteRecordRaw = {
  path: "/marketplace",
  children: [MARKETPLACE],
};

export const MARKETPLACE_ROUTES = [MARKETPLACE_PARENT];
