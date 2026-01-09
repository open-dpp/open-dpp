import type {
  RouteLocationNormalizedGeneric,
  RouteRecordRaw,
} from "vue-router";
import { localizedBreadcrumb } from "../../lib/breadcrumbs.ts";
import { useLayoutStore } from "../../stores/layout";

export const ADMIN_BASE: RouteRecordRaw = {
  path: "",
  name: "Administration",
  component: () =>
    import("../../view/admin/OrganizationsAdminView.vue"),
  beforeEnter: (to: RouteLocationNormalizedGeneric) => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = adminListBreadCrumbs(to);
  },
};

function adminListBreadCrumbs(to: RouteLocationNormalizedGeneric) {
  return [
    {
      name: localizedBreadcrumb("organizations.organizations"),
      route: ADMIN_BASE,
      params: to.params,
    },
  ];
}

export const ADMIN_ORGANIZATIONS: RouteRecordRaw = {
  path: "organizations",
  name: "AdminOrganizationsListView",
  component: () =>
    import("../../view/admin/OrganizationsAdminView.vue"),
  beforeEnter: (to: RouteLocationNormalizedGeneric) => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = adminListBreadCrumbs(to);
  },
};

export const ADMIN_USERS: RouteRecordRaw = {
  path: "users",
  name: "AdminUsersListView",
  component: () =>
    import("../../view/admin/UsersAdminView.vue"),
  beforeEnter: (to: RouteLocationNormalizedGeneric) => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = adminListBreadCrumbs(to);
  },
};

export const ADMIN_PARENT: RouteRecordRaw = {
  path: "/admin",
  children: [ADMIN_BASE, ADMIN_ORGANIZATIONS, ADMIN_USERS],
};

export const ADMIN_ROUTES = [ADMIN_PARENT];
