import type { Locale } from "vue-i18n";
import { definePreset } from "@primeuix/themes";
import Aura from "@primeuix/themes/aura";
import { createPinia } from "pinia";
import PrimeVue from "primevue/config";
import ConfirmationService from "primevue/confirmationservice";
import ToastService from "primevue/toastservice";
import Tooltip from "primevue/tooltip";
import { createApp, toRaw, watch } from "vue";
import App from "./App.vue";
import { authClient } from "./auth-client.ts";
import apiClient from "./lib/api-client.ts";
import { router } from "./router";
import { useIndexStore } from "./stores";
import { useLanguageStore } from "./stores/language.ts";
import { useOrganizationsStore } from "./stores/organizations";
import { useUserStore } from "./stores/user.ts";
import { i18n } from "./translations/i18n.ts";
import "./index.css";
import "primeicons/primeicons.css";
import "dayjs/locale/de";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { convertLanguageToLocale } from "./translations/util.ts";

dayjs.extend(localizedFormat);

const pinia = createPinia();

const OpenDppPreset = definePreset(Aura, {
  semantic: {
    primary: {
      500: "#6BAD87",
      600: "#00965E",
    },
  },
});

/**
 * The full-screen view of an `Image` centers the image in a box that takes its size from the
 * image. An SVG with only a `viewBox` has no size of its own, so in that box it collapses to
 * nothing. In a box of the size of the overlay it scales to fit, and an image that has a size
 * keeps it. The box is a grid because WebKit gives an SVG with neither a `viewBox` nor a size no
 * width in a flex box.
 */
const imagePassThrough = {
  originalContainer: { class: "grid h-full w-full place-items-center" },
};

async function startApp() {
  const app = createApp(App).use(pinia);
  app.use(i18n);
  app.use(PrimeVue, {
    theme: {
      preset: OpenDppPreset,
      options: {
        darkModeSelector: false,
      },
    },
    pt: { image: imagePassThrough },
  });
  app.directive("tooltip", Tooltip);

  app.use(ConfirmationService);
  app.use(ToastService);

  const { onI18nLocaleChange } = useLanguageStore();
  watch(
    () => (i18n.global.locale as unknown as { value: Locale }).value,
    (newLocale) => {
      // const localValue = (newLocale as unknown as { value: Locale }).value;
      onI18nLocaleChange(newLocale);
    },
    { immediate: true }, // Run once on startup
  );

  const { data: session } = await authClient.getSession();
  const isSignedIn = session !== null;
  const userStore = useUserStore();
  userStore.updateUserBySession(session);
  if (isSignedIn) {
    try {
      const me = await apiClient.dpp.users.getMe();
      userStore.setMe(me.data.user);
      if (me.data.user.preferredLanguage) {
        (i18n.global.locale as unknown as { value: Locale }).value = convertLanguageToLocale(
          me.data.user.preferredLanguage,
        );
      }
    } catch (error) {
      console.error("Failed to load preferred language for signed-in user", error);
    }
    const organizationStore = useOrganizationsStore();
    await organizationStore.fetchOrganizations();
    const indexStore = useIndexStore();
    if (organizationStore.organizations.length === 0) {
      indexStore.selectOrganization(null);
    } else if (session.session.activeOrganizationId) {
      indexStore.selectOrganization(session.session.activeOrganizationId);
    } else {
      indexStore.selectOrganization(toRaw(organizationStore.organizations[0]!).id);
    }
  }

  app.use(router);
  await router.isReady();
  app.mount("#app");
}

startApp();
