import type { RouteLocationNormalizedGeneric, RouteRecordRaw } from "vue-router";
import { localizedBreadcrumb } from "../../../lib/breadcrumbs.ts";
import { useLayoutStore } from "../../../stores/layout";
import { passportBreadcrumbs } from "../passports/passports.ts";

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
