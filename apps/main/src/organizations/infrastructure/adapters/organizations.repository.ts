import { Injectable } from "@nestjs/common";
import { AuthService } from "../../../auth/auth.service";
import { Organization } from "../../domain/organization";
import { OrganizationsRepositoryPort } from "../../domain/ports/organizations.repository.port";
import { OrganizationsMapper } from "../mappers/organizations.mapper";

@Injectable()
export class OrganizationsRepository implements OrganizationsRepositoryPort {
  constructor(
    private readonly mapper: OrganizationsMapper,
    private readonly authService: AuthService,
  ) {
  }

  async save(organization: Organization): Promise<Organization> {
    const betterAuthOrganization = this.mapper.toPersistence(organization);
    const entity = await (this.authService.auth?.api as any).createOrganization({
      body: {
        name: betterAuthOrganization.name,
        slug: betterAuthOrganization.slug,
        logo: betterAuthOrganization.logo,
        userId: "",
      },
      headers: {},
    });
    return this.mapper.toDomain(entity);
  }
}
