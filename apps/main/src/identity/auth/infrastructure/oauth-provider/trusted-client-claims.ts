/**
 * Claims the Trusted Client may find in id tokens and at `/oauth2/userinfo`. The plugin
 * derives `sub`, `name`, `picture`, `email` and `email_verified` itself; this instance adds
 * the profile claims below. Standard OIDC claims only: no organization or role claims.
 * Replaces the plugin's advertised list, so the built-in claims are restated.
 */
export const OAUTH_PROVIDER_CLAIMS_SUPPORTED = [
  "sub",
  "iss",
  "aud",
  "exp",
  "iat",
  "sid",
  "scope",
  "azp",
  "email",
  "email_verified",
  "name",
  "picture",
  "given_name",
  "family_name",
  "locale",
] as const;

const PROFILE_SCOPE = "profile";

/**
 * The user record as better-auth hands it to the claim hooks: the core fields plus this
 * app's additional fields (`firstName`, `lastName`, `preferredLanguage`) as unknown values.
 */
export type ProfileClaimSource = Readonly<Record<string, unknown>>;

/**
 * `given_name` and `family_name` from the User's own first and last name (the plugin would
 * split the display name on spaces) and `locale` from the preferred language (a BCP 47 tag).
 * Emitted only with the `profile` scope; a missing source omits the claim rather than
 * sending `null`.
 */
export function profileClaims(
  user: ProfileClaimSource,
  scopes: readonly string[],
): Record<string, string> {
  if (!scopes.includes(PROFILE_SCOPE)) {
    return {};
  }
  const candidates: Array<[string, unknown]> = [
    ["given_name", user.firstName],
    ["family_name", user.lastName],
    ["locale", user.preferredLanguage],
  ];
  return Object.fromEntries(
    candidates.filter((entry): entry is [string, string] => isPresent(entry[1])),
  );
}

function isPresent(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
