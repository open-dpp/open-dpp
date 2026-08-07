import type { RouteLocationNormalizedGeneric, RouteRecordRaw } from "vue-router";
import { localizedBreadcrumb } from "../../lib/breadcrumbs.ts";
import { useLayoutStore } from "../../stores/layout";
import { passportBreadcrumbs } from "./passports/passports.ts";

/**
 * Passport-scoped permalink list, mounted under the passport route
 * (`/organizations/:organizationId/passports/:passportId/permalinks`) and reached
 * from the passport's top-right dropdown. The org-scoped `GET /permalinks` endpoint
 * is kept API-only — the frontend no longer lists permalinks org-wide.
 */
export const PASSPORT_PERMALINKS_LIST: RouteRecordRaw = {
  path: "permalinks",
  name: "passportPermalinks",
  component: () => import("../../view/permalinks/PermalinkListView.vue"),
  beforeEnter: async (to: RouteLocationNormalizedGeneric) => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = [
      ...(await passportBreadcrumbs(to)),
      {
        name: localizedBreadcrumb("permalink.list.label"),
        route: PASSPORT_PERMALINKS_LIST,
        params: to.params,
      },
    ];
  },
};
