import { ValueError } from "@open-dpp/exception";

export interface OrganizationIdAndSlug {
  id: string;
  slug: string;
}

/**
 * The Mongo adapter stores a 24-hex string `_id` as a real ObjectId and anything else as a
 * raw string, which the Mongoose `_id: ObjectId` schema then fails to hydrate.
 */
const OBJECT_ID_HEX = /^[0-9a-f]{24}$/;

/**
 * better-auth `organizationHooks.beforeCreateOrganization`: the domain mints the
 * organization id and sends it as the slug (see Organization.create and
 * OrganizationsRepository.create); this hook makes that slug the persisted `_id`, which
 * `adapter.createOrganization` honours via `forceAllowId`.
 */
export function assignOrganizationSlugAsId(slug: string | undefined): {
  data: OrganizationIdAndSlug;
} {
  if (slug === undefined || !OBJECT_ID_HEX.test(slug)) {
    throw new ValueError(
      `Organization slug must be the domain-minted ObjectId hex string, got ${JSON.stringify(slug)}`,
    );
  }
  return { data: { id: slug, slug } };
}
