// The base env first: it enables the OAuth Provider and names the Trusted Client.
import "./trusted-client.test-env";

/**
 * As `trusted-client.test-env`, for a Trusted Client that sends its secret in the form body
 * (`client_secret_post`). Import it FIRST in a spec, for the same reason as the base env.
 */
process.env.OPEN_DPP_OAUTH_PROVIDER_CLIENT_AUTH_METHOD = "client_secret_post";
