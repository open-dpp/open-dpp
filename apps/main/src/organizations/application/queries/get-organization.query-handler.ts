import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { Organization } from "../../domain/organization";
import { OrganizationsRepositoryPort } from "../../domain/ports/organizations.repository.port";
import { ORGANIZATIONS_REPO_MONGO } from "../../organizations.constants";
import { GetOrganizationQuery } from "./get-organization.query";

@QueryHandler(GetOrganizationQuery)
export class GetOrganizationQueryHandler implements IQueryHandler<GetOrganizationQuery> {
  constructor(
    @Inject(ORGANIZATIONS_REPO_MONGO)
    private readonly organizationsRepository: OrganizationsRepositoryPort,
  ) { }

  async execute(query: GetOrganizationQuery): Promise<Organization | null> {
    return this.organizationsRepository.findOneById(query.organizationId);
  }
}
