import { RouteLocationNormalizedGeneric, RouteRecordRaw } from 'vue-router';
import { useLayoutStore } from '../../../stores/layout';
import { useDraftStore } from '../../../stores/draft';
import {
  localizedBreadcrumb,
  textOrLocalizedFallback,
} from '../../../lib/breadcrumbs';

const draftListBreadcrumbs = (to: RouteLocationNormalizedGeneric) => [
  {
    name: localizedBreadcrumb('draft.passTemplates'),
    route: DRAFT_LIST,
    params: to.params,
  },
];

export const draftBreadcrumbs = async (to: RouteLocationNormalizedGeneric) => {
  const draftId = String(to.params.draftId);
  const draftStore = useDraftStore();
  let draftName = draftStore.draft?.name;
  if (draftName === undefined) {
    await draftStore.fetchDraft(draftId);
    draftName = draftStore.draft?.name;
  }
  return [
    ...draftListBreadcrumbs(to),
    {
      name: textOrLocalizedFallback(draftName || draftId, 'draft.draft'),
      route: DRAFT,
      params: to.params,
    },
  ];
};

export const DRAFT: RouteRecordRaw = {
  path: '',
  name: 'Draft',
  component: () => import('../../../view/template-drafts/DraftView.vue'),
  beforeEnter: async (to: RouteLocationNormalizedGeneric) => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = await draftBreadcrumbs(to);
  },
};

export const DRAFT_LIST: RouteRecordRaw = {
  path: '',
  name: 'Drafts',
  component: () => import('../../../view/template-drafts/DraftListView.vue'),
  beforeEnter: (to: RouteLocationNormalizedGeneric) => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = draftListBreadcrumbs(to);
  },
};

export const DRAFT_CREATE: RouteRecordRaw = {
  path: 'create',
  name: 'DraftsCreate',
  props: true,
  component: () => import('../../../view/template-drafts/CreateDraftView.vue'),
  beforeEnter: (to: RouteLocationNormalizedGeneric) => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = [
      ...draftListBreadcrumbs(to),
      {
        name: localizedBreadcrumb('common.create'),
        route: DRAFT_CREATE,
        params: to.params,
      },
    ];
  },
};

export const DRAFT_PARENT: RouteRecordRaw = {
  path: ':draftId',
  children: [DRAFT],
};

export const ORGANIZATION_DRAFTS_PARENT: RouteRecordRaw = {
  path: 'data-model-drafts',
  children: [DRAFT_LIST, DRAFT_CREATE, DRAFT_PARENT],
};
