import type { RouteLocationNormalizedGeneric, RouteLocationRaw } from "vue-router";
import { isOAuthContinuation } from "../lib/oauth-continuation.ts";

/**
 * Where a navigation is sent given the session state, or undefined to continue. A signed-in
 * user is kept off anonymous-only pages, except when the OAuth Provider opened the page
 * (signed query with `sig`): `prompt=login` re-authentication and `prompt=create` sign-up
 * must render for a signed-in user too. An anonymous user of a protected page goes to
 * sign-in with the absolute return URL.
 */
export function resolveAuthRedirect(
  to: RouteLocationNormalizedGeneric,
  isSignedIn: boolean,
  origin: string,
): RouteLocationRaw | undefined {
  if (isSignedIn && to.meta?.onlyAnonymous && !isOAuthContinuation(to.query)) {
    return "/";
  }
  if (!isSignedIn && !to.meta?.public) {
    return {
      name: "Signin",
      query: { redirect: encodeURIComponent(origin + to.fullPath) },
    };
  }
  return undefined;
}
