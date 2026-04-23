import type { RouteLocationNormalizedGeneric, RouteRecordRaw } from "vue-router";
import { localizedBreadcrumb } from "../../../lib/breadcrumbs.ts";
import { useLayoutStore } from "../../../stores/layout";

export const PRESENTATION_VIEW: RouteRecordRaw = {
  path: ":permalink",
  name: "PRESENTATION_VIEW",
  component: () => import("../../../view/presentation/View.vue"),
  beforeEnter: async (to: RouteLocationNormalizedGeneric) => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = await presentationBreadcrumbs(to);
  },
  meta: {
    layout: "presentation",
    public: true,
  },
};

function presentationBreadcrumbs(to: RouteLocationNormalizedGeneric) {
  return [
    {
      name: localizedBreadcrumb("presentation.productpass"),
      route: PRESENTATION_VIEW,
      params: to.params,
    },
  ];
}

export const PRESENTATION_404: RouteRecordRaw = {
  path: "404",
  name: "PRESENTATION_404",
  component: () => import("../../../view/presentation/404.vue"),
  beforeEnter: async (to: RouteLocationNormalizedGeneric) => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = await presentationBreadcrumbs(to);
  },
  meta: {
    layout: "presentation",
    public: true,
  },
};

export const PRESENTATION_VIEW_CHAT: RouteRecordRaw = {
  path: ":permalink/chat",
  name: "PRESENTATION_VIEW_CHAT",
  component: () => import("../../../view/presentation/Chat.vue"),
  beforeEnter: async (to: RouteLocationNormalizedGeneric) => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = await presentationBreadcrumbs(to);
  },
  meta: {
    layout: "presentation",
    public: true,
  },
};

export const PRESENTATION_PARENT: RouteRecordRaw = {
  path: "/p",
  children: [PRESENTATION_404, PRESENTATION_VIEW, PRESENTATION_VIEW_CHAT],
};

// Legacy /presentation/* URLs predate the /p/ rename (commit 970ae00f) and are
// already in the wild via v0.4.0 QR codes. The shim component bounces the
// browser through the backend UPI redirect controller so old UUIDs resolve to
// the correct permalink. Registered before PRESENTATION_PARENT so its prefix
// can't be shadowed by any future /presentation* addition.
export const PRESENTATION_LEGACY_REDIRECT: RouteRecordRaw = {
  path: "/presentation/:legacyPath(.*)*",
  name: "PRESENTATION_LEGACY_REDIRECT",
  component: () => import("../../../view/presentation/LegacyPresentationRedirect.vue"),
  meta: {
    layout: "none",
    public: true,
  },
};

export const PRESENTATION_ROUTES = [PRESENTATION_LEGACY_REDIRECT, PRESENTATION_PARENT];
