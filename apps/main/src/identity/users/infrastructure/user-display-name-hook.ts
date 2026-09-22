import { deriveDisplayName } from "../domain/user";

/** The name fields of a user record as better-auth hands them to a database hook. */
export interface UserNameFields {
  name?: string | null;
  firstName?: unknown;
  lastName?: unknown;
}

/**
 * better-auth `databaseHooks.user.create.before`: every User gets a display name. The domain
 * rule `deriveDisplayName` is applied at the better-auth boundary, where sign-up and the
 * admin endpoints accept an empty `name`. Downstream, the OAuth Provider splits `user.name`
 * for its profile claims and throws on a missing one. Returns a new record; the input is
 * never mutated.
 */
export function withDisplayName<T extends UserNameFields>(user: T): { data: T } {
  if (hasDisplayName(user.name)) {
    return { data: { ...user } };
  }
  const derived = deriveDisplayName(user.firstName, user.lastName);
  return { data: derived ? { ...user, name: derived } : { ...user } };
}

function hasDisplayName(name: string | null | undefined): name is string {
  return typeof name === "string" && name.trim().length > 0;
}
