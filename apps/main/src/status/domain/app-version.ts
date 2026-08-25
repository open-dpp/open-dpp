import semver from "semver";

export const UNKNOWN_APP_VERSION = "unknown";

/**
 * Only a semantic version is trustworthy as an application version. Rejecting
 * everything else keeps Docker tag names that CI or a deployment may inject —
 * a branch (`main`), a moving tag (`latest`), a commit tag (`sha-abc1234`) —
 * from being rendered to users as the application version.
 */
export function isValidAppVersion(candidate: string | null | undefined): boolean {
  if (!candidate) {
    return false;
  }
  const trimmed = candidate.trim();
  // `semver.valid()` tolerates a leading "v" ("v1.2.3" -> "1.2.3"), but the
  // prefix is not part of a semantic version and the UI renders one of its own,
  // so accepting "v1.2.3" here would show up as "vv1.2.3".
  if (trimmed.startsWith("v")) {
    return false;
  }
  // Predicate only: `semver.valid()` strips build metadata
  // ("3.1.3+sha.abc1234" -> "3.1.3"), so its return value must never be used
  // as the version itself.
  return semver.valid(trimmed) !== null;
}

/**
 * Picks the first candidate that is a semantic version, in the caller's order
 * of preference.
 */
export function resolveAppVersion(candidates: Array<string | null | undefined>): string {
  const version = candidates.find((candidate) => isValidAppVersion(candidate));
  return version ? version.trim() : UNKNOWN_APP_VERSION;
}
