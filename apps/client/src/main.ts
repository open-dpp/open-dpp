import {
  createAutoAnimatePlugin,
  createMultiStepPlugin,
} from "@formkit/addons";
import { de, en } from "@formkit/i18n";
import { genesisIcons } from "@formkit/icons";
import { defaultConfig, plugin } from "@formkit/vue";
import { createPinia } from "pinia";
import { createApp } from "vue";
import { rootClasses } from "../formkit.theme";
import App from "./App.vue";
import { keycloakDisabled } from "./const";
import keycloakIns, { initializeKeycloak } from "./lib/keycloak";
import { router } from "./router";
import { useIndexStore } from "./stores";
import { useOrganizationsStore } from "./stores/organizations";
import { i18n } from "./translations/i18n.ts";
import "./index.css";
import "@formkit/addons/css/multistep";

const pinia = createPinia();

async function startApp() {
  const app = createApp(App).use(pinia);
  app.use(i18n);

  const indexStore = useIndexStore();

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
      locale: indexStore.formkitLocale,
      plugins: [createMultiStepPlugin(), createAutoAnimatePlugin()],
    }),
  );
  if (!keycloakDisabled) {
    app.provide("$keycloak", keycloakIns);
    await initializeKeycloak(keycloakIns);
    if (keycloakIns.authenticated) {
      const organizationsStore = useOrganizationsStore();
      await organizationsStore.fetchOrganizations();
      const lastSelectedOrganization = indexStore.selectedOrganization;
      if (
        !organizationsStore.organizations.find(
          organization => organization.id === lastSelectedOrganization,
        )
      ) {
        indexStore.selectOrganization(null);
      }
    }
  }

  app.use(router);
  app.mount("#app");
}

startApp();
