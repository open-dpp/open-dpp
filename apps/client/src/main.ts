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
import { authClient } from "./auth-client.ts";
import { router } from "./router";
import { useIndexStore } from "./stores";
import { useOrganizationsStore } from "./stores/organizations.ts";
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

  const session = authClient.useSession();
  await new Promise((resolve) => {
    while (session.value.isPending || session.value.isRefetching) {
      // IGNORE
    }
    resolve(null);
  });
  if (session.value.data !== null) {
    const organizationStore = useOrganizationsStore();
    await organizationStore.fetchOrganizations();
  }

  app.use(router);
  app.mount("#app");
}

startApp();
