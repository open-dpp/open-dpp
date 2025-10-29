import type { RouteRecordRaw } from "vue-router";
import { createRouter, createWebHistory } from "vue-router";
import { authClient } from "../auth-client.ts";

import { useIndexStore } from "../stores";
import { useLayoutStore } from "../stores/layout";
import { AUTH_ROUTES } from "./routes/auth";
import { MARKETPLACE_ROUTES } from "./routes/marketplace";
import { MEDIA_ROUTES } from "./routes/media";
import { ORGANIZATION_ROUTES } from "./routes/organizations";
import { PRESENTATION_ROUTES } from "./routes/presentation/presentation";

// const MODE = import.meta.env.MODE;

export const routes: RouteRecordRaw[] = [
  {
    path: "/",
    redirect: () => {
      const indexStore = useIndexStore();
      const org = indexStore.selectedOrganization;

      if (org) {
        return `/organizations/${indexStore.selectedOrganization}/models`;
      }
      else {
        return "/organizations"; // fallback
      }
    },
  },
  {
    path: "/signin",
    name: "Signin",
    component: () => import("../view/auth/Signin.vue"),
    meta: {
      layout: "none",
      public: true,
      onlyAnonymous: true,
    },
  },
  {
    path: "/signout",
    name: "Signout",
    component: () => import("../view/Logout.vue"),
    meta: {
      layout: "none",
      public: true,
    },
  },
  {
    path: "/signup",
    name: "Signup",
    component: () => import("../view/auth/Signup.vue"),
    meta: {
      layout: "none",
      public: true,
      onlyAnonymous: true,
    },
  },
  {
    path: "/password-reset",
    name: "PasswordReset",
    component: () => import("../view/auth/PasswordReset.vue"),
    meta: {
      layout: "none",
      public: true,
      onlyAnonymous: true,
    },
  },
  {
    path: "/password-reset-request",
    name: "PasswordResetRequest",
    component: () => import("../view/auth/PasswordResetRequest.vue"),
    meta: {
      layout: "none",
      public: true,
      onlyAnonymous: true,
    },
  },
  ...AUTH_ROUTES,
  ...ORGANIZATION_ROUTES,
  ...MARKETPLACE_ROUTES,
  ...MEDIA_ROUTES,
  ...PRESENTATION_ROUTES,
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const layoutStore = useLayoutStore();
  layoutStore.isPageLoading = true;
  const session = authClient.useSession();
  const isSignedIn = session.value.data !== null;

  if (isSignedIn && to.meta?.onlyAnonymous) {
    next("/");
    return;
  }
  if (!isSignedIn && !to.meta?.public) {
    next("/signin");
    return;
  }

  next();
});

router.afterEach(async () => {
  const layoutStore = useLayoutStore();
  // await new Promise((resolve) => setTimeout(resolve, 75));
  layoutStore.isPageLoading = false;
});
