import { AGENT_SERVER_URL, API_URL, MARKETPLACE_URL } from "../const";
import { OpenDppClient } from "@open-dpp/api-client";

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
});
export default apiClient;
