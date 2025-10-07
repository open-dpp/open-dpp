import type { RouteRecordRaw } from "vue-router";
import { localizedBreadcrumb } from "../../lib/breadcrumbs.ts";
import { useLayoutStore } from "../../stores/layout";

export const PROFILE: RouteRecordRaw = {
  path: "/profile",
  name: "Profile",
  component: () => import("../../view/Profile.vue"),
  beforeEnter: () => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = [{ name: localizedBreadcrumb("user.profile"), route: PROFILE }];
  },
};

export const LOGOUT: RouteRecordRaw = {
  path: "/logout",
  name: "Logout",
  component: () => import("../../view/Logout.vue"),
};

export const AUTH_ROUTES = [PROFILE, LOGOUT];
