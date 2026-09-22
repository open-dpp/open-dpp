import { deriveDisplayName } from "../domain/user";

/**
 * The display name a User gets when neither a `name` nor a usable first or last name was sent,
 * as with an admin's email-only invite. The same word the mail templates fall back to for a
 * missing first name; the User replaces it by filling in their names.
 */
export const DISPLAY_NAME_FALLBACK = "User";

/** The name fields of a user record as better-auth hands them to a database hook. */
export interface UserNameFields {
  name?: string | null;
  firstName?: unknown;
  lastName?: unknown;
}

/**
 * better-auth `databaseHooks.user.create.before`: every User gets a non-blank display name. The
 * domain rule `deriveDisplayName` is applied at the better-auth boundary, where sign-up and the
 * admin endpoints accept an empty `name`; when it yields nothing, `DISPLAY_NAME_FALLBACK` fills
 * in. Downstream, the OAuth Provider splits `user.name` for its profile claims and throws on a
 * missing one. Only better-auth's own surfaces (session, OIDC claims) see this name: the domain
 * `User.name` stays derived from the first and last name. Returns a new record; the input is
 * never mutated.
 */
export function withDisplayName<T extends UserNameFields>(user: T): { data: T } {
  if (hasDisplayName(user.name)) {
    return { data: { ...user } };
  }
  const derived = deriveDisplayName(user.firstName, user.lastName);
  return { data: { ...user, name: derived ?? DISPLAY_NAME_FALLBACK } };
}

function hasDisplayName(name: string | null | undefined): name is string {
  return typeof name === "string" && name.trim().length > 0;
}
