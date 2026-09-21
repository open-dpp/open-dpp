/** The name fields of a user record as better-auth hands them to a database hook. */
export interface UserNameFields {
  name?: string | null;
  firstName?: unknown;
  lastName?: unknown;
}

/**
 * better-auth `databaseHooks.user.create.before`: every User gets a display name. The domain
 * derives `name` from first and last name (see `User`); this restates that rule at the
 * better-auth boundary, where sign-up and the admin endpoints accept an empty `name`.
 * Downstream, the OAuth Provider splits `user.name` for its profile claims and throws on a
 * missing one. Returns a new record; the input is never mutated.
 */
export function withDisplayName<T extends UserNameFields>(user: T): { data: T } {
  if (isPresent(user.name)) {
    return { data: { ...user } };
  }
  const derived = [user.firstName, user.lastName].filter(isPresent).join(" ");
  return { data: derived ? { ...user, name: derived } : { ...user } };
}

function isPresent(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
