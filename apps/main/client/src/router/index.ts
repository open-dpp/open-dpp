import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import keycloakIns from "../lib/keycloak";
import { keycloakDisabled } from "../const";
import { useLayoutStore } from "../stores/layout";

import { AUTH_ROUTES } from "./routes/auth";
import { ORGANIZATION_ROUTES } from "./routes/organizations";
import { useIndexStore } from "../stores";
import { MARKETPLACE_ROUTES } from "./routes/marketplace";
import { MEDIA_ROUTES } from "./routes/media";
import {PRESENTATION_ROUTES} from "./routes/presentation/presentation";

// const MODE = import.meta.env.MODE;

export const routes: RouteRecordRaw[] = [
  {
    path: "/",
    redirect: () => {
      const indexStore = useIndexStore();
      const org = indexStore.selectedOrganization;

      if (org) {
        return `/organizations/${indexStore.selectedOrganization}/models`;
      } else {
        return "/organizations"; // fallback
      }
    },
  },
  ...AUTH_ROUTES,
  ...ORGANIZATION_ROUTES,
  ...MARKETPLACE_ROUTES,
  ...MEDIA_ROUTES,
    ...PRESENTATION_ROUTES
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const layoutStore = useLayoutStore();
  layoutStore.isPageLoading = true;
  if (keycloakDisabled) {
    next();
  }
  if (!keycloakIns.authenticated) {
    await keycloakIns.login({
      redirectUri: `${window.location.origin}${to.fullPath}`,
    });
    next();
  } else {
    next();
  }
});

router.afterEach(async () => {
  const layoutStore = useLayoutStore();
  // await new Promise((resolve) => setTimeout(resolve, 75));
  layoutStore.isPageLoading = false;
});
