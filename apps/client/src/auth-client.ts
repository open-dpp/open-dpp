import { apiKeyClient, genericOAuthClient, inferAdditionalFields, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/vue";
import { API_URL } from "./const.ts";

export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: `${API_URL}/auth`,
  plugins: [
    inferAdditionalFields({
      user: {
        firstName: {
          type: "string",
          required: true,
          input: true,
        },
        lastName: {
          type: "string",
          required: true,
          input: true,
        },
        name: {
          type: "string",
          required: false,
          input: true,
        },
      },
      organization: {
        image: {
          type: "string",
          required: false,
          input: true,
        },
      },
    }),
    genericOAuthClient(),
    organizationClient(),
    apiKeyClient(),
  ],
});
