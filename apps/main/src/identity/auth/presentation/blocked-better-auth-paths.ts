/**
 * better-auth routes the app exposes through its own endpoints instead. Matched exactly
 * on the path relative to the auth base path — `includes()` would also catch look-alikes
 * such as `/organization/update-member-role`.
 *
 * - create: organizations are created via `POST /organizations` (policy + settings gates).
 * - update: accepts `data.slug`, which would break the slug = id invariant (#852).
 * - check-slug: with slug = id it would only tell whether an organization id exists.
 */
export const BLOCKED_BETTER_AUTH_POST_PATHS: ReadonlySet<string> = new Set([
  "/organization/create",
  "/organization/update",
  "/organization/check-slug",
]);

const AUTH_BASE_SEGMENT = "/auth";

/** Path of a request relative to the better-auth base path, without the query string. */
export function betterAuthPath(url: string): string | undefined {
  const pathname = url.split("?")[0];
  const index = pathname.indexOf(`${AUTH_BASE_SEGMENT}/`);
  return index === -1 ? undefined : pathname.slice(index + AUTH_BASE_SEGMENT.length);
}

export function isBlockedBetterAuthPostPath(url: string): boolean {
  const path = betterAuthPath(url);
  return path !== undefined && BLOCKED_BETTER_AUTH_POST_PATHS.has(path);
}
