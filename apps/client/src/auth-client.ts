import { apiKeyClient } from "@better-auth/api-key/client";
import {
  adminClient,
  genericOAuthClient,
  inferAdditionalFields,
  organizationClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/vue";
import { API_URL } from "./const.ts";
import { LatestApiVersionWithPrefixDto } from "@open-dpp/dto";

export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: `${API_URL}/${LatestApiVersionWithPrefixDto}/auth`,
  /**
   * The pages navigate themselves (`resumeFromResponse`). better-auth's default redirect plugin
   * would follow a `{ redirect: true, url }` answer as well, sending the browser to a Trusted
   * Client's redirect URI twice with one single-use code.
   */
  disableDefaultFetchPlugins: true,
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
        preferredLanguage: {
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
    adminClient(),
  ],
});
