import { RouteLocationNormalizedGeneric, RouteRecordRaw } from 'vue-router';
import { useLayoutStore } from '../../stores/layout';
import { localizedBreadcrumb } from '../../lib/breadcrumbs';

export const analyticsBreadcrumbs = (to: RouteLocationNormalizedGeneric) => [
  {
    name: localizedBreadcrumb('analytics.analytics'),
    route: Analytics,
    params: to.params,
  },
];

export const Analytics: RouteRecordRaw = {
  path: '',
  name: 'Analytics',
  props: true,
  component: () => import('../../view/analytics/AnalyticsView.vue'),
  beforeEnter: (to: RouteLocationNormalizedGeneric) => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = analyticsBreadcrumbs(to);
  },
};

export const ORGANIZATION_ANALYTICS_PARENT: RouteRecordRaw = {
  path: 'analytics',
  children: [Analytics],
};
