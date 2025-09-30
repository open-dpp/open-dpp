import { createApp } from 'vue';
import './index.css';
import App from './App.vue';
import { router } from './router';
import { createPinia } from 'pinia';
import keycloakIns, { initializeKeycloak } from './lib/keycloak';
import { keycloakDisabled } from './const';
import { useIndexStore } from './stores';
import { defaultConfig, plugin } from '@formkit/vue';
import { genesisIcons } from '@formkit/icons';
import { rootClasses } from '../formkit.theme';
import { de, en } from '@formkit/i18n';
import {
  createAutoAnimatePlugin,
  createMultiStepPlugin,
} from '@formkit/addons';
import '@formkit/addons/css/multistep';
import { useOrganizationsStore } from './stores/organizations';
import { i18n } from './translations/i18n';
const pinia = createPinia();

const startApp = async () => {
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
    app.provide('$keycloak', keycloakIns);
    await initializeKeycloak(keycloakIns);
    if (keycloakIns.authenticated) {
      const organizationsStore = useOrganizationsStore();
      await organizationsStore.fetchOrganizations();
      const lastSelectedOrganization = indexStore.selectedOrganization;
      if (
        !organizationsStore.organizations.find(
          (organization) => organization.id === lastSelectedOrganization,
        )
      ) {
        indexStore.selectOrganization(null);
      }
    }
  }

  app.use(router);
  app.mount('#app');
};

startApp();
