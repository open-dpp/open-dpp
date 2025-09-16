import { RouteLocationNormalizedGeneric, RouteRecordRaw } from "vue-router";
import { useLayoutStore } from "../../stores/layout";
import { ORGANIZATION_MODELS_PARENT } from "./models/models";
import { ORGANIZATION_DRAFTS_PARENT } from "./product-data-model-drafts/drafts";
import { ORGANIZATION_INTEGRATIONS_PARENT } from "./integrations";
import { ORGANIZATION_STATISTICS_PARENT } from "./statistics";

const organizationListBreadCrumbs = (to: RouteLocationNormalizedGeneric) => [
  { name: "Organisationen", route: ORGANIZATION_LIST, params: to.params },
];

export const ORGANIZATION_LIST: RouteRecordRaw = {
  path: "",
  name: "Organizations",
  component: () =>
    import("../../view/organizations/SelectOrganizationView.vue"),
  beforeEnter: (to: RouteLocationNormalizedGeneric) => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = organizationListBreadCrumbs(to);
  },
};

export const ORGANIZATION_CREATE: RouteRecordRaw = {
  path: "create",
  name: "OrganizationCreate",
  component: () =>
    import("../../view/organizations/CreateOrganizationView.vue"),
  beforeEnter: (to: RouteLocationNormalizedGeneric) => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = organizationListBreadCrumbs(to);
  },
};

export const ORGANIZATION: RouteRecordRaw = {
  path: "",
  name: "Organization",
  props: true,
  component: () => import("../../view/organizations/OrganizationView.vue"),
};

export const ORGANIZATION_MEMBERS: RouteRecordRaw = {
  path: "members",
  name: "OrganizationMembers",
  props: true,
  component: () =>
    import("../../view/organizations/OrganizationMembersView.vue"),
  beforeEnter: (to: RouteLocationNormalizedGeneric) => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = [
      {
        name: "Mitglieder",
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
    ORGANIZATION_MODELS_PARENT,
    ORGANIZATION_DRAFTS_PARENT,
    ORGANIZATION_INTEGRATIONS_PARENT,
    ORGANIZATION_STATISTICS_PARENT,
  ],
};

export const ORGANIZATIONS_PARENT: RouteRecordRaw = {
  path: "/organizations",
  children: [ORGANIZATION_LIST, ORGANIZATION_CREATE, ORGANIZATION_PARENT],
};

export const ORGANIZATION_ROUTES = [ORGANIZATIONS_PARENT];
