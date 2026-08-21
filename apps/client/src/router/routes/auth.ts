import type { RouteRecordRaw } from "vue-router";
import { localizedBreadcrumb } from "../../lib/breadcrumbs.ts";
import { useLayoutStore } from "../../stores/layout";

// Breadcrumbs navigate via route names, so each tab crumb points at its own
// nested route while the root crumb always leads back to the general tab.
function setProfileBreadcrumbs(tabTitleKey: string, tabRoute: RouteRecordRaw) {
  const layoutStore = useLayoutStore();
  layoutStore.breadcrumbs = [
    { name: localizedBreadcrumb("user.profile"), route: PROFILE_GENERAL },
    { name: localizedBreadcrumb(tabTitleKey), route: tabRoute },
  ];
}

export const PROFILE_GENERAL: RouteRecordRaw = {
  path: "",
  name: "Profile",
  component: () => import("../../view/profile/ProfileGeneralView.vue"),
  beforeEnter: () => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = [
      { name: localizedBreadcrumb("user.profile"), route: PROFILE_GENERAL },
    ];
  },
};

export const PROFILE_INVITATIONS: RouteRecordRaw = {
  path: "invitations",
  name: "ProfileInvitations",
  component: () => import("../../view/profile/ProfileInvitationsView.vue"),
  beforeEnter: () => setProfileBreadcrumbs("user.tabs.invitations", PROFILE_INVITATIONS),
};

export const PROFILE_API_KEYS: RouteRecordRaw = {
  path: "api-keys",
  name: "ProfileApiKeys",
  component: () => import("../../view/profile/ApiKeysView.vue"),
  beforeEnter: () => setProfileBreadcrumbs("user.tabs.apiKeys", PROFILE_API_KEYS),
};

export const PROFILE: RouteRecordRaw = {
  path: "/profile",
  component: () => import("../../view/profile/ProfileLayout.vue"),
  children: [PROFILE_GENERAL, PROFILE_INVITATIONS, PROFILE_API_KEYS],
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

export const EMAIL_VERIFIED: RouteRecordRaw = {
  path: "/email-verified",
  name: "EmailVerified",
  component: () => import("../../view/auth/EmailVerifiedView.vue"),
  meta: {
    layout: "none",
    public: true,
  },
};

export const AUTH_ROUTES = [
  PROFILE,
  LOGOUT,
  EMAIL_CHANGE_REVOKE_CONFIRM,
  EMAIL_CHANGE_REVOKED,
  EMAIL_VERIFIED,
];
