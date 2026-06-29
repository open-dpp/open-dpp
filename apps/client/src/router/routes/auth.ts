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

export const EMAIL_CHANGE_REVOKE_CONFIRM: RouteRecordRaw = {
  path: "/account/email-change-revoke",
  name: "EmailChangeRevokeConfirm",
  component: () => import("../../view/auth/EmailChangeRevokeConfirmView.vue"),
  meta: {
    layout: "none",
    public: true,
  },
};

export const EMAIL_CHANGE_REVOKED: RouteRecordRaw = {
  path: "/account/email-change-revoked",
  name: "EmailChangeRevoked",
  component: () => import("../../view/auth/EmailChangeRevokedView.vue"),
  meta: {
    layout: "none",
    public: true,
  },
};

export const AUTH_ROUTES = [PROFILE, LOGOUT, EMAIL_CHANGE_REVOKE_CONFIRM, EMAIL_CHANGE_REVOKED];
