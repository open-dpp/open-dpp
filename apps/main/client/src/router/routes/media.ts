import { RouteLocationNormalizedGeneric, RouteRecordRaw } from 'vue-router';
import { useLayoutStore } from '../../stores/layout';
import { localizedBreadcrumb } from '../../lib/breadcrumbs';

const filesListBreadCrumbs = (to: RouteLocationNormalizedGeneric) => [
  { name: localizedBreadcrumb('media.media'), route: MEDIA, params: to.params },
];

export const MEDIA: RouteRecordRaw = {
  path: '',
  name: 'Medien',
  component: () => import('../../view/media/MediaView.vue'),
  beforeEnter: (to: RouteLocationNormalizedGeneric) => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = filesListBreadCrumbs(to);
  },
};

export const MEDIA_PARENT: RouteRecordRaw = {
  path: '/media',
  children: [MEDIA],
};

export const MEDIA_ROUTES = [MEDIA_PARENT];
