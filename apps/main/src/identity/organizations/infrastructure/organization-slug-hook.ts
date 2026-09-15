import { ObjectId } from "mongodb";

export interface OrganizationIdAndSlug {
  id: string;
  slug: string;
}

/**
 * better-auth `organizationHooks.beforeCreateOrganization`: mints the organization id
 * up front and makes the slug equal to it. The caller's slug is ignored — the slug is
 * an internal alias of the id, not a value anyone chooses.
 *
 * Why here and not in the repository: `adapter.createOrganization` honours a hook-supplied
 * `id` (`forceAllowId: true`), so this is the one place that can set both fields in a
 * single write, for every creation path — including the session-less `userId` system
 * action. The id must be a 24-hex string: the Mongo adapter stores a valid ObjectId hex
 * as a real ObjectId and anything else (e.g. a UUID) as a raw string `_id`, which the
 * Mongoose `_id: ObjectId` schema then fails to hydrate.
 *
 * better-auth still checks the *incoming* slug for uniqueness before this hook runs, so
 * callers pass a unique placeholder (see OrganizationsRepository.create).
 */
export function assignOrganizationIdAsSlug(): { data: OrganizationIdAndSlug } {
  const id = new ObjectId().toHexString();
  return { data: { id, slug: id } };
}
