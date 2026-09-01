import type { RouteLocationNormalizedGeneric, RouteRecordRaw } from "vue-router";
import { localizedBreadcrumb } from "../../lib/breadcrumbs.ts";
import { useLayoutStore } from "../../stores/layout";
import { integrationBreadcrumbs } from "./integrations.ts";

export const BULK_IMPORT: RouteRecordRaw = {
  path: "bulk-import",
  name: "bulkImport",
  component: () => import("../../view/integrations/BulkImportListView.vue"),
  beforeEnter: (to: RouteLocationNormalizedGeneric) => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = bulkImportBreadcrumbs(to);
  },
};

export function bulkImportBreadcrumbs(to: RouteLocationNormalizedGeneric) {
  return [
    ...integrationBreadcrumbs(to),
    {
      name: localizedBreadcrumb("integrations.bulkImport.label"),
      route: BULK_IMPORT,
      params: to.params,
    },
  ];
}

export const BULK_IMPORT_RUN: RouteRecordRaw = {
  path: "bulk-import/runs/:runId",
  name: "bulkImportRun",
  component: () => import("../../view/integrations/BulkImportRunDetailView.vue"),
  beforeEnter: (to: RouteLocationNormalizedGeneric) => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = bulkImportRunBreadcrumbs(to);
  },
};

export function bulkImportRunBreadcrumbs(to: RouteLocationNormalizedGeneric) {
  return [
    ...bulkImportBreadcrumbs(to),
    {
      name: {
        text: to.params.runId ? String(to.params.runId) : "",
        localized: false,
      },
      route: BULK_IMPORT_RUN,
      params: to.params,
    },
  ];
}
