import type { OrganizationCreateResponseDto, OrganizationDto } from "@open-dpp/dto";
import type { ProvisioningResult } from "../application/services/organization-provisioning.service";
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

/** Response of `POST /organizations` with `owner`: the organization plus what happened to the owner. */
export function toProvisionedOrganizationDto(
  result: ProvisioningResult,
): OrganizationCreateResponseDto {
  return {
    ...toOrganizationDto(result.organization),
    provisioning: {
      owner: { id: result.owner.id, email: result.owner.email, created: result.owner.created },
      emailSent: result.emailSent,
    },
  };
}
