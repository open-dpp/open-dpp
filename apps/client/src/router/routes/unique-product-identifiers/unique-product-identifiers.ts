import type { RouteLocationNormalizedGeneric, RouteRecordRaw } from "vue-router";
import { localizedBreadcrumb } from "../../../lib/breadcrumbs.ts";
import { useLayoutStore } from "../../../stores/layout";
import { passportBreadcrumbs } from "../passports/passports.ts";

/**
 * Passport-scoped unique-product-identifier list, mounted under the passport route
 * (`/organizations/:organizationId/passports/:passportId/unique-product-identifiers`)
 * and reached from the passport's top-right dropdown. The org-scoped
 * `GET /unique-product-identifiers` endpoint is kept API-only — the frontend no
 * longer lists UPIs org-wide.
 */
export const PASSPORT_UNIQUE_PRODUCT_IDENTIFIERS_LIST: RouteRecordRaw = {
  path: "unique-product-identifiers",
  name: "passportUniqueProductIdentifiers",
  component: () =>
    import("../../../view/unique-product-identifiers/UniqueProductIdentifierListView.vue"),
  beforeEnter: async (to: RouteLocationNormalizedGeneric) => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = [
      ...(await passportBreadcrumbs(to)),
      {
        name: localizedBreadcrumb("uniqueProductIdentifiers.label"),
        route: PASSPORT_UNIQUE_PRODUCT_IDENTIFIERS_LIST,
        params: to.params,
      },
    ];
  },
};
