import { RouteLocationNormalizedGeneric, RouteRecordRaw } from "vue-router";
import { useLayoutStore } from "../../stores/layout";
import { PRO_ALPHA_INTEGRATION_ID } from "../../const";

export const integrationBreadcrumbs = (to: RouteLocationNormalizedGeneric) => [
  {
    name: "Integrationen",
    route: INTEGRATIONS,
    params: to.params,
  },
];

const aasConnectionListBreadcrumbs = (to: RouteLocationNormalizedGeneric) => [
  ...integrationBreadcrumbs(to),
  {
    name: "Proalpha",
    route: AAS_CONNECTION_LIST,
    params: to.params,
  },
];

export const aasConnectionBreadcrumbs = (
  to: RouteLocationNormalizedGeneric,
) => [
  ...aasConnectionListBreadcrumbs(to),
  {
    name: to.params.connectionId + "" || "Verbindung",
    route: AAS_CONNECTION,
    params: to.params,
  },
];

export const aiIntegrationBreadcrumbs = (
  to: RouteLocationNormalizedGeneric,
) => [
  ...integrationBreadcrumbs(to),
  {
    name: "KI-Integrationen",
    route: AI_INTEGRATION,
    params: to.params,
  },
];

export const INTEGRATIONS: RouteRecordRaw = {
  path: "",
  name: "Integrationen",
  component: () => import("../../view/integrations/IntegrationView.vue"),
  beforeEnter: (to: RouteLocationNormalizedGeneric) => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = integrationBreadcrumbs(to);
  },
};

export const AI_INTEGRATION: RouteRecordRaw = {
  path: "ai-integration",
  name: "KI-Integration",
  component: () => import("../../view/integrations/AiIntegrationView.vue"),
  beforeEnter: (to: RouteLocationNormalizedGeneric) => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = aiIntegrationBreadcrumbs(to);
  },
};

export const AAS_CONNECTION_LIST: RouteRecordRaw = {
  path: "",
  name: "Verbindungen",
  component: () => import("../../view/integrations/ConnectionListView.vue"),
  beforeEnter: (to: RouteLocationNormalizedGeneric) => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = aasConnectionListBreadcrumbs(to);
  },
};

export const AAS_CONNECTION: RouteRecordRaw = {
  path: ":connectionId",
  name: "Verbindung",
  component: () => import("../../view/integrations/ConnectionView.vue"),
  beforeEnter: (to: RouteLocationNormalizedGeneric) => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = aasConnectionBreadcrumbs(to);
  },
};

export const AAS_CONNECTION_CREATE: RouteRecordRaw = {
  path: "create",
  name: "Verbindung erstellen",
  component: () => import("../../view/integrations/CreateConnectionView.vue"),
  beforeEnter: (to: RouteLocationNormalizedGeneric) => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = [
      ...aasConnectionListBreadcrumbs(to),
      {
        name: "Erstellen",
        route: AAS_CONNECTION_CREATE,
        params: to.params,
      },
    ];
  },
};

const PRO_ALPHA_CONNECTIONS_PARENT: RouteRecordRaw = {
  path: `connections`,
  children: [AAS_CONNECTION_CREATE, AAS_CONNECTION],
};

const PRO_ALPHA_INTEGRATION_PARENT: RouteRecordRaw = {
  path: `${PRO_ALPHA_INTEGRATION_ID}`,
  children: [AAS_CONNECTION_LIST, PRO_ALPHA_CONNECTIONS_PARENT],
};

export const ORGANIZATION_INTEGRATIONS_PARENT: RouteRecordRaw = {
  path: "integrations",
  children: [INTEGRATIONS, PRO_ALPHA_INTEGRATION_PARENT, AI_INTEGRATION],
};
