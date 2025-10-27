import { genericOAuthClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/vue";
import { API_URL } from "./const.ts";

export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: `${API_URL}/auth`,
  plugins: [
    genericOAuthClient(),
  ],
});
