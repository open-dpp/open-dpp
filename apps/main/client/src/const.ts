const keycloakDisabled = import.meta.env.VITE_KEYCLOAK_DISABLED === "true";

export { keycloakDisabled };
export const KEYCLOAK_URL =
  (import.meta.env.VITE_KEYCLOAK_ROOT as string) || "http://localhost:20001";
export const API_URL = import.meta.env.VITE_API_ROOT;
export const MARKETPLACE_URL = import.meta.env.VITE_MARKETPLACE_ROOT;
export const AGENT_SERVER_URL = import.meta.env.VITE_AGENT_SERVER_ROOT;
export const VIEW_ROOT_URL = import.meta.env.VITE_VIEW_ROOT_URL;
export const MEDIA_SERVICE_URL = import.meta.env.VITE_MEDIA_SERVICE_ROOT;

// local storage keys
const LOCAL_STORAGE_PREFIX = "open-dpp-local";
export const LAST_SELECTED_ORGANIZATION_ID_KEY = `${LOCAL_STORAGE_PREFIX}-last-selected-organization-id`;
export const QUICK_ACCESS_ITEMS_KEY = `${LOCAL_STORAGE_PREFIX}-quick-access-items`;

export const PRO_ALPHA_INTEGRATION_ID = "pro-alpha";
export const AI_INTEGRATION_ID = "ai-integration";
