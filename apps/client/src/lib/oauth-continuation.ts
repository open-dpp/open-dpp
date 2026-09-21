/**
 * Sign-in through open-dpp for the Trusted Client (OAuth Provider). An unauthenticated
 * authorize request is redirected to `/signin` (or `/signup` on `prompt=create`) carrying
 * the authorize parameters plus `exp`, `ba_iat` and `sig`. That signed query IS the pending
 * request: nothing is stored server-side. The auth pages send it back as `oauth_query`
 * with the sign-in or sign-up, and the provider resumes the authorize request in-request,
 * answering `{ redirect: true, url }` with the Trusted Client's redirect URI and a code.
 */

const SIGNATURE_PARAM = "sig";
const PROMPT_PARAM = "prompt";

/**
 * The signed query up to and including `sig`, serialised the way the provider signed it,
 * or undefined when the page was not opened by the OAuth Provider.
 */
export function signedOAuthQuery(search: string): string | undefined {
  const params = new URLSearchParams(search);
  if (!params.has(SIGNATURE_PARAM)) {
    return undefined;
  }
  const signed = new URLSearchParams();
  for (const [key, value] of params) {
    signed.append(key, value);
    if (key === SIGNATURE_PARAM) {
      break;
    }
  }
  return signed.toString();
}

/** Whether a parsed route query carries the provider's signature. */
export function isOAuthContinuation(query: Readonly<Record<string, unknown>>): boolean {
  const signature = query[SIGNATURE_PARAM];
  return typeof signature === "string" && signature.length > 0;
}

/** Whether the pending request asks for the given OIDC prompt (space-separated values). */
export function oauthPromptIncludes(search: string, prompt: string): boolean {
  const value = new URLSearchParams(search).get(PROMPT_PARAM);
  return value !== null && value.split(" ").includes(prompt);
}

/** The URL a better-auth response asks the browser to continue at, when it does. */
export function continuationUrl(data: unknown): string | undefined {
  if (typeof data !== "object" || data === null) {
    return undefined;
  }
  const { redirect, url } = data as { redirect?: unknown; url?: unknown };
  return redirect === true && typeof url === "string" && url.length > 0 ? url : undefined;
}
