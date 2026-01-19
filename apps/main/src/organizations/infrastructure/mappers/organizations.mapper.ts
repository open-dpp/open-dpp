import { Injectable } from "@nestjs/common";
import { Organization as BetterAuthOrganization } from "better-auth/plugins/organization";
import { Mapper } from "../../../base.mapper";
import { Organization } from "../../domain/organization";

@Injectable()
export class OrganizationsMapper implements Mapper<Organization, BetterAuthOrganization> {
  toDomain(betterAuthOrg: BetterAuthOrganization): Organization {
    return {
      id: betterAuthOrg.id,
      name: betterAuthOrg.name,
      slug: betterAuthOrg.slug,
      logo: betterAuthOrg.logo ?? null,
      metadata: betterAuthOrg.metadata,
      createdAt: betterAuthOrg.createdAt,
    };
  }

  toPersistence(domainEntity: Organization): BetterAuthOrganization {
    return {
      id: domainEntity.id,
      name: domainEntity.name,
      slug: domainEntity.slug,
      createdAt: domainEntity.createdAt,
      logo: domainEntity.logo,
      metadata: domainEntity.metadata,
    };
  }
}
