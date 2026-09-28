/** The OAuth Provider's token endpoint, relative to the better-auth base path. */
export const OAUTH_TOKEN_PATH = "/oauth2/token";

/**
 * RFC 6749 §5.1: a token response must not be cached. The plugin sets these headers via
 * better-call's `ctx.json(body, { headers })`, which better-auth 1.6 drops (it runs every
 * endpoint with `asResponse: false`), so the mount sets them itself.
 */
export const TOKEN_RESPONSE_HEADERS: Readonly<Record<string, string>> = {
  "Cache-Control": "no-store",
  Pragma: "no-cache",
};
