import { OpenDppClient } from "@open-dpp/api-client";
import { AGENT_SERVER_URL, ANALYTICS_URL, API_URL, MARKETPLACE_URL, MEDIA_SERVICE_URL } from "../const";

const apiClient = new OpenDppClient({
  dpp: {
    baseURL: API_URL,
  },
  marketplace: {
    baseURL: MARKETPLACE_URL,
  },
  agentServer: {
    baseURL: AGENT_SERVER_URL,
  },
  analytics: {
    baseURL: ANALYTICS_URL,
  },
  media: {
    baseURL: MEDIA_SERVICE_URL,
  },
});
export default apiClient;
