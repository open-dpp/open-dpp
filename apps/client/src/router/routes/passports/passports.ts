import type {
  RouteLocationNormalizedGeneric,
  RouteRecordRaw,
} from "vue-router";
import { localizedBreadcrumb } from "../../../lib/breadcrumbs.ts";
import { useLayoutStore } from "../../../stores/layout";

export const PASSPORTS_LIST: RouteRecordRaw = {
  path: "",
  name: "passports",
  component: () => import("../../../view/passports/PassportListView.vue"),
  beforeEnter: async (to: RouteLocationNormalizedGeneric) => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = await passportsListBreadcrumbs(to);
  },
};

async function passportsListBreadcrumbs(to: RouteLocationNormalizedGeneric) {
  return [
    {
      name: localizedBreadcrumb("passports.label"),
      route: PASSPORTS_LIST,
      params: to.params,
    },
  ];
}

export const PASSPORT: RouteRecordRaw = {
  path: "",
  name: "passport",
  component: () => import("../../../view/passports/PassportView.vue"),
  beforeEnter: async (to: RouteLocationNormalizedGeneric) => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = await passportBreadcrumbs(to);
  },
};

export const PASSPORT_QRCODE: RouteRecordRaw = {
  path: "qr-code",
  name: "passportQrCode",
  component: () => import("../../../view/passports/PassportQrCodeView.vue"),
  beforeEnter: async (to: RouteLocationNormalizedGeneric) => {
    const layoutStore = useLayoutStore();
    layoutStore.breadcrumbs = await passportBreadcrumbs(to);
    layoutStore.breadcrumbs = [
      ...(await passportBreadcrumbs(to)),
      {
        name: localizedBreadcrumb("common.qrCode"),
        route: PASSPORT_QRCODE,
        params: to.params,
      },
    ];
  },
};

export async function passportBreadcrumbs(to: RouteLocationNormalizedGeneric) {
  const text = to.params.passportId ? String(to.params.passportId) : "Editor";
  return [
    ...(await passportsListBreadcrumbs(to)),
    {
      name: {
        text,
        localized: false,
      },
      route: PASSPORT,
      params: to.params,
    },
  ];
}

const PASSPORT_PARENT: RouteRecordRaw = {
  path: ":passportId",
  children: [PASSPORT, PASSPORT_QRCODE],
};

export const ORGANIZATION_PASSPORTS_PARENT: RouteRecordRaw = {
  path: "passports",
  children: [PASSPORTS_LIST, PASSPORT_PARENT],
};
