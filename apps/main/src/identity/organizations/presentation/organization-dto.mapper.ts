import type { OrganizationDto } from "@open-dpp/dto";
import { Organization } from "../domain/organization";

/**
 * Wire representation of an organization. Built explicitly so the response shape is a
 * decision in code: the internal `slug` and the `members` array never reach the client.
 */
export function toOrganizationDto(organization: Organization): OrganizationDto {
  return {
    id: organization.id,
    name: organization.name,
    logo: organization.logo,
    metadata: organization.metadata ?? {},
    createdAt: organization.createdAt.toISOString(),
  };
}
