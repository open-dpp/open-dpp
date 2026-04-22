import type { RouteLocationNormalizedGeneric, RouteRecordRaw } from "vue-router";
import { localizedBreadcrumb } from "../../lib/breadcrumbs.ts";
import { useLayoutStore } from "../../stores/layout";
import { ORGANIZATION_ANALYTICS_PARENT } from "./analytics.ts";
import { ORGANIZATION_INTEGRATIONS_PARENT } from "./integrations";
import { ORGANIZATION_PASSPORTS_PARENT } from "./passports/passports.ts";
import { ORGANIZATION_TEMPLATES_PARENT } from "./templates/templates.ts";

export const ORGANIZATION_LIST: RouteRecordRaw = {
  redirect: "/profile",
  path: "",
};

function organizationListBreadCrumbs(to: RouteLocationNormalizedGeneric) {
  return [
    {
      name: localizedBreadcrumb("organizations.organizations"),
      route: ORGANIZATION_LIST,
      params: to.params,
    },
  ];
}

export const ORGANIZATION_CREATE: RouteRecordRaw = {
  path: "create",
  name: "OrganizationCreate",
  component: () => import("../../view/organizations/CreateOrganizationView.vue"),
  beforeEnter: (to: RouteLocationNormalizedGeneric) => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = organizationListBreadCrumbs(to);
  },
};

export const ORGANIZATION: RouteRecordRaw = {
  path: "",
  name: "Organization",
  props: true,
  component: () => import("../../view/organizations/OrganizationSettingsView.vue"),
  beforeEnter: (to: RouteLocationNormalizedGeneric) => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = [
      {
        name: localizedBreadcrumb("organizations.settings.title"),
        route: ORGANIZATION,
        params: to.params,
      },
    ];
  },
};

export const ORGANIZATION_MEMBERS: RouteRecordRaw = {
  path: "members",
  name: "OrganizationMembers",
  component: () => import("../../view/organizations/OrganizationMembersView.vue"),
  beforeEnter: (to: RouteLocationNormalizedGeneric) => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = [
      {
        name: localizedBreadcrumb("members.members"),
        route: ORGANIZATION_MEMBERS,
        params: to.params,
      },
    ];
  },
};
export const ORGANIZATION_PARENT: RouteRecordRaw = {
  path: ":organizationId",
  children: [
    ORGANIZATION,
    ORGANIZATION_MEMBERS,
    ORGANIZATION_TEMPLATES_PARENT,
    ORGANIZATION_PASSPORTS_PARENT,
    ORGANIZATION_INTEGRATIONS_PARENT,
    ORGANIZATION_ANALYTICS_PARENT,
  ],
};

export const ORGANIZATIONS_PARENT: RouteRecordRaw = {
  path: "/organizations",
  children: [ORGANIZATION_LIST, ORGANIZATION_CREATE, ORGANIZATION_PARENT],
};

export const ORGANIZATION_ROUTES = [ORGANIZATIONS_PARENT];
