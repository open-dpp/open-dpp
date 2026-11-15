import type { LocationQuery } from "vue-router";
import { z } from "zod";

/** The `redirect` query holds an encoded URL. Untrusted: use `sameOriginRedirectOf` to follow it. */
function redirectUriOf(query: LocationQuery): string {
  const redirect = query.redirect;
  return typeof redirect === "string" && redirect.length > 0 ? decodeURIComponent(redirect) : "/";
}

function hasRedirect(query: LocationQuery): boolean {
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
 * Where to go after signing in or up, as a path of this application, or undefined if the `redirect`
 * query is missing or leads to another site. The query comes from a link and is untrusted, so it is
 * never followed without this check.
 */
export function sameOriginRedirectOf(
  query: LocationQuery,
  origin = window.location.origin,
): string | undefined {
  if (!hasRedirect(query)) {
    return undefined;
  }
  try {
    const target = new URL(redirectUriOf(query), origin);
    if (target.origin !== origin) {
      return undefined;
    }
    // Dot segments are resolved by the parser, so "/.//evil.example.com" leaves the path
    // "//evil.example.com", which a browser takes as another site.
    return target.pathname.startsWith("//")
      ? undefined
      : `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return undefined;
  }
}

/**
 * The absolute address Better Auth gets as `callbackURL`. It validates the value against the
 * trusted origins and rejects a relative path with a hash. The path comes from
 * `sameOriginRedirectOf`, so its origin has already been checked.
 */
export function callbackUrlOf(path: string, origin = window.location.origin): string {
  return new URL(path, origin).href;
}
