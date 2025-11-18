// eslint-disable-next-line import/no-mutable-exports
export let API_URL = import.meta.env.VITE_API_ROOT as string;
export const APPEND_TO = import.meta.env.VITE_APPEND_TO as string ?? "body"; // This is set to self for cypress component tests to fix rendering issues for primevue components using teleport like SplitButton
async function fetchConfig() {
  if (!API_URL) {
    // Get runtime configuration
    try {
      const response = await fetch("/config.json");
      const config = await response.json();
      API_URL = config.API_URL || "";
    }
    catch (error) {
      console.error("Failed to fetch runtime configuration:", error);
    }
  }
}
// eslint-disable-next-line antfu/no-top-level-await
await fetchConfig();

export const MARKETPLACE_URL = API_URL; // import.meta.env.VITE_MARKETPLACE_ROOT;
export const VIEW_ROOT_URL = API_URL.replace("/api", ""); // import.meta.env.VITE_VIEW_ROOT_URL;
export const MEDIA_SERVICE_URL = API_URL; // import.meta.env.VITE_MEDIA_SERVICE_ROOT;
export const AGENT_SERVER_URL = API_URL;
export const ANALYTICS_URL = API_URL;

export const AGENT_WEBSOCKET_URL = API_URL.substring(
  0,
  API_URL.lastIndexOf("/"),
);
// local storage keys
const LOCAL_STORAGE_PREFIX = "open-dpp-local";
export const LAST_SELECTED_ORGANIZATION_ID_KEY = `${LOCAL_STORAGE_PREFIX}-last-selected-organization-id`;
export const LAST_SELECTED_LANGUAGE = `${LOCAL_STORAGE_PREFIX}-last-language`;
export const QUICK_ACCESS_ITEMS_KEY = `${LOCAL_STORAGE_PREFIX}-quick-access-items`;

export const PRO_ALPHA_INTEGRATION_ID = "pro-alpha";
export const AI_INTEGRATION_ID = "ai-integration";
