import { RouteLocationNormalizedGeneric, RouteRecordRaw } from 'vue-router';
import { useLayoutStore } from '../../../stores/layout';
import { ITEMS_PARENT } from './items';
import { useModelsStore } from '../../../stores/models';
import { localizedBreadcrumb } from '../../../lib/breadcrumbs';

const modelListBreadcrumbs = (to: RouteLocationNormalizedGeneric) => [
  // ...organizationBreadcrumbs(to),
  {
    name: localizedBreadcrumb('models.list.title'),
    route: MODEL_LIST,
    params: to.params,
  },
];

export const modelBreadcrumbs = async (to: RouteLocationNormalizedGeneric) => {
  if (to.params.modelId) {
    const modelId = String(to.params.modelId);
    const modelStore = useModelsStore();
    let modelName: string | null = null;
    const foundModel = modelStore.models.find((m) => m.id === modelId);
    if (foundModel) {
      modelName = foundModel.name;
    }
    return [
      ...modelListBreadcrumbs(to),
      {
        name: {
          text: modelName || modelId,
          localized: false,
        },
        route: MODEL,
        params: to.params,
      },
    ];
  }
  return [
    ...modelListBreadcrumbs(to),
    {
      name: {
        text: 'models.pass',
        localized: true,
      },
      route: MODEL,
      params: to.params,
    },
  ];
};

export const MODEL: RouteRecordRaw = {
  path: '',
  name: 'Model',
  component: () => import('../../../view/models/ModelView.vue'),
  beforeEnter: async (to: RouteLocationNormalizedGeneric) => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = await modelBreadcrumbs(to);
  },
};

export const MODEL_QRCODE: RouteRecordRaw = {
  path: 'qr-code',
  name: 'ModelQrCode',
  component: () => import('../../../view/models/ModelQrCode.vue'),
  beforeEnter: async (to: RouteLocationNormalizedGeneric) => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = [
      ...(await modelBreadcrumbs(to)),
      {
        name: localizedBreadcrumb('common.qrCode'),
        route: MODEL_QRCODE,
        params: to.params,
      },
    ];
  },
};

const MODEL_PARENT: RouteRecordRaw = {
  path: ':modelId',
  children: [MODEL, MODEL_QRCODE, ITEMS_PARENT],
};

// MODELS

export const MODEL_LIST: RouteRecordRaw = {
  path: '',
  name: 'Models',
  component: () => import('../../../view/models/Models.vue'),
  beforeEnter: (to: RouteLocationNormalizedGeneric) => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = modelListBreadcrumbs(to);
  },
};

export const MODEL_CREATE: RouteRecordRaw = {
  path: 'create',
  name: 'ModelCreate',
  props: true,
  component: () => import('../../../view/models/CreateModelView.vue'),
  beforeEnter: (to: RouteLocationNormalizedGeneric) => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = [
      ...modelListBreadcrumbs(to),
      {
        name: localizedBreadcrumb('common.create'),
        route: MODEL_CREATE,
        params: to.params,
      },
    ];
  },
};

export const ORGANIZATION_MODELS_PARENT: RouteRecordRaw = {
  path: 'models',
  children: [MODEL_LIST, MODEL_CREATE, MODEL_PARENT],
};
