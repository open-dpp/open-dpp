import { RouteRecordRaw } from 'vue-router';
import { useLayoutStore } from '../../stores/layout';
import { localizedBreadcrumb } from '../../lib/breadcrumbs';

export const PROFILE: RouteRecordRaw = {
  path: '/profile',
  name: 'Profile',
  component: () => import('../../view/Profile.vue'),
  beforeEnter: () => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = [
      { name: localizedBreadcrumb('user.profile'), route: PROFILE },
    ];
  },
};

export const LOGOUT: RouteRecordRaw = {
  path: '/logout',
  name: 'Logout',
  component: () => import('../../view/Logout.vue'),
};

export const AUTH_ROUTES = [PROFILE, LOGOUT];
