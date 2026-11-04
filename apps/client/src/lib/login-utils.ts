import type { LocationQuery } from "vue-router";
import { z } from "zod";

/** Where to go after signing in or up: the `redirect` query holds an encoded URL, "/" if absent. */
export function redirectUriOf(query: LocationQuery): string {
  const redirect = query.redirect;
  return typeof redirect === "string" && redirect.length > 0 ? decodeURIComponent(redirect) : "/";
}

export function hasRedirect(query: LocationQuery): boolean {
  return typeof query.redirect === "string" && query.redirect.length > 0;
}

/**
 * The address a link prefilled the form with, e.g. the invitation of a guest. Anything which is not
 * an email address is ignored.
 */
export function prefilledEmailOf(query: LocationQuery): string | undefined {
  const parsed = z.email().safeParse(query.email);
  return parsed.success ? parsed.data : undefined;
}

/**
 * The return URL as a path of this application, or undefined if it is missing or leads to another
 * site. A signed-in user who follows a link to the sign-in or sign-up goes there directly.
 */
export function sameOriginRedirectOf(query: LocationQuery, origin: string): string | undefined {
  if (!hasRedirect(query)) {
    return undefined;
  }
  try {
    const target = new URL(redirectUriOf(query), origin);
    return target.origin === origin
      ? `${target.pathname}${target.search}${target.hash}`
      : undefined;
  } catch {
    return undefined;
  }
}
