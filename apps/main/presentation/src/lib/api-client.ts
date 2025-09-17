import { OpenDppClient } from "@open-dpp/api-client";
import { API_URL } from "../const";

const apiClient = new OpenDppClient({
  dpp: { baseURL: API_URL },
});

export default apiClient;
