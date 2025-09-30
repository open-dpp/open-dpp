import { RouteLocationNormalizedGeneric, RouteRecordRaw } from 'vue-router';
import { useLayoutStore } from '../../../stores/layout';
import { modelBreadcrumbs } from './models';
import { localizedBreadcrumb } from '../../../lib/breadcrumbs';

const itemListBreadcrumbs = async (to: RouteLocationNormalizedGeneric) => [
  ...(await modelBreadcrumbs(to)),
  {
    name: localizedBreadcrumb('items.label'),
    route: ITEM_LIST,
    params: to.params,
  },
];

export const ITEM_LIST: RouteRecordRaw = {
  path: '',
  name: 'OrganizationModelsItems',
  component: () => import('../../../view/items/ItemListView.vue'),
  beforeEnter: async (to: RouteLocationNormalizedGeneric) => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = await itemListBreadcrumbs(to);
  },
};

export const ITEM: RouteRecordRaw = {
  path: '',
  name: 'Item',
  component: () => import('../../../view/items/ItemView.vue'),
  beforeEnter: async (to: RouteLocationNormalizedGeneric) => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = await itemListBreadcrumbs(to);
  },
};

export const ITEM_QRCODE: RouteRecordRaw = {
  path: 'qr-code',
  name: 'ItemQrCode',
  component: () => import('../../../view/items/ItemQrCode.vue'),
  beforeEnter: async (to: RouteLocationNormalizedGeneric) => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = [
      ...(await itemListBreadcrumbs(to)),
      {
        name: localizedBreadcrumb('items.item'),
        route: ITEM_QRCODE,
        params: to.params,
      },
    ];
  },
};

export const ITEM_PARENT: RouteRecordRaw = {
  path: ':itemId',
  children: [ITEM, ITEM_QRCODE],
};

export const ITEMS_PARENT: RouteRecordRaw = {
  path: 'items',
  children: [ITEM_LIST, ITEM_PARENT],
};
