import { RouteLocationNormalizedGeneric, RouteRecordRaw } from 'vue-router';
import { useLayoutStore } from '../../../stores/layout';
import { localizedBreadcrumb } from '../../../lib/breadcrumbs';

const presentationBreadcrumbs = (to: RouteLocationNormalizedGeneric) => [
  {
    name: localizedBreadcrumb('presentation.productpass'),
    route: PRESENTATION_VIEW,
    params: to.params,
  },
];

export const PRESENTATION_404: RouteRecordRaw = {
  path: '404',
  name: 'PRESENTATION_404',
  component: () => import('../../../view/presentation/404.vue'),
  beforeEnter: async (to: RouteLocationNormalizedGeneric) => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = await presentationBreadcrumbs(to);
  },
  meta: {
    layout: 'presentation',
  },
};

export const PRESENTATION_VIEW: RouteRecordRaw = {
  path: ':permalink',
  name: 'PRESENTATION_VIEW',
  component: () => import('../../../view/presentation/View.vue'),
  beforeEnter: async (to: RouteLocationNormalizedGeneric) => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = await presentationBreadcrumbs(to);
  },
  meta: {
    layout: 'presentation',
  },
};

export const PRESENTATION_VIEW_CHAT: RouteRecordRaw = {
  path: ':permalink/chat',
  name: 'PRESENTATION_VIEW_CHAT',
  component: () => import('../../../view/presentation/Chat.vue'),
  beforeEnter: async (to: RouteLocationNormalizedGeneric) => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = await presentationBreadcrumbs(to);
  },
  meta: {
    layout: 'presentation',
  },
};

export const PRESENTATION_PARENT: RouteRecordRaw = {
  path: '/presentation',
  children: [PRESENTATION_404, PRESENTATION_VIEW, PRESENTATION_VIEW_CHAT],
};

export const PRESENTATION_ROUTES = [PRESENTATION_PARENT];
