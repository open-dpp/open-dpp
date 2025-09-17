import { createApp } from "vue";
import "./index.css";
import App from "./App.vue";
import { router } from "./router";
import { createPinia } from "pinia";
import keycloakIns, { initializeKeycloak } from "./lib/keycloak";
import { keycloakDisabled } from "./const";

const pinia = createPinia();

const startApp = async () => {
  const app = createApp(App).use(pinia);
  if (!keycloakDisabled) {
    app.provide("$keycloak", keycloakIns);
    await initializeKeycloak(keycloakIns);
  }

  app.use(router);
  app.mount("#app");
};

startApp();
