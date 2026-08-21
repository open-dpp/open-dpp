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
  // Predicate only: `semver.valid()` strips build metadata
  // ("3.1.3+sha.abc1234" -> "3.1.3"), so its return value must never be used
  // as the version itself.
  return semver.valid(candidate.trim()) !== null;
}

/**
 * Picks the first candidate that is a semantic version, in the caller's order
 * of preference.
 */
export function resolveAppVersion(candidates: Array<string | null | undefined>): string {
  const version = candidates.find((candidate) => isValidAppVersion(candidate));
  return version ? version.trim() : UNKNOWN_APP_VERSION;
}
