import type { Locale } from "vue-i18n";
import {
  createAutoAnimatePlugin,
  createMultiStepPlugin,
} from "@formkit/addons";
import { de, en } from "@formkit/i18n";
import { genesisIcons } from "@formkit/icons";
import { defaultConfig, plugin } from "@formkit/vue";
import { definePreset } from "@primeuix/themes";
import Aura from "@primeuix/themes/aura";
import { createPinia } from "pinia";
import PrimeVue from "primevue/config";
import ConfirmationService from "primevue/confirmationservice";
import Tooltip from "primevue/tooltip";
import { createApp, watch } from "vue";
import { rootClasses } from "../formkit.theme";
import App from "./App.vue";
import { authClient } from "./auth-client.ts";
import { router } from "./router";
import { useIndexStore } from "./stores";
import { useLanguageStore } from "./stores/language.ts";
import { useOrganizationsStore } from "./stores/organizations";
import { i18n } from "./translations/i18n.ts";
import "./index.css";
import "@formkit/addons/css/multistep";
import "primeicons/primeicons.css";
import "dayjs/locale/de";

const pinia = createPinia();

const OpenDppPreset = definePreset(Aura, {
  semantic: {
    primary: {
      500: "#6BAD87",
      600: "#00965E",
    },
  },
});

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
  });
  app.directive("tooltip", Tooltip);

  app.use(ConfirmationService);

  const { shortLocale, onI18nLocaleChange } = useLanguageStore();
  watch(
    () => (i18n.global.locale as unknown as { value: Locale }).value,
    (newLocale) => {
      // const localValue = (newLocale as unknown as { value: Locale }).value;
      onI18nLocaleChange(newLocale);
    },
    { immediate: true }, // Run once on startup
  );

  app.use(
    plugin,
    defaultConfig({
      config: {
        rootClasses,
      },
      icons: {
        ...genesisIcons,
      },
      locales: { de, en },
      locale: shortLocale,
      plugins: [createMultiStepPlugin(), createAutoAnimatePlugin()],
    }),
  );

  const { data: session } = await authClient.getSession();
  const isSignedIn = session !== null;
  if (isSignedIn) {
    const organizationStore = useOrganizationsStore();
    await organizationStore.fetchOrganizations();
    if (organizationStore.organizations.length === 0) {
      const indexStore = useIndexStore();
      indexStore.selectOrganization(null);
    }
  }

  app.use(router);
  app.mount("#app");
}

startApp();
