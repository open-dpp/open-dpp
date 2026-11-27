import { isNonBlankString } from "../../../../lib/non-blank-string";
import { EMAIL_SCOPE, PROFILE_SCOPE } from "../../domain/trusted-client-access-token";

/**
 * Claims the Trusted Client may find in id tokens and at `/oauth2/userinfo`. At userinfo
 * the plugin derives `sub`, `name`, `picture`, `email` and `email_verified` itself and this
 * instance adds the profile claims below; in id tokens this instance supplies both (see
 * `idTokenClaims`). Standard OIDC claims only: no organization or role claims.
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
  return nonBlankClaims([
    ["given_name", user.firstName],
    ["family_name", user.lastName],
    ["locale", user.preferredLanguage],
  ]);
}

/** The candidates that have a value: a missing source omits the claim. */
function nonBlankClaims(candidates: ReadonlyArray<[string, unknown]>): Record<string, string> {
  return Object.fromEntries(
    candidates.filter((entry): entry is [string, string] => isNonBlankString(entry[1])),
  );
}

/**
 * The plugin's built-in claims beyond `sub`: display name and picture with the `profile`
 * scope, the e-mail address and whether it is verified with the `email` scope. The plugin
 * serves them at `/oauth2/userinfo` and, since better-auth 1.7, no longer writes them into
 * id tokens.
 */
function builtInClaims(
  user: ProfileClaimSource,
  scopes: readonly string[],
): Record<string, string | boolean> {
  const profile = scopes.includes(PROFILE_SCOPE)
    ? nonBlankClaims([
        ["name", user.name],
        ["picture", user.image],
      ])
    : {};
  const email = scopes.includes(EMAIL_SCOPE)
    ? { ...nonBlankClaims([["email", user.email]]), email_verified: user.emailVerified === true }
    : {};
  return { ...profile, ...email };
}

/**
 * Everything an id token says about the User beyond `sub`: the same scope-gated claim set
 * `/oauth2/userinfo` answers with, so a Trusted Client can read either.
 */
export function idTokenClaims(
  user: ProfileClaimSource,
  scopes: readonly string[],
): Record<string, string | boolean> {
  return { ...builtInClaims(user, scopes), ...profileClaims(user, scopes) };
}
