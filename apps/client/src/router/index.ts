import type { RouteRecordRaw } from "vue-router";
import { createRouter, createWebHistory } from "vue-router";
import { authClient } from "../auth-client.ts";

import { useIndexStore } from "../stores";
import { useLayoutStore } from "../stores/layout";
import { useOrganizationsStore } from "../stores/organizations.ts";
import { ADMIN_ROUTES } from "./routes/admin.ts";
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
  {
    path: "/accept-invitation/:id",
    name: "AcceptInvitationToOrganization",
    props: true,
    component: () => import("../view/organizations/AcceptInviteToOrganizationView.vue"),
    meta: {
      layout: "default",
      public: false,
      onlyAnonymous: false,
    },
  },
  ...AUTH_ROUTES,
  ...ORGANIZATION_ROUTES,
  ...MARKETPLACE_ROUTES,
  ...MEDIA_ROUTES,
  ...PRESENTATION_ROUTES,
  ...ADMIN_ROUTES,
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const layoutStore = useLayoutStore();

  // avoid loading page when only query params changed
  if (to.path !== from.path) {
    layoutStore.isPageLoading = true;
  }

  const { data: session } = await authClient.getSession();
  const isSignedIn = session !== null;

  if (isSignedIn && to.meta?.onlyAnonymous) {
    next("/");
    return;
  }
  if (!isSignedIn && !to.meta?.public) {
    const fullRedirectUrl = encodeURIComponent(window.location.origin + to.fullPath);
    next({
      name: "Signin",
      query: {
        redirect: fullRedirectUrl,
      },
    });
    return;
  }

  const organizationStore = useOrganizationsStore();
  const indexStore = useIndexStore();
  const paramOrganizationId = to.params.organizationId;
  if (paramOrganizationId) {
    const organization = organizationStore.organizations.find(o => o.id === paramOrganizationId);
    if (!organization) {
      next("/organizations");
      indexStore.selectOrganization(null);
      return;
    }
    indexStore.selectOrganization(organization.id);
  }

  next();
});

router.afterEach(async (to, from) => {
  const layoutStore = useLayoutStore();
  // avoid loading page when only query params changed
  if (to.path !== from.path) {
    layoutStore.isPageLoading = false;
  }
});
